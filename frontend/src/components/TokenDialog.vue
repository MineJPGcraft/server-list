<template>
  <n-modal
    v-model:show="showModal"
    preset="dialog"
    title="登录"
    :mask-closable="false"
    :close-on-esc="false"
    :closable="false"
  >
    <div>
      <div v-if="oidcProviders.length > 0">
        <n-text depth="3" style="font-size: 13px; margin-bottom: 8px; display: block">
          使用第三方账号登录
        </n-text>
        <n-space vertical style="margin-bottom: 8px">
          <n-button
            v-for="provider in oidcProviders"
            :key="provider.id"
            block
            @click="handleOidcLogin(provider)"
          >
            使用 {{ provider.name }} 登录
          </n-button>
        </n-space>
        <n-divider style="margin: 12px 0">或使用令牌</n-divider>
      </div>

      <n-form ref="formRef" :model="formData">
        <n-form-item label="访问令牌" path="token">
          <n-input
            v-model:value="formData.token"
            type="password"
            placeholder="请输入 Token"
            @keyup.enter="handleSubmit"
          />
        </n-form-item>
      </n-form>
    </div>
    <template #action>
      <n-space>
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" :loading="loading" :disabled="!formData.token" @click="handleSubmit">
          确认
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, NSpace, NText, NDivider } from 'naive-ui'
import { getOidcProviders } from '@/api/server'

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
const formData = reactive({ token: '' })
const oidcProviders = ref([])

watch(() => props.show, async (val) => {
  showModal.value = val
  if (val) {
    formData.token = ''
    try {
      const providers = await getOidcProviders()
      oidcProviders.value = Array.isArray(providers) ? providers : []
    } catch {
      oidcProviders.value = []
    }
  }
})

watch(showModal, (val) => {
  emit('update:show', val)
})

const handleOidcLogin = (provider) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: provider.id,
    redirect_uri: provider.redirect_uri,
    state: provider.id,
    scope: 'openid profile'
  })
  window.location.href = `${provider.auth_url}?${params.toString()}`
}

const handleSubmit = () => {
  if (!formData.token) return
  loading.value = true
  emit('submit', formData.token)
  setTimeout(() => {
    loading.value = false
  }, 2000)
}

const handleCancel = () => {
  showModal.value = false
  emit('cancel')
}
</script>
