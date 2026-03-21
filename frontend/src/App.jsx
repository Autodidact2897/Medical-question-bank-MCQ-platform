import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import LandingPage from './pages/LandingPage'
import LnaQuiz from './pages/LnaQuiz'
import LnaResults from './pages/LnaResults'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import QuizPage from './pages/QuizPage'
import QuizResults from './pages/QuizResults'
import ClinicalBriefs from './pages/ClinicalBriefs'
import SingleBrief from './pages/SingleBrief'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/lna-quiz" element={<LnaQuiz />} />
          <Route path="/lna-results/:sessionId" element={<LnaResults />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes - require login */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/quiz/:id" element={
            <ProtectedRoute><QuizPage /></ProtectedRoute>
          } />
          <Route path="/quiz/:id/results" element={
            <ProtectedRoute><QuizResults /></ProtectedRoute>
          } />
          <Route path="/briefs" element={
            <ProtectedRoute><ClinicalBriefs /></ProtectedRoute>
          } />
          <Route path="/briefs/:id" element={
            <ProtectedRoute><SingleBrief /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
