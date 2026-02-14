import axios from 'axios'

const BASE_URL = '/api'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器添加 token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers['authorization'] = token
    }
    return config
  },
  error => Promise.reject(error)
)

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

export const createServer = (server) => apiClient.post('/create', server)

export const editServer = (server) => apiClient.post('/edit', server)

export const deleteServer = (uuid) => apiClient.post('/delete', { uuid })

export const checkToken = (token) =>
  axios.get(`${BASE_URL}/checkToken`, {
    headers: {
      'authorization': token
    }
  })
