const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET /api/briefs — list all briefs (summary only)
router.get('/', async (req, res) => {
  try {
    const { subject } = req.query;
    let query = 'SELECT brief_id, title, subject, topic FROM clinical_briefs';
    const params = [];

    if (subject) {
      query += ' WHERE subject = $1';
      params.push(subject);
    }

    query += ' ORDER BY subject, topic, brief_id';

    const result = await pool.query(query, params);
    console.log(`Briefs list: returning ${result.rows.length} briefs`);
    res.json({ success: true, data: result.rows, error: null });
  } catch (err) {
    console.error('Error fetching briefs:', err.message);
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch briefs' });
  }
});

// GET /api/briefs/by-topic?topic=... — find brief by topic name (for linking from quiz)
router.get('/by-topic', async (req, res) => {
  try {
    const { topic } = req.query;
    if (!topic) {
      return res.status(400).json({ success: false, data: null, error: 'Topic is required' });
    }

    const result = await pool.query(
      'SELECT brief_id, title, subject, topic FROM clinical_briefs WHERE topic = $1 LIMIT 1',
      [topic]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null, error: null });
    }

    console.log(`Brief found for topic "${topic}": ${result.rows[0].brief_id}`);
    res.json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    console.error('Error fetching brief by topic:', err.message);
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch brief' });
  }
});

// GET /api/briefs/:briefId — full brief with content
router.get('/:briefId', async (req, res) => {
  try {
    const { briefId } = req.params;
    const result = await pool.query(
      'SELECT * FROM clinical_briefs WHERE brief_id = $1',
      [briefId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, error: 'Brief not found' });
    }

    console.log(`Brief detail: ${briefId}`);
    res.json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    console.error('Error fetching brief:', err.message);
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch brief' });
  }
});

module.exports = router;
