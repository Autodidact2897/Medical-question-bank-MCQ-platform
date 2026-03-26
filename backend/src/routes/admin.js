const express = require('express');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Admin emails — read from ADMIN_EMAILS env var (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

// Admin guard middleware
function adminOnly(req, res, next) {
  if (!ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ success: false, error: 'Admin access required', data: null });
  }
  next();
}

router.use(authMiddleware);
router.use(adminOnly);

// Shared mail transport factory — returns { transporter, fromAddress } or { transporter: null }
function getMailTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.EMAIL_FROM || 'hello@discolabs.co.uk';
  const fromName = process.env.EMAIL_FROM_NAME || 'DiscoLabs';

  if (!host || !user || !pass) return { transporter: null, fromAddress: null };

  const transporter = nodemailer.createTransport({
    host, port, secure: port === 465,
    auth: { user, pass },
  });
  return { transporter, fromAddress: `"${fromName}" <${fromEmail}>` };
}

// GET /api/admin/metrics — full site metrics dashboard
router.get('/metrics', async (req, res) => {
  console.log('Admin metrics requested');

  try {
    // Run all queries in parallel
    const [
      usersResult,
      newUsers7d,
      newUsers30d,
      sessionsResult,
      answersResult,
      rapidResult,
      subjectResult,
      topTopics,
      difficultyResult,
      dailyActivity,
      recentUsers,
      questionBankStats,
      activeLearners,
    ] = await Promise.all([
      // 1. Total users
      pool.query('SELECT COUNT(*)::int AS total FROM users'),

      // 2. New users last 7 days
      pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`),

      // 3. New users last 30 days
      pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE created_at >= NOW() - INTERVAL '30 days'`),

      // 4. Quiz sessions
      pool.query(`
        SELECT
          COUNT(*)::int AS total_sessions,
          COALESCE(SUM(CASE WHEN completed THEN 1 ELSE 0 END), 0)::int AS completed_sessions,
          COALESCE(AVG(CASE WHEN completed THEN score END), 0)::numeric(5,1) AS avg_score,
          COALESCE(AVG(CASE WHEN completed THEN total_questions END), 0)::numeric(5,1) AS avg_questions_per_session
        FROM quiz_sessions
      `),

      // 5. Total answers
      pool.query(`
        SELECT
          COUNT(*)::int AS total_answers,
          COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::int AS total_correct
        FROM user_answers
      `),

      // 6. Rapid diagnostic sessions
      pool.query(`
        SELECT
          COUNT(*)::int AS total_started,
          COALESCE(SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END), 0)::int AS total_completed,
          COALESCE(AVG(CASE WHEN completed_at IS NOT NULL THEN overall_percentage END), 0)::numeric(5,1) AS avg_score
        FROM rapid_diagnostic_sessions
      `),

      // 7. Performance by subject
      pool.query(`
        SELECT
          q.subject,
          COUNT(*)::int AS attempted,
          COALESCE(SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END), 0)::int AS correct,
          ROUND(COALESCE(AVG(CASE WHEN ua.is_correct THEN 1.0 ELSE 0.0 END) * 100, 0))::int AS percentage
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        GROUP BY q.subject
        ORDER BY attempted DESC
      `),

      // 8. Top 10 topics by attempts
      pool.query(`
        SELECT
          q.topic,
          q.subject,
          COUNT(*)::int AS attempted,
          ROUND(COALESCE(AVG(CASE WHEN ua.is_correct THEN 1.0 ELSE 0.0 END) * 100, 0))::int AS percentage
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        GROUP BY q.topic, q.subject
        ORDER BY attempted DESC
        LIMIT 10
      `),

      // 9. Performance by difficulty
      pool.query(`
        SELECT
          q.difficulty,
          COUNT(*)::int AS attempted,
          COALESCE(SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END), 0)::int AS correct,
          ROUND(COALESCE(AVG(CASE WHEN ua.is_correct THEN 1.0 ELSE 0.0 END) * 100, 0))::int AS percentage
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        GROUP BY q.difficulty
        ORDER BY
          CASE q.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Hard' THEN 3 ELSE 4 END
      `),

      // 10. Daily activity (last 30 days)
      pool.query(`
        SELECT
          date_trunc('day', ua.answered_at)::date AS day,
          COUNT(*)::int AS answers,
          COUNT(DISTINCT qs.user_id)::int AS active_users
        FROM user_answers ua
        JOIN quiz_sessions qs ON ua.session_id = qs.id
        WHERE ua.answered_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day
      `),

      // 11. Recent signups
      pool.query(`
        SELECT id, email, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 10
      `),

      // 12. Question bank stats
      pool.query(`
        SELECT
          COUNT(*)::int AS total_questions,
          COUNT(DISTINCT subject)::int AS total_subjects,
          COUNT(DISTINCT topic)::int AS total_topics,
          COALESCE(SUM(CASE WHEN lna THEN 1 ELSE 0 END), 0)::int AS lna_questions
        FROM questions
      `),

      // 13. Most active learners (top 10)
      pool.query(`
        SELECT
          u.email,
          COUNT(ua.id)::int AS total_answers,
          ROUND(COALESCE(AVG(CASE WHEN ua.is_correct THEN 1.0 ELSE 0.0 END) * 100, 0))::int AS percentage,
          COUNT(DISTINCT qs.id)::int AS sessions
        FROM users u
        JOIN quiz_sessions qs ON qs.user_id = u.id
        JOIN user_answers ua ON ua.session_id = qs.id
        GROUP BY u.id, u.email
        ORDER BY total_answers DESC
        LIMIT 10
      `),
    ]);

    const { total_answers, total_correct } = answersResult.rows[0];
    const overall_correct_pct = total_answers > 0
      ? Math.round((total_correct / total_answers) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        users: {
          total: usersResult.rows[0].total,
          new_7d: newUsers7d.rows[0].total,
          new_30d: newUsers30d.rows[0].total,
        },
        quiz_sessions: sessionsResult.rows[0],
        answers: {
          total: total_answers,
          correct: total_correct,
          overall_correct_pct,
        },
        rapid_diagnostic: rapidResult.rows[0],
        by_subject: subjectResult.rows,
        top_topics: topTopics.rows,
        by_difficulty: difficultyResult.rows,
        daily_activity: dailyActivity.rows,
        recent_users: recentUsers.rows,
        question_bank: questionBankStats.rows[0],
        active_learners: activeLearners.rows,
      },
    });
  } catch (err) {
    console.error('Admin metrics error:', err);
    res.status(500).json({ success: false, error: 'Failed to load admin metrics', data: null });
  }
});

// ──────────────────────────────────────────────
// Email Brief Management
// ──────────────────────────────────────────────

// GET /api/admin/subscribers — list all email subscribers
router.get('/subscribers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT es.id, es.email, es.subscribed, es.subscribed_at, es.unsubscribed_at, u.created_at AS user_created
      FROM email_subscribers es
      JOIN users u ON es.user_id = u.id
      ORDER BY es.subscribed_at DESC
    `);
    const total = result.rows.length;
    const active = result.rows.filter(r => r.subscribed).length;
    return res.json({ success: true, data: { subscribers: result.rows, total, active }, error: null });
  } catch (err) {
    console.error('Subscribers error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to load subscribers', data: null });
  }
});

// GET /api/admin/briefs — list all email briefs
router.get('/briefs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM email_briefs ORDER BY created_at DESC'
    );
    return res.json({ success: true, data: result.rows, error: null });
  } catch (err) {
    console.error('Briefs list error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to load briefs', data: null });
  }
});

// POST /api/admin/briefs — create a new email brief
router.post('/briefs', async (req, res) => {
  const { subject_line, preview_text, body_html, body_text, topic, msra_subject } = req.body;
  if (!subject_line || !body_html) {
    return res.status(400).json({ success: false, error: 'subject_line and body_html are required', data: null });
  }
  try {
    const result = await pool.query(`
      INSERT INTO email_briefs (subject_line, preview_text, body_html, body_text, topic, msra_subject)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [subject_line, preview_text || '', body_html, body_text || '', topic || '', msra_subject || '']);
    console.log('Brief created:', result.rows[0].id);
    return res.json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    console.error('Brief create error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to create brief', data: null });
  }
});

// PUT /api/admin/briefs/:id — update an existing brief
router.put('/briefs/:id', async (req, res) => {
  const { id } = req.params;
  const { subject_line, preview_text, body_html, body_text, topic, msra_subject } = req.body;
  try {
    const result = await pool.query(`
      UPDATE email_briefs
      SET subject_line = $1, preview_text = $2, body_html = $3, body_text = $4,
          topic = $5, msra_subject = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [subject_line, preview_text || '', body_html, body_text || '', topic || '', msra_subject || '', id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Brief not found', data: null });
    }
    return res.json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    console.error('Brief update error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update brief', data: null });
  }
});

// DELETE /api/admin/briefs/:id — delete a brief
router.delete('/briefs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM email_briefs WHERE id = $1', [id]);
    return res.json({ success: true, data: { message: 'Brief deleted' }, error: null });
  } catch (err) {
    console.error('Brief delete error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to delete brief', data: null });
  }
});

// POST /api/admin/briefs/:id/send — send a brief to all active subscribers
router.post('/briefs/:id/send', async (req, res) => {
  const { id } = req.params;
  try {
    // Get the brief
    const briefResult = await pool.query('SELECT * FROM email_briefs WHERE id = $1', [id]);
    if (briefResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Brief not found', data: null });
    }
    const brief = briefResult.rows[0];

    // Get active subscribers
    const subsResult = await pool.query(
      'SELECT email FROM email_subscribers WHERE subscribed = true'
    );
    const subscribers = subsResult.rows;

    if (subscribers.length === 0) {
      return res.json({ success: true, data: { sent: 0, message: 'No active subscribers' }, error: null });
    }

    const { transporter, fromAddress } = getMailTransport();
    if (!transporter) {
      return res.status(500).json({ success: false, error: 'Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.', data: null });
    }

    // Send to each subscriber
    let sentCount = 0;
    const errors = [];

    for (const sub of subscribers) {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: sub.email,
          subject: brief.subject_line,
          text: brief.body_text || brief.subject_line,
          html: wrapHtmlEmail(brief.subject_line, brief.body_html, brief.preview_text),
        });
        sentCount++;
      } catch (sendErr) {
        console.error('Failed to send email:', sendErr.message);
        errors.push({ error: sendErr.message });
      }
    }

    // Update brief status
    await pool.query(`
      UPDATE email_briefs SET status = 'sent', sent_at = NOW(), sent_count = $1 WHERE id = $2
    `, [sentCount, id]);

    console.log(`Brief ${id} sent to ${sentCount}/${subscribers.length} subscribers`);
    return res.json({
      success: true,
      data: { sent: sentCount, total: subscribers.length, errors: errors.length > 0 ? errors : undefined },
      error: null,
    });
  } catch (err) {
    console.error('Send brief error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to send brief', data: null });
  }
});

// POST /api/admin/briefs/:id/test — send to admin only (test email)
router.post('/briefs/:id/test', async (req, res) => {
  const { id } = req.params;
  try {
    const briefResult = await pool.query('SELECT * FROM email_briefs WHERE id = $1', [id]);
    if (briefResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Brief not found', data: null });
    }
    const brief = briefResult.rows[0];

    const { transporter, fromAddress } = getMailTransport();
    if (!transporter) {
      return res.status(500).json({ success: false, error: 'Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.', data: null });
    }

    await transporter.sendMail({
      from: fromAddress,
      to: req.user.email,
      subject: `[TEST] ${brief.subject_line}`,
      text: brief.body_text || brief.subject_line,
      html: wrapHtmlEmail(brief.subject_line, brief.body_html, brief.preview_text),
    });

    console.log('Test email sent');
    return res.json({ success: true, data: { sent_to: req.user.email }, error: null });
  } catch (err) {
    console.error('Test email error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to send test email', data: null });
  }
});

// Wrap brief HTML in a styled email template
function wrapHtmlEmail(title, bodyHtml, previewText) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0c3a5c; padding: 24px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 20px; margin: 0; font-weight: 600; }
    .header p { color: #93c5fd; font-size: 12px; margin: 8px 0 0; }
    .body { padding: 32px; color: #1f2937; font-size: 15px; line-height: 1.6; }
    .body h2 { color: #0c3a5c; font-size: 18px; margin-top: 24px; }
    .body h3 { color: #0c3a5c; font-size: 16px; margin-top: 20px; }
    .body ul, .body ol { padding-left: 20px; }
    .body li { margin-bottom: 6px; }
    .footer { background-color: #f4f5f7; padding: 20px 32px; text-align: center; font-size: 12px; color: #6b7280; }
    .footer a { color: #0c3a5c; text-decoration: none; }
    .preview { display: none; max-height: 0; overflow: hidden; }
  </style>
</head>
<body>
  <div class="preview">${previewText || ''}</div>
  <div class="wrapper">
    <div class="header">
      <h1>&#x2695; DiscoLabs</h1>
      <p>Your daily clinical brief</p>
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>DiscoLabs &mdash; MSRA Revision, Targeted.</p>
      <p><a href="https://medical-question-bank-mcq-platform.vercel.app/dashboard">Go to Dashboard</a></p>
      <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">
        You received this because you subscribed to clinical briefs on DiscoLabs.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ──────────────────────────────────────────────
// Reported Issues (Question Feedback)
// ──────────────────────────────────────────────

// GET /api/admin/feedback — all feedback with user + question info
router.get('/feedback', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        qf.id, qf.feedback_type, qf.feedback_text, qf.created_at, qf.replied_at,
        u.email AS user_email,
        q.id AS question_db_id, q.question_id, q.question_text, q.subject, q.topic
      FROM question_feedback qf
      JOIN users u ON qf.user_id = u.id
      JOIN questions q ON qf.question_id = q.id
      ORDER BY qf.created_at DESC
    `);
    return res.json({ success: true, data: result.rows, error: null });
  } catch (err) {
    console.error('Feedback list error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to load feedback', data: null });
  }
});

// POST /api/admin/feedback/:id/reply — send email reply via Resend and mark replied
router.post('/feedback/:id/reply', async (req, res) => {
  const { id } = req.params;
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ success: false, error: 'Subject and message are required', data: null });
  }

  try {
    // Get the feedback + user email
    const fbResult = await pool.query(`
      SELECT qf.*, u.email AS user_email
      FROM question_feedback qf
      JOIN users u ON qf.user_id = u.id
      WHERE qf.id = $1
    `, [id]);

    if (fbResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Feedback not found', data: null });
    }

    const fb = fbResult.rows[0];

    // Try Resend first, fall back to SMTP
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'hello@discolabs.co.uk';

    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: `DiscoLabs <${fromEmail}>`,
        to: fb.user_email,
        subject,
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0c3a5c; padding: 16px 24px; color: #fff; font-weight: 600;">&#x2695; DiscoLabs</div>
          <div style="padding: 24px; color: #1f2937; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
          <div style="padding: 16px 24px; background: #f4f5f7; color: #6b7280; font-size: 12px; text-align: center;">DiscoLabs — MSRA Revision, Targeted.</div>
        </div>`,
      });
    } else {
      const { transporter, fromAddress } = getMailTransport();
      if (!transporter) {
        return res.status(500).json({ success: false, error: 'Email not configured. Set RESEND_API_KEY or SMTP credentials.', data: null });
      }
      await transporter.sendMail({
        from: fromAddress,
        to: fb.user_email,
        subject,
        html: message.replace(/\n/g, '<br>'),
      });
    }

    // Mark as replied
    await pool.query('UPDATE question_feedback SET replied_at = NOW() WHERE id = $1', [id]);

    console.log(`Feedback ${id} replied to ${fb.user_email}`);
    return res.json({ success: true, data: { sent_to: fb.user_email }, error: null });
  } catch (err) {
    console.error('Feedback reply error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to send reply', data: null });
  }
});

// ──────────────────────────────────────────────
// Question Editor
// ──────────────────────────────────────────────

// GET /api/admin/questions — paginated, filterable question list
router.get('/questions', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const { subject, topic, difficulty, search } = req.query;

  try {
    let where = [];
    let params = [];
    let idx = 1;

    if (subject) { where.push(`q.subject = $${idx++}`); params.push(subject); }
    if (topic) { where.push(`q.topic = $${idx++}`); params.push(topic); }
    if (difficulty) { where.push(`q.difficulty = $${idx++}`); params.push(difficulty); }
    if (search) {
      where.push(`(q.question_text ILIKE $${idx} OR q.question_id ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM questions q ${whereClause}`,
      params
    );

    const result = await pool.query(
      `SELECT q.* FROM questions q ${whereClause} ORDER BY q.id DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      data: {
        questions: result.rows,
        total: countResult.rows[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
      error: null,
    });
  } catch (err) {
    console.error('Questions list error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to load questions', data: null });
  }
});

// PUT /api/admin/questions/:id — partial update of a question
router.put('/questions/:id', async (req, res) => {
  const { id } = req.params;
  const allowed = [
    'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e',
    'option_f', 'option_g', 'option_h', 'correct_answer', 'explanation',
    'difficulty', 'subject', 'topic', 'question_id', 'lna',
  ];

  const updates = [];
  const values = [];
  let idx = 1;

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${idx++}`);
      values.push(req.body[field]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid fields to update', data: null });
  }

  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE questions SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found', data: null });
    }
    console.log(`Question ${id} updated`);
    return res.json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    console.error('Question update error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update question', data: null });
  }
});

module.exports = router;
