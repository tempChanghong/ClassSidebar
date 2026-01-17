import { computed, watch, onMounted, onUnmounted, Ref, toRaw, ref } from 'vue'
import { useSidebarStore } from '../stores/sidebarStore'

export function useSidebarInteraction(
  wrapperRef: Ref<HTMLElement | null>,
  sidebarRef: Ref<HTMLElement | null>
) {
  const store = useSidebarStore()

  // Constants
  const START_W = 4
  let START_H = 64
  let TARGET_W = 400
  const TARGET_H = 450
  const THRESHOLD = 60
  const VELOCITY_THRESHOLD = 0.3

  // State
  let startX = 0
  let lastX = 0
  let lastTime = 0
  let currentVelocity = 0
  let isSwipeActive = false
  let animationId: number | null = null
  let startTimeStamp = 0
  let lastResizeTime = 0

  let isVerticalDragging = false
  let startY = 0

  const lastTransforms = ref<any>(null)

  function throttledResize(w: number, h: number, y: number) {
    const now = Date.now()
    if (now - lastResizeTime > 16) {
      window.electronAPI.resizeWindow(w, h, y)
      lastResizeTime = now
    }
  }

  function updateWindowSize(p: number) {
    if (!store.config?.transforms || !store.config?.displayBounds) return

    const { posy } = store.config.transforms
    const { y: screenY, height: screenH } = store.config.displayBounds

    let targetWinW: number, targetWinH: number

    if (p <= 0) {
      targetWinW = 20
      targetWinH = START_H + 40
    } else {
      if (p >= 0.99) {
          targetWinW = Math.floor(TARGET_W + 100)
          targetWinH = Math.floor(TARGET_H + 100)
      } else {
          targetWinW = Math.floor(store.sidebarWidth + 100)
          targetWinH = Math.floor(store.sidebarHeight + 100)
      }
    }

    // Correct calculation for startCenterY: screenY + half screen height + posy offset
    const startCenterY = screenY + (screenH / 2) + posy
    
    const safeCenterY = Math.max(
      screenY + TARGET_H / 2 + 20,
      Math.min(screenY + screenH - TARGET_H / 2 - 20, startCenterY)
    )
    const currentCenterY = startCenterY + (safeCenterY - startCenterY) * p
    const newWindowY = currentCenterY - targetWinH / 2

    // console.log(`[RENDERER-DEBUG] updateWindowSize p=${p}. Target: ${targetWinW}x${targetWinH} at Y=${newWindowY}`)

    if (p === 0 || p === 1) {
      window.electronAPI.resizeWindow(targetWinW, targetWinH, newWindowY)
    } else {
      throttledResize(targetWinW, targetWinH, newWindowY)
    }
  }

  // --- Watcher: Strict Control ---
  watch(
    () => store.config,
    (newConfig) => {
      if (!newConfig?.transforms) return

      const newT = newConfig.transforms

      if (!lastTransforms.value) {
        console.log('[RENDERER-DEBUG] First load config:', JSON.stringify(newT))
        lastTransforms.value = JSON.parse(JSON.stringify(newT))
        if (typeof newT.height === 'number') START_H = newT.height
        if (typeof newT.width === 'number') TARGET_W = newT.width
        
        if (!store.isExpanded) {
            console.log('[RENDERER-DEBUG] First load: Forcing collapsed resize')
            updateWindowSize(0)
        }
        return
      }

      const oldT = lastTransforms.value
      
      const heightChanged = newT.height !== oldT.height
      const widthChanged = newT.width !== oldT.width
      const displayChanged = newT.display !== oldT.display
      const posyChanged = newT.posy !== oldT.posy

      console.log(`[RENDERER-DEBUG] Config Changed. H:${heightChanged} W:${widthChanged} D:${displayChanged} PosY:${posyChanged}`)
      
      lastTransforms.value = JSON.parse(JSON.stringify(newT))
      
      if (typeof newT.height === 'number') START_H = newT.height
      if (typeof newT.width === 'number') TARGET_W = newT.width

      if (posyChanged && !heightChanged && !widthChanged && !displayChanged) {
          // If only posy changed, we might want to update position if collapsed
          if (!store.isExpanded) {
              updateWindowSize(0)
          }
          return
      }

      if (heightChanged || widthChanged || displayChanged) {
        console.log('[RENDERER-DEBUG] Structural change detected. Resizing...')
        if (!store.isExpanded) {
          updateWindowSize(0)
        } else {
          updateWindowSize(1)
        }
      }
    },
    { deep: true, immediate: true }
  )

  const progress = computed(() => {
    if (TARGET_W === START_W) return 0
    return Math.max(0, Math.min(1, (store.sidebarWidth - START_W) / (TARGET_W - START_W)))
  })

  const sidebarStyle = computed(() => {
    const p = progress.value
    const currentRadius = 4 + 12 * p
    const currentMargin = 6 + 6 * p
    const gray = Math.floor(156 + (255 - 156) * p)
    const baseOpacity = store.config?.transforms?.opacity ?? 0.95
    const currentOpacity = 0.8 + (baseOpacity - 0.8) * p

    return {
      width: `${store.sidebarWidth}px`,
      height: `${store.sidebarHeight}px`,
      borderRadius: `${currentRadius}px`,
      marginLeft: `${currentMargin}px`,
      backgroundColor: `rgba(${gray}, ${gray}, ${gray}, ${currentOpacity})`,
      transition: store.isDragging || animationId ? 'none' : undefined
    }
  })

  watch(
    () => store.sidebarWidth,
    () => {
      updateWindowSize(progress.value)
    }
  )

  function stopAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  function expand() {
    const currentW = store.sidebarWidth
    if (
      store.isExpanded &&
      !store.isDragging &&
      !animationId &&
      Math.abs(currentW - TARGET_W) < 1
    )
      return

    stopAnimation()
    store.setExpanded(true)
    document.body.classList.add('expanded')

    const speed = store.config?.transforms?.animation_speed || 1
    const duration = 300 / speed
    const startTime = performance.now()
    const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4)
    const startProgress = progress.value

    function animate(currentTime: number) {
      if (!store.isExpanded) {
        animationId = null
        return
      }
      const elapsed = currentTime - startTime
      const t = Math.min(1, elapsed / duration)
      const p = startProgress + (1 - startProgress) * easeOutQuart(t)

      const newWidth = START_W + (TARGET_W - START_W) * p
      const newHeight = START_H + (TARGET_H - START_H) * p
      store.updateDimensions(newWidth, newHeight)

      if (t >= 1) {
        store.updateDimensions(TARGET_W, TARGET_H)
        animationId = null
      } else {
        animationId = requestAnimationFrame(animate)
      }
    }
    animationId = requestAnimationFrame(animate)
  }

  function collapse() {
    stopAnimation()
    store.setExpanded(false)
    document.body.classList.remove('expanded')

    const speed = store.config?.transforms?.animation_speed || 1
    const duration = 300 / speed
    const startTime = performance.now()
    const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4)
    const startProgress = progress.value

    function animate(currentTime: number) {
      if (store.isExpanded) {
        animationId = null
        return
      }
      const elapsed = currentTime - startTime
      const t = Math.min(1, elapsed / duration)
      const p = startProgress * (1 - easeOutQuart(t))

      const newWidth = START_W + (TARGET_W - START_W) * p
      const newHeight = START_H + (TARGET_H - START_H) * p
      store.updateDimensions(newWidth, newHeight)

      if (t >= 1) {
        store.updateDimensions(START_W, START_H)
        animationId = null
        // Force resize to collapsed state when animation finishes
        updateWindowSize(0)
      } else {
        animationId = requestAnimationFrame(animate)
      }
    }
    animationId = requestAnimationFrame(animate)
  }

  function isInteractive(target: EventTarget | null) {
    if (!target || !(target instanceof HTMLElement)) return false
    return (
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      !!target.closest('.launcher-item') ||
      !!target.closest('.volume-slider-container') ||
      !!target.closest('.drag-handle')
    )
  }

  function onWrapperMouseDown(e: MouseEvent) {
    if (store.isExpanded && isInteractive(e.target)) return
    e.preventDefault()
    handleStart(e.screenX)
  }

  function onWrapperTouchStart(e: TouchEvent) {
    if (e.touches.length > 0) {
      if (store.isExpanded && isInteractive(e.target)) return
      e.preventDefault()
      handleStart(e.touches[0].screenX)
    }
  }

  function handleStart(currentX: number) {
    store.isDragging = true
    lastX = currentX
    lastTime = performance.now()
    startTimeStamp = lastTime
    currentVelocity = 0
    isSwipeActive = true

    if (animationId) {
      const currentProgress = progress.value
      startX = currentX - currentProgress * 250
      stopAnimation()
    } else {
      if (store.isExpanded) {
        isSwipeActive = false
        startX = currentX - 250
      } else {
        startX = currentX
      }
    }
  }

  function handleMove(currentX: number) {
    if (!store.isDragging) return
    const now = performance.now()
    const dt = now - lastTime
    if (dt > 0) currentVelocity = (currentX - lastX) / dt
    lastX = currentX
    lastTime = now

    if (!isSwipeActive) {
      if (currentVelocity < -0.5) {
        isSwipeActive = true
      } else {
        return
      }
    }

    const deltaX = currentX - startX
    const p = Math.max(0, Math.min(1, deltaX / 250))

    const newWidth = START_W + (TARGET_W - START_W) * p
    const newHeight = START_H + (TARGET_H - START_H) * p
    store.updateDimensions(newWidth, newHeight)
  }

  function handleEnd(currentX: number | null) {
    if (!store.isDragging) return
    store.isDragging = false

    if (!isSwipeActive) return

    const deltaX = currentX ? currentX - startX : 0
    const duration = performance.now() - startTimeStamp

    if (currentVelocity < -VELOCITY_THRESHOLD) {
      collapse()
      return
    }

    const isClick = Math.abs(deltaX) < 5 && duration < 300

    if (
      deltaX > THRESHOLD ||
      currentVelocity > VELOCITY_THRESHOLD ||
      (duration < 200 && deltaX > 20)
    ) {
      expand()
    } else if (isClick && !store.isExpanded) {
      expand()
    } else {
      collapse()
    }
  }

  function onDragHandleMouseDown(e: MouseEvent) {
    e.stopPropagation()
    isVerticalDragging = true
    startY = e.screenY
    window.electronAPI.setIgnoreMouse(false, true)
    console.log('[RENDERER-DEBUG] Vertical Drag Start')
  }

  function onDragHandleTouchStart(e: TouchEvent) {
    if (e.touches.length > 0) {
      e.stopPropagation()
      isVerticalDragging = true
      startY = e.touches[0].screenY
      window.electronAPI.setIgnoreMouse(false, true)
      console.log('[RENDERER-DEBUG] Vertical Drag Start (Touch)')
    }
  }

  function handleVerticalMove(currentY: number) {
    if (!isVerticalDragging) return
    const deltaY = currentY - startY
    // Ensure deltaY is a valid number
    if (isNaN(deltaY)) return

    window.electronAPI.moveWindow(deltaY)
    startY = currentY
  }

  async function handleVerticalEnd() {
    if (!isVerticalDragging) return
    isVerticalDragging = false
    console.log('[RENDERER-DEBUG] Vertical Drag End')
    
    if (store.config) {
        const newPosy = await window.electronAPI.getCurrentPosY()
        console.log(`[RENDERER-DEBUG] New PosY from Main: ${newPosy}`)
        
        if (store.config.transforms) {
            store.config.transforms.posy = newPosy
            if (lastTransforms.value) {
                lastTransforms.value.posy = newPosy
            }
        }

        const configToSave = JSON.parse(JSON.stringify(toRaw(store.config)))
        if ('displayBounds' in configToSave) {
            delete configToSave.displayBounds
        }
        
        console.log('[RENDERER-DEBUG] Saving config...')
        await window.electronAPI.saveConfig(configToSave)
        
        // Force update window size to ensure it snaps to correct position
        // This is crucial because after dragging, the window might be slightly off
        // relative to the new posy if we don't re-calculate.
        if (!store.isExpanded) {
            updateWindowSize(0)
        }
    }
  }

  function updateIgnoreMouse(e: MouseEvent) {
    if (store.isDragging || animationId || isVerticalDragging) {
      window.electronAPI.setIgnoreMouse(false, true)
      return
    }

    let shouldIgnore = true
    const clientX = e.clientX
    const clientY = e.clientY

    if (store.isExpanded) {
      if (sidebarRef.value) {
        const rect = sidebarRef.value.getBoundingClientRect()
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          shouldIgnore = false
        }
      }
    } else {
      if (wrapperRef.value) {
        const rect = wrapperRef.value.getBoundingClientRect()
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          shouldIgnore = false
        }
      }
    }
    window.electronAPI.setIgnoreMouse(shouldIgnore, true)
  }

  const onMouseMove = (e: MouseEvent) => {
      handleMove(e.screenX)
      handleVerticalMove(e.screenY)
  }
  
  const onMouseUp = (e: MouseEvent) => {
      handleEnd(e.screenX)
      handleVerticalEnd()
  }

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      if (store.isDragging) {
        e.preventDefault()
        handleMove(e.touches[0].screenX)
      } else if (isVerticalDragging) {
        e.preventDefault()
        handleVerticalMove(e.touches[0].screenY)
      }
    }
  }
  
  const onTouchEnd = (e: TouchEvent) => {
    handleEnd(e.changedTouches.length > 0 ? e.changedTouches[0].screenX : null)
    handleVerticalEnd()
  }
  
  const onBlur = () => {
    if (store.isExpanded) collapse()
  }
  const onMouseDownGlobal = (e: MouseEvent) => {
    if (store.isExpanded && sidebarRef.value && !sidebarRef.value.contains(e.target as Node)) {
      collapse()
    }
  }

  onMounted(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('blur', onBlur)
    window.addEventListener('mousedown', onMouseDownGlobal)
    window.addEventListener('mousemove', updateIgnoreMouse)
    window.addEventListener('mouseleave', () => window.electronAPI.setIgnoreMouse(true, true))
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('blur', onBlur)
    window.removeEventListener('mousedown', onMouseDownGlobal)
    window.removeEventListener('mousemove', updateIgnoreMouse)
  })

  return {
    sidebarStyle,
    onWrapperMouseDown,
    onWrapperTouchStart,
    onDragHandleMouseDown,
    onDragHandleTouchStart
  }
}
