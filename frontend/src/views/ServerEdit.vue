<template>
  <div class="server-edit-container">
    <div class="header">
      <h1>{{ isCreateMode ? '添加服务器' : '编辑服务器' }}</h1>
    </div>

    <n-alert
      v-if="isCreateMode"
      type="warning"
      title="重要提示"
      :bordered="false"
      style="margin-bottom: 20px"
    >
      <ul style="margin: 0; padding-left: 20px;">
        <li>服务器添加后ID不可改变</li>
        <li>如果你选择的ID和已有服务器重复则此操作相当于修改已有服务器</li>
      </ul>
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
  return route.path === '/create' || !route.params.id
})

onMounted(async () => {
  // 先检查身份验证
  if (!authStore.token) {
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
      const serverId = route.params.id

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

      currentServer.value = serverStore.getServerById(serverId)

      if (!currentServer.value) {
        message.error('服务器不存在')
        router.push('/')
      }
    } else {
      // 创建模式，初始化空数据
      currentServer.value = {
        id: '',
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
  if (!authStore.token) {
    showTokenDialog.value = true
    return false
  }
  return true
}

const handleTokenSubmit = async (token) => {
  const isValid = await authStore.verifyToken(token)
  if (isValid) {
    message.success('验证成功')
    showTokenDialog.value = false

    // 如果是初始验证，加载页面数据
    if (isInitialAuth) {
      isInitialAuth = false
      await loadPageData()
    }

    // 如果有待提交的表单数据，执行提交
    if (pendingFormData) {
      await performSubmit(pendingFormData)
      pendingFormData = null
    }
  } else {
    message.error('Token 无效')
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
    if (error.message.includes('401') || error.message.includes('403')) {
      authStore.clearToken()
      message.error('身份验证失败，请重新登录')
    } else {
      message.error((isCreateMode.value ? '添加' : '更新') + '失败：' + error.message)
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
