<template>
  <div class="oidc-admin-container">
    <div class="header">
      <n-button text @click="router.push('/')">← 返回</n-button>
      <h1>OIDC 配置管理</h1>
      <n-button type="primary" @click="openCreateDialog">添加提供商</n-button>
    </div>

    <n-spin :show="loading">
      <n-empty v-if="providers.length === 0 && !loading" description="暂无 OIDC 提供商" style="padding: 60px 0" />
      <div v-else class="provider-list">
        <n-card
          v-for="p in providers"
          :key="p.id"
          class="provider-card"
        >
          <div class="provider-header">
            <div>
              <div class="provider-name">{{ p.name }}</div>
              <div class="provider-id">Client ID: {{ p.id }}</div>
            </div>
            <n-space>
              <n-button size="small" @click="openEditDialog(p)">编辑</n-button>
              <n-button size="small" type="error" @click="handleDelete(p)">删除</n-button>
            </n-space>
          </div>
          <n-descriptions :column="1" size="small" style="margin-top: 12px">
            <n-descriptions-item label="显示名称">{{ p.name }}</n-descriptions-item>
            <n-descriptions-item label="授权端点">{{ p.auth_url }}</n-descriptions-item>
            <n-descriptions-item label="令牌端点">{{ p.apipoint }}</n-descriptions-item>
            <n-descriptions-item label="回调地址">{{ p.redirect_uri }}</n-descriptions-item>
            <n-descriptions-item label="登录后跳转">{{ p.frontend || '/' }}</n-descriptions-item>
            <n-descriptions-item label="权限覆写">{{ p.perm ?? '不覆写（继承用户权限）' }}</n-descriptions-item>
          </n-descriptions>
        </n-card>
      </div>
    </n-spin>

    <!-- 新增/编辑对话框 -->
    <n-modal
      v-model:show="showDialog"
      :title="isEdit ? '编辑 OIDC 提供商' : '添加 OIDC 提供商'"
      preset="card"
      style="width: 560px"
      :mask-closable="false"
    >
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top">
        <n-form-item label="Client ID" path="id">
          <n-input
            v-model:value="formData.id"
            placeholder="e.g. bee7bafb37755081f807"
            :disabled="isEdit"
          />
        </n-form-item>
        <n-form-item label="显示名称" path="name">
          <n-input v-model:value="formData.name" placeholder="e.g. Casdoor" />
        </n-form-item>
        <n-form-item label="Client Secret" path="secret">
          <n-input
            v-model:value="formData.secret"
            type="password"
            show-password-on="click"
            placeholder="客户端密钥"
          />
        </n-form-item>
        <n-form-item label="授权端点 (auth_url)" path="auth_url">
          <n-input
            v-model:value="formData.auth_url"
            placeholder="http://localhost:8000/login/oauth/authorize"
          />
        </n-form-item>
        <n-form-item label="令牌端点 (apipoint)" path="apipoint">
          <n-input
            v-model:value="formData.apipoint"
            placeholder="http://localhost:8000/api/login/oauth/access_token"
          />
        </n-form-item>
        <n-form-item label="回调地址 (redirect_uri)" path="redirect_uri">
          <n-input
            v-model:value="formData.redirect_uri"
            placeholder="http://localhost:8080/api/auth/callback"
          />
        </n-form-item>
        <n-form-item label="登录后跳转（可选）" path="frontend">
          <n-input v-model:value="formData.frontend" placeholder="默认为 /" />
        </n-form-item>
        <n-form-item label="权限覆写（可选）" path="perm">
          <n-input-number
            v-model:value="formData.perm"
            :min="1"
            placeholder="留空则继承用户权限"
            clearable
            style="width: 100%"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDialog = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton, NCard, NModal, NForm, NFormItem, NInput, NInputNumber,
  NSpace, NSpin, NEmpty, NDescriptions, NDescriptionsItem, useMessage, useDialog
} from 'naive-ui'
import { getOidcAdminList, createOidcProvider, editOidcProvider, deleteOidcProvider } from '@/api/server'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const providers = ref([])
const loading = ref(false)
const showDialog = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const emptyForm = () => ({
  id: '',
  name: '',
  secret: '',
  auth_url: '',
  apipoint: '',
  redirect_uri: '',
  frontend: '',
  perm: null
})

const formData = reactive(emptyForm())

const rules = {
  id: [{ required: true, message: '必填', trigger: 'blur' }],
  name: [{ required: true, message: '必填', trigger: 'blur' }],
  secret: [{ required: true, message: '必填', trigger: 'blur' }],
  auth_url: [{ required: true, message: '必填', trigger: 'blur' }],
  apipoint: [{ required: true, message: '必填', trigger: 'blur' }],
  redirect_uri: [{ required: true, message: '必填', trigger: 'blur' }]
}

const fetchProviders = async () => {
  loading.value = true
  try {
    providers.value = await getOidcAdminList()
  } catch (e) {
    message.error('加载失败：' + (e.response?.data || e.message))
  } finally {
    loading.value = false
  }
}

onMounted(fetchProviders)

const openCreateDialog = () => {
  isEdit.value = false
  Object.assign(formData, emptyForm())
  showDialog.value = true
}

const openEditDialog = (p) => {
  isEdit.value = true
  Object.assign(formData, {
    id: p.id,
    name: p.name,
    secret: p.secret,
    auth_url: p.auth_url,
    apipoint: p.apipoint,
    redirect_uri: p.redirect_uri,
    frontend: p.frontend || '',
    perm: p.perm ?? null
  })
  showDialog.value = true
}

const handleSubmit = () => {
  formRef.value.validate(async (errors) => {
    if (errors) return
    submitting.value = true
    try {
      const payload = { ...formData }
      if (!payload.frontend) delete payload.frontend
      if (payload.perm === null) delete payload.perm

      if (isEdit.value) {
        await editOidcProvider(payload)
        message.success('更新成功')
      } else {
        await createOidcProvider(payload)
        message.success('添加成功')
      }
      showDialog.value = false
      await fetchProviders()
    } catch (e) {
      message.error('操作失败：' + (e.response?.data || e.message))
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = (p) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除 "${p.name}" 吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteOidcProvider(p.id)
        message.success('删除成功')
        await fetchProviders()
      } catch (e) {
        message.error('删除失败：' + (e.response?.data || e.message))
      }
    }
  })
}
</script>

<style scoped>
.oidc-admin-container {
  max-width: 900px;
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

.provider-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.provider-card {
  border-radius: 8px;
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.provider-name {
  font-size: 16px;
  font-weight: 600;
}

.provider-id {
  font-size: 13px;
  color: #888;
  margin-top: 2px;
}
</style>
