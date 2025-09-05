<template>
  <div class="plugin-manager">
    <!-- Header -->
    <div class="manager-header">
      <div class="header-content">
        <div class="header-info">
          <Puzzle :size="24" class="header-icon" />
          <div>
            <h1 class="header-title">{{ $t('plugin.pluginManager') }}</h1>
            <p class="header-subtitle">{{ $t('plugin.manageExtensions') }}</p>
          </div>
        </div>

        <div class="header-actions">
          <button
            @click="refreshPlugins"
            class="action-btn"
            :disabled="isLoading"
            aria-label="按钮"
          >
            <RotateCcw :size="16" :class="{ 'animate-spin': isLoading }" />
            {{ $t('common.refresh') }}
          </button>

          <button @click="showInstallDialog = true" class="action-btn primary" aria-label="按钮">
            <Plus :size="16" />
            {{ $t('plugin.installPlugin') }}
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">{{ $t('plugin.totalPlugins') }}:</span>
          <span class="stat-value">{{ plugins.length }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">{{ $t('plugin.enabledPlugins') }}:</span>
          <span class="stat-value">{{ enabledCount }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">{{ $t('plugin.availableUpdates') }}:</span>
          <span class="stat-value">{{ updatesCount }}</span>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="manager-filters">
      <div class="search-container">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('plugin.searchPlugins')"
          class="search-input"
          aria-label="输入框"
        />
      </div>

      <div class="filter-tabs">
        <button
          v-for="filter in filterOptions"
          :key="filter.key"
          @click="activeFilter = filter.key"
          class="filter-tab"
          :class="{ active: activeFilter === filter.key }"
          aria-label="按钮"
        >
          <component :is="filter.icon" :size="16" />
          {{ filter.label }}
          <span v-if="filter.count > 0" class="filter-count">{{ filter.count }}</span>
        </button>
      </div>

      <div class="sort-options">
        <select v-model="sortBy" class="sort-select">
          <option value="name">{{ $t('plugin.sortByName') }}</option>
          <option value="category">{{ $t('plugin.sortByCategory') }}</option>
          <option value="updated">{{ $t('plugin.sortByUpdated') }}</option>
          <option value="installed">{{ $t('plugin.sortByInstalled') }}</option>
        </select>
      </div>
    </div>

    <!-- Plugin List -->
    <div class="plugin-list">
      <div v-if="isLoading" class="loading-state">
        <Loader :size="32" class="animate-spin" />
        <p>{{ $t('plugin.loadingPlugins') }}</p>
      </div>

      <div v-else-if="filteredPlugins.length === 0" class="empty-state">
        <Package :size="48" class="empty-icon" />
        <h3>{{ $t('plugin.noPluginsFound') }}</h3>
        <p>{{ $t('plugin.noPluginsDescription') }}</p>
        <button @click="showInstallDialog = true" class="empty-action" aria-label="按钮">
          {{ $t('plugin.browsePlugins') }}
        </button>
      </div>

      <div v-else class="plugin-grid">
        <PluginCard
          v-for="plugin in filteredPlugins"
          :key="plugin.manifest.id"
          :plugin="plugin"
          @toggle="togglePlugin"
          @configure="configurePlugin"
          @uninstall="uninstallPlugin"
          @update="updatePlugin"
          @view-details="viewPluginDetails"
        />
      </div>
    </div>

    <!-- Install Dialog -->
    <PluginInstallDialog
      v-if="showInstallDialog"
      :visible="showInstallDialog"
      @close="showInstallDialog = false"
      @install="onPluginInstall"
    />

    <!-- Plugin Details Modal -->
    <PluginDetailsModal
      v-if="selectedPlugin"
      :plugin="selectedPlugin"
      :visible="!!selectedPlugin"
      @close="selectedPlugin = null"
      @toggle="togglePlugin"
      @configure="configurePlugin"
      @uninstall="uninstallPlugin"
    />

    <!-- Plugin Settings Modal -->
    <PluginSettingsModal
      v-if="configuringPlugin"
      :plugin="configuringPlugin"
      :visible="!!configuringPlugin"
      @close="configuringPlugin = null"
      @save="savePluginSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Puzzle,
  RotateCcw,
  Plus,
  Search,
  Package,
  Loader,
  Grid,
  List,
  Filter,
  Settings,
  Download,
  Trash2
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import {
  pluginManager,
  type PluginInstance,
  type PluginCategory
} from '@renderer/src/services/plugin/PluginManager'
import PluginCard from './PluginCard.vue'
import PluginInstallDialog from './PluginInstallDialog.vue'
import PluginDetailsModal from './PluginDetailsModal.vue'
import PluginSettingsModal from './PluginSettingsModal.vue'

// Composables
const { t } = useI18n()

// State
const plugins = ref<PluginInstance[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const activeFilter = ref<string>('all')
const sortBy = ref<string>('name')
const showInstallDialog = ref(false)
const selectedPlugin = ref<PluginInstance | null>(null)
const configuringPlugin = ref<PluginInstance | null>(null)

// Computed
const enabledCount = computed(() => plugins.value.filter(p => p.enabled).length)
const updatesCount = computed(() => 0) // TODO: Implement update checking

const filterOptions = computed(() => [
  {
    key: 'all',
    label: t('plugin.allPlugins'),
    icon: Grid,
    count: plugins.value.length
  },
  {
    key: 'enabled',
    label: t('plugin.enabled'),
    icon: Settings,
    count: enabledCount.value
  },
  {
    key: 'disabled',
    label: t('plugin.disabled'),
    icon: Package,
    count: plugins.value.length - enabledCount.value
  },
  {
    key: 'updates',
    label: t('plugin.updates'),
    icon: Download,
    count: updatesCount.value
  }
])

const filteredPlugins = computed(() => {
  let filtered = plugins.value

  // Apply text search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      plugin =>
        plugin.manifest.name.toLowerCase().includes(query) ||
        plugin.manifest.description.toLowerCase().includes(query) ||
        plugin.manifest.author.toLowerCase().includes(query) ||
        plugin.manifest.keywords?.some(k => k.toLowerCase().includes(query))
    )
  }

  // Apply filter
  switch (activeFilter.value) {
    case 'enabled':
      filtered = filtered.filter(p => p.enabled)
      break
    case 'disabled':
      filtered = filtered.filter(p => !p.enabled)
      break
    case 'updates':
      // TODO: Filter plugins with available updates
      break
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.manifest.name.localeCompare(b.manifest.name)
      case 'category':
        return a.manifest.category.localeCompare(b.manifest.category)
      case 'updated':
        // TODO: Sort by last updated
        return 0
      case 'installed':
        // TODO: Sort by installation date
        return 0
      default:
        return 0
    }
  })

  return filtered
})

// Methods
const loadPlugins = async () => {
  isLoading.value = true
  try {
    plugins.value = pluginManager.getPlugins()
  } catch (error) {
    console.error('Failed to load plugins:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshPlugins = async () => {
  await loadPlugins()
}

const togglePlugin = async (plugin: PluginInstance) => {
  try {
    if (plugin.enabled) {
      await pluginManager.disablePlugin(plugin.manifest.id)
    } else {
      await pluginManager.enablePlugin(plugin.manifest.id)
    }
    await loadPlugins()
  } catch (error) {
    console.error('Failed to toggle plugin:', error)
    // TODO: Show error notification
  }
}

const configurePlugin = (plugin: PluginInstance) => {
  configuringPlugin.value = plugin
}

const uninstallPlugin = async (plugin: PluginInstance) => {
  if (!confirm(t('plugin.confirmUninstall', { name: plugin.manifest.name }))) {
    return
  }

  try {
    await pluginManager.uninstallPlugin(plugin.manifest.id)
    await loadPlugins()
  } catch (error) {
    console.error('Failed to uninstall plugin:', error)
    // TODO: Show error notification
  }
}

const updatePlugin = async (plugin: PluginInstance) => {
  // TODO: Implement plugin updates
  console.log('Update plugin:', plugin.manifest.id)
}

const viewPluginDetails = (plugin: PluginInstance) => {
  selectedPlugin.value = plugin
}

const onPluginInstall = async (pluginData: any) => {
  try {
    await pluginManager.installPlugin(pluginData)
    await loadPlugins()
    showInstallDialog.value = false
  } catch (error) {
    console.error('Failed to install plugin:', error)
    // TODO: Show error notification
  }
}

const savePluginSettings = async (plugin: PluginInstance, settings: Record<string, any>) => {
  try {
    await pluginManager.updatePluginSettings(plugin.manifest.id, settings)
    configuringPlugin.value = null
  } catch (error) {
    console.error('Failed to save plugin settings:', error)
    // TODO: Show error notification
  }
}

// Plugin manager event handlers
const onPluginLoaded = (plugin: PluginInstance) => {
  loadPlugins()
}

const onPluginUnloaded = (pluginId: string) => {
  loadPlugins()
}

const onPluginEnabled = (pluginId: string) => {
  loadPlugins()
}

const onPluginDisabled = (pluginId: string) => {
  loadPlugins()
}

const onPluginError = (pluginId: string, error: Error) => {
  console.error(`Plugin ${pluginId} error:`, error)
  // TODO: Show error notification
  loadPlugins()
}

// Lifecycle
onMounted(async () => {
  // Initialize plugin manager if not already done
  if (!pluginManager.getPlugins().length) {
    try {
      await pluginManager.initialize()
    } catch (error) {
      console.error('Failed to initialize plugin manager:', error)
    }
  }

  // Load plugins
  await loadPlugins()

  // Listen to plugin manager events
  pluginManager.on('plugin-loaded', onPluginLoaded)
  pluginManager.on('plugin-unloaded', onPluginUnloaded)
  pluginManager.on('plugin-enabled', onPluginEnabled)
  pluginManager.on('plugin-disabled', onPluginDisabled)
  pluginManager.on('plugin-error', onPluginError)
})

onUnmounted(() => {
  // Remove event listeners
  pluginManager.off('plugin-loaded', onPluginLoaded)
  pluginManager.off('plugin-unloaded', onPluginUnloaded)
  pluginManager.off('plugin-enabled', onPluginEnabled)
  pluginManager.off('plugin-disabled', onPluginDisabled)
  pluginManager.off('plugin-error', onPluginError)
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
.plugin-manager {
  @apply flex flex-col h-full bg-background;
}

.manager-header {
  @apply border-b border-border bg-muted/30;
}

.header-content {
  @apply flex items-center justify-between p-6;
}

.header-info {
  @apply flex items-center gap-4;
}

.header-icon {
  @apply text-primary;
}

.header-title {
  @apply text-2xl font-bold;
}

.header-subtitle {
  @apply text-sm text-muted-foreground mt-1;
}

.header-actions {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50;
}

.action-btn.primary {
  @apply bg-primary text-primary-foreground border-primary hover:bg-primary/90;
}

.stats-bar {
  @apply flex items-center gap-6 px-6 py-3 border-t border-border bg-background/50;
}

.stat-item {
  @apply flex items-center gap-2 text-sm;
}

.stat-label {
  @apply text-muted-foreground;
}

.stat-value {
  @apply font-semibold;
}

.manager-filters {
  @apply flex items-center gap-4 p-4 border-b border-border bg-background;
}

.search-container {
  @apply relative flex-1 max-w-md;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground;
}

.search-input {
  @apply w-full pl-10 pr-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent;
}

.filter-tabs {
  @apply flex items-center gap-1;
}

.filter-tab {
  @apply flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent;
}

.filter-tab.active {
  @apply bg-primary text-primary-foreground;
}

.filter-count {
  @apply px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full;
}

.filter-tab.active .filter-count {
  @apply bg-primary-foreground/20 text-primary-foreground;
}

.sort-options {
  @apply flex items-center gap-2;
}

.sort-select {
  @apply px-3 py-2 border border-border rounded-md text-sm;
}

.plugin-list {
  @apply flex-1 overflow-auto p-6;
}

.loading-state,
.empty-state {
  @apply flex flex-col items-center justify-center h-64 text-center;
}

.empty-icon {
  @apply text-muted-foreground mb-4;
}

.empty-state h3 {
  @apply text-lg font-semibold mb-2;
}

.empty-state p {
  @apply text-muted-foreground mb-4;
}

.empty-action {
  @apply px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors;
}

.plugin-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
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

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    @apply flex-col gap-4;
  }

  .stats-bar {
    @apply flex-wrap gap-4;
  }

  .manager-filters {
    @apply flex-col gap-4;
  }

  .filter-tabs {
    @apply flex-wrap;
  }

  .plugin-grid {
    @apply grid-cols-1;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .plugin-manager {
    @apply border border-border;
  }

  .filter-tab.active {
    @apply ring-2 ring-primary;
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

/* 🎨 表单用户体验优化 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 1rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error {
  border-color: hsl(0 84% 60%);
}

.form-error {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: hsl(0 84% 60%);
}

.form-success {
  border-color: hsl(142 71% 45%);
}

/* 加载状态 */
.form-input.loading {
  background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
