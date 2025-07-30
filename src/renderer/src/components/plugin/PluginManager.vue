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
          <button @click="refreshPlugins" class="action-btn" :disabled="isLoading">
            <RotateCcw :size="16" :class="{ 'animate-spin': isLoading }" />
            {{ $t('common.refresh') }}
          </button>
          
          <button @click="showInstallDialog = true" class="action-btn primary">
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
        />
      </div>
      
      <div class="filter-tabs">
        <button
          v-for="filter in filterOptions"
          :key="filter.key"
          @click="activeFilter = filter.key"
          class="filter-tab"
          :class="{ 'active': activeFilter === filter.key }"
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
        <button @click="showInstallDialog = true" class="empty-action">
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
  Puzzle, RotateCcw, Plus, Search, Package, Loader,
  Grid, List, Filter, Settings, Download, Trash2
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { pluginManager, type PluginInstance, type PluginCategory } from '@renderer/src/services/plugin/PluginManager'
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
    filtered = filtered.filter(plugin => 
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
</style>