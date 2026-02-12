import { defineStore } from 'pinia'
import { checkToken } from '@/api/server'

export const useAuthStore = defineStore('auth', {
  state: () => {
    const token = localStorage.getItem('auth_token')
    return {
      token: token || null,
      isAuthenticated: !!token
    }
  },

  actions: {
    setToken(token) {
      this.token = token
      this.isAuthenticated = true
      localStorage.setItem('auth_token', token)
    },

    clearToken() {
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('auth_token')
    },

    async verifyToken(token) {
      try {
        await checkToken(token)
        this.setToken(token)
        return true
      } catch (error) {
        this.clearToken()
        return false
      }
    },

    getToken() {
      return this.token
    }
  }
})
