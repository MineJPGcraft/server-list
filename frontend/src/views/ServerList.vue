<template>
  <div class="server-list-container">
    <div class="header">
      <h1>服务器列表</h1>
      <div class="header-actions">
        <n-button
          v-if="authStore.isAuthenticated"
          quaternary
          @click="handleLogout"
        >
          退出登录
        </n-button>
        <n-button type="primary" @click="handleAdd">
          添加服务器
        </n-button>
      </div>
    </div>

    <n-spin :show="serverStore.loading">
      <div v-if="serverStore.servers.length > 0" class="server-grid">
        <ServerCard
          v-for="server in serverStore.servers"
          :key="server.id"
          :server="server"
          @contextmenu="handleContextMenu"
        />
      </div>
      <n-empty
        v-else
        description="暂无服务器"
        class="empty-state"
      />
    </n-spin>

    <ContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      @delete="handleDelete"
      @close="contextMenu.hide"
    />

    <TokenDialog
      v-model:show="showTokenDialog"
      @submit="handleTokenSubmit"
      @cancel="handleTokenCancel"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NSpin, NEmpty, useMessage, useDialog } from 'naive-ui'
import { useServerStore } from '@/stores/serverStore'
import { useAuthStore } from '@/stores/authStore'
import { useContextMenu } from '@/composables/useContextMenu'
import ServerCard from '@/components/ServerCard.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import TokenDialog from '@/components/TokenDialog.vue'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const serverStore = useServerStore()
const authStore = useAuthStore()
const contextMenu = useContextMenu()

const showTokenDialog = ref(false)
let pendingAction = null

onMounted(async () => {
  try {
    await serverStore.fetchServers()
  } catch (error) {
    message.error('加载服务器列表失败：' + error.message)
  }
})

const requireAuth = (action) => {
  if (!authStore.token) {
    pendingAction = action
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
    if (pendingAction) {
      pendingAction()
      pendingAction = null
    }
  } else {
    message.error('Token 无效')
  }
}

const handleTokenCancel = () => {
  pendingAction = null
  showTokenDialog.value = false
}

const handleLogout = () => {
  dialog.warning({
    title: '确认退出',
    content: '确定要退出登录吗？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: () => {
      authStore.clearToken()
      message.success('已退出登录')
    }
  })
}

const handleAdd = () => {
  if (requireAuth(() => handleAdd())) {
    router.push('/create')
  }
}

const handleContextMenu = (event, server) => {
  contextMenu.show(event, server)
}

const handleDelete = () => {
  const server = contextMenu.targetData.value
  if (!server) return

  // 先隐藏右键菜单
  contextMenu.hide()

  // 检查身份验证
  if (!requireAuth(() => {
    // 重新显示菜单并触发删除
    contextMenu.show({ clientX: contextMenu.x.value, clientY: contextMenu.y.value, preventDefault: () => {} }, server)
    handleDelete()
  })) {
    return
  }

  // 弹出确认对话框
  dialog.warning({
    title: '确认删除',
    content: `确定要删除服务器 "${server.name}" 吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await serverStore.deleteServer(server.id)
        message.success('删除成功')
      } catch (error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          authStore.clearToken()
          message.error('身份验证失败，请重新登录')
        } else {
          message.error('删除失败：' + error.message)
        }
      }
    }
  })
}
</script>

<style scoped>
.server-list-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.empty-state {
  padding: 60px 0;
}

@media (max-width: 768px) {
  .server-grid {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
