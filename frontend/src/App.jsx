import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import LandingPage from './pages/LandingPage'
import LnaQuiz from './pages/LnaQuiz'
import LnaResults from './pages/LnaResults'
import RapidDiagnosticPage from './pages/RapidDiagnosticPage'
import RapidDiagnosticResultsPage from './pages/RapidDiagnosticResultsPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import SubjectPicker from './pages/SubjectPicker'
import QuizPage from './pages/QuizPage'
import QuizResults from './pages/QuizResults'
import ClinicalBriefs from './pages/ClinicalBriefs'
import SingleBrief from './pages/SingleBrief'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import AdminDashboard from './pages/AdminDashboard'
import AdminEmails from './pages/AdminEmails'
import Account from './pages/Account'
import NotFound from './pages/NotFound'
import LnaResultsPage from './pages/LnaResultsPage'
import StudyByDifficultyPage from './pages/StudyByDifficultyPage'
import LnaAnalyticsPage from './pages/LnaAnalyticsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/lna-quiz" element={<LnaQuiz />} />
          <Route path="/lna-results/:sessionId" element={<LnaResults />} />
          <Route path="/rapid-diagnostic" element={<RapidDiagnosticPage />} />
          <Route path="/rapid-diagnostic/results/:sessionToken" element={<RapidDiagnosticResultsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Protected routes - require login */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/subjects" element={
            <ProtectedRoute><SubjectPicker /></ProtectedRoute>
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
          <Route path="/admin" element={
            <ProtectedRoute><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/emails" element={
            <ProtectedRoute><AdminEmails /></ProtectedRoute>
          } />
          <Route path="/account" element={
            <ProtectedRoute><Account /></ProtectedRoute>
          } />
          <Route path="/study/difficulty" element={
            <ProtectedRoute><StudyByDifficultyPage /></ProtectedRoute>
          } />
          <Route path="/lna/results" element={
            <ProtectedRoute><LnaResultsPage /></ProtectedRoute>
          } />
          <Route path="/lna/analytics" element={
            <ProtectedRoute><LnaAnalyticsPage /></ProtectedRoute>
          } />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
