import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

// Redirect to /login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const signup = (email, password) =>
  api.post('/api/auth/signup', { email, password });

export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const logout = () =>
  api.post('/api/auth/logout');

export const getMe = () =>
  api.get('/api/auth/me');

export const getSubjects = () =>
  api.get('/api/subjects');

export const startQuiz = (subject, questionCount) =>
  api.post('/api/quiz/start', { subject, questionCount });

export const submitAnswer = (sessionId, questionId, userAnswer) =>
  api.post(`/api/quiz/${sessionId}/answer`, { questionId, userAnswer });

export const getResults = (sessionId) =>
  api.get(`/api/quiz/${sessionId}/results`);

export default api;
