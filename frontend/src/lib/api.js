import axios from 'axios'

const rawUrl = import.meta.env.VITE_API_URL || ''
const api = axios.create({
  baseURL: rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`,
  withCredentials: true,
})

// Auth state is managed ONLY by AuthContext:
//   - On page load: /auth/me determines if user is logged in
//   - On login/register: setUser is called with the response
//   - On logout: setUser(null) is called
//
// The 401 interceptor DOES NOT clear auth state.
// This prevents cross-origin cookie timing issues from logging users out
// mid-session. Individual pages handle 401 errors in their own catch blocks.

export default api
