<template>
  <div class="plugin-card" :class="cardClasses">
    <!-- Plugin Icon and Basic Info -->
    <div class="card-header">
      <div class="plugin-icon">
        <img
          v-if="plugin.manifest.icon"
          :src="plugin.manifest.icon"
          :alt="plugin.manifest.name"
          class="icon-image"
        />
        <Puzzle v-else :size="32" class="icon-default" />
      </div>

      <div class="plugin-info">
        <h3 class="plugin-name">{{ plugin.manifest.name }}</h3>
        <p class="plugin-version">v{{ plugin.manifest.version }}</p>
        <p class="plugin-author">{{ $t('plugin.by') }} {{ plugin.manifest.author }}</p>
      </div>

      <div class="card-actions">
        <button
          @click="$emit('toggle', plugin)"
          class="toggle-btn"
          :class="{ enabled: plugin.enabled }"
          :title="plugin.enabled ? $t('plugin.disable') : $t('plugin.enable')"
         aria-label="按钮">
          <Power :size="16" />
        </button>

        <div class="action-menu">
          <button @click="showActions = !showActions" class="menu-trigger" aria-label="按钮">
            <MoreVertical :size="16" />
          </button>

          <div v-if="showActions" class="action-dropdown">
            <button @click="$emit('view-details', plugin)" class="action-item" aria-label="按钮">
              <Info :size="14" />
              {{ $t('plugin.viewDetails') }}
            </button>

            <button v-if="hasSettings" @click="$emit('configure', plugin)" class="action-item" aria-label="按钮">
              <Settings :size="14" />
              {{ $t('plugin.configure') }}
            </button>

            <button v-if="hasUpdate" @click="$emit('update', plugin)" class="action-item" aria-label="按钮">
              <Download :size="14" />
              {{ $t('plugin.update') }}
            </button>

            <div class="action-divider" />

            <button @click="$emit('uninstall', plugin)" class="action-item danger" aria-label="按钮">
              <Trash2 :size="14" />
              {{ $t('plugin.uninstall') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Plugin Description -->
    <div class="card-body">
      <p class="plugin-description">{{ plugin.manifest.description }}</p>

      <!-- Keywords/Tags -->
      <div
        v-if="plugin.manifest.keywords && plugin.manifest.keywords.length > 0"
        class="plugin-keywords"
      >
        <span
          v-for="keyword in plugin.manifest.keywords.slice(0, 3)"
          :key="keyword"
          class="keyword-tag"
        >
          {{ keyword }}
        </span>
        <span v-if="plugin.manifest.keywords.length > 3" class="keyword-more">
          +{{ plugin.manifest.keywords.length - 3 }}
        </span>
      </div>
    </div>

    <!-- Plugin Status and Meta -->
    <div class="card-footer">
      <div class="status-indicators">
        <div class="status-item" :class="statusClass">
          <div class="status-dot" />
          <span class="status-text">{{ statusText }}</span>
        </div>

        <div v-if="plugin.error" class="error-indicator" :title="plugin.error">
          <AlertTriangle :size="14" />
        </div>

        <div class="category-badge" :class="categoryClass">
          <component :is="categoryIcon" :size="12" />
          {{ $t(`plugin.category.${plugin.manifest.category}`) }}
        </div>
      </div>

      <div class="meta-info">
        <span v-if="plugin.manifest.license" class="license">
          {{ plugin.manifest.license }}
        </span>

        <span class="permissions-count" :title="permissionsTitle">
          <Shield :size="12" />
          {{ plugin.manifest.requiredPermissions.length }}
        </span>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <Loader :size="24" class="animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Puzzle,
  Power,
  MoreVertical,
  Info,
  Settings,
  Download,
  Trash2,
  AlertTriangle,
  Shield,
  Loader,
  Code,
  Gamepad2,
  Wrench,
  BookOpen,
  Users,
  Palette,
  Zap,
  Globe
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { PluginInstance, PluginCategory } from '@renderer/src/services/plugin/PluginManager'

// Props
interface Props {
  plugin: PluginInstance
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  toggle: [plugin: PluginInstance]
  configure: [plugin: PluginInstance]
  uninstall: [plugin: PluginInstance]
  update: [plugin: PluginInstance]
  'view-details': [plugin: PluginInstance]
}>()

// Composables
const { t } = useI18n()

// State
const showActions = ref(false)
const isLoading = ref(false)

// Computed
const cardClasses = computed(() => ({
  'plugin-enabled': props.plugin.enabled,
  'plugin-disabled': !props.plugin.enabled,
  'plugin-error': !!props.plugin.error,
  'plugin-loading': isLoading.value
}))

const statusClass = computed(() => ({
  'status-enabled': props.plugin.enabled && !props.plugin.error,
  'status-disabled': !props.plugin.enabled && !props.plugin.error,
  'status-error': !!props.plugin.error
}))

const statusText = computed(() => {
  if (props.plugin.error) {
    return t('plugin.status.error')
  }
  return props.plugin.enabled ? t('plugin.status.enabled') : t('plugin.status.disabled')
})

const categoryClass = computed(() => `category-${props.plugin.manifest.category}`)

const categoryIcon = computed(() => {
  const iconMap: Record<PluginCategory, any> = {
    productivity: Wrench,
    entertainment: Gamepad2,
    utility: Zap,
    development: Code,
    education: BookOpen,
    social: Users,
    customization: Palette,
    integration: Globe
  }
  return iconMap[props.plugin.manifest.category] || Puzzle
})

const hasSettings = computed(() => {
  return props.plugin.manifest.settings && props.plugin.manifest.settings.length > 0
})

const hasUpdate = computed(() => {
  // TODO: Implement update checking
  return false
})

const permissionsTitle = computed(() => {
  return props.plugin.manifest.requiredPermissions.join(', ')
})

// Methods
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('.action-menu')) {
    showActions.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
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
.container-sm { max-width: var(--breakpoint-sm); }
.container-md { max-width: var(--breakpoint-md); }
.container-lg { max-width: var(--breakpoint-lg); }
.container-xl { max-width: var(--breakpoint-xl); }

/* 响应式显示 */
.hidden-sm { display: none; }
.hidden-md { display: none; }
.hidden-lg { display: none; }

@media (min-width: 640px) {
  .hidden-sm { display: block; }
}

@media (min-width: 768px) {
  .hidden-md { display: block; }
}

@media (min-width: 1024px) {
  .hidden-lg { display: block; }
}

/* 响应式文本 */
.text-responsive-sm { font-size: clamp(0.875rem, 2vw, 1rem); }
.text-responsive-base { font-size: clamp(1rem, 2.5vw, 1.125rem); }
.text-responsive-lg { font-size: clamp(1.125rem, 3vw, 1.25rem); }
.text-responsive-xl { font-size: clamp(1.25rem, 3.5vw, 1.5rem); }

/* 响应式间距 */
.space-responsive-sm { gap: clamp(0.5rem, 2vw, 1rem); }
.space-responsive-md { gap: clamp(1rem, 3vw, 1.5rem); }
.space-responsive-lg { gap: clamp(1.5rem, 4vw, 2rem); }

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
  .flex-col-mobile { flex-direction: column; }
  .grid-1-mobile { grid-template-columns: 1fr; }
  .gap-2-mobile { gap: var(--space-2); }
  .p-4-mobile { padding: var(--space-4); }
}

@media (max-width: 768px) {
  .flex-col-tablet { flex-direction: column; }
  .grid-2-tablet { grid-template-columns: repeat(2, 1fr); }
  .gap-4-tablet { gap: var(--space-4); }
  .p-6-tablet { padding: var(--space-6); }
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

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.grid-gap-2 { gap: var(--space-2); }
.grid-gap-4 { gap: var(--space-4); }
.grid-gap-6 { gap: var(--space-6); }

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
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

  .hidden-mobile { display: none; }
  .flex-mobile-col { flex-direction: column; }
  .grid-mobile-1 { grid-template-columns: 1fr; }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

.mx-auto { margin-left: auto; margin-right: auto; }
.my-auto { margin-top: auto; margin-bottom: auto; }

.px-1 { padding-left: var(--space-1); padding-right: var(--space-1); }
.px-2 { padding-left: var(--space-2); padding-right: var(--space-2); }
.px-3 { padding-left: var(--space-3); padding-right: var(--space-3); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.px-6 { padding-left: var(--space-6); padding-right: var(--space-6); }

.py-1 { padding-top: var(--space-1); padding-bottom: var(--space-1); }
.py-2 { padding-top: var(--space-2); padding-bottom: var(--space-2); }
.py-3 { padding-top: var(--space-3); padding-bottom: var(--space-3); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }
.py-6 { padding-top: var(--space-6); padding-bottom: var(--space-6); }

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

.stack-sm > * + * { margin-top: var(--space-2); }
.stack-md > * + * { margin-top: var(--space-4); }
.stack-lg > * + * { margin-top: var(--space-6); }
.stack-xl > * + * { margin-top: var(--space-8); }

.inline-sm > * + * { margin-left: var(--space-2); }
.inline-md > * + * { margin-left: var(--space-4); }
.inline-lg > * + * { margin-left: var(--space-6); }

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */

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
.font-sans { font-family: var(--font-family-sans); }
.font-mono { font-family: var(--font-family-mono); }

.text-xs { font-size: var(--font-size-xs); line-height: var(--line-height-tight); }
.text-sm { font-size: var(--font-size-sm); line-height: var(--line-height-snug); }
.text-base { font-size: var(--font-size-base); line-height: var(--line-height-normal); }
.text-lg { font-size: var(--font-size-lg); line-height: var(--line-height-relaxed); }
.text-xl { font-size: var(--font-size-xl); line-height: var(--line-height-relaxed); }
.text-2xl { font-size: var(--font-size-2xl); line-height: var(--line-height-loose); }
.text-3xl { font-size: var(--font-size-3xl); line-height: var(--line-height-loose); }

.font-thin { font-weight: var(--font-weight-thin); }
.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.leading-tight { line-height: var(--line-height-tight); }
.leading-snug { line-height: var(--line-height-snug); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }

.tracking-tight { letter-spacing: var(--letter-spacing-tight); }
.tracking-normal { letter-spacing: var(--letter-spacing-normal); }
.tracking-wide { letter-spacing: var(--letter-spacing-wide); }

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
.text-primary { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
.text-gray-500 { color: var(--color-gray-500); }
.text-gray-600 { color: var(--color-gray-600); }
.text-gray-700 { color: var(--color-gray-700); }

.bg-primary { background-color: var(--color-primary); }
.bg-primary-hover:hover { background-color: var(--color-primary-hover); }
.bg-success { background-color: var(--color-success); }
.bg-warning { background-color: var(--color-warning); }
.bg-error { background-color: var(--color-error); }

.border-primary { border-color: var(--color-primary); }
.border-success { border-color: var(--color-success); }
.border-error { border-color: var(--color-error); }

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
.plugin-card {
  @apply relative bg-background border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200;
}

.plugin-enabled {
  @apply border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20;
}

.plugin-disabled {
  @apply border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20;
}

.plugin-error {
  @apply border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20;
}

.plugin-loading {
  @apply pointer-events-none;
}

.card-header {
  @apply flex items-start gap-3 mb-3;
}

.plugin-icon {
  @apply flex-shrink-0;
}

.icon-image {
  @apply w-8 h-8 rounded-md object-cover;
}

.icon-default {
  @apply text-muted-foreground;
}

.plugin-info {
  @apply flex-1 min-w-0;
}

.plugin-name {
  @apply font-semibold text-base truncate;
}

.plugin-version {
  @apply text-xs text-muted-foreground;
}

.plugin-author {
  @apply text-xs text-muted-foreground truncate;
}

.card-actions {
  @apply flex items-start gap-1;
}

.toggle-btn {
  @apply p-2 rounded-md border border-border hover:bg-accent transition-colors;
}

.toggle-btn.enabled {
  @apply bg-green-500 text-white border-green-500 hover:bg-green-600;
}

.action-menu {
  @apply relative;
}

.menu-trigger {
  @apply p-2 rounded-md hover:bg-accent transition-colors;
}

.action-dropdown {
  @apply absolute right-0 top-full mt-1 bg-background border border-border rounded-md shadow-lg z-10 min-w-40;
}

.action-item {
  @apply w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left;
}

.action-item.danger {
  @apply text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20;
}

.action-divider {
  @apply border-t border-border my-1;
}

.card-body {
  @apply mb-4;
}

.plugin-description {
  @apply text-sm text-muted-foreground mb-3 line-clamp-2;
}

.plugin-keywords {
  @apply flex items-center gap-1 flex-wrap;
}

.keyword-tag {
  @apply px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full;
}

.keyword-more {
  @apply text-xs text-muted-foreground;
}

.card-footer {
  @apply flex items-center justify-between;
}

.status-indicators {
  @apply flex items-center gap-2;
}

.status-item {
  @apply flex items-center gap-1.5 text-xs;
}

.status-dot {
  @apply w-2 h-2 rounded-full;
}

.status-enabled .status-dot {
  @apply bg-green-500;
}

.status-disabled .status-dot {
  @apply bg-gray-400;
}

.status-error .status-dot {
  @apply bg-red-500;
}

.status-enabled .status-text {
  @apply text-green-600 dark:text-green-400;
}

.status-disabled .status-text {
  @apply text-gray-600 dark:text-gray-400;
}

.status-error .status-text {
  @apply text-red-600 dark:text-red-400;
}

.error-indicator {
  @apply text-red-500;
}

.category-badge {
  @apply flex items-center gap-1 px-2 py-1 rounded-full text-xs;
}

.category-productivity {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300;
}

.category-entertainment {
  @apply bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300;
}

.category-utility {
  @apply bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300;
}

.category-development {
  @apply bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300;
}

.category-education {
  @apply bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300;
}

.category-social {
  @apply bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300;
}

.category-customization {
  @apply bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300;
}

.category-integration {
  @apply bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300;
}

.meta-info {
  @apply flex items-center gap-2 text-xs text-muted-foreground;
}

.permissions-count {
  @apply flex items-center gap-1;
}

.loading-overlay {
  @apply absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .plugin-card {
    @apply border-2;
  }

  .toggle-btn:focus {
    @apply ring-2 ring-primary;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .plugin-card {
    @apply p-3;
  }

  .card-header {
    @apply gap-2;
  }

  .plugin-keywords {
    @apply hidden;
  }

  .card-footer {
    @apply flex-col items-start gap-2;
  }
}


/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}

/* 🎨 错误状态设计 */
.error-state {
  padding: 1rem;
  border: 1px solid hsl(0 84% 60% / 0.2);
  border-radius: 8px;
  background-color: hsl(0 84% 60% / 0.05);
  color: hsl(0 84% 60%);
}

.error-icon {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  color: hsl(0 84% 60%);
}

.error-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-message {
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
}

.error-retry-btn {
  padding: 0.5rem 1rem;
  background-color: hsl(0 84% 60%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.error-retry-btn:hover {
  background-color: hsl(0 84% 60% / 0.9);
}</style>
