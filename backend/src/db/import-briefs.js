const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = require('./connection');

const CSV_PATH = path.join(__dirname, '../../../data/Clinical_Briefs.csv');

async function importBriefs() {
  console.log('Starting clinical briefs import...');
  console.log('Reading CSV from:', CSV_PATH);

  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV file not found:', CSV_PATH);
    process.exit(1);
  }

  // Ensure unique constraint exists
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE clinical_briefs
      ADD CONSTRAINT clinical_briefs_brief_id_unique UNIQUE (brief_id)
    `);
    console.log('Added unique constraint on brief_id');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('Unique constraint already exists, continuing...');
    } else {
      console.error('Error adding constraint:', err.message);
      client.release();
      await pool.end();
      process.exit(1);
    }
  } finally {
    client.release();
  }

  const rows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Found ${rows.length} rows in CSV. Importing...`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      const result = await pool.query(
        `INSERT INTO clinical_briefs (
          brief_id, title, subject, topic, content,
          guideline_references, date_added
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (brief_id) DO NOTHING`,
        [
          row['brief_id']              || null,
          row['title']                 || null,
          row['subject']               || null,
          row['topic']                 || null,
          row['content']               || null,
          row['guideline_references']  || null,
          row['date_added']            || null,
        ]
      );

      if (result.rowCount === 0) {
        console.log(`Row ${rowNum} (${row['brief_id']}): skipped (already exists)`);
        skipped++;
      } else {
        imported++;
      }
    } catch (err) {
      console.error(`Row ${rowNum} (${row['brief_id']}): FAILED - ${err.message}`);
      failed++;
    }
  }

  console.log('\n--- Import complete ---');
  console.log(`Imported:  ${imported}`);
  console.log(`Skipped:   ${skipped} (already in database)`);
  console.log(`Failed:    ${failed}`);

  await pool.end();
}

importBriefs();
