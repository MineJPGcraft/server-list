<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ left: x + 'px', top: y + 'px' }"
    @click.stop
  >
    <div v-if="showRequestEdit" class="menu-item" @click="handleRequestEdit">
      <span class="menu-icon">✏️</span>
      <span>申请编辑</span>
    </div>
    <div class="menu-item" @click="handleDelete">
      <span class="menu-icon">🗑️</span>
      <span>删除</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: Boolean,
  x: Number,
  y: Number,
  showRequestEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['delete', 'request-edit'])

const handleDelete = () => {
  emit('delete')
}

const handleRequestEdit = () => {
  emit('request-edit')
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 150px;
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-icon {
  font-size: 14px;
}
</style>
