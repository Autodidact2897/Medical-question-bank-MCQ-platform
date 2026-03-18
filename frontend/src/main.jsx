import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Something went wrong.</h2>
        <p>Our team has been notified. Please refresh the page to try again.</p>
      </div>
    }>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
