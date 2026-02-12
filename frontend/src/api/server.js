import axios from 'axios'

const BASE_URL = '/api'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器处理错误
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

// API 方法
export const getServers = () => apiClient.get('/getjson')

export const saveServer = (server) => apiClient.post('/edit', [server])

export const deleteServer = (id) => apiClient.post('/delete', { id })
