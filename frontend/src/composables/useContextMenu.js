import { ref, onMounted, onUnmounted } from 'vue'

export function useContextMenu() {
  const visible = ref(false)
  const x = ref(0)
  const y = ref(0)
  const targetData = ref(null)

  const show = (event, data) => {
    event.preventDefault()

    // 边界检测
    const menuWidth = 150
    const menuHeight = 50
    let posX = event.clientX
    let posY = event.clientY

    // 防止菜单超出视口
    if (posX + menuWidth > window.innerWidth) {
      posX = window.innerWidth - menuWidth - 10
    }
    if (posY + menuHeight > window.innerHeight) {
      posY = window.innerHeight - menuHeight - 10
    }

    x.value = posX
    y.value = posY
    targetData.value = data
    visible.value = true
  }

  const hide = () => {
    visible.value = false
    targetData.value = null
  }

  const handleClickOutside = () => {
    if (visible.value) {
      hide()
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  return {
    visible,
    x,
    y,
    targetData,
    show,
    hide
  }
}
