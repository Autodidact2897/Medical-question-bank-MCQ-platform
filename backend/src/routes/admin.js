const express = require('express');
const nodemailer = require('nodemailer');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Admin emails — only these users can access admin routes
const ADMIN_EMAILS = ['benpopham43@sky.com'];

// Admin guard middleware
function adminOnly(req, res, next) {
  if (!ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ success: false, error: 'Admin access required', data: null });
  }
  next();
}

router.use(authMiddleware);
router.use(adminOnly);

// GET /api/admin/metrics — full site metrics dashboard
router.get('/metrics', async (req, res) => {
  console.log('Admin metrics requested by:', req.user.email);

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

    // Configure email transport
    // Uses SMTP_* env vars — works with Gmail, Outlook, Resend, SendGrid, etc.
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.EMAIL_FROM || 'hello@discolabs.co.uk';
    const fromName = process.env.EMAIL_FROM_NAME || 'DiscoLabs';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
      return res.status(500).json({
        success: false,
        error: 'Email sending not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to your environment variables.',
        data: null,
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    // Send to each subscriber
    let sentCount = 0;
    const errors = [];

    for (const sub of subscribers) {
      try {
        await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: sub.email,
          subject: brief.subject_line,
          text: brief.body_text || brief.subject_line,
          html: wrapHtmlEmail(brief.subject_line, brief.body_html, brief.preview_text),
        });
        sentCount++;
        console.log('Email sent to:', sub.email);
      } catch (sendErr) {
        console.error('Failed to send to', sub.email, sendErr.message);
        errors.push({ email: sub.email, error: sendErr.message });
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

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.EMAIL_FROM || 'hello@discolabs.co.uk';
    const fromName = process.env.EMAIL_FROM_NAME || 'DiscoLabs';

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(500).json({
        success: false,
        error: 'SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to your environment variables.',
        data: null,
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: req.user.email,
      subject: `[TEST] ${brief.subject_line}`,
      text: brief.body_text || brief.subject_line,
      html: wrapHtmlEmail(brief.subject_line, brief.body_html, brief.preview_text),
    });

    console.log('Test email sent to:', req.user.email);
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

module.exports = router;
