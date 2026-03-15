<template>
  <div class="server-edit-container">
    <div class="header">
      <h1>{{ isCreateMode ? '添加服务器' : '编辑服务器' }}</h1>
    </div>

    <n-alert
      v-if="isCreateMode"
      type="info"
      title="提示"
      :bordered="false"
      style="margin-bottom: 20px"
    >
      服务器将自动生成唯一的UUID作为标识符
    </n-alert>

    <n-spin :show="loading">
      <ServerForm
        v-if="currentServer"
        :server="currentServer"
        :mode="isCreateMode ? 'create' : 'edit'"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </n-spin>

    <TokenDialog
      v-model:show="showTokenDialog"
      @submit="handleTokenSubmit"
      @cancel="handleTokenCancel"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, NAlert, NSpin } from 'naive-ui'
import { useServerStore } from '@/stores/serverStore'
import { useAuthStore } from '@/stores/authStore'
import ServerForm from '@/components/ServerForm.vue'
import TokenDialog from '@/components/TokenDialog.vue'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const serverStore = useServerStore()
const authStore = useAuthStore()

const currentServer = ref(null)
const showTokenDialog = ref(false)
const loading = ref(false)
let pendingFormData = null
let isInitialAuth = false

const isCreateMode = computed(() => {
  return route.path === '/create' || !route.params.uuid
})

onMounted(async () => {
  // 先检查身份验证
  await authStore.checkAuth()
  if (!authStore.isAuthenticated) {
    isInitialAuth = true
    showTokenDialog.value = true
    return
  }

  // 已登录，继续加载数据
  await loadPageData()
})

const loadPageData = async () => {
  loading.value = true
  try {
    if (!isCreateMode.value) {
      // 编辑模式，获取服务器数据
      const serverUuid = route.params.uuid

      // 如果 store 中没有数据，先加载
      if (serverStore.servers.length === 0) {
        try {
          await serverStore.fetchServers()
        } catch (error) {
          message.error('加载服务器数据失败：' + error.message)
          router.push('/')
          return
        }
      }

      currentServer.value = serverStore.getServerByUuid(serverUuid)

      if (!currentServer.value) {
        message.error('服务器不存在')
        router.push('/')
      }
    } else {
      // 创建模式，初始化空数据
      currentServer.value = {
        name: '',
        type: '',
        version: '',
        icon: '',
        link: '',
        ip: '',
        description: ''
      }
    }
  } finally {
    loading.value = false
  }
}

const requireAuth = (action) => {
  if (!authStore.isAuthenticated) {
    showTokenDialog.value = true
    return false
  }
  return true
}

const handleTokenSubmit = async (token) => {
  try {
    await authStore.loginWithToken(token)
    message.success('验证成功')
    showTokenDialog.value = false

    if (isInitialAuth) {
      isInitialAuth = false
      await loadPageData()
    }

    if (pendingFormData) {
      await performSubmit(pendingFormData)
      pendingFormData = null
    }
  } catch (e) {
    const msg = e.response?.data
    if (msg === 'Token disabled') {
      message.error('Token 登录未启用')
    } else {
      message.error('Token 无效')
    }
  }
}

const handleTokenCancel = () => {
  // 如果是初始验证被取消，返回首页
  if (isInitialAuth) {
    isInitialAuth = false
    message.info('需要登录才能访问此页面')
    router.push('/')
    return
  }

  // 表单提交验证被取消
  pendingFormData = null
  showTokenDialog.value = false
}

const performSubmit = async (formData) => {
  try {
    if (isCreateMode.value) {
      await serverStore.createServer(formData)
      message.success('添加成功')
    } else {
      await serverStore.updateServer(formData)
      message.success('更新成功')
    }
    router.push('/')
  } catch (error) {
    if (error.response?.status === 403) {
      if (error.response.data === 'Permission denied') {
        message.error('权限不足')
      } else {
        authStore.isAuthenticated = false
        authStore.perm = 0
        message.error('登录已失效，请重新登录')
      }
    } else {
      message.error((isCreateMode.value ? '添加' : '更新') + '失败：' + (error.response?.data || error.message))
    }
  }
}

const handleSubmit = async (formData) => {
  if (!requireAuth()) {
    pendingFormData = formData
    return
  }
  await performSubmit(formData)
}

const handleCancel = () => {
  router.push('/')
}
</script>

<style scoped>
.server-edit-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  margin-bottom: 32px;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}
</style>
