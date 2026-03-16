<template>
  <div class="setup-container">
    <div class="setup-header">
      <h1>初始化向导</h1>
      <p class="setup-subtitle">TOKEN 登录未启用，且当前没有超级管理员。请按步骤完成初始化。</p>
    </div>

    <n-spin :show="checking">
      <div v-if="!checking" class="steps">

        <!-- Step 1: 配置 OIDC -->
        <n-card class="step-card">
          <div class="step-title">
            <n-tag :type="providers.length > 0 ? 'success' : 'default'" round>1</n-tag>
            <span>配置 OIDC 登录提供商</span>
            <n-tag v-if="providers.length > 0" type="success" size="small">已配置 {{ providers.length }} 个</n-tag>
          </div>
          <p class="step-desc">添加至少一个 OIDC 提供商，以便通过第三方账号登录。</p>

          <n-form ref="oidcFormRef" :model="oidcForm" :rules="oidcRules" label-placement="top">
            <n-grid :cols="2" :x-gap="16">
              <n-form-item-gi label="Client ID" path="id">
                <n-input v-model:value="oidcForm.id" placeholder="e.g. bee7bafb37755081f807" />
              </n-form-item-gi>
              <n-form-item-gi label="显示名称" path="name">
                <n-input v-model:value="oidcForm.name" placeholder="e.g. Casdoor" />
              </n-form-item-gi>
              <n-form-item-gi :span="2" label="Client Secret" path="secret">
                <n-input
                  v-model:value="oidcForm.secret"
                  type="password"
                  show-password-on="click"
                  placeholder="客户端密钥"
                />
              </n-form-item-gi>
              <n-form-item-gi :span="2" label="授权端点 (auth_url)" path="auth_url">
                <n-input v-model:value="oidcForm.auth_url" placeholder="http://localhost:8000/login/oauth/authorize" />
              </n-form-item-gi>
              <n-form-item-gi :span="2" label="令牌端点 (apipoint)" path="apipoint">
                <n-input v-model:value="oidcForm.apipoint" placeholder="http://localhost:8000/api/login/oauth/access_token" />
              </n-form-item-gi>
              <n-form-item-gi :span="2" label="回调地址 (redirect_uri)" path="redirect_uri">
                <n-input v-model:value="oidcForm.redirect_uri" placeholder="http://localhost:8080/api/auth/callback" />
              </n-form-item-gi>
            </n-grid>
          </n-form>

          <div v-if="providers.length > 0" class="configured-providers">
            <n-divider style="margin: 12px 0" />
            <n-text depth="3" style="font-size: 13px">已配置的提供商：</n-text>
            <n-space style="margin-top: 6px">
              <n-tag v-for="p in providers" :key="p.id" type="success">{{ p.name }}</n-tag>
            </n-space>
          </div>

          <div class="step-actions">
            <n-button type="primary" :loading="oidcSaving" @click="handleSaveOidc">
              {{ providers.length > 0 ? '再添加一个' : '保存提供商' }}
            </n-button>
          </div>
        </n-card>

        <!-- Step 2: 登录 -->
        <n-card class="step-card" :class="{ 'step-disabled': providers.length === 0 }">
          <div class="step-title">
            <n-tag :type="isLoggedIn ? 'success' : 'default'" round>2</n-tag>
            <span>通过 OIDC 登录</span>
            <n-tag v-if="isLoggedIn" type="success" size="small">已登录</n-tag>
          </div>

          <div v-if="isLoggedIn" class="logged-in-info">
            <n-text>已登录，可继续下一步。</n-text>
          </div>
          <div v-else-if="providers.length === 0">
            <n-text depth="3">请先完成第 1 步配置 OIDC 提供商。</n-text>
          </div>
          <div v-else>
            <p class="step-desc">选择提供商登录。登录完成后会自动回到此页面。</p>
            <n-space vertical>
              <n-button
                v-for="p in providers"
                :key="p.id"
                block
                @click="handleOidcLogin(p)"
              >
                使用 {{ p.name }} 登录
              </n-button>
            </n-space>
          </div>
        </n-card>

        <!-- Step 3: 设为超管 -->
        <n-card class="step-card" :class="{ 'step-disabled': providers.length === 0 }">
          <div class="step-title">
            <n-tag :type="isDone ? 'success' : 'default'" round>3</n-tag>
            <span>设为超级管理员</span>
          </div>
          <p class="step-desc">将某个账号提升为超级管理员（perm=3）。完成后此向导将关闭。</p>

          <n-divider title-placement="left" style="margin: 0 0 16px">方式一：提升当前登录账号</n-divider>
          <n-button
            type="primary"
            :disabled="!isLoggedIn"
            :loading="promoting"
            @click="handlePromote"
          >
            {{ isLoggedIn ? '设为超级管理员' : '请先完成第 2 步登录' }}
          </n-button>

          <n-divider title-placement="left" style="margin: 20px 0 16px">方式二：直接指定账号 ID（可恢复被封禁账号）</n-divider>
          <p class="step-desc" style="margin-bottom: 12px">
            输入数据库中已有的用户 ID（OIDC sub），无需登录即可提升并解封。
          </p>
          <n-input-group>
            <n-input
              v-model:value="promoteUserId"
              placeholder="用户 ID（OIDC sub）"
              @keyup.enter="handlePromoteById"
            />
            <n-button type="warning" :loading="promotingById" @click="handlePromoteById">
              提升 / 解封
            </n-button>
          </n-input-group>
        </n-card>

      </div>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard, NButton, NSpin, NForm, NFormItem, NFormItemGi, NGrid,
  NInput, NInputGroup, NTag, NText, NSpace, NDivider, useMessage
} from 'naive-ui'
import { getSetupStatus, setupOidc, setupPromote, setupPromoteById, getOidcProviders } from '@/api/server'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const checking = ref(true)
const providers = ref([])
const oidcSaving = ref(false)
const promoting = ref(false)
const promotingById = ref(false)
const promoteUserId = ref('')
const isDone = ref(false)

const isLoggedIn = computed(() => authStore.isAuthenticated)

const oidcFormRef = ref(null)
const oidcForm = reactive({
  id: '', name: '', secret: '', auth_url: '', apipoint: '', redirect_uri: ''
})

const oidcRules = {
  id: [{ required: true, message: '必填', trigger: 'blur' }],
  name: [{ required: true, message: '必填', trigger: 'blur' }],
  secret: [{ required: true, message: '必填', trigger: 'blur' }],
  auth_url: [{ required: true, message: '必填', trigger: 'blur' }],
  apipoint: [{ required: true, message: '必填', trigger: 'blur' }],
  redirect_uri: [{ required: true, message: '必填', trigger: 'blur' }]
}

const loadProviders = async () => {
  try {
    providers.value = await getOidcProviders()
  } catch {
    providers.value = []
  }
}

onMounted(async () => {
  try {
    await getSetupStatus()
  } catch {
    // Not in setup mode → redirect home
    router.replace('/')
    return
  }
  await Promise.all([authStore.checkAuth(), loadProviders()])
  checking.value = false
})

const handleSaveOidc = () => {
  oidcFormRef.value.validate(async (errors) => {
    if (errors) return
    oidcSaving.value = true
    try {
      // Set frontend to /setup so user returns here after OIDC login
      await setupOidc({ ...oidcForm, frontend: '/setup' })
      message.success('OIDC 提供商已保存')
      Object.assign(oidcForm, { id: '', name: '', secret: '', auth_url: '', apipoint: '', redirect_uri: '' })
      oidcFormRef.value.restoreValidation()
      await loadProviders()
    } catch (e) {
      message.error('保存失败：' + (e.response?.data || e.message))
    } finally {
      oidcSaving.value = false
    }
  })
}

const handleOidcLogin = (provider) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: provider.id,
    redirect_uri: provider.redirect_uri,
    state: provider.id,
    scope: 'openid'
  })
  window.location.href = `${provider.auth_url}?${params.toString()}`
}

const handlePromote = async () => {
  promoting.value = true
  try {
    await setupPromote()
    await authStore.checkAuth()
    message.success('已成为超级管理员，正在跳转…')
    isDone.value = true
    setTimeout(() => router.push('/'), 1500)
  } catch (e) {
    if (e.response?.status === 404) {
      message.info('系统已完成初始化，正在跳转…')
      router.push('/')
    } else {
      message.error('操作失败：' + (e.response?.data || e.message))
    }
  } finally {
    promoting.value = false
  }
}

const handlePromoteById = async () => {
  if (!promoteUserId.value.trim()) return
  promotingById.value = true
  try {
    await setupPromoteById(promoteUserId.value.trim())
    message.success('账号已提升为超级管理员，请使用该账号登录。')
    isDone.value = true
    setTimeout(() => router.push('/'), 1500)
  } catch (e) {
    if (e.response?.status === 404) {
      message.error('未找到该用户 ID，请确认账号已登录过至少一次')
    } else if (e.response?.status === 404 && e.response?.data === 'Not found') {
      message.info('系统已完成初始化，正在跳转…')
      router.push('/')
    } else {
      message.error('操作失败：' + (e.response?.data || e.message))
    }
  } finally {
    promotingById.value = false
  }
}
</script>

<style scoped>
.setup-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 24px;
}

.setup-header {
  text-align: center;
  margin-bottom: 36px;
}

.setup-header h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
}

.setup-subtitle {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-card {
  transition: opacity 0.2s;
}

.step-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.step-desc {
  margin: 0 0 16px;
  color: #666;
  font-size: 14px;
}

.step-actions {
  margin-top: 16px;
}

.configured-providers {
  margin-top: 4px;
}

.logged-in-info {
  padding: 8px 0;
}
</style>
