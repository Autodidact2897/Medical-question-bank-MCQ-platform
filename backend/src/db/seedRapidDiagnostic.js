const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = require('./connection');

const MIGRATION_PATH = path.join(__dirname, 'migrations/add_rapid_diagnostic_tables.sql');
const CSV_PATH = path.join(__dirname, '../../../data/rapid_diagnostic_questions.csv');

async function seed() {
  console.log('=== Rapid Diagnostic Seed ===');

  // 1. Run migration
  console.log('Running migration...');
  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
  await pool.query(migrationSql);
  console.log('Tables created (or already exist).');

  // 2. Clear existing rows
  console.log('Clearing existing rapid_diagnostic_questions...');
  await pool.query('DELETE FROM rapid_diagnostic_answers');
  await pool.query('DELETE FROM rapid_diagnostic_sessions');
  await pool.query('DELETE FROM rapid_diagnostic_questions');
  console.log('Cleared.');

  // 3. Read CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV not found at:', CSV_PATH);
    process.exit(1);
  }

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Found ${rows.length} questions in CSV. Inserting...`);

  let inserted = 0;
  for (const row of rows) {
    try {
      await pool.query(`
        INSERT INTO rapid_diagnostic_questions (
          rd_question_id, subject_tag, paper, question_type, question_text,
          option_a, option_b, option_c, option_d, option_e,
          option_f, option_g, option_h,
          correct_answer, explanation, difficulty, teaser_text, display_order
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16, $17, $18
        )
      `, [
        row.rd_question_id,
        row.subject_tag,
        row.paper,
        row.question_type,
        row.question_text,
        row.option_a,
        row.option_b,
        row.option_c,
        row.option_d,
        row.option_e || null,
        row.option_f || null,
        row.option_g || null,
        row.option_h || null,
        row.correct_answer,
        row.explanation,
        row.difficulty,
        row.teaser_text,
        row.display_order ? parseInt(row.display_order) : null,
      ]);
      inserted++;
    } catch (err) {
      console.error(`Failed to insert ${row.rd_question_id}: ${err.message}`);
    }
  }

  console.log(`\n--- Seed complete ---`);
  console.log(`Inserted: ${inserted} / ${rows.length} questions`);

  await pool.end();
}

seed();
