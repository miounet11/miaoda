<template>
  <div class="plugins-view">
    <!-- Tab Navigation -->
    <div class="plugins-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
      >
        <component :is="tab.icon" :size="18" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Plugin Market -->
      <div v-show="activeTab === 'market'" class="tab-pane">
        <PluginMarketStore />
      </div>

      <!-- Installed Plugins -->
      <div v-show="activeTab === 'installed'" class="tab-pane">
        <div class="installed-header">
          <h2>已安装的插件</h2>
          <p class="installed-description">管理您已安装的插件</p>
        </div>

        <div class="installed-content">
          <div v-if="installedPlugins.length === 0" class="empty-state">
            <Package :size="48" class="empty-icon" />
            <h3>暂无已安装插件</h3>
            <p>去插件市场发现有用的插件</p>
            <button @click="activeTab = 'market'" class="browse-btn">浏览插件市场</button>
          </div>

          <div v-else class="installed-list">
            <div v-for="plugin in installedPlugins" :key="plugin.id" class="installed-plugin-card">
              <div class="plugin-info">
                <div class="plugin-icon">
                  <img
                    v-if="plugin.manifest?.icon"
                    :src="plugin.manifest.icon"
                    :alt="plugin.manifest.name"
                  />
                  <Puzzle v-else :size="32" />
                </div>
                <div class="plugin-details">
                  <h3 class="plugin-name">{{ plugin.manifest.name }}</h3>
                  <p class="plugin-description">{{ plugin.manifest.description }}</p>
                  <div class="plugin-meta">
                    <span class="version">v{{ plugin.manifest.version }}</span>
                    <span class="author">{{ plugin.manifest.author }}</span>
                  </div>
                </div>
              </div>

              <div class="plugin-controls">
                <div class="status-toggle">
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      :checked="plugin.enabled"
                      @change="togglePlugin(plugin)"
                    />
                    <span class="toggle-slider" />
                  </label>
                  <span class="status-text">
                    {{ plugin.enabled ? '已启用' : '已禁用' }}
                  </span>
                </div>

                <div class="action-buttons">
                  <button @click="configurePlugin(plugin)" class="control-btn">
                    <Settings :size="16" />
                    设置
                  </button>
                  <button @click="uninstallPlugin(plugin)" class="control-btn danger">
                    <Trash2 :size="16" />
                    卸载
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Developer Tools -->
      <div v-show="activeTab === 'develop'" class="tab-pane">
        <div class="develop-header">
          <h2>插件开发</h2>
          <p class="develop-description">创建和测试您自己的插件</p>
        </div>

        <div class="develop-content">
          <div class="develop-grid">
            <!-- Create New Plugin -->
            <div class="develop-card">
              <div class="card-icon">
                <Plus :size="32" />
              </div>
              <h3>创建新插件</h3>
              <p>使用内置模板快速创建插件项目</p>
              <button @click="createNewPlugin" class="develop-btn">开始创建</button>
            </div>

            <!-- Import Plugin -->
            <div class="develop-card">
              <div class="card-icon">
                <Upload :size="32" />
              </div>
              <h3>导入插件</h3>
              <p>从本地文件或 GitHub 导入现有插件</p>
              <button @click="importPlugin" class="develop-btn secondary">导入插件</button>
            </div>

            <!-- Developer Docs -->
            <div class="develop-card">
              <div class="card-icon">
                <FileText :size="32" />
              </div>
              <h3>开发文档</h3>
              <p>学习插件 API 和最佳实践</p>
              <button @click="openDocs" class="develop-btn secondary">查看文档</button>
            </div>
          </div>

          <!-- Development Projects -->
          <div v-if="devProjects.length > 0" class="dev-projects">
            <h3>开发中的项目</h3>
            <div class="projects-list">
              <div v-for="project in devProjects" :key="project.id" class="project-card">
                <div class="project-info">
                  <h4>{{ project.name }}</h4>
                  <p>{{ project.description }}</p>
                  <span class="project-status" :class="project.status">
                    {{ getStatusLabel(project.status) }}
                  </span>
                </div>
                <div class="project-actions">
                  <button @click="openProject(project)" class="action-btn">
                    <Code :size="16" />
                    编辑
                  </button>
                  <button @click="testProject(project)" class="action-btn">
                    <Play :size="16" />
                    测试
                  </button>
                  <button @click="buildProject(project)" class="action-btn primary">
                    <Package :size="16" />
                    构建
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Store,
  Package,
  Code,
  Puzzle,
  Settings,
  Trash2,
  Plus,
  Upload,
  FileText,
  Play
} from 'lucide-vue-next'

import PluginMarketStore from '../components/plugin/PluginMarketStore.vue'
import type { Plugin } from '../types/plugins'

interface DevProject {
  id: string
  name: string
  description: string
  status: 'draft' | 'development' | 'testing' | 'ready'
  path: string
  lastModified: string
}

// State
const activeTab = ref('market')
const installedPlugins = ref<Plugin[]>([])
const devProjects = ref<DevProject[]>([])

// Tab configuration
const tabs = [
  { id: 'market', label: '插件市场', icon: Store },
  { id: 'installed', label: '已安装', icon: Package },
  { id: 'develop', label: '开发工具', icon: Code }
]

// Methods
const togglePlugin = async (plugin: Plugin) => {
  try {
    if (plugin.enabled) {
      await window.electronAPI.deactivatePlugin(plugin.manifest.id)
    } else {
      await window.electronAPI.activatePlugin(plugin.manifest.id)
    }
    plugin.enabled = !plugin.enabled
  } catch (error) {
    console.error('Failed to toggle plugin:', error)
  }
}

const configurePlugin = (plugin: Plugin) => {
  // Open plugin configuration dialog
  console.log('Configure plugin:', plugin.manifest.name)
}

const uninstallPlugin = async (plugin: Plugin) => {
  try {
    await window.electronAPI.uninstallPlugin(plugin.manifest.id)
    const index = installedPlugins.value.findIndex(p => p.manifest.id === plugin.manifest.id)
    if (index > -1) {
      installedPlugins.value.splice(index, 1)
    }
  } catch (error) {
    console.error('Failed to uninstall plugin:', error)
  }
}

const createNewPlugin = () => {
  // Open plugin creation wizard
  console.log('Create new plugin')
}

const importPlugin = () => {
  // Open plugin import dialog
  console.log('Import plugin')
}

const openDocs = () => {
  // Open documentation
  window.open('https://docs.miaodachat.com/plugins', '_blank')
}

const openProject = (project: DevProject) => {
  // Open project in editor
  console.log('Open project:', project.name)
}

const testProject = (project: DevProject) => {
  // Test project
  console.log('Test project:', project.name)
}

const buildProject = (project: DevProject) => {
  // Build project
  console.log('Build project:', project.name)
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: '草稿',
    development: '开发中',
    testing: '测试中',
    ready: '准备就绪'
  }
  return labels[status] || status
}

const loadInstalledPlugins = async () => {
  try {
    const plugins = await window.electronAPI.getPlugins()
    installedPlugins.value = plugins.filter(plugin => plugin.enabled)
  } catch (error) {
    console.error('Failed to load installed plugins:', error)
  }
}

const loadDevProjects = async () => {
  // Mock dev projects - in real implementation, this would load from filesystem
  devProjects.value = [
    {
      id: 'my-theme-plugin',
      name: 'My Theme Plugin',
      description: '自定义主题插件项目',
      status: 'development',
      path: '/path/to/plugin',
      lastModified: '2024-01-15'
    }
  ]
}

onMounted(() => {
  loadInstalledPlugins()
  loadDevProjects()
})
</script>

<style scoped>
.plugins-view {
  @apply flex flex-col h-full bg-background;
}

/* Tab Navigation */
.plugins-tabs {
  @apply flex border-b border-border bg-card;
}

.tab-btn {
  @apply inline-flex items-center gap-2 px-6 py-4 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-muted transition-all;
}

.tab-btn.active {
  @apply text-primary border-primary bg-background;
}

/* Tab Content */
.tab-content {
  @apply flex-1 overflow-hidden;
}

.tab-pane {
  @apply h-full overflow-auto;
}

/* Installed Plugins Tab */
.installed-header {
  @apply p-6 border-b border-border;
}

.installed-header h2 {
  @apply text-2xl font-bold mb-2;
}

.installed-description {
  @apply text-muted-foreground;
}

.installed-content {
  @apply p-6;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-icon {
  @apply text-muted-foreground mb-4;
}

.empty-state h3 {
  @apply text-lg font-semibold mb-2;
}

.empty-state p {
  @apply text-muted-foreground mb-6;
}

.browse-btn {
  @apply px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors;
}

.installed-list {
  @apply space-y-4;
}

.installed-plugin-card {
  @apply flex items-center justify-between p-6 bg-card border border-border rounded-lg hover:shadow-md transition-all;
}

.plugin-info {
  @apply flex items-center gap-4 flex-1;
}

.plugin-icon {
  @apply w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden;
}

.plugin-icon img {
  @apply w-full h-full object-cover;
}

.plugin-details {
  @apply flex-1 min-w-0;
}

.plugin-name {
  @apply font-semibold mb-1;
}

.plugin-description {
  @apply text-sm text-muted-foreground mb-2;
}

.plugin-meta {
  @apply flex items-center gap-2 text-xs text-muted-foreground;
}

.plugin-controls {
  @apply flex items-center gap-6;
}

.status-toggle {
  @apply flex items-center gap-3;
}

.toggle-switch {
  @apply relative inline-block w-10 h-6;
}

.toggle-switch input {
  @apply opacity-0 w-0 h-0;
}

.toggle-slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-muted rounded-full transition-all;
}

.toggle-slider:before {
  @apply absolute content-[""] h-4 w-4 left-1 bottom-1 bg-background rounded-full transition-all;
}

input:checked + .toggle-slider {
  @apply bg-primary;
}

input:checked + .toggle-slider:before {
  @apply transform translate-x-4;
}

.status-text {
  @apply text-sm;
}

.action-buttons {
  @apply flex gap-2;
}

.control-btn {
  @apply inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors;
}

.control-btn.danger {
  @apply border-destructive/30 text-destructive hover:bg-destructive/10;
}

/* Developer Tools Tab */
.develop-header {
  @apply p-6 border-b border-border;
}

.develop-header h2 {
  @apply text-2xl font-bold mb-2;
}

.develop-description {
  @apply text-muted-foreground;
}

.develop-content {
  @apply p-6 space-y-8;
}

.develop-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.develop-card {
  @apply p-6 bg-card border border-border rounded-lg text-center hover:shadow-md transition-all;
}

.card-icon {
  @apply w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary;
}

.develop-card h3 {
  @apply text-lg font-semibold mb-2;
}

.develop-card p {
  @apply text-sm text-muted-foreground mb-4;
}

.develop-btn {
  @apply px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors;
}

.develop-btn.secondary {
  @apply bg-background border border-border text-foreground hover:bg-accent;
}

/* Development Projects */
.dev-projects h3 {
  @apply text-lg font-semibold mb-4;
}

.projects-list {
  @apply space-y-4;
}

.project-card {
  @apply flex items-center justify-between p-4 bg-card border border-border rounded-lg;
}

.project-info {
  @apply flex-1 min-w-0;
}

.project-info h4 {
  @apply font-semibold mb-1;
}

.project-info p {
  @apply text-sm text-muted-foreground mb-2;
}

.project-status {
  @apply inline-block px-2 py-1 text-xs rounded-full;
}

.project-status.draft {
  @apply bg-gray-100 text-gray-700;
}

.project-status.development {
  @apply bg-blue-100 text-blue-700;
}

.project-status.testing {
  @apply bg-yellow-100 text-yellow-700;
}

.project-status.ready {
  @apply bg-green-100 text-green-700;
}

.project-actions {
  @apply flex gap-2;
}

.action-btn {
  @apply inline-flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors;
}

.action-btn.primary {
  @apply bg-primary text-primary-foreground border-primary hover:bg-primary/90;
}

/* Dark mode adjustments */
.dark .project-status.draft {
  @apply bg-gray-800 text-gray-300;
}

.dark .project-status.development {
  @apply bg-blue-900/50 text-blue-400;
}

.dark .project-status.testing {
  @apply bg-yellow-900/50 text-yellow-400;
}

.dark .project-status.ready {
  @apply bg-green-900/50 text-green-400;
}
</style>
