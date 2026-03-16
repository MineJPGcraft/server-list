<template>
  <div class="user-admin-container">
    <div class="header">
      <n-button text @click="router.push('/')">← 返回</n-button>
      <h1>用户管理</h1>
    </div>

    <n-spin :show="loading">
      <n-empty v-if="users.length === 0 && !loading" description="暂无用户" style="padding: 60px 0" />
      <n-table v-else :bordered="false" :single-line="false">
        <thead>
          <tr>
            <th>用户 ID</th>
            <th>用户名</th>
            <th>权限</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" :class="{ 'banned-row': u.banned }">
            <td class="id-cell">{{ u.id }}</td>
            <td>{{ u.name }}</td>
            <td>{{ permLabel(u.perm) }}</td>
            <td>
              <n-tag :type="u.banned ? 'error' : 'success'" size="small">
                {{ u.banned ? '已封禁' : '正常' }}
              </n-tag>
            </td>
            <td>
              <n-space>
                <n-button size="small" @click="openEditDialog(u)">修改权限</n-button>
                <n-button
                  size="small"
                  :type="u.banned ? 'default' : 'error'"
                  @click="handleBanToggle(u)"
                >
                  {{ u.banned ? '解封' : '封禁' }}
                </n-button>
              </n-space>
            </td>
          </tr>
        </tbody>
      </n-table>
    </n-spin>

    <n-modal
      v-model:show="showDialog"
      title="修改用户权限"
      preset="card"
      style="width: 400px"
      :mask-closable="false"
    >
      <n-form label-placement="top">
        <n-form-item label="用户">
          <n-input :value="editTarget.name" disabled />
        </n-form-item>
        <n-form-item label="权限等级">
          <n-select
            v-model:value="editTarget.perm"
            :options="permOptions"
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
  NButton, NTable, NModal, NForm, NFormItem, NInput, NSelect,
  NSpace, NSpin, NEmpty, NTag, useMessage, useDialog
} from 'naive-ui'
import { getUserList, editUser, banUser } from '@/api/server'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const users = ref([])
const loading = ref(false)
const showDialog = ref(false)
const submitting = ref(false)
const editTarget = reactive({ id: '', name: '', perm: 1 })

const permOptions = [
  { label: '1 — 普通用户', value: 1 },
  { label: '2 — 管理员', value: 2 },
  { label: '3 — 超级管理员', value: 3 }
]

const permLabel = (p) => {
  if (p >= 3) return '3 — 超级管理员'
  if (p >= 2) return '2 — 管理员'
  return '1 — 普通用户'
}

const fetchUsers = async () => {
  loading.value = true
  try {
    users.value = await getUserList()
  } catch (e) {
    message.error('加载失败：' + (e.response?.data || e.message))
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

const openEditDialog = (u) => {
  Object.assign(editTarget, { id: u.id, name: u.name, perm: u.perm })
  showDialog.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    await editUser({ id: editTarget.id, perm: editTarget.perm })
    message.success('修改成功')
    showDialog.value = false
    await fetchUsers()
  } catch (e) {
    message.error('修改失败：' + (e.response?.data || e.message))
  } finally {
    submitting.value = false
  }
}

const handleBanToggle = (u) => {
  const action = u.banned ? '解封' : '封禁'
  const content = u.banned
    ? `确定要解封用户 "${u.name}" 吗？`
    : `确定要封禁用户 "${u.name}" 吗？封禁后该用户的所有会话将立即失效。`
  dialog.warning({
    title: `确认${action}`,
    content,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await banUser({ id: u.id, banned: !u.banned })
        message.success(`${action}成功`)
        await fetchUsers()
      } catch (e) {
        message.error(`${action}失败：` + (e.response?.data || e.message))
      }
    }
  })
}
</script>

<style scoped>
.user-admin-container {
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

.id-cell {
  font-size: 13px;
  color: #888;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banned-row td {
  opacity: 0.6;
}
</style>
