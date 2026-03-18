import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { submitAnswer } from '../services/api';

const OPTION_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export default function QuizPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const questions = location.state?.questions || [];
  const subject = location.state?.subject || '';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null); // { isCorrect, correctAnswer, explanation }
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!questions.length) {
    return (
      <div className="error-page">
        <p>No questions found. Please go back to the dashboard and start a new quiz.</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  const question = questions[currentIndex];
  const total = questions.length;
  const progress = ((currentIndex) / total) * 100;
  const isLast = currentIndex === total - 1;

  const options = OPTION_KEYS
    .map((key) => ({ key: key.toUpperCase(), text: question[`option_${key}`] }))
    .filter((opt) => opt.text && opt.text.trim() !== '');

  const handleSelect = async (letter) => {
    if (selectedAnswer || submitting) return;
    setSelectedAnswer(letter);
    setSubmitting(true);
    try {
      const res = await submitAnswer(sessionId, question.id, letter);
      setResult(res.data.data);
    } catch {
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isLast) {
      navigate(`/results/${sessionId}`, { state: { subject } });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setResult(null);
    }
  };

  const getOptionClass = (letter) => {
    if (!result) {
      return selectedAnswer === letter ? 'option-btn option-selected' : 'option-btn';
    }
    if (letter === result.correctAnswer.toUpperCase()) return 'option-btn option-correct';
    if (letter === selectedAnswer) return 'option-btn option-wrong';
    return 'option-btn option-neutral';
  };

  return (
    <div className="quiz-page">
      <div className="quiz-header">
        <div className="quiz-header-left">
          <span className="header-logo">⚕</span>
          <span className="header-title">MedQBank</span>
        </div>
        <div className="quiz-meta">
          <span className="quiz-subject">{subject}</span>
          <span className="quiz-timer">⏱ {formatTime(seconds)}</span>
        </div>
      </div>

      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="quiz-container">
        <div className="quiz-counter">Question {currentIndex + 1} of {total}</div>

        <div className="quiz-question-card">
          <p className="quiz-question-text">{question.question_text}</p>
        </div>

        <div className="options-list">
          {options.map((opt) => (
            <button
              key={opt.key}
              className={getOptionClass(opt.key)}
              onClick={() => handleSelect(opt.key)}
              disabled={!!selectedAnswer || submitting}
            >
              <span className="option-letter">{opt.key}</span>
              <span className="option-text">{opt.text}</span>
              {result && opt.key === result.correctAnswer.toUpperCase() && (
                <span className="option-icon">✓</span>
              )}
              {result && opt.key === selectedAnswer && opt.key !== result.correctAnswer.toUpperCase() && (
                <span className="option-icon">✗</span>
              )}
            </button>
          ))}
        </div>

        {submitting && <div className="submitting-msg">Checking answer...</div>}

        {result && (
          <div className={`feedback-box ${result.isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
            <div className="feedback-verdict">
              {result.isCorrect ? '✓ Correct!' : `✗ Incorrect — the correct answer is ${result.correctAnswer}`}
            </div>
            <div className="feedback-explanation">
              <strong>Explanation:</strong> {result.explanation}
            </div>
            <button className="btn btn-primary" onClick={handleNext}>
              {isLast ? 'See Results' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
