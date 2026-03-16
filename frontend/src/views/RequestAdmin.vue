<template>
  <div class="request-admin-container">
    <div class="header">
      <n-button quaternary @click="router.push('/')">← 返回列表</n-button>
      <h1>申请管理</h1>
    </div>

    <n-spin :show="loading">
      <n-empty v-if="!loading && requests.length === 0" description="暂无待审核申请" style="padding: 60px 0" />
      <div v-else class="request-cards">
        <n-card
          v-for="req in requests"
          :key="req.id"
          class="request-card"
          :title="reqTypeLabel[req.req_type] || req.req_type"
        >
          <template #header-extra>
            <n-tag type="info">审核中</n-tag>
          </template>

          <n-descriptions :column="2" label-placement="left" size="small">
            <n-descriptions-item label="申请人">{{ req.username || req.userid }}</n-descriptions-item>
            <n-descriptions-item label="申请时间">{{ new Date(req.created_at).toLocaleString() }}</n-descriptions-item>
            <n-descriptions-item label="目标服务器" v-if="req.target_uuid">
              <span style="font-family: monospace; font-size: 12px">{{ req.target_uuid }}</span>
            </n-descriptions-item>
            <n-descriptions-item label="服务器名称">{{ req.data?.name }}</n-descriptions-item>
            <n-descriptions-item label="类型">{{ req.data?.type }}</n-descriptions-item>
            <n-descriptions-item label="版本">{{ req.data?.version }}</n-descriptions-item>
            <n-descriptions-item label="链接">{{ req.data?.link }}</n-descriptions-item>
            <n-descriptions-item label="IP">{{ req.data?.IP || '—' }}</n-descriptions-item>
          </n-descriptions>

          <n-collapse style="margin-top: 12px">
            <n-collapse-item title="查看描述 / 图标" name="detail">
              <div><b>描述：</b>{{ req.data?.description }}</div>
              <div><b>图标URL：</b>{{ req.data?.icon }}</div>
            </n-collapse-item>
          </n-collapse>

          <template #action>
            <n-space>
              <n-button size="small" @click="openEditModal(req)">编辑</n-button>
              <n-button size="small" type="success" @click="handleApprove(req)">通过</n-button>
              <n-button size="small" type="error" @click="openRejectModal(req)">拒绝</n-button>
            </n-space>
          </template>
        </n-card>
      </div>
    </n-spin>

    <!-- Edit Modal -->
    <n-modal v-model:show="showEditModal" preset="card" title="编辑申请数据" style="max-width: 600px">
      <n-form v-if="editingReq" ref="editFormRef" :model="editFormData" label-placement="top">
        <n-form-item label="服务器名称" path="name">
          <n-input v-model:value="editFormData.name" />
        </n-form-item>
        <n-form-item label="类型" path="type">
          <n-input v-model:value="editFormData.type" />
        </n-form-item>
        <n-form-item label="版本" path="version">
          <n-input v-model:value="editFormData.version" />
        </n-form-item>
        <n-form-item label="图标URL" path="icon">
          <n-input v-model:value="editFormData.icon" />
        </n-form-item>
        <n-form-item label="链接" path="link">
          <n-input v-model:value="editFormData.link" />
        </n-form-item>
        <n-form-item label="IP（可选）" path="IP">
          <n-input v-model:value="editFormData.IP" />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input v-model:value="editFormData.description" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditModal = false">取消</n-button>
          <n-button type="primary" :loading="editSaving" @click="handleEditSave">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Reject Modal -->
    <n-modal v-model:show="showRejectModal" preset="dialog" title="拒绝申请">
      <n-input
        v-model:value="rejectReason"
        type="textarea"
        placeholder="请输入拒绝理由（可选）"
        :rows="3"
      />
      <template #action>
        <n-space>
          <n-button @click="showRejectModal = false">取消</n-button>
          <n-button type="error" :loading="rejectSaving" @click="handleRejectConfirm">确认拒绝</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton, NSpin, NEmpty, NCard, NTag, NDescriptions, NDescriptionsItem,
  NCollapse, NCollapseItem, NSpace, NModal, NForm, NFormItem, NInput,
  useMessage, useDialog
} from 'naive-ui'
import { getAdminRequests, adminEditRequest, approveRequest, rejectRequest } from '@/api/server'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const loading = ref(true)
const requests = ref([])

const showEditModal = ref(false)
const editingReq = ref(null)
const editFormRef = ref(null)
const editSaving = ref(false)
const editFormData = reactive({
  name: '', type: '', version: '', icon: '', link: '', IP: '', description: ''
})

const showRejectModal = ref(false)
const rejectingReq = ref(null)
const rejectReason = ref('')
const rejectSaving = ref(false)

const reqTypeLabel = {
  create: '新建服务器',
  edit: '编辑服务器'
}

const fetchRequests = async () => {
  loading.value = true
  try {
    requests.value = await getAdminRequests()
  } catch (e) {
    message.error('加载失败：' + (e.response?.data || e.message))
  } finally {
    loading.value = false
  }
}

const openEditModal = (req) => {
  editingReq.value = req
  Object.assign(editFormData, {
    name: req.data?.name || '',
    type: req.data?.type || '',
    version: req.data?.version || '',
    icon: req.data?.icon || '',
    link: req.data?.link || '',
    IP: req.data?.IP || '',
    description: req.data?.description || ''
  })
  showEditModal.value = true
}

const handleEditSave = async () => {
  editSaving.value = true
  try {
    const data = { ...editFormData }
    if (!data.IP) delete data.IP
    await adminEditRequest({ id: editingReq.value.id, data })
    message.success('已保存')
    showEditModal.value = false
    await fetchRequests()
  } catch (e) {
    message.error('保存失败：' + (e.response?.data || e.message))
  } finally {
    editSaving.value = false
  }
}

const handleApprove = async (req) => {
  try {
    await approveRequest(req.id)
    message.success('已通过，操作执行成功')
    await fetchRequests()
  } catch (e) {
    if (e.response?.status === 409 && e.response?.data?.code === 'target_not_found') {
      dialog.warning({
        title: '目标服务器不存在',
        content: '目标服务器不存在，是否将此申请改为新建服务器工单？',
        positiveText: '改为新建',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            await approveRequest(req.id, true)
            message.success('已通过（新建服务器）')
            await fetchRequests()
          } catch (e2) {
            message.error('操作失败：' + (e2.response?.data || e2.message))
          }
        }
      })
    } else {
      message.error('操作失败：' + (e.response?.data || e.message))
    }
  }
}

const openRejectModal = (req) => {
  rejectingReq.value = req
  rejectReason.value = ''
  showRejectModal.value = true
}

const handleRejectConfirm = async () => {
  rejectSaving.value = true
  try {
    await rejectRequest(rejectingReq.value.id, rejectReason.value)
    message.success('已拒绝')
    showRejectModal.value = false
    await fetchRequests()
  } catch (e) {
    message.error('操作失败：' + (e.response?.data || e.message))
  } finally {
    rejectSaving.value = false
  }
}

onMounted(fetchRequests)
</script>

<style scoped>
.request-admin-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}
.request-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.request-card {
  width: 100%;
}
</style>
