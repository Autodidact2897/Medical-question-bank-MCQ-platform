/**
 * Seed clinical_briefs table from the extracted DOCX master list.
 * Run: node backend/src/db/seed-briefs.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('../db/connection');
const briefs = require('./clinical_briefs_seed.json');

// Map DOCX section names to cleaner display names
const SECTION_MAP = {
  'CARDIOVASCULAR': 'Cardiovascular',
  'RESPIRATORY': 'Respiratory',
  'GASTROENTEROLOGY / NUTRITION': 'Gastroenterology & Nutrition',
  'ENDOCRINOLOGY / METABOLIC': 'Endocrinology & Metabolic',
  'PSYCHIATRY / NEUROLOGY': 'Psychiatry & Neurology',
  'MUSCULOSKELETAL': 'Musculoskeletal',
  'INFECTIOUS DISEASE / HAEMATOLOGY / IMMUNOLOGY / GENETICS': 'Infectious Disease, Haematology, Immunology & Genetics',
  'RENAL / UROLOGY': 'Renal & Urology',
  'DERMATOLOGY / ENT / EYES': 'Dermatology, ENT & Eyes',
  'REPRODUCTIVE': 'Reproductive',
  'PAEDIATRICS': 'Paediatrics',
  'PHARMACOLOGY & THERAPEUTICS': 'Pharmacology & Therapeutics',
  'PAPER 1: PROFESSIONAL INTEGRITY': 'Professional Integrity (SJT)',
  'PAPER 1: COPING WITH PRESSURE': 'Coping with Pressure (SJT)',
  'PAPER 1: EMPATHY & SENSITIVITY': 'Empathy & Sensitivity (SJT)',
  'PAPER 1: PROFESSIONAL DILEMMAS — NEW SUBTOPICS': 'Professional Dilemmas (SJT)',
};

async function seed() {
  console.log(`Seeding ${briefs.length} clinical briefs...`);

  // Ensure columns exist
  try {
    await pool.query(`
      ALTER TABLE clinical_briefs
      ADD COLUMN IF NOT EXISTS brief_number INTEGER,
      ADD COLUMN IF NOT EXISTS source VARCHAR,
      ADD COLUMN IF NOT EXISTS brief_type VARCHAR
    `);
  } catch (err) {
    console.log('Column add note:', err.message);
  }

  let inserted = 0;
  let skipped = 0;

  for (const brief of briefs) {
    const briefId = `CB_${String(brief.number).padStart(3, '0')}`;
    const subject = SECTION_MAP[brief.section] || brief.section;
    // Use the title as the topic (subtopic) since we don't have a separate topic field
    const topic = brief.title;

    try {
      await pool.query(`
        INSERT INTO clinical_briefs (brief_id, title, subject, topic, brief_number, source, brief_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (brief_id) DO UPDATE SET
          title = EXCLUDED.title,
          subject = EXCLUDED.subject,
          topic = EXCLUDED.topic,
          brief_number = EXCLUDED.brief_number,
          source = EXCLUDED.source,
          brief_type = EXCLUDED.brief_type
      `, [briefId, brief.title, subject, topic, brief.number, brief.source, brief.type]);
      inserted++;
    } catch (err) {
      console.error(`Failed to insert brief #${brief.number}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`Done: ${inserted} inserted/updated, ${skipped} skipped`);
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
