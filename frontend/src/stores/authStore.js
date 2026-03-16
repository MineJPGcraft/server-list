import { defineStore } from 'pinia'
import { checkAuth, logout, loginWithToken } from '@/api/server'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    perm: 0
  }),

  getters: {
    isActive: (state) => state.isAuthenticated && state.perm >= 1,
    isAdmin: (state) => state.perm >= 2,
    isSuperAdmin: (state) => state.perm >= 3
  },

  actions: {
    async checkAuth() {
      try {
        const data = await checkAuth()
        this.isAuthenticated = true
        this.perm = data.perm
        return true
      } catch {
        this.isAuthenticated = false
        this.perm = 0
        return false
      }
    },

    async logout() {
      try {
        await logout()
      } catch {}
      this.isAuthenticated = false
      this.perm = 0
    },

    async loginWithToken(token) {
      try {
        await loginWithToken(token)
        await this.checkAuth()
        return true
      } catch (e) {
        throw e
      }
    }
  }
})
