import { ref } from 'vue'

export function useContextMenu() {
  const visible = ref(false)
  const x = ref(0)
  const y = ref(0)
  const targetData = ref(null)

  const show = (event, data) => {
    event.preventDefault()
    event.stopPropagation()

    // 先隐藏已有菜单
    hide()

    // 使用 nextTick 确保在下一帧显示新菜单
    setTimeout(() => {
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

      // 添加全局点击监听器
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside, { once: true })
      }, 0)
    }, 0)
  }

  const hide = () => {
    visible.value = false
    targetData.value = null
    // 移除监听器
    document.removeEventListener('click', handleClickOutside)
  }

  const handleClickOutside = () => {
    hide()
  }

  return {
    visible,
    x,
    y,
    targetData,
    show,
    hide
  }
}
