<template>
  <div class="plugins-view">
    <div class="plugins-header">
      <h2>{{ $t('plugins.title') }}</h2>
      <p class="plugins-description">{{ $t('plugins.description') }}</p>
    </div>
    
    <div class="plugins-content">
      <div class="plugins-sidebar">
        <div class="plugin-actions">
          <button
            v-for="action in actions"
            :key="action"
            @click="selectedAction = action"
            :class="['action-btn', { active: selectedAction === action }]"
          >
            {{ $t(`plugins.actions.${action}`) }}
          </button>
        </div>
      </div>
      
      <div class="plugins-main">
        <div v-if="selectedAction === 'browse'" class="plugins-grid">
          <div
            v-for="plugin in plugins"
            :key="plugin.id"
            :class="['plugin-card', { active: selectedPlugin?.id === plugin.id }]"
            @click="selectPlugin(plugin)"
          >
            <div class="plugin-header">
              <div class="plugin-icon">
                <Puzzle :size="32" />
              </div>
              <div class="plugin-status" :class="plugin.status">
                <div class="status-dot"></div>
                {{ $t(`plugins.status.${plugin.status}`) }}
              </div>
            </div>
            <h3>{{ plugin.name }}</h3>
            <p>{{ plugin.description }}</p>
            <div class="plugin-meta">
              <span class="version">v{{ plugin.version }}</span>
              <span class="author">{{ plugin.author }}</span>
            </div>
            <div class="plugin-actions-card">
              <button
                v-if="plugin.status === 'installed'"
                @click.stop="togglePlugin(plugin)"
                :class="['action-btn-small', plugin.enabled ? 'enabled' : 'disabled']"
              >
                {{ plugin.enabled ? $t('common.disable') : $t('common.enable') }}
              </button>
              <button
                v-if="plugin.status === 'available'"
                @click.stop="installPlugin(plugin)"
                class="action-btn-small install"
              >
                {{ $t('plugins.install') }}
              </button>
            </div>
          </div>
        </div>
        
        <div v-else-if="selectedAction === 'installed'" class="installed-plugins">
          <div v-for="plugin in installedPlugins" :key="plugin.id" class="installed-plugin">
            <div class="plugin-info">
              <h3>{{ plugin.name }}</h3>
              <p>{{ plugin.description }}</p>
            </div>
            <div class="plugin-controls">
              <button @click="configurePlugin(plugin)" class="control-btn">
                {{ $t('plugins.configure') }}
              </button>
              <button @click="uninstallPlugin(plugin)" class="control-btn danger">
                {{ $t('plugins.uninstall') }}
              </button>
            </div>
          </div>
        </div>
        
        <div v-else-if="selectedAction === 'develop'" class="develop-section">
          <div class="develop-card">
            <h3>{{ $t('plugins.develop.title') }}</h3>
            <p>{{ $t('plugins.develop.description') }}</p>
            <button @click="createNewPlugin" class="develop-btn">
              {{ $t('plugins.develop.create') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Puzzle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  status: 'installed' | 'available' | 'updating'
  enabled: boolean
}

const { t } = useI18n()

const selectedAction = ref('browse')
const selectedPlugin = ref<Plugin | null>(null)
const plugins = ref<Plugin[]>([
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'A simple calculator plugin',
    version: '1.0.0',
    author: 'MiaoDa Team',
    status: 'installed',
    enabled: true
  },
  {
    id: 'web-tools',
    name: 'Web Tools',
    description: 'Web development utilities',
    version: '1.2.0',
    author: 'MiaoDa Team',
    status: 'installed',
    enabled: false
  }
])

const actions = ['browse', 'installed', 'develop']

const installedPlugins = computed(() => {
  return plugins.value.filter(plugin => plugin.status === 'installed')
})

const selectPlugin = (plugin: Plugin) => {
  selectedPlugin.value = plugin
}

const togglePlugin = (plugin: Plugin) => {
  plugin.enabled = !plugin.enabled
}

const installPlugin = (plugin: Plugin) => {
  plugin.status = 'updating'
  setTimeout(() => {
    plugin.status = 'installed'
    plugin.enabled = true
  }, 2000)
}

const uninstallPlugin = (plugin: Plugin) => {
  const index = plugins.value.findIndex(p => p.id === plugin.id)
  if (index > -1) {
    plugins.value.splice(index, 1)
  }
}

const configurePlugin = (plugin: Plugin) => {
  // Open plugin configuration
}

const createNewPlugin = () => {
  // Open plugin development wizard
}

onMounted(() => {
  // Load plugins from API
})
</script>

<style scoped>
.plugins-view {
  @apply flex flex-col h-full;
}

.plugins-header {
  @apply p-6 border-b border-border;
}

.plugins-header h2 {
  @apply text-2xl font-bold mb-2;
}

.plugins-description {
  @apply text-muted-foreground;
}

.plugins-content {
  @apply flex-1 flex overflow-hidden;
}

.plugins-sidebar {
  @apply w-64 border-r border-border p-4;
}

.plugin-actions {
  @apply space-y-2;
}

.action-btn {
  @apply w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors;
}

.action-btn.active {
  @apply bg-primary text-primary-foreground;
}

.plugins-main {
  @apply flex-1 p-6 overflow-auto;
}

.plugins-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.plugin-card {
  @apply p-4 border border-border rounded-lg cursor-pointer hover:shadow-md transition-all;
}

.plugin-card.active {
  @apply border-primary shadow-md;
}

.plugin-header {
  @apply flex items-center justify-between mb-3;
}

.plugin-icon {
  @apply text-primary;
}

.plugin-status {
  @apply flex items-center gap-2 text-xs;
}

.status-dot {
  @apply w-2 h-2 rounded-full;
}

.plugin-status.installed .status-dot {
  @apply bg-green-500;
}

.plugin-status.available .status-dot {
  @apply bg-gray-400;
}

.plugin-status.updating .status-dot {
  @apply bg-yellow-500 animate-pulse;
}

.plugin-card h3 {
  @apply font-semibold mb-2;
}

.plugin-card p {
  @apply text-sm text-muted-foreground mb-3;
}

.plugin-meta {
  @apply flex justify-between text-xs text-muted-foreground mb-3;
}

.plugin-actions-card {
  @apply flex gap-2;
}

.action-btn-small {
  @apply px-3 py-1 text-xs rounded transition-colors;
}

.action-btn-small.enabled {
  @apply bg-green-100 text-green-700 hover:bg-green-200;
}

.action-btn-small.disabled {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.action-btn-small.install {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}

.installed-plugins {
  @apply space-y-4;
}

.installed-plugin {
  @apply flex items-center justify-between p-4 border border-border rounded-lg;
}

.plugin-controls {
  @apply flex gap-2;
}

.control-btn {
  @apply px-3 py-1 text-sm rounded border border-border hover:bg-accent transition-colors;
}

.control-btn.danger {
  @apply border-red-300 text-red-600 hover:bg-red-50;
}

.develop-section {
  @apply flex justify-center items-center h-full;
}

.develop-card {
  @apply text-center space-y-4 max-w-md;
}

.develop-card h3 {
  @apply text-xl font-semibold;
}

.develop-btn {
  @apply px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors;
}
</style>