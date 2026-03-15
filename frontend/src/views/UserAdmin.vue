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
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td class="id-cell">{{ u.id }}</td>
            <td>{{ u.name }}</td>
            <td>{{ u.perm }}</td>
            <td>
              <n-button size="small" @click="openEditDialog(u)">修改权限</n-button>
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
          <n-input-number
            v-model:value="editTarget.perm"
            :min="1"
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
  NButton, NTable, NModal, NForm, NFormItem, NInput, NInputNumber,
  NSpace, NSpin, NEmpty, useMessage
} from 'naive-ui'
import { getUserList, editUser } from '@/api/server'

const router = useRouter()
const message = useMessage()

const users = ref([])
const loading = ref(false)
const showDialog = ref(false)
const submitting = ref(false)
const editTarget = reactive({ id: '', name: '', perm: 1 })

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
</style>
