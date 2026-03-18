import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSubjects, startQuiz } from '../services/api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingQuiz, setStartingQuiz] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSubjects()
      .then((res) => setSubjects(res.data.data))
      .catch(() => setError('Failed to load subjects.'))
      .finally(() => setLoading(false));
  }, []);

  const handleStartQuiz = async (subject) => {
    setStartingQuiz(subject);
    try {
      const res = await startQuiz(subject, 10);
      const { sessionId } = res.data.data;
      navigate(`/quiz/${sessionId}`, { state: { questions: res.data.data.questions, subject } });
    } catch {
      setError('Failed to start quiz. Please try again.');
      setStartingQuiz(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const subjectColours = [
    '#2563eb', '#0891b2', '#059669', '#7c3aed',
    '#dc2626', '#d97706', '#db2777', '#0284c7',
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <span className="header-logo">⚕</span>
          <span className="header-title">MedQBank</span>
        </div>
        <div className="dashboard-header-right">
          <span className="header-email">{user?.email}</span>
          <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h2>Welcome back, {user?.email?.split('@')[0]}</h2>
          <p>Choose a subject to start practising</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading subjects...</p>
          </div>
        ) : (
          <div className="subjects-grid">
            {subjects.map((s, i) => (
              <div className="subject-card" key={s.subject}>
                <div
                  className="subject-card-bar"
                  style={{ backgroundColor: subjectColours[i % subjectColours.length] }}
                ></div>
                <div className="subject-card-body">
                  <h3>{s.subject}</h3>
                  <p className="subject-count">{s.count} question{s.count !== 1 ? 's' : ''}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleStartQuiz(s.subject)}
                    disabled={startingQuiz === s.subject}
                  >
                    {startingQuiz === s.subject ? 'Starting...' : 'Start Quiz (10 questions)'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
