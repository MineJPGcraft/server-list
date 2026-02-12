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

    <ServerForm
      :server="currentServer"
      :mode="isCreateMode ? 'create' : 'edit'"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, NAlert } from 'naive-ui'
import { useServerStore } from '@/stores/serverStore'
import ServerForm from '@/components/ServerForm.vue'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const serverStore = useServerStore()

const currentServer = ref(null)

const isCreateMode = computed(() => {
  return route.path === '/create' || !route.params.id
})

onMounted(async () => {
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
})

const handleSubmit = async (formData) => {
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
    message.error((isCreateMode.value ? '添加' : '更新') + '失败：' + error.message)
  }
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
