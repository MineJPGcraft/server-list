<template>
  <div class="request-form-container">
    <div class="header">
      <n-button quaternary @click="router.push('/requests')">← 返回申请列表</n-button>
      <h1>{{ id ? '编辑申请草稿' : '新建申请' }}</h1>
    </div>

    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="top"
      class="form"
    >
      <n-form-item label="申请类型" path="req_type">
        <n-select
          v-model:value="formData.req_type"
          :options="reqTypeOptions"
          :disabled="!!id"
          placeholder="请选择申请类型"
        />
      </n-form-item>

      <n-form-item
        v-if="formData.req_type === 'edit'||formData.req_type === 'delete'"
        label="目标服务器 UUID"
        path="target_uuid"
      >
        <n-select
          v-model:value="formData.target_uuid"
          :options="serverOptions"
          filterable
          clearable
          placeholder="请选择或输入目标服务器 UUID"
          :disabled="!!id"
        />
      </n-form-item>

      <n-form-item label="名称" path="name" v-if="formData.req_type !== 'delete'">
        <n-input v-model:value="formData.name" placeholder="请输入服务器名称" />
      </n-form-item>

      <n-form-item label="类型" path="type" v-if="formData.req_type !== 'delete'">
        <n-input v-model:value="formData.type" placeholder="请输入服务器类型" />
      </n-form-item>

      <n-form-item label="版本" path="version" v-if="formData.req_type !== 'delete'">
        <n-input v-model:value="formData.version" placeholder="请输入服务器版本" />
      </n-form-item>

      <n-form-item label="图标URL" path="icon" v-if="formData.req_type !== 'delete'">
        <n-input v-model:value="formData.icon" placeholder="https://example.com/icon.png" />
      </n-form-item>

      <n-form-item label="链接" path="link" v-if="formData.req_type !== 'delete'">
        <n-input v-model:value="formData.link" placeholder="https://example.com" />
      </n-form-item>

      <n-form-item label="IP地址（可选）" path="IP" v-if="formData.req_type !== 'delete'">
        <n-input v-model:value="formData.IP" placeholder="请输入IP地址或域名（可选）" />
      </n-form-item>

      <n-form-item label="描述" path="description" v-if="formData.req_type !== 'delete'">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          placeholder="请输入服务器描述"
          :rows="3"
        />
      </n-form-item>

      <div class="form-actions">
        <n-button @click="router.push('/requests')">取消</n-button>
        <n-button @click="handleSaveDraft" :loading="saving">保存草稿</n-button>
        <n-button type="primary" @click="handleSubmitRequest" :loading="submitting">提交审核</n-button>
      </div>
    </n-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NButton, NForm, NFormItem, NInput, NSelect, useMessage } from 'naive-ui'
import { createRequest, editRequest, submitRequest, getMyRequests } from '@/api/server'
import { getServers } from '@/api/server'

const props = defineProps({ id: String })
const router = useRouter()
const route = useRoute()
const message = useMessage()

const formRef = ref(null)
const saving = ref(false)
const submitting = ref(false)
const servers = ref([])
const savedId = ref(props.id || null)

const formData = reactive({
  req_type: 'create',
  target_uuid: null,
  name: '',
  type: '',
  version: '',
  icon: '',
  link: '',
  IP: '',
  description: ''
})

const reqTypeOptions = [
  { label: '新建服务器', value: 'create' },
  { label: '编辑现有服务器', value: 'edit'},
  { label: '移除现有服务器', value: 'delete' }
]

const serverOptions = computed(() =>
  servers.value.map(s => ({ label: `${s.name} (${s.uuid})`, value: s.uuid }))
)

// 选择目标服务器后自动填充字段（仅新建模式，不影响编辑已有草稿）
watch(() => formData.target_uuid, (uuid) => {
  if (props.id || !uuid) return
  const server = servers.value.find(s => s.uuid === uuid)
  if (server) {
    formData.name = server.name || ''
    formData.type = server.type || ''
    formData.version = server.version || ''
    formData.icon = server.icon || ''
    formData.link = server.link || ''
    formData.IP = server.IP || ''
    formData.description = server.description || ''
  }
})

const urlValidator = (rule, value) => {
  if (!value) return new Error('此字段必填')
  if (!/^https?:\/\/.+/.test(value)) return new Error('请输入有效的 URL（以 http:// 或 https:// 开头）')
  return true
}

const rules = {
  req_type: [{ required: true, message: '请选择申请类型', trigger: 'change' }],
  target_uuid: [{
    validator: (rule, value) => {
      if (formData.req_type === 'edit' && !value) return new Error('编辑类型需填写目标服务器 UUID')
      return true
    },
    trigger: 'change'
  }],
  name: [{ required: true, message: '此字段必填', trigger: 'blur' }],
  type: [{ required: true, message: '此字段必填', trigger: 'blur' }],
  version: [{ required: true, message: '此字段必填', trigger: 'blur' }],
  icon: [{ validator: urlValidator, trigger: 'blur' }],
  link: [{ validator: urlValidator, trigger: 'blur' }],
  description: [{ required: true, message: '此字段必填', trigger: 'blur' }]
}

onMounted(async () => {
  try {
    servers.value = await getServers()
  } catch {}

  // Pre-fill from query params (from context menu "申请编辑")
  if (!props.id) {
    const qType = route.query.type
    const qUuid = route.query.uuid
    if (qType === 'edit' && qUuid) {
      formData.req_type = 'edit'
      formData.target_uuid = qUuid
      // Pre-fill server data if found
      const server = servers.value.find(s => s.uuid === qUuid)
      if (server) {
        formData.name = server.name || ''
        formData.type = server.type || ''
        formData.version = server.version || ''
        formData.icon = server.icon || ''
        formData.link = server.link || ''
        formData.IP = server.IP || ''
        formData.description = server.description || ''
      }
    }
    return
  }

  // Load draft for editing
  try {
    const list = await getMyRequests()
    const draft = list.find(r => r.id === props.id)
    if (draft) {
      formData.req_type = draft.req_type
      formData.target_uuid = draft.target_uuid || null
      Object.assign(formData, draft.data)
    }
  } catch (e) {
    message.error('加载草稿失败')
  }
})

const getServerData = () => ({
  name: formData.name,
  type: formData.type,
  version: formData.version,
  icon: formData.icon,
  link: formData.link,
  description: formData.description,
  ...(formData.IP ? { IP: formData.IP } : {})
})

const handleSaveDraft = () => {
  formRef.value.validate(async (errors) => {
    if (errors) return
    saving.value = true
    try {
      if (savedId.value) {
        await editRequest({
          id: savedId.value,
          data: getServerData(),
          req_type: formData.req_type,
          target_uuid: formData.target_uuid || undefined
        })
      } else {
        const result = await createRequest({
          req_type: formData.req_type,
          target_uuid: formData.target_uuid || undefined,
          data: getServerData()
        })
        savedId.value = result.id
      }
      message.success('草稿已保存')
      router.push('/requests')
    } catch (e) {
      message.error('保存失败：' + (e.response?.data || e.message))
    } finally {
      saving.value = false
    }
  })
}

const handleSubmitRequest = () => {
  formRef.value.validate(async (errors) => {
    if (errors) return
    submitting.value = true
    try {
      let reqId = savedId.value
      if (reqId) {
        await editRequest({
          id: reqId,
          data: getServerData(),
          req_type: formData.req_type,
          target_uuid: formData.target_uuid || undefined
        })
      } else {
        const result = await createRequest({
          req_type: formData.req_type,
          target_uuid: formData.target_uuid || undefined,
          data: getServerData()
        })
        reqId = result.id
        savedId.value = reqId
      }
      await submitRequest(reqId)
      message.success('已提交审核')
      router.push('/requests')
    } catch (e) {
      if (e.response?.status === 429) {
        message.error('待审核申请已达上限，请等待审核完成后再提交')
      } else {
        message.error('提交失败：' + (e.response?.data || e.message))
      }
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped>
.request-form-container {
  max-width: 700px;
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
  flex: 1;
}
.form {
  margin-top: 8px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
