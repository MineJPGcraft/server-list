<template>
  <n-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-placement="top"
    class="server-form"
  >
    <n-form-item label="ID" path="id">
      <n-input
        v-model:value="formData.id"
        placeholder="请输入服务器ID"
        :disabled="mode === 'edit'"
      />
    </n-form-item>

    <n-form-item label="名称" path="name">
      <n-input
        v-model:value="formData.name"
        placeholder="请输入服务器名称"
      />
    </n-form-item>

    <n-form-item label="类型" path="type">
      <n-input
        v-model:value="formData.type"
        placeholder="请输入服务器类型"
      />
    </n-form-item>

    <n-form-item label="版本" path="version">
      <n-input
        v-model:value="formData.version"
        placeholder="请输入服务器版本"
      />
    </n-form-item>

    <n-form-item label="图标URL" path="icon">
      <n-input
        v-model:value="formData.icon"
        placeholder="https://example.com/icon.png"
      />
    </n-form-item>

    <n-form-item label="链接" path="link">
      <n-input
        v-model:value="formData.link"
        placeholder="https://example.com"
      />
    </n-form-item>

    <n-form-item label="IP地址（可选）" path="ip">
      <n-input
        v-model:value="formData.ip"
        placeholder="请输入IP地址或域名（可选）"
      />
    </n-form-item>

    <n-form-item label="描述" path="description">
      <n-input
        v-model:value="formData.description"
        type="textarea"
        placeholder="请输入服务器描述"
        :rows="3"
      />
    </n-form-item>

    <div class="form-actions">
      <n-button @click="handleCancel">取消</n-button>
      <n-button type="primary" @click="handleSubmit">提交</n-button>
    </div>
  </n-form>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { NForm, NFormItem, NInput, NButton } from 'naive-ui'

const props = defineProps({
  server: {
    type: Object,
    default: null
  },
  mode: {
    type: String,
    default: 'create'
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formRef = ref(null)
const formData = reactive({
  id: '',
  name: '',
  type: '',
  version: '',
  icon: '',
  link: '',
  ip: '',
  description: ''
})

// URL 验证规则
const urlValidator = (rule, value) => {
  if (!value) return new Error('此字段必填')
  const urlPattern = /^https?:\/\/.+/
  if (!urlPattern.test(value)) {
    return new Error('请输入有效的 URL（以 http:// 或 https:// 开头）')
  }
  return true
}

// ID 验证规则
const idValidator = (rule, value) => {
  if (!value) return new Error('此字段必填')
  const idPattern = /^[a-zA-Z0-9_-]+$/
  if (!idPattern.test(value)) {
    return new Error('ID 只能包含字母、数字、下划线和连字符')
  }
  return true
}

const rules = {
  id: [{ validator: idValidator, trigger: 'blur' }],
  name: [{ required: true, message: '此字段必填', trigger: 'blur' }],
  type: [{ required: true, message: '此字段必填', trigger: 'blur' }],
  version: [{ required: true, message: '此字段必填', trigger: 'blur' }],
  icon: [{ validator: urlValidator, trigger: 'blur' }],
  link: [{ validator: urlValidator, trigger: 'blur' }],
  ip: [],
  description: [{ required: true, message: '此字段必填', trigger: 'blur' }]
}

// 监听 props.server 的变化，更新表单数据
watch(
  () => props.server,
  (newServer) => {
    if (newServer) {
      Object.assign(formData, newServer)
    }
  },
  { immediate: true }
)

const handleSubmit = () => {
  formRef.value.validate((errors) => {
    if (!errors) {
      const submitData = { ...formData }
      // 删除 uid 字段（如果存在）
      delete submitData.uid
      // 如果 ip 为空，删除该字段
      if (!submitData.ip || submitData.ip.trim() === '') {
        delete submitData.ip
      }
      emit('submit', submitData)
    }
  })
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.server-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
