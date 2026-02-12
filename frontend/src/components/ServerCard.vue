<template>
  <n-card
    class="server-card"
    hoverable
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <div class="card-content">
      <n-image
        :src="server.icon"
        :alt="server.name"
        class="server-icon"
        :img-props="{ style: 'object-fit: cover' }"
      />
      <h3 class="server-name">{{ server.name }}</h3>
      <p class="server-description">{{ server.description }}</p>
    </div>
  </n-card>
</template>

<script setup>
import { NCard, NImage } from 'naive-ui'
import { useRouter } from 'vue-router'

const props = defineProps({
  server: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['contextmenu'])
const router = useRouter()

const handleClick = () => {
  router.push(`/edit/${props.server.id}`)
}

const handleContextMenu = (event) => {
  emit('contextmenu', event, props.server)
}
</script>

<style scoped>
.server-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.server-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.server-icon {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.server-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.server-description {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
