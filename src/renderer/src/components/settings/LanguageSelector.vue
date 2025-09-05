<template>
  <div class="language-selector" :data-size="size" :data-variant="variant">
    <!-- Trigger Button -->
    <button
      @click="toggleDropdown"
      class="language-trigger"
      :class="{
        active: isOpen,
        'language-change-success': showSuccessFeedback
      }"
      :aria-label="$t('settings.language')"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
    >
      <div class="current-language">
        <span class="language-flag">{{ currentLocale.flag }}</span>
        <span class="language-name">{{
          showNative ? currentLocale.nativeName : currentLocale.name
        }}</span>
      </div>

      <ChevronDown :size="16" class="dropdown-icon" :class="{ rotated: isOpen }" />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="language-dropdown"
      role="listbox"
      :aria-label="$t('settings.selectLanguage')"
    >
      <div class="dropdown-header" v-if="showHeader">
        <Globe :size="16" />
        <span>{{ $t('settings.selectLanguage') }}</span>
      </div>

      <div class="language-list">
        <button
          v-for="locale in availableLocales"
          :key="locale.code"
          @click="selectLanguage(locale.code)"
          class="language-option"
          :class="{ active: locale.current }"
          role="option"
          :aria-selected="locale.current"
          aria-label="按钮"
        >
          <div class="option-content">
            <span class="option-flag">{{ locale.flag }}</span>

            <div class="option-text">
              <span class="option-name">{{ locale.name }}</span>
              <span class="option-native">{{ locale.nativeName }}</span>
            </div>
          </div>

          <Check v-if="locale.current" :size="16" class="check-icon" />
        </button>
      </div>

      <div class="dropdown-footer" v-if="showFooter">
        <button @click="openTranslationHelp" class="help-button" aria-label="按钮">
          <HelpCircle :size="14" />
          <span>{{ $t('settings.translationHelp') }}</span>
        </button>
      </div>
    </div>

    <!-- Overlay -->
    <div v-if="isOpen" class="language-overlay" @click="closeDropdown" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Globe, Check, HelpCircle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useI18nService, type SupportedLocale } from '@renderer/src/services/i18n'

// Props
interface Props {
  showNative?: boolean
  showHeader?: boolean
  showFooter?: boolean
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'compact' | 'minimal'
}

const props = withDefaults(defineProps<Props>(), {
  showNative: false,
  showHeader: true,
  showFooter: true,
  size: 'medium',
  variant: 'default'
})

// Emits
const emit = defineEmits<{
  'language-change': [locale: SupportedLocale]
}>()

// Composables
const { t } = useI18n()
const i18nService = useI18nService()

// State
const isOpen = ref(false)
const showSuccessFeedback = ref(false)

// Computed
const currentLocale = computed(() => {
  const availableLocales = i18nService.getAvailableLocales()
  return availableLocales.find(locale => locale.current) || availableLocales[0]
})

const availableLocales = computed(() => {
  return i18nService.getAvailableLocales()
})

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectLanguage = async (locale: SupportedLocale) => {
  try {
    await i18nService.setLocale(locale)
    emit('language-change', locale)
    closeDropdown()

    // Show visual success feedback
    showSuccessFeedback.value = true
    setTimeout(() => {
      showSuccessFeedback.value = false
    }, 2000)

    // Show success notification
    if (window.showNotification) {
      const localeInfo = i18nService.getLocaleInfo(locale)
      window.showNotification(
        t('settings.languageChanged', { language: localeInfo.name }),
        'success'
      )
    }
  } catch (error) {
    console.error('Failed to change language:', error)

    // Show error notification
    if (window.showNotification) {
      window.showNotification(t('settings.languageChangeError'), 'error')
    }
  }
}

const openTranslationHelp = () => {
  // Open translation help or contribution guide
  const helpUrl = 'https://github.com/miaodachat/translations'
  window.open(helpUrl, '_blank')
  closeDropdown()
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) return

  switch (event.key) {
    case 'Escape':
      closeDropdown()
      break
    case 'Tab':
      // Let natural tab behavior work
      break
    default:
      break
  }
}

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('.language-selector')) {
    closeDropdown()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
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
.language-selector {
  @apply relative inline-block;
}

.language-trigger {
  @apply flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-lg font-medium text-sm;
  position: relative;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center center;
  backface-visibility: hidden;
  min-height: 48px;
  cursor: pointer;
}

.language-trigger:hover:not(:disabled) {
  @apply bg-accent border-primary/30;
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.language-trigger:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.language-trigger.active {
  @apply bg-accent border-primary shadow-md;
  transform: scale(1.01);
}

.language-trigger:focus-visible {
  @apply outline-none ring-2 ring-primary ring-offset-2;
  transform: scale(1.01);
}

.current-language {
  @apply flex items-center gap-3 flex-1;
}

.language-flag {
  @apply text-xl leading-none;
}

.language-name {
  @apply text-sm font-medium;
}

.dropdown-icon {
  @apply text-muted-foreground transition-transform;
  transition-duration: 150ms;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
  @apply text-primary;
}

.language-dropdown {
  @apply absolute top-full left-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-50 min-w-72 max-w-80;
  backdrop-filter: blur(8px);
}

.language-overlay {
  @apply fixed inset-0 z-40 bg-black/10 backdrop-blur-sm;
}

.dropdown-header {
  @apply flex items-center gap-3 px-4 py-4 border-b border-border/50 bg-muted/20;
}

.dropdown-header span {
  @apply text-sm font-semibold;
}

.language-list {
  @apply py-2 max-h-80 overflow-y-auto;
}

.language-option {
  @apply w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.language-option:hover {
  @apply bg-accent/50;
  transform: translateX(4px);
}

.language-option:active {
  transform: translateX(2px) scale(0.98);
}

.language-option.active {
  @apply bg-primary/5 text-primary border-r-2 border-primary;
  font-weight: 600;
}

.option-content {
  @apply flex items-center gap-4 flex-1;
}

.option-flag {
  @apply text-xl leading-none;
}

.language-option:hover .option-flag {
  transform: scale(1.1) rotate(5deg);
}

.option-text {
  @apply flex flex-col;
}

.option-name {
  @apply text-sm font-medium leading-tight;
}

.option-native {
  @apply text-xs text-muted-foreground mt-0.5;
}

.language-option:hover .option-name {
  @apply text-primary;
}

.language-option:hover .option-native {
  @apply text-primary/70;
}

.language-option.active .option-native {
  @apply text-primary/80;
}

.check-icon {
  @apply text-primary;
  animation: checkSlideIn 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes checkSlideIn {
  0% {
    transform: scale(0) rotate(180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.dropdown-footer {
  @apply border-t border-border/50 bg-muted/20;
}

.help-button {
  @apply w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground cursor-pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.help-button:hover {
  @apply text-foreground bg-accent/30;
  transform: translateX(2px);
}

.help-button:active {
  transform: translateX(1px) scale(0.98);
}

/* Success animation for language change */
.language-change-success::after {
  content: '✓';
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  color: rgb(34, 197, 94);
  font-weight: bold;
  animation: successCheckmark 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes successCheckmark {
  0% {
    transform: translateY(-50%) scale(0) rotate(180deg);
    opacity: 0;
  }
  50% {
    transform: translateY(-50%) scale(1.2) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-50%) scale(1) rotate(0deg);
    opacity: 0;
  }
}

/* Size variants */
.language-selector[data-size='small'] .language-trigger {
  @apply px-3 py-2 text-xs min-h-10;
}

.language-selector[data-size='small'] .language-name {
  @apply text-xs;
}

.language-selector[data-size='small'] .language-flag {
  @apply text-lg;
}

.language-selector[data-size='large'] .language-trigger {
  @apply px-5 py-4 min-h-14;
}

.language-selector[data-size='large'] .language-name {
  @apply text-base;
}

.language-selector[data-size='large'] .current-language {
  @apply gap-4;
}

/* Variant styles */
.language-selector[data-variant='compact'] .current-language {
  @apply gap-2;
}

.language-selector[data-variant='compact'] .language-name {
  @apply hidden;
}

.language-selector[data-variant='minimal'] .language-trigger {
  @apply border-0 bg-transparent hover:bg-accent/50 shadow-none;
}

.language-selector[data-variant='minimal'] .dropdown-icon {
  @apply hidden;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .language-dropdown {
    @apply left-auto right-0 min-w-64 max-w-72;
    position: fixed;
    top: auto;
    bottom: 80px;
    left: 16px;
    right: 16px;
    width: auto;
    max-width: none;
  }

  .language-trigger {
    @apply min-h-12 px-4 py-3;
  }

  .language-option {
    @apply py-4 px-4;
  }

  .help-button {
    @apply py-4 px-4;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .language-dropdown {
    @apply bg-background/95 border-border/60;
    backdrop-filter: blur(12px);
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.3),
      0 10px 10px -5px rgba(0, 0, 0, 0.2);
  }

  .dropdown-header {
    @apply bg-muted/30;
  }

  .dropdown-footer {
    @apply bg-muted/30;
  }

  .language-overlay {
    @apply bg-black/30;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .language-trigger {
    @apply border-2;
  }

  .language-trigger:focus-visible {
    @apply ring-4 ring-primary;
  }

  .language-option.active {
    @apply bg-primary text-primary-foreground border-0;
  }

  .dropdown-header,
  .dropdown-footer {
    @apply border-2 border-border;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .language-trigger,
  .language-option,
  .help-button,
  .option-flag,
  .dropdown-icon {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
}
</style>
