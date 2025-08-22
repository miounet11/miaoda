<template>
  <div 
    v-if="visible" 
    class="keyboard-hint"
    :class="hintClasses"
    @animationend="handleAnimationEnd"
  >
    <!-- Shortcut display -->
    <div class="shortcut-container">
      <div class="shortcut-keys">
        <kbd 
          v-for="(key, index) in parsedKeys" 
          :key="index"
          class="key"
          :class="{ 'modifier': key.isModifier }"
        >
          {{ key.display }}
        </kbd>
      </div>
      
      <!-- Action description -->
      <div class="action-description">
        {{ description }}
      </div>
    </div>
    
    <!-- Visual indicator -->
    <div class="indicator">
      <div class="indicator-pulse" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  shortcut: string
  description: string
  trigger?: 'hover' | 'focus' | 'manual' | 'auto'
  position?: 'top' | 'bottom' | 'left' | 'right'
  variant?: 'default' | 'minimal' | 'enhanced'
  autoHide?: boolean
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  trigger: 'auto',
  position: 'bottom',
  variant: 'enhanced',
  autoHide: true,
  duration: 3000
})

const emit = defineEmits<{
  'show': []
  'hide': []
  'shortcut-triggered': [shortcut: string]
}>()

// State
const visible = ref(false)
const animationState = ref<'entering' | 'visible' | 'exiting'>('visible')
const hideTimer = ref<NodeJS.Timeout | null>(null)

// Computed
const hintClasses = computed(() => ({
  [`hint-${props.position}`]: true,
  [`hint-${props.variant}`]: true,
  [`hint-${animationState.value}`]: true
}))

const parsedKeys = computed(() => {
  const keys = props.shortcut.split('+').map(key => key.trim())
  const isMac = navigator.platform.toLowerCase().includes('mac')
  
  return keys.map(key => {
    const lowerKey = key.toLowerCase()
    let display = key
    let isModifier = false
    
    // Handle modifier keys
    if (lowerKey === 'ctrl' || lowerKey === 'cmd' || lowerKey === 'command') {
      display = isMac ? '⌘' : 'Ctrl'
      isModifier = true
    } else if (lowerKey === 'alt' || lowerKey === 'option') {
      display = isMac ? '⌥' : 'Alt'
      isModifier = true
    } else if (lowerKey === 'shift') {
      display = isMac ? '⇧' : 'Shift'
      isModifier = true
    } else if (lowerKey === 'enter' || lowerKey === 'return') {
      display = isMac ? '↵' : 'Enter'
    } else if (lowerKey === 'escape' || lowerKey === 'esc') {
      display = 'Esc'
    } else if (lowerKey === 'space') {
      display = 'Space'
    } else if (lowerKey === 'tab') {
      display = 'Tab'
    } else if (lowerKey === 'backspace') {
      display = '⌫'
    } else if (lowerKey === 'delete') {
      display = 'Del'
    } else {
      display = key.toUpperCase()
    }
    
    return { display, isModifier }
  })
})

// Methods
const show = () => {
  if (visible.value) return
  
  visible.value = true
  animationState.value = 'entering'
  emit('show')
  
  if (props.autoHide && props.duration > 0) {
    hideTimer.value = setTimeout(() => {
      hide()
    }, props.duration)
  }
}

const hide = () => {
  if (!visible.value) return
  
  animationState.value = 'exiting'
  
  if (hideTimer.value) {
    clearTimeout(hideTimer.value)
    hideTimer.value = null
  }
}

const handleAnimationEnd = () => {
  if (animationState.value === 'entering') {
    animationState.value = 'visible'
  } else if (animationState.value === 'exiting') {
    visible.value = false
    animationState.value = 'visible'
    emit('hide')
  }
}

// Keyboard event handler
const handleKeydown = (event: KeyboardEvent) => {
  const shortcutParts = props.shortcut.toLowerCase().split('+').map(s => s.trim())
  const pressedKeys: string[] = []
  
  if (event.ctrlKey || event.metaKey) pressedKeys.push('ctrl')
  if (event.altKey) pressedKeys.push('alt')
  if (event.shiftKey) pressedKeys.push('shift')
  
  const mainKey = event.key.toLowerCase()
  if (!['control', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(mainKey)) {
    pressedKeys.push(mainKey === ' ' ? 'space' : mainKey)
  }
  
  const matches = shortcutParts.every(part => 
    pressedKeys.includes(part) || 
    (part === 'cmd' && pressedKeys.includes('ctrl'))
  ) && pressedKeys.length === shortcutParts.length
  
  if (matches) {
    emit('shortcut-triggered', props.shortcut)
    if (props.trigger === 'auto') {
      show()
    }
  }
}

// Auto-trigger on mount
watch(() => props.trigger, (newTrigger) => {
  if (newTrigger === 'auto') {
    show()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (props.trigger === 'auto') {
    // Delay slightly to ensure smooth appearance
    setTimeout(show, 100)
  }
  
  // Listen for keyboard events
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (hideTimer.value) {
    clearTimeout(hideTimer.value)
  }
  document.removeEventListener('keydown', handleKeydown)
})

// Expose methods
defineExpose({
  show,
  hide,
  visible: () => visible.value
})
</script>

<style scoped>
.keyboard-hint {
  position: fixed;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  user-select: none;
  max-width: 300px;
}

/* Position variants */
.hint-top {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.hint-bottom {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.hint-left {
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.hint-right {
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

/* Style variants */
.hint-minimal {
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 8px;
}

.hint-enhanced {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Container styling */
.shortcut-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 4px;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 2px 6px;
  background: linear-gradient(145deg, #f0f0f0, #d0d0d0);
  border: 1px solid #c0c0c0;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 11px;
  font-weight: 600;
  color: #333;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
}

.key.modifier {
  background: linear-gradient(145deg, #e0e0e0, #c0c0c0);
  border-color: #a0a0a0;
  color: #444;
  min-width: 28px;
}

.action-description {
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Visual indicator */
.indicator {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary, #3b82f6);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
}

.indicator-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: inherit;
  opacity: 0.4;
  animation: indicatorPulse 2s ease-in-out infinite;
}

/* Animation states */
.hint-entering {
  animation: hintSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.hint-exiting {
  animation: hintSlideOut 0.3s cubic-bezier(0.4, 0, 0.8, 1) both;
}

.hint-visible {
  animation: hintFloatBreathe 4s ease-in-out infinite;
}

/* Animations */
@keyframes hintSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes hintSlideOut {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px) scale(0.9);
  }
}

@keyframes hintFloatBreathe {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-3px);
  }
}

@keyframes indicatorPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.8;
  }
}

/* Position-specific animations */
.hint-top.hint-entering {
  animation: hintSlideInTop 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.hint-bottom.hint-entering {
  animation: hintSlideInBottom 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.hint-left.hint-entering {
  animation: hintSlideInLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.hint-right.hint-entering {
  animation: hintSlideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes hintSlideInTop {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes hintSlideInBottom {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes hintSlideInLeft {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0) scale(1);
  }
}

@keyframes hintSlideInRight {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0) scale(1);
  }
}

/* Dark theme adjustments */
@media (prefers-color-scheme: dark) {
  .keyboard-hint {
    background: rgba(20, 20, 20, 0.95);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .hint-enhanced {
    background: linear-gradient(135deg, rgba(20, 20, 20, 0.95), rgba(40, 40, 40, 0.95));
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .key {
    background: linear-gradient(145deg, #404040, #303030);
    border-color: #505050;
    color: #e0e0e0;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.5);
  }
  
  .key.modifier {
    background: linear-gradient(145deg, #505050, #404040);
    border-color: #606060;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .keyboard-hint {
    animation: none !important;
  }
  
  .hint-entering,
  .hint-exiting,
  .hint-visible {
    animation: none !important;
  }
  
  .indicator-pulse {
    animation: none !important;
    opacity: 0.6;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .keyboard-hint {
    background: rgba(0, 0, 0, 0.95);
    border: 2px solid #ffffff;
  }
  
  .key {
    background: #ffffff;
    border: 2px solid #000000;
    color: #000000;
  }
  
  .action-description {
    color: #ffffff;
    font-weight: 700;
  }
}
</style>