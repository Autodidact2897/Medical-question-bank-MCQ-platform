/**
 * Import clinical brief CONTENT from markdown files into the database.
 * Matches by brief number. Updates content, subject, and topic fields.
 * Run: node backend/src/db/import-brief-content.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const pool = require('../db/connection');

const BRIEFS_DIR = path.resolve(__dirname, '../../../data/Clinical_Briefs');

function parseBrief(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  let briefNumber = null;
  let subject = null;
  let subtopic = null;
  let title = null;

  // Parse header metadata
  for (const line of lines.slice(0, 10)) {
    const titleMatch = line.match(/^#\s*(\d+)\.\s*(.+)/);
    if (titleMatch) {
      briefNumber = parseInt(titleMatch[1]);
      title = titleMatch[2].trim();
    }
    const subjectMatch = line.match(/^\*\*Subject:\*\*\s*(.+)/);
    if (subjectMatch) subject = subjectMatch[1].trim();
    const subtopicMatch = line.match(/^\*\*Subtopic:\*\*\s*(.+)/);
    if (subtopicMatch) subtopic = subtopicMatch[1].trim();
  }

  // Content is everything after the first --- separator
  const firstSep = raw.indexOf('---');
  let content = '';
  if (firstSep !== -1) {
    const afterSep = raw.substring(firstSep + 3).trim();
    // Remove trailing guideline/word count lines for cleaner display
    content = afterSep;
  } else {
    content = raw;
  }

  return { briefNumber, title, subject, subtopic, content };
}

async function importAll() {
  const files = fs.readdirSync(BRIEFS_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('CLAUDE'))
    .sort();

  console.log(`Found ${files.length} markdown brief files`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = path.join(BRIEFS_DIR, file);
    try {
      const brief = parseBrief(filePath);

      if (!brief.briefNumber) {
        console.warn(`  Skipping ${file}: no brief number found`);
        errors++;
        continue;
      }

      const briefId = `CB_${String(brief.briefNumber).padStart(3, '0')}`;

      // Update the existing record
      const result = await pool.query(`
        UPDATE clinical_briefs
        SET content = $1,
            subject = COALESCE($2, subject),
            topic = COALESCE($3, topic),
            title = COALESCE($4, title)
        WHERE brief_id = $5
        RETURNING id
      `, [brief.content, brief.subject, brief.subtopic, brief.title, briefId]);

      if (result.rows.length > 0) {
        updated++;
      } else {
        // Brief not in database yet — insert it
        await pool.query(`
          INSERT INTO clinical_briefs (brief_id, title, subject, topic, content, brief_number)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (brief_id) DO UPDATE SET
            content = EXCLUDED.content,
            subject = EXCLUDED.subject,
            topic = EXCLUDED.topic,
            title = EXCLUDED.title
        `, [briefId, brief.title, brief.subject, brief.subtopic, brief.content, brief.briefNumber]);
        updated++;
        console.log(`  Inserted new: ${briefId} — ${brief.title}`);
      }
    } catch (err) {
      console.error(`  Error processing ${file}: ${err.message}`);
      errors++;
    }
  }

  // Check how many briefs now have content
  const countResult = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(CASE WHEN content IS NOT NULL AND content != '' THEN 1 END)::int AS with_content
    FROM clinical_briefs
  `);

  const { total, with_content } = countResult.rows[0];

  console.log(`\nDone: ${updated} briefs updated, ${notFound} not found in DB, ${errors} errors`);
  console.log(`Database: ${with_content}/${total} briefs now have content`);

  await pool.end();
}

importAll().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
