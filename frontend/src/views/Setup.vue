<template>
  <div class="setup-container">
    <div class="setup-header">
      <h1>初始化向导</h1>
      <p class="setup-subtitle">TOKEN 登录未启用,且当前没有超级管理员。请按步骤完成初始化。</p>
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
          <p class="step-desc">添加至少一个 OIDC 提供商,以便通过第三方账号登录。</p>

          <n-form ref="oidcFormRef" :model="oidcForm" :rules="oidcRules" label-placement="top">
            <n-grid :cols="2" :x-gap="16">

              <!-- ★ OIDC 自动发现 ★ -->
              <n-form-item-gi :span="2" label="Issuer URL（自动发现，可选）">
                <n-input-group>
                  <n-input
                      v-model:value="issuerUrl"
                      placeholder="e.g. https://accounts.google.com 或 http://localhost:8000"
                      style="flex: 1"
                  />
                  <n-button type="info" :loading="discovering" @click="handleDiscover">
                    自动发现
                  </n-button>
                </n-input-group>
              </n-form-item-gi>

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
            <n-text depth="3">已配置的提供商:</n-text>
            <div class="provider-tags">
              <n-tag
                  v-for="p in providers"
                  :key="p.id"
                  closable
                  type="success"
                  @close="handleDeleteProvider(p)"
              >
                {{ p.name }} ({{ p.id }})
              </n-tag>
            </div>
          </div>

          <n-button
              type="primary"
              :loading="oidcSaving"
              :disabled="oidcSaving"
              style="margin-top: 12px"
              @click="handleSaveOidc"
          >
            保存 OIDC 提供商
          </n-button>
        </n-card>

        <!-- Step 2: 登录 -->
        <n-card class="step-card">
          <div class="step-title">
            <n-tag :type="isLoggedIn ? 'success' : 'default'" round>2</n-tag>
            <span>通过 OIDC 登录</span>
            <n-tag v-if="isLoggedIn" type="success" size="small">已登录</n-tag>
          </div>
          <p class="step-desc">使用刚才配置的 OIDC 提供商完成登录。登录后回到此页面继续。</p>
          <n-space v-if="!isLoggedIn && providers.length > 0" vertical>
            <n-button
                v-for="p in providers"
                :key="p.id"
                type="primary"
                @click="handleOidcLogin(p)"
            >
              使用 {{ p.name }} 登录
            </n-button>
          </n-space>
          <n-text v-if="isLoggedIn" type="success">✓ 当前已登录</n-text>
        </n-card>

        <!-- Step 3: 提升管理员 -->
        <n-card class="step-card">
          <div class="step-title">
            <n-tag :type="isDone ? 'success' : 'default'" round>3</n-tag>
            <span>提升为超级管理员</span>
          </div>

          <p class="step-desc">
            将当前登录用户提升为超级管理员。
          </p>
          <n-button
              type="primary"
              :loading="promoting"
              :disabled="!isLoggedIn || isDone"
              @click="handlePromoteSelf"
          >
            将当前用户设为管理员
          </n-button>

          <n-divider style="margin: 16px 0">或按用户 ID 提升</n-divider>
          <p class="step-desc">
            输入数据库中已有的用户 ID(OIDC sub),无需登录即可提升并解封。
          </p>
          <n-input-group>
            <n-input
                v-model:value="promoteUserId"
                placeholder="用户 ID(OIDC sub)"
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
import {
  getSetupStatus,
  setupOidc,
  setupPromote,
  setupPromoteById,
  getOidcProviders,
  discoverOidc
} from '@/api/server'
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

// ★ 自动发现相关状态 ★
const issuerUrl = ref('')
const discovering = ref(false)

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
    router.replace('/')
    return
  }
  await loadProviders()
  checking.value = false
})

// ★ OIDC 自动发现处理函数 ★
const handleDiscover = async () => {
  if (!issuerUrl.value) {
    message.warning('请先输入 Issuer URL')
    return
  }
  discovering.value = true
  try {
    const config = await discoverOidc(issuerUrl.value)

    if (config.authorization_endpoint) {
      oidcForm.auth_url = config.authorization_endpoint
    }
    if (config.token_endpoint) {
      oidcForm.apipoint = config.token_endpoint
    }
    if (!oidcForm.name && config.issuer) {
      try {
        oidcForm.name = new URL(config.issuer).hostname
      } catch { /* ignore */ }
    }

    message.success('已自动填充授权端点和令牌端点')
  } catch (e) {
    message.error('自动发现失败: ' + e.message)
  } finally {
    discovering.value = false
  }
}

const handleSaveOidc = () => {
  oidcFormRef.value?.validate(async (errors) => {
    if (errors) return
    oidcSaving.value = true
    try {
      await setupOidc({ ...oidcForm })
      message.success('OIDC 提供商已保存')
      Object.assign(oidcForm, { id: '', name: '', secret: '', auth_url: '', apipoint: '', redirect_uri: '' })
      issuerUrl.value = ''
      await loadProviders()
    } catch (e) {
      message.error('保存失败: ' + (e.response?.data || e.message))
    } finally {
      oidcSaving.value = false
    }
  })
}

const handleDeleteProvider = async (p) => {
  try {
    // Setup 模式下复用 setupOidc 或直接调用删除接口
    await setupOidc({ delete: true, id: p.id })
    message.success('已删除')
    await loadProviders()
  } catch (e) {
    message.error('删除失败: ' + (e.response?.data || e.message))
  }
}

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

const handlePromoteSelf = async () => {
  promoting.value = true
  try {
    await setupPromote()
    message.success('已提升为超级管理员，请刷新页面')
    isDone.value = true
  } catch (e) {
    message.error('提升失败: ' + (e.response?.data || e.message))
  } finally {
    promoting.value = false
  }
}

const handlePromoteById = async () => {
  if (!promoteUserId.value) {
    message.warning('请输入用户 ID')
    return
  }
  promotingById.value = true
  try {
    await setupPromoteById(promoteUserId.value)
    message.success('用户已提升为超级管理员')
    isDone.value = true
  } catch (e) {
    message.error('提升失败: ' + (e.response?.data || e.message))
  } finally {
    promotingById.value = false
  }
}
</script>

<style scoped>
.setup-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 16px;
}
.setup-header {
  text-align: center;
  margin-bottom: 32px;
}
.setup-header h1 {
  margin: 0;
  font-size: 28px;
}
.setup-subtitle {
  color: #666;
  margin-top: 8px;
}
.steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.step-card {
  border-radius: 8px;
}
.step-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.step-desc {
  color: #666;
  margin: 0 0 16px 0;
}
.configured-providers {
  margin-top: 8px;
}
.provider-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
</style>