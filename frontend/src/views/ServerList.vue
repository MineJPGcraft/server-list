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

    <!-- 搜索和分页设置 -->
    <div class="toolbar">
      <n-input
        v-model:value="searchQuery"
        placeholder="按名称搜索服务器..."
        clearable
        class="search-input"
      >
        <template #prefix>
          <n-icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z"/>
            </svg>
          </n-icon>
        </template>
      </n-input>
      <div class="page-size-selector">
        <span class="page-size-label">每页显示：</span>
        <n-select
          v-model:value="pageSize"
          :options="pageSizeOptions"
          size="small"
          style="width: 100px"
        />
      </div>
    </div>

    <n-spin :show="serverStore.loading">
      <div v-if="paginatedServers.length > 0" class="server-grid">
        <ServerCard
          v-for="server in paginatedServers"
          :key="server.uuid"
          :server="server"
          @contextmenu="handleContextMenu"
        />
      </div>
      <n-empty
        v-else
        :description="searchQuery ? '未找到匹配的服务器' : '暂无服务器'"
        class="empty-state"
      />

      <!-- 分页 -->
      <div v-if="filteredServers.length > 0" class="pagination-container">
        <n-pagination
          v-model:page="currentPage"
          :item-count="filteredServers.length"
          :page-size="pageSize"
          show-size-picker
          :page-sizes="[6, 12, 24, 48]"
          @update:page-size="handlePageSizeChange"
        >
          <template #prefix="{ itemCount }">
            共 {{ itemCount }} 个服务器
          </template>
        </n-pagination>
      </div>
    </n-spin>

    <ContextMenu
      :visible="contextMenu.visible.value"
      :x="contextMenu.x.value"
      :y="contextMenu.y.value"
      @delete="handleDelete"
    />

    <TokenDialog
      v-model:show="showTokenDialog"
      @submit="handleTokenSubmit"
      @cancel="handleTokenCancel"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NSpin, NEmpty, NInput, NSelect, NPagination, NIcon, useMessage, useDialog } from 'naive-ui'
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

// 搜索和分页状态
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(parseInt(localStorage.getItem('serverListPageSize')) || 12)

const pageSizeOptions = [
  { label: '6', value: 6 },
  { label: '12', value: 12 },
  { label: '24', value: 24 },
  { label: '48', value: 48 }
]

// 过滤后的服务器列表
const filteredServers = computed(() => {
  if (!searchQuery.value) {
    return serverStore.servers
  }

  const query = searchQuery.value.toLowerCase().trim()
  return serverStore.servers.filter(server =>
    server.name.toLowerCase().includes(query)
  )
})

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredServers.value.length / pageSize.value)
})

// 当前页的服务器列表
const paginatedServers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredServers.value.slice(start, end)
})

// 监听搜索变化，重置到第一页
watch(searchQuery, () => {
  currentPage.value = 1
})

// 监听过滤结果变化，如果当前页超出范围则重置
watch(filteredServers, () => {
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = totalPages.value
  }
})

// 监听分页大小变化，保存到 localStorage
watch(pageSize, (newSize) => {
  localStorage.setItem('serverListPageSize', newSize.toString())
  // 重新计算当前页，避免超出范围
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = totalPages.value
  }
})

const handlePageSizeChange = (newSize) => {
  pageSize.value = newSize
}

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

  // 立即隐藏右键菜单
  contextMenu.hide()

  // 检查身份验证
  if (!requireAuth(() => {
    // 验证成功后重新触发删除
    handleDeleteConfirm(server)
  })) {
    return
  }

  // 直接弹出确认对话框
  handleDeleteConfirm(server)
}

const handleDeleteConfirm = (server) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除服务器 "${server.name}" 吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await serverStore.deleteServer(server.uuid)
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

.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.page-size-label {
  font-size: 14px;
  color: #666;
}

.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.empty-state {
  padding: 60px 0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
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

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    max-width: 100%;
  }

  .page-size-selector {
    justify-content: space-between;
  }
}
</style>
