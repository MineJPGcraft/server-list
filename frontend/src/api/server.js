import axios from 'axios'

const BASE_URL = '/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const getServers = () => apiClient.get('/getjson')

export const createServer = (server) => apiClient.post('/admin/create', server)

export const editServer = (server) => apiClient.post('/admin/edit', server)

export const deleteServer = (uuid) => apiClient.post('/admin/delete', { uuid })

export const checkAuth = () => apiClient.get('/auth/check')

export const logout = () => apiClient.post('/auth/logout')

export const loginWithToken = (token) => apiClient.post('/auth/token', { token })

export const getOidcProviders = () => apiClient.get('/oidcConfig/list')

export const getOidcAdminList = () => apiClient.get('/oidcConfig/admin/list')

export const createOidcProvider = (data) => apiClient.post('/oidcConfig/admin/create', data)

export const editOidcProvider = (data) => apiClient.post('/oidcConfig/admin/edit', data)

export const deleteOidcProvider = (clientId) => apiClient.post('/oidcConfig/admin/delete', { clientId })

export const getUserList = () => apiClient.get('/admin/user/list')

export const editUser = (data) => apiClient.post('/admin/user/edit', data)
