require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/auth');
const questionsRoutes = require('./src/routes/questions');
const quizRoutes = require('./src/routes/quiz');
const briefsRoutes = require('./src/routes/briefs');
const progressRoutes = require('./src/routes/progress');
const rapidDiagnosticRoutes = require('./src/routes/rapidDiagnostic');
const adminRoutes = require('./src/routes/admin');
const emailRoutes = require('./src/routes/email');

// Initialise Sentry before anything else
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://medical-question-bank-mcq-platform.vercel.app',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', questionsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/briefs', briefsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/rapid-diagnostic', rapidDiagnosticRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRoutes);

// Health check
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ success: true, message: 'Server is running' });
});

// Sentry error handler — must be after all routes
Sentry.setupExpressErrorHandler(app);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
