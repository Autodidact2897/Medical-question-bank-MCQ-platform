import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getResults, startQuiz } from '../services/api';

export default function ResultsPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const subject = location.state?.subject || '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getResults(sessionId)
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load results.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleTryAgain = async () => {
    try {
      const res = await startQuiz(subject, 10);
      const { sessionId: newSessionId, questions } = res.data.data;
      navigate(`/quiz/${newSessionId}`, { state: { questions, subject } });
    } catch {
      setError('Failed to start a new quiz.');
    }
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return { text: 'Excellent work!', cls: 'score-excellent' };
    if (score >= 60) return { text: 'Good effort — review the questions you missed', cls: 'score-good' };
    return { text: 'Keep practising — focus on the highlighted topics', cls: 'score-low' };
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (error) return <div className="error-page"><p>{error}</p><button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Dashboard</button></div>;

  const { score, totalQuestions, correctAnswers, results } = data;
  const { text: scoreMsg, cls: scoreCls } = getScoreMessage(score);

  return (
    <div className="results-page">
      <div className="results-header">
        <div className="dashboard-header-left">
          <span className="header-logo">⚕</span>
          <span className="header-title">MedQBank</span>
        </div>
      </div>

      <div className="results-container">
        <div className={`score-card ${scoreCls}`}>
          <div className="score-big">{correctAnswers}/{totalQuestions}</div>
          <div className="score-percent">{score}%</div>
          <div className="score-message">{scoreMsg}</div>
          {subject && <div className="score-subject">{subject}</div>}
        </div>

        <div className="results-actions">
          <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          {subject && (
            <button className="btn btn-primary" onClick={handleTryAgain}>
              Try Again
            </button>
          )}
        </div>

        <div className="results-list">
          {results.map((r, i) => (
            <div key={i} className={`result-item ${r.is_correct ? 'result-correct' : 'result-wrong'}`}>
              <div className="result-item-header">
                <span className="result-icon">{r.is_correct ? '✓' : '✗'}</span>
                <span className="result-num">Q{i + 1}</span>
                <span className="result-topic">{r.topic}</span>
                <span className="result-difficulty">{r.difficulty}</span>
              </div>
              <p className="result-question">{r.question_text}</p>
              <div className="result-answers">
                <span className={`answer-tag ${r.is_correct ? 'answer-correct' : 'answer-wrong'}`}>
                  Your answer: {r.user_answer}
                </span>
                {!r.is_correct && (
                  <span className="answer-tag answer-correct">
                    Correct: {r.correct_answer}
                  </span>
                )}
              </div>
              <div className="result-explanation">
                <strong>Explanation:</strong> {r.explanation}
              </div>
            </div>
          ))}
        </div>

        <div className="results-actions results-actions-bottom">
          <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          {subject && (
            <button className="btn btn-primary" onClick={handleTryAgain}>
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
