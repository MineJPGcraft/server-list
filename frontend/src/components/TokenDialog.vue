<template>
  <n-modal
    v-model:show="showModal"
    preset="dialog"
    title="身份验证"
    :mask-closable="false"
    :close-on-esc="false"
    :closable="false"
  >
    <n-form ref="formRef" :model="formData">
      <n-form-item label="请输入访问令牌" path="token">
        <n-input
          v-model:value="formData.token"
          type="password"
          placeholder="请输入 Token"
          @keyup.enter="handleSubmit"
        />
      </n-form-item>
    </n-form>
    <template #action>
      <n-space>
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">
          确认
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, NSpace } from 'naive-ui'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show', 'submit', 'cancel'])

const showModal = ref(props.show)
const loading = ref(false)
const formRef = ref(null)
const formData = reactive({
  token: ''
})

watch(() => props.show, (val) => {
  showModal.value = val
  if (val) {
    formData.token = ''
  }
})

watch(showModal, (val) => {
  emit('update:show', val)
})

const handleSubmit = () => {
  if (!formData.token) return
  loading.value = true
  emit('submit', formData.token)
  // 重置 loading 状态由父组件控制
  setTimeout(() => {
    loading.value = false
  }, 2000)
}

const handleCancel = () => {
  showModal.value = false
  emit('cancel')
}
</script>
