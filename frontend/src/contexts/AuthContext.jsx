import { createContext, useContext, useState, useEffect } from 'react'
import api, { setAuthErrorHandler } from '../lib/api'

// Think of AuthContext like a noticeboard in the centre of the building —
// every room (page) can check it to know if the user is logged in.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On first load, check if the user already has a valid session
  useEffect(() => {
    // Register the 401 handler so expired tokens clear auth state
    // instead of doing a hard page redirect
    setAuthErrorHandler(() => setUser(null))

    api.get('/auth/me')
      .then(res => setUser(res.data.data || res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    setUser(res.data.data || res.data.user)
    return res.data
  }

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    setUser(res.data.data || res.data.user)
    return res.data
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — any page can call useAuth() to get user info
export function useAuth() {
  return useContext(AuthContext)
}
