import axios from 'axios'

const rawUrl = import.meta.env.VITE_API_URL || ''
const api = axios.create({
  baseURL: rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      const publicPaths = ['/login', '/signup', '/register', '/rapid-diagnostic', '/lna-quiz', '/lna-results', '/privacy', '/terms']
      const isPublic = currentPath === '/' || publicPaths.some(p => currentPath.startsWith(p))
      if (!isPublic) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
