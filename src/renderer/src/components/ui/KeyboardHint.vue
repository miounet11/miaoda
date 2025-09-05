<template>
  <div v-if="visible" class="keyboard-hint" :class="hintClasses" @animationend="handleAnimationEnd">
    <!-- Shortcut display -->
    <div class="shortcut-container">
      <div class="shortcut-keys">
        <kbd
          v-for="(key, index) in parsedKeys"
          :key="index"
          class="key"
          :class="{ modifier: key.isModifier }"
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
  show: []
  hide: []
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
  const shortcutParts = props.shortcut
    .toLowerCase()
    .split('+')
    .map(s => s.trim())
  const pressedKeys: string[] = []

  if (event.ctrlKey || event.metaKey) pressedKeys.push('ctrl')
  if (event.altKey) pressedKeys.push('alt')
  if (event.shiftKey) pressedKeys.push('shift')

  const mainKey = event.key.toLowerCase()
  if (!['control', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(mainKey)) {
    pressedKeys.push(mainKey === ' ' ? 'space' : mainKey)
  }

  const matches =
    shortcutParts.every(
      part => pressedKeys.includes(part) || (part === 'cmd' && pressedKeys.includes('ctrl'))
    ) && pressedKeys.length === shortcutParts.length

  if (matches) {
    emit('shortcut-triggered', props.shortcut)
    if (props.trigger === 'auto') {
      show()
    }
  }
}

// Auto-trigger on mount
watch(
  () => props.trigger,
  newTrigger => {
    if (newTrigger === 'auto') {
      show()
    }
  },
  { immediate: true }
)

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
/* 🎨 响应式设计系统 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 🎨 响应式实用类 */
.container-sm {
  max-width: var(--breakpoint-sm);
}
.container-md {
  max-width: var(--breakpoint-md);
}
.container-lg {
  max-width: var(--breakpoint-lg);
}
.container-xl {
  max-width: var(--breakpoint-xl);
}

/* 响应式显示 */
.hidden-sm {
  display: none;
}
.hidden-md {
  display: none;
}
.hidden-lg {
  display: none;
}

@media (min-width: 640px) {
  .hidden-sm {
    display: block;
  }
}

@media (min-width: 768px) {
  .hidden-md {
    display: block;
  }
}

@media (min-width: 1024px) {
  .hidden-lg {
    display: block;
  }
}

/* 响应式文本 */
.text-responsive-sm {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
.text-responsive-base {
  font-size: clamp(1rem, 2.5vw, 1.125rem);
}
.text-responsive-lg {
  font-size: clamp(1.125rem, 3vw, 1.25rem);
}
.text-responsive-xl {
  font-size: clamp(1.25rem, 3.5vw, 1.5rem);
}

/* 响应式间距 */
.space-responsive-sm {
  gap: clamp(0.5rem, 2vw, 1rem);
}
.space-responsive-md {
  gap: clamp(1rem, 3vw, 1.5rem);
}
.space-responsive-lg {
  gap: clamp(1.5rem, 4vw, 2rem);
}

/* 响应式网格 */
.grid-responsive-sm {
  grid-template-columns: repeat(auto-fit, minmax(clamp(200px, 25vw, 300px), 1fr));
}

.grid-responsive-md {
  grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 30vw, 350px), 1fr));
}

.grid-responsive-lg {
  grid-template-columns: repeat(auto-fit, minmax(clamp(300px, 35vw, 400px), 1fr));
}

/* 响应式布局调整 */
@media (max-width: 640px) {
  .flex-col-mobile {
    flex-direction: column;
  }
  .grid-1-mobile {
    grid-template-columns: 1fr;
  }
  .gap-2-mobile {
    gap: var(--space-2);
  }
  .p-4-mobile {
    padding: var(--space-4);
  }
}

@media (max-width: 768px) {
  .flex-col-tablet {
    flex-direction: column;
  }
  .grid-2-tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  .gap-4-tablet {
    gap: var(--space-4);
  }
  .p-6-tablet {
    padding: var(--space-6);
  }
}

@media (max-width: 1024px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
}

/* 🎨 现代布局系统 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.flex-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}

/* 🎨 网格系统 */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-gap-2 {
  gap: var(--space-2);
}
.grid-gap-4 {
  gap: var(--space-4);
}
.grid-gap-6 {
  gap: var(--space-6);
}

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.card:hover {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 🎨 页面布局 */
.page-layout {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
}

.page-main {
  padding: var(--space-6) 0;
}

.page-footer {
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

/* 🎨 侧边栏布局 */
.sidebar-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-6);
}

.sidebar {
  position: sticky;
  top: var(--space-6);
  height: fit-content;
}

.sidebar-content {
  padding: var(--space-6);
  background: white;
  border-radius: 12px;
  border: 1px solid var(--color-gray-200);
}

/* 🎨 响应式工具 */
@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .hidden-mobile {
    display: none;
  }
  .flex-mobile-col {
    flex-direction: column;
  }
  .grid-mobile-1 {
    grid-template-columns: 1fr;
  }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
  --space-32: 8rem; /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 {
  margin: var(--space-1);
}
.m-2 {
  margin: var(--space-2);
}
.m-3 {
  margin: var(--space-3);
}
.m-4 {
  margin: var(--space-4);
}
.m-6 {
  margin: var(--space-6);
}
.m-8 {
  margin: var(--space-8);
}

.p-1 {
  padding: var(--space-1);
}
.p-2 {
  padding: var(--space-2);
}
.p-3 {
  padding: var(--space-3);
}
.p-4 {
  padding: var(--space-4);
}
.p-6 {
  padding: var(--space-6);
}
.p-8 {
  padding: var(--space-8);
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-auto {
  margin-top: auto;
  margin-bottom: auto;
}

.px-1 {
  padding-left: var(--space-1);
  padding-right: var(--space-1);
}
.px-2 {
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.px-3 {
  padding-left: var(--space-3);
  padding-right: var(--space-3);
}
.px-4 {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
.px-6 {
  padding-left: var(--space-6);
  padding-right: var(--space-6);
}

.py-1 {
  padding-top: var(--space-1);
  padding-bottom: var(--space-1);
}
.py-2 {
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}
.py-3 {
  padding-top: var(--space-3);
  padding-bottom: var(--space-3);
}
.py-4 {
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
}
.py-6 {
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}

/* 🎨 容器和布局间距 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.section-spacing {
  padding-top: var(--space-12);
  padding-bottom: var(--space-12);
}

.card-spacing {
  padding: var(--space-6);
}

.stack-sm > * + * {
  margin-top: var(--space-2);
}
.stack-md > * + * {
  margin-top: var(--space-4);
}
.stack-lg > * + * {
  margin-top: var(--space-6);
}
.stack-xl > * + * {
  margin-top: var(--space-8);
}

.inline-sm > * + * {
  margin-left: var(--space-2);
}
.inline-md > * + * {
  margin-left: var(--space-4);
}
.inline-lg > * + * {
  margin-left: var(--space-6);
}

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  --font-size-5xl: 3rem; /* 48px */

  /* 字体权重 */
  --font-weight-thin: 100;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* 字母间距 */
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
}

/* 🎨 字体实用类 */
.font-sans {
  font-family: var(--font-family-sans);
}
.font-mono {
  font-family: var(--font-family-mono);
}

.text-xs {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
}
.text-sm {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-snug);
}
.text-base {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}
.text-lg {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
}
.text-xl {
  font-size: var(--font-size-xl);
  line-height: var(--line-height-relaxed);
}
.text-2xl {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-loose);
}
.text-3xl {
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-loose);
}

.font-thin {
  font-weight: var(--font-weight-thin);
}
.font-light {
  font-weight: var(--font-weight-light);
}
.font-normal {
  font-weight: var(--font-weight-normal);
}
.font-medium {
  font-weight: var(--font-weight-medium);
}
.font-semibold {
  font-weight: var(--font-weight-semibold);
}
.font-bold {
  font-weight: var(--font-weight-bold);
}

.leading-tight {
  line-height: var(--line-height-tight);
}
.leading-snug {
  line-height: var(--line-height-snug);
}
.leading-normal {
  line-height: var(--line-height-normal);
}
.leading-relaxed {
  line-height: var(--line-height-relaxed);
}

.tracking-tight {
  letter-spacing: var(--letter-spacing-tight);
}
.tracking-normal {
  letter-spacing: var(--letter-spacing-normal);
}
.tracking-wide {
  letter-spacing: var(--letter-spacing-wide);
}

/* 🎨 文本层次优化 */
.heading-1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 1rem;
}

.heading-2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 0.875rem;
}

.heading-3 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
  margin-bottom: 0.75rem;
}

.body-large {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
}

.body-regular {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}

.body-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.caption {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-gray-600);
}

/* 🎨 高级色彩系统 */
:root {
  /* 基础色彩 */
  --color-primary: hsl(221 83% 53%);
  --color-primary-hover: hsl(221 83% 48%);
  --color-primary-active: hsl(221 83% 43%);

  /* 语义色彩 */
  --color-success: hsl(142 71% 45%);
  --color-warning: hsl(38 92% 50%);
  --color-error: hsl(0 84% 60%);
  --color-info: hsl(217 91% 60%);

  /* 中性色彩 */
  --color-gray-50: hsl(210 20% 98%);
  --color-gray-100: hsl(210 15% 95%);
  --color-gray-200: hsl(210 10% 89%);
  --color-gray-300: hsl(210 8% 75%);
  --color-gray-400: hsl(210 8% 56%);
  --color-gray-500: hsl(210 6% 43%);
  --color-gray-600: hsl(210 8% 35%);
  --color-gray-700: hsl(210 10% 28%);
  --color-gray-800: hsl(210 12% 21%);
  --color-gray-900: hsl(210 15% 15%);

  /* 透明度变体 */
  --color-primary-10: hsl(221 83% 53% / 0.1);
  --color-primary-20: hsl(221 83% 53% / 0.2);
  --color-primary-30: hsl(221 83% 53% / 0.3);
  --color-success-10: hsl(142 71% 45% / 0.1);
  --color-error-10: hsl(0 84% 60% / 0.1);
}

/* 🎨 色彩实用类 */
.text-primary {
  color: var(--color-primary);
}
.text-success {
  color: var(--color-success);
}
.text-warning {
  color: var(--color-warning);
}
.text-error {
  color: var(--color-error);
}
.text-gray-500 {
  color: var(--color-gray-500);
}
.text-gray-600 {
  color: var(--color-gray-600);
}
.text-gray-700 {
  color: var(--color-gray-700);
}

.bg-primary {
  background-color: var(--color-primary);
}
.bg-primary-hover:hover {
  background-color: var(--color-primary-hover);
}
.bg-success {
  background-color: var(--color-success);
}
.bg-warning {
  background-color: var(--color-warning);
}
.bg-error {
  background-color: var(--color-error);
}

.border-primary {
  border-color: var(--color-primary);
}
.border-success {
  border-color: var(--color-success);
}
.border-error {
  border-color: var(--color-error);
}

/* 🎨 对比度增强 */
.high-contrast {
  --color-primary: hsl(221 100% 40%);
  --color-gray-900: hsl(210 20% 10%);
  --color-gray-100: hsl(210 15% 95%);
}

/* 🎨 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: hsl(210 15% 15%);
    --color-gray-100: hsl(210 12% 21%);
    --color-gray-200: hsl(210 10% 28%);
    --color-gray-300: hsl(210 8% 35%);
    --color-gray-400: hsl(210 6% 43%);
    --color-gray-500: hsl(210 8% 56%);
    --color-gray-600: hsl(210 8% 75%);
    --color-gray-700: hsl(210 10% 89%);
    --color-gray-800: hsl(210 15% 95%);
    --color-gray-900: hsl(210 20% 98%);
  }
}
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
  color: hsl(NaN NaN% NaN%);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
}

.key.modifier {
  background: linear-gradient(145deg, #e0e0e0, #c0c0c0);
  border-color: hsl(0 0% 63%);
  color: hsl(NaN NaN% NaN%);
  min-width: 28px;
}

.action-description {
  color: hsl(0 0% 100%);
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
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-3px);
  }
}

@keyframes indicatorPulse {
  0%,
  100% {
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
    border-color: hsl(0 0% 31%);
    color: hsl(0 0% 88%);
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.5);
  }

  .key.modifier {
    background: linear-gradient(145deg, #505050, #404040);
    border-color: hsl(0 0% 38%);
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
    color: hsl(0 0% 0%);
  }

  .action-description {
    color: hsl(0 0% 100%);
    font-weight: 700;
  }
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}
</style>
