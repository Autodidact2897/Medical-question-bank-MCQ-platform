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

// Track when login/register last succeeded so we don't kick users out
// immediately after they log in (cross-origin cookie may not be ready yet)
let lastAuthSuccessAt = 0
export function markAuthSuccess() {
  lastAuthSuccessAt = Date.now()
}

// Debounce: only one verification in flight at a time
let verifying = false

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me')
      const isQuizCall = url.includes('/quiz/') && (url.includes('/answer') || url.includes('/complete'))

      if (!isAuthCall && !isQuizCall && onAuthError) {
        // If we logged in within the last 5 seconds, don't clear — cookie might not be ready yet
        const timeSinceAuth = Date.now() - lastAuthSuccessAt
        if (timeSinceAuth < 5000) {
          // Skip clearing — the login just happened
          return Promise.reject(error)
        }

        // Verify the session is truly dead before clearing
        if (!verifying) {
          verifying = true
          try {
            await api.get('/auth/me')
            // /auth/me succeeded — session is fine, don't clear
          } catch {
            // /auth/me also failed — session is truly expired
            onAuthError()
          } finally {
            verifying = false
          }
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
