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
    },
    getServerByUuid: (state) => (uuid) => {
      return state.servers.find(s => s.uuid === uuid)
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
        const uuid = await serverAPI.createServer(server)
        // 重新获取服务器列表以获取完整数据
        await this.fetchServers()
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
        await serverAPI.editServer(server)
        // 重新获取服务器列表以获取最新数据
        await this.fetchServers()
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteServer(uuid) {
      this.loading = true
      this.error = null
      try {
        await serverAPI.deleteServer(uuid)
        // 从本地状态移除
        this.servers = this.servers.filter(s => s.uuid !== uuid)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
