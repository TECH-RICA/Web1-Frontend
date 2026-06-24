import { create } from 'zustand'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
}

interface AuthStore {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  logout: () => void
}

const API_URL = 'http://localhost:5000/api'

export const useAuthStore = create<AuthStore>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('token'),
  
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (res.ok) {
      set({ user: data.user, token: data.token })
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
    } else {
      throw new Error(data.error)
    }
  },
  
  register: async (email: string, password: string, firstName: string, lastName: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName })
    })
    const data = await res.json()
    if (res.ok) {
      set({ user: data.user, token: data.token })
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
    } else {
      throw new Error(data.error)
    }
  },
  
  logout: () => {
    set({ user: null, token: null })
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }
}))
