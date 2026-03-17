const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = require('./connection');

const CSV_PATH = path.join(__dirname, '../../../data/MSRA_Master_Question_Bank.csv');

async function importQuestions() {
  console.log('Starting question import...');
  console.log('Reading CSV from:', CSV_PATH);

  // Add unique constraint on question_id so ON CONFLICT works
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE questions
      ADD CONSTRAINT questions_question_id_unique UNIQUE (question_id)
    `);
    console.log('Added unique constraint on question_id');
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

  // Read all CSV rows into memory first
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
    const rowNum = i + 2; // +2 because row 1 is the header

    try {
      const result = await pool.query(
        `INSERT INTO questions (
          question_id, subject, topic, question_type, question_text,
          option_a, option_b, option_c, option_d, option_e,
          option_f, option_g, option_h,
          correct_answer, explanation, difficulty, lna, date_added
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16, $17, $18
        )
        ON CONFLICT (question_id) DO NOTHING`,
        [
          row['Question_ID']     || null,
          row['Subject']         || null,
          row['Topic']           || null,
          row['Question_Type']   || null,
          row['Question']        || null,
          row['Option_A']        || null,
          row['Option_B']        || null,
          row['Option_C']        || null,
          row['Option_D']        || null,
          row['Option_E']        || null,
          row['Option_F']        || null,
          row['Option_G']        || null,
          row['Option_H']        || null,
          row['Correct_Answer']  || null,
          row['Explanation']     || null,
          row['Difficulty']      || null,
          row['LNA'] === 'Yes',
          row['Date_Added']      || null,
        ]
      );

      if (result.rowCount === 0) {
        console.log(`Row ${rowNum} (${row['Question_ID']}): skipped (already exists)`);
        skipped++;
      } else {
        imported++;
      }
    } catch (err) {
      console.error(`Row ${rowNum} (${row['Question_ID']}): FAILED - ${err.message}`);
      failed++;
    }
  }

  console.log('\n--- Import complete ---');
  console.log(`Imported:  ${imported}`);
  console.log(`Skipped:   ${skipped} (already in database)`);
  console.log(`Failed:    ${failed}`);

  await pool.end();
}

importQuestions();
