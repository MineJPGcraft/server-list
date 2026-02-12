import { defineStore } from 'pinia'
import * as serverAPI from '@/api/server'

export const useServerStore = defineStore('server', {
  state: () => ({
    servers: [],
    loading: false,
    error: null
  }),

  getters: {
    getServerById: (state) => (id) => {
      return state.servers.find(s => s.id === id)
    }
  },

  actions: {
    async fetchServers() {
      this.loading = true
      this.error = null
      try {
        this.servers = await serverAPI.getServers()
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async createServer(server) {
      this.loading = true
      this.error = null
      try {
        await serverAPI.saveServer(server)
        // 添加到本地状态
        this.servers.push(server)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateServer(server) {
      this.loading = true
      this.error = null
      try {
        await serverAPI.saveServer(server)
        // 更新本地状态
        const index = this.servers.findIndex(s => s.id === server.id)
        if (index !== -1) {
          this.servers[index] = server
        }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteServer(id) {
      this.loading = true
      this.error = null
      try {
        await serverAPI.deleteServer(id)
        // 从本地状态移除
        this.servers = this.servers.filter(s => s.id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
