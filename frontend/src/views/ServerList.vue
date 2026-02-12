<template>
  <div class="server-list-container">
    <div class="header">
      <h1>服务器列表</h1>
      <n-button type="primary" @click="handleAdd">
        添加服务器
      </n-button>
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
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NSpin, NEmpty, useMessage, useDialog } from 'naive-ui'
import { useServerStore } from '@/stores/serverStore'
import { useContextMenu } from '@/composables/useContextMenu'
import ServerCard from '@/components/ServerCard.vue'
import ContextMenu from '@/components/ContextMenu.vue'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const serverStore = useServerStore()
const contextMenu = useContextMenu()

onMounted(async () => {
  try {
    await serverStore.fetchServers()
  } catch (error) {
    message.error('加载服务器列表失败：' + error.message)
  }
})

const handleAdd = () => {
  router.push('/create')
}

const handleContextMenu = (event, server) => {
  contextMenu.show(event, server)
}

const handleDelete = () => {
  const server = contextMenu.targetData.value
  if (!server) return

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
        message.error('删除失败：' + error.message)
      }
    }
  })

  contextMenu.hide()
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
