<template>
  <div class="request-list-container">
    <div class="header">
      <n-button quaternary @click="router.push('/')">← 返回列表</n-button>
      <h1>我的申请</h1>
      <n-button type="primary" @click="router.push('/requests/new')">新建申请</n-button>
    </div>

    <n-spin :show="loading">
      <n-empty v-if="!loading && requests.length === 0" description="暂无申请" style="padding: 60px 0" />
      <n-data-table
        v-else
        :columns="columns"
        :data="requests"
        :row-key="row => row.id"
      />
    </n-spin>

    <n-modal v-model:show="showRejectReason" preset="dialog" title="拒绝理由">
      <div>{{ selectedRejectReason || '（无）' }}</div>
      <template #action>
        <n-button @click="showRejectReason = false">关闭</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton, NSpin, NEmpty, NDataTable, NTag, NModal, NSpace, useMessage, useDialog
} from 'naive-ui'
import { getMyRequests, submitRequest, cancelRequest, deleteRequest } from '@/api/server'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const loading = ref(true)
const requests = ref([])
const showRejectReason = ref(false)
const selectedRejectReason = ref('')

const statusTagType = {
  draft: 'default',
  pending: 'info',
  approved: 'success',
  rejected: 'error'
}
const statusLabel = {
  draft: '草稿',
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝'
}
const reqTypeLabel = {
  create: '新建服务器',
  edit: '编辑服务器'
}

const fetchRequests = async () => {
  loading.value = true
  try {
    requests.value = await getMyRequests()
  } catch (e) {
    message.error('加载失败：' + (e.response?.data || e.message))
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (row) => {
  try {
    await submitRequest(row.id)
    message.success('已提交审核')
    await fetchRequests()
  } catch (e) {
    const msg = e.response?.data || e.message
    if (e.response?.status === 429) {
      message.error('待审核申请已达上限，请等待审核完成')
    } else {
      message.error('提交失败：' + msg)
    }
  }
}

const handleCancel = async (row) => {
  try {
    await cancelRequest(row.id)
    message.success('已撤回')
    await fetchRequests()
  } catch (e) {
    message.error('撤回失败：' + (e.response?.data || e.message))
  }
}

const handleDelete = (row) => {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除此草稿吗？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteRequest(row.id)
        message.success('已删除')
        await fetchRequests()
      } catch (e) {
        message.error('删除失败：' + (e.response?.data || e.message))
      }
    }
  })
}

const columns = [
  {
    title: '类型',
    key: 'req_type',
    render: (row) => reqTypeLabel[row.req_type] || row.req_type
  },
  {
    title: '目标服务器',
    key: 'target_uuid',
    render: (row) => row.target_uuid ? h('span', { style: 'font-family: monospace; font-size: 12px' }, row.target_uuid) : '—'
  },
  {
    title: '服务器名称',
    key: 'data',
    render: (row) => row.data?.name || '—'
  },
  {
    title: '状态',
    key: 'status',
    render: (row) => h(NTag, { type: statusTagType[row.status] || 'default' }, { default: () => statusLabel[row.status] || row.status })
  },
  {
    title: '创建时间',
    key: 'created_at',
    render: (row) => new Date(row.created_at).toLocaleString()
  },
  {
    title: '操作',
    key: 'actions',
    render: (row) => {
      const btns = []
      if (row.status === 'draft') {
        btns.push(h(NButton, { size: 'small', type: 'primary', onClick: () => handleSubmit(row) }, { default: () => '提交审核' }))
        btns.push(h(NButton, { size: 'small', onClick: () => router.push(`/requests/edit/${row.id}`) }, { default: () => '编辑' }))
        btns.push(h(NButton, { size: 'small', type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }))
      } else if (row.status === 'pending') {
        btns.push(h(NButton, { size: 'small', onClick: () => handleCancel(row) }, { default: () => '撤回' }))
      } else if (row.status === 'rejected') {
        btns.push(h(NButton, { size: 'small', onClick: () => { selectedRejectReason.value = row.reject_reason; showRejectReason.value = true } }, { default: () => '查看理由' }))
        btns.push(h(NButton, { size: 'small', type: 'primary', onClick: () => router.push(`/requests/edit/${row.id}`) }, { default: () => '重新编辑' }))
      }
      return h(NSpace, {}, { default: () => btns })
    }
  }
]

onMounted(fetchRequests)
</script>

<style scoped>
.request-list-container {
  max-width: 1200px;
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
  font-size: 24px;
  font-weight: 600;
}
</style>
