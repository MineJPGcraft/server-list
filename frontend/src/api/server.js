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

export const banUser = (data) => apiClient.post('/admin/user/ban', data)

// 初始化向导
export const getSetupStatus = () => apiClient.get('/setup/status')
export const setupOidc = (data) => apiClient.post('/setup/oidc', data)
export const setupPromote = () => apiClient.post('/setup/promote')
export const setupPromoteById = (userid) => apiClient.post('/setup/promote-by-id', { userid })

// 用户申请
export const getMyRequests = () => apiClient.get('/request/list')
export const createRequest = (data) => apiClient.post('/request/create', data)
export const editRequest = (data) => apiClient.post('/request/edit', data)
export const submitRequest = (id) => apiClient.post('/request/submit', { id })
export const cancelRequest = (id) => apiClient.post('/request/cancel', { id })
export const deleteRequest = (id) => apiClient.post('/request/delete', { id })
// 管理员审核
export const getAdminRequests = () => apiClient.get('/admin/request/list')
export const adminEditRequest = (data) => apiClient.post('/admin/request/edit', data)
export const approveRequest = (id, force_create = false) => apiClient.post('/admin/request/approve', { id, force_create })
export const rejectRequest = (id, reason = '') => apiClient.post('/admin/request/reject', { id, reason })
export const adminSubmitRequest = (id) => apiClient.post('/admin/request/submit', { id })
