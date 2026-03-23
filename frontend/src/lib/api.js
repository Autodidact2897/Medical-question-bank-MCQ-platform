import axios from 'axios'

const rawUrl = import.meta.env.VITE_API_URL || ''
const api = axios.create({
  baseURL: rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`,
  withCredentials: true,
})

// Auth error handler — set by AuthContext to clear user state on 401
let onAuthError = null
export function setAuthErrorHandler(handler) {
  onAuthError = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't clear auth state on login/register/me calls or active quiz submissions
      // Quiz pages handle 401 themselves to show a warning instead of losing progress
      const url = error.config?.url || ''
      const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me')
      const isQuizCall = url.includes('/quiz/') && (url.includes('/answer') || url.includes('/complete'))
      if (!isAuthCall && !isQuizCall && onAuthError) {
        onAuthError()
      }
    }
    return Promise.reject(error)
  }
)

export default api
