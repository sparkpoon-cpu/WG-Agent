import { create } from 'zustand'
import { api } from './api'

interface AuthState {
  user: { id: string; username: string; isAdmin: boolean } | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('wg-auth-token'),
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    const result = await api.login(username, password)
    localStorage.setItem('wg-auth-token', result.token)
    set({ token: result.token, user: result.user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('wg-auth-token')
    set({ token: null, user: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('wg-auth-token')
    if (!token) {
      set({ isAuthenticated: false })
      return
    }
    try {
      const user = await api.getMe()
      set({ user, isAuthenticated: true })
    } catch {
      localStorage.removeItem('wg-auth-token')
      set({ token: null, user: null, isAuthenticated: false })
    }
  }
}))
