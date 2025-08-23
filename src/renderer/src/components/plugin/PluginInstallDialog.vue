<template>
  <div class="install-dialog-overlay" @click.self="$emit('close')">
    <div class="install-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <h2 class="dialog-title">{{ $t('plugin.installPlugin') }}</h2>
        <button @click="$emit('close')" class="close-btn">
          <X :size="20" />
        </button>
      </div>

      <!-- Install Methods -->
      <div class="dialog-content">
        <div class="install-methods">
          <!-- From URL -->
          <div class="install-method" :class="{ active: installMethod === 'url' }">
            <button @click="installMethod = 'url'" class="method-header">
              <Globe :size="20" />
              <div class="method-info">
                <h3>{{ $t('plugin.installFromUrl') }}</h3>
                <p>{{ $t('plugin.installFromUrlDescription') }}</p>
              </div>
            </button>

            <div v-if="installMethod === 'url'" class="method-content">
              <div class="input-group">
                <label class="input-label">{{ $t('plugin.pluginUrl') }}</label>
                <input
                  v-model="pluginUrl"
                  type="url"
                  :placeholder="$t('plugin.pluginUrlPlaceholder')"
                  class="text-input"
                  @keydown.enter="installFromUrl"
                />
              </div>

              <div class="method-actions">
                <button
                  @click="installFromUrl"
                  :disabled="!pluginUrl || isInstalling"
                  class="install-btn"
                >
                  <Download :size="16" :class="{ 'animate-spin': isInstalling }" />
                  {{ isInstalling ? $t('plugin.installing') : $t('plugin.install') }}
                </button>
              </div>
            </div>
          </div>

          <!-- From File -->
          <div class="install-method" :class="{ active: installMethod === 'file' }">
            <button @click="installMethod = 'file'" class="method-header">
              <FileUp :size="20" />
              <div class="method-info">
                <h3>{{ $t('plugin.installFromFile') }}</h3>
                <p>{{ $t('plugin.installFromFileDescription') }}</p>
              </div>
            </button>

            <div v-if="installMethod === 'file'" class="method-content">
              <div class="file-drop-zone" :class="{ 'drag-over': isDragOver }">
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".zip,.tar.gz,.plugin"
                  @change="handleFileSelect"
                  class="file-input"
                />

                <div
                  @drop="handleDrop"
                  @dragover.prevent="isDragOver = true"
                  @dragleave="isDragOver = false"
                  class="drop-area"
                >
                  <Upload :size="32" class="drop-icon" />
                  <p class="drop-text">
                    {{ selectedFile ? selectedFile.name : $t('plugin.dropFileHere') }}
                  </p>
                  <p class="drop-hint">
                    {{ $t('plugin.orClickToSelect') }}
                  </p>

                  <button @click="$refs.fileInputRef?.click()" class="select-file-btn">
                    {{ $t('plugin.selectFile') }}
                  </button>
                </div>
              </div>

              <div v-if="selectedFile" class="method-actions">
                <button @click="installFromFile" :disabled="isInstalling" class="install-btn">
                  <FileUp :size="16" :class="{ 'animate-spin': isInstalling }" />
                  {{ isInstalling ? $t('plugin.installing') : $t('plugin.install') }}
                </button>
              </div>
            </div>
          </div>

          <!-- From Registry -->
          <div class="install-method" :class="{ active: installMethod === 'registry' }">
            <button @click="installMethod = 'registry'" class="method-header">
              <Package :size="20" />
              <div class="method-info">
                <h3>{{ $t('plugin.browseRegistry') }}</h3>
                <p>{{ $t('plugin.browseRegistryDescription') }}</p>
              </div>
            </button>

            <div v-if="installMethod === 'registry'" class="method-content">
              <div class="registry-search">
                <div class="search-container">
                  <Search :size="18" class="search-icon" />
                  <input
                    v-model="registryQuery"
                    type="text"
                    :placeholder="$t('plugin.searchRegistry')"
                    class="search-input"
                    @input="searchRegistry"
                  />
                </div>

                <div class="category-filters">
                  <button
                    v-for="category in categories"
                    :key="category.key"
                    @click="selectedCategory = category.key"
                    class="category-btn"
                    :class="{ active: selectedCategory === category.key }"
                  >
                    <component :is="category.icon" :size="16" />
                    {{ category.label }}
                  </button>
                </div>
              </div>

              <div class="registry-results">
                <div v-if="isSearching" class="search-loading">
                  <Loader :size="24" class="animate-spin" />
                  <p>{{ $t('plugin.searchingRegistry') }}</p>
                </div>

                <div v-else-if="registryPlugins.length === 0" class="no-results">
                  <Package :size="32" class="no-results-icon" />
                  <p>{{ $t('plugin.noPluginsFound') }}</p>
                </div>

                <div v-else class="plugin-results">
                  <div
                    v-for="plugin in registryPlugins"
                    :key="plugin.id"
                    class="registry-plugin"
                    @click="selectRegistryPlugin(plugin)"
                  >
                    <div class="plugin-icon">
                      <img
                        v-if="plugin.icon"
                        :src="plugin.icon"
                        :alt="plugin.name"
                        class="icon-image"
                      />
                      <Puzzle v-else :size="24" />
                    </div>

                    <div class="plugin-details">
                      <h4 class="plugin-name">{{ plugin.name }}</h4>
                      <p class="plugin-description">{{ plugin.description }}</p>
                      <div class="plugin-meta">
                        <span class="plugin-version">v{{ plugin.version }}</span>
                        <span class="plugin-author">{{ plugin.author }}</span>
                        <span class="plugin-downloads">{{
                          formatDownloads(plugin.downloads)
                        }}</span>
                      </div>
                    </div>

                    <div class="plugin-actions">
                      <button
                        @click.stop="installRegistryPlugin(plugin)"
                        :disabled="isInstalling"
                        class="install-btn small"
                      >
                        <Download :size="14" />
                        {{ $t('plugin.install') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Install Progress -->
      <div v-if="installProgress" class="install-progress">
        <div class="progress-header">
          <h3>{{ installProgress.title }}</h3>
          <span class="progress-percent">{{ Math.round(installProgress.progress * 100) }}%</span>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${installProgress.progress * 100}%` }" />
        </div>

        <p class="progress-description">{{ installProgress.description }}</p>
      </div>

      <!-- Error Display -->
      <div v-if="installError" class="install-error">
        <AlertTriangle :size="20" />
        <div class="error-content">
          <h3>{{ $t('plugin.installationFailed') }}</h3>
          <p>{{ installError }}</p>
        </div>
        <button @click="installError = null" class="error-dismiss">
          <X :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  X,
  Globe,
  FileUp,
  Package,
  Download,
  Upload,
  Search,
  Loader,
  AlertTriangle,
  Puzzle,
  Code,
  Gamepad2,
  Wrench,
  BookOpen,
  Users,
  Palette,
  Zap
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

// Props
interface Props {
  visible: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  install: [data: any]
}>()

// Types
interface RegistryPlugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  downloads: number
  category: string
  url: string
}

interface InstallProgress {
  title: string
  description: string
  progress: number
}

// Composables
const { t } = useI18n()

// State
const installMethod = ref<'url' | 'file' | 'registry'>('registry')
const pluginUrl = ref('')
const selectedFile = ref<File | null>(null)
const registryQuery = ref('')
const selectedCategory = ref('all')
const isInstalling = ref(false)
const isSearching = ref(false)
const isDragOver = ref(false)
const installProgress = ref<InstallProgress | null>(null)
const installError = ref<string | null>(null)
const registryPlugins = ref<RegistryPlugin[]>([])

// Refs
const fileInputRef = ref<HTMLInputElement>()

// Computed
const categories = computed(() => [
  {
    key: 'all',
    label: t('plugin.allCategories'),
    icon: Package
  },
  {
    key: 'productivity',
    label: t('plugin.category.productivity'),
    icon: Wrench
  },
  {
    key: 'entertainment',
    label: t('plugin.category.entertainment'),
    icon: Gamepad2
  },
  {
    key: 'utility',
    label: t('plugin.category.utility'),
    icon: Zap
  },
  {
    key: 'development',
    label: t('plugin.category.development'),
    icon: Code
  }
])

// Methods
const installFromUrl = async () => {
  if (!pluginUrl.value) return

  try {
    isInstalling.value = true
    installError.value = null

    installProgress.value = {
      title: t('plugin.downloadingPlugin'),
      description: t('plugin.fetchingFromUrl'),
      progress: 0.1
    }

    // Simulate download progress
    const progressInterval = setInterval(() => {
      if (installProgress.value && installProgress.value.progress < 0.9) {
        installProgress.value.progress += 0.1
      }
    }, 200)

    // TODO: Implement actual plugin download and installation
    await new Promise(resolve => setTimeout(resolve, 2000))

    clearInterval(progressInterval)
    installProgress.value = {
      title: t('plugin.installingPlugin'),
      description: t('plugin.finalizing'),
      progress: 1.0
    }

    emit('install', { type: 'url', data: pluginUrl.value })
  } catch (error) {
    installError.value = error instanceof Error ? error.message : t('plugin.unknownError')
  } finally {
    isInstalling.value = false
    installProgress.value = null
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFile.value = file
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  const file = event.dataTransfer?.files[0]
  if (file) {
    selectedFile.value = file
  }
}

const installFromFile = async () => {
  if (!selectedFile.value) return

  try {
    isInstalling.value = true
    installError.value = null

    installProgress.value = {
      title: t('plugin.processingFile'),
      description: t('plugin.extractingPlugin'),
      progress: 0.2
    }

    // Simulate file processing
    const progressInterval = setInterval(() => {
      if (installProgress.value && installProgress.value.progress < 0.9) {
        installProgress.value.progress += 0.15
      }
    }, 300)

    // TODO: Implement actual file processing and installation
    await new Promise(resolve => setTimeout(resolve, 2000))

    clearInterval(progressInterval)
    installProgress.value = {
      title: t('plugin.installingPlugin'),
      description: t('plugin.finalizing'),
      progress: 1.0
    }

    emit('install', { type: 'file', data: selectedFile.value })
  } catch (error) {
    installError.value = error instanceof Error ? error.message : t('plugin.unknownError')
  } finally {
    isInstalling.value = false
    installProgress.value = null
  }
}

const searchRegistry = async () => {
  if (!registryQuery.value && selectedCategory.value === 'all') {
    registryPlugins.value = []
    return
  }

  try {
    isSearching.value = true

    // TODO: Implement actual registry search
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock registry results
    registryPlugins.value = [
      {
        id: 'sample-plugin-1',
        name: 'Code Highlighter',
        version: '1.2.0',
        description: 'Syntax highlighting for code blocks in chat messages',
        author: 'Developer Name',
        downloads: 15420,
        category: 'development',
        url: 'https://example.com/plugin1'
      },
      {
        id: 'sample-plugin-2',
        name: 'Message Translator',
        version: '2.1.5',
        description: 'Real-time message translation between languages',
        author: 'Translation Team',
        downloads: 8930,
        category: 'utility',
        url: 'https://example.com/plugin2'
      }
    ].filter(plugin => {
      const matchesQuery =
        !registryQuery.value ||
        plugin.name.toLowerCase().includes(registryQuery.value.toLowerCase()) ||
        plugin.description.toLowerCase().includes(registryQuery.value.toLowerCase())

      const matchesCategory =
        selectedCategory.value === 'all' || plugin.category === selectedCategory.value

      return matchesQuery && matchesCategory
    })
  } catch (error) {
    console.error('Registry search failed:', error)
    registryPlugins.value = []
  } finally {
    isSearching.value = false
  }
}

const selectRegistryPlugin = (plugin: RegistryPlugin) => {
  // TODO: Show plugin details modal
  console.log('Selected plugin:', plugin)
}

const installRegistryPlugin = async (plugin: RegistryPlugin) => {
  try {
    isInstalling.value = true
    installError.value = null

    installProgress.value = {
      title: t('plugin.downloadingPlugin'),
      description: plugin.name,
      progress: 0.1
    }

    // Simulate installation progress
    const progressInterval = setInterval(() => {
      if (installProgress.value && installProgress.value.progress < 0.9) {
        installProgress.value.progress += 0.1
      }
    }, 200)

    // TODO: Implement actual plugin installation from registry
    await new Promise(resolve => setTimeout(resolve, 2000))

    clearInterval(progressInterval)
    installProgress.value = {
      title: t('plugin.installingPlugin'),
      description: t('plugin.finalizing'),
      progress: 1.0
    }

    emit('install', { type: 'registry', data: plugin })
  } catch (error) {
    installError.value = error instanceof Error ? error.message : t('plugin.unknownError')
  } finally {
    isInstalling.value = false
    installProgress.value = null
  }
}

const formatDownloads = (downloads: number): string => {
  if (downloads >= 1000000) {
    return `${(downloads / 1000000).toFixed(1)}M`
  } else if (downloads >= 1000) {
    return `${(downloads / 1000).toFixed(1)}K`
  }
  return downloads.toString()
}

// Lifecycle
onMounted(() => {
  // Load initial registry content
  searchRegistry()
})
</script>

<style scoped>
.install-dialog-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4;
}

.install-dialog {
  @apply bg-background border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col;
}

.dialog-header {
  @apply flex items-center justify-between p-6 border-b border-border;
}

.dialog-title {
  @apply text-xl font-semibold;
}

.close-btn {
  @apply p-2 rounded-md hover:bg-accent transition-colors;
}

.dialog-content {
  @apply flex-1 overflow-y-auto p-6;
}

.install-methods {
  @apply space-y-4;
}

.install-method {
  @apply border border-border rounded-lg overflow-hidden;
}

.install-method.active {
  @apply border-primary;
}

.method-header {
  @apply w-full flex items-start gap-4 p-4 text-left hover:bg-accent transition-colors;
}

.method-info h3 {
  @apply font-medium mb-1;
}

.method-info p {
  @apply text-sm text-muted-foreground;
}

.method-content {
  @apply p-4 border-t border-border bg-muted/30;
}

.input-group {
  @apply space-y-2 mb-4;
}

.input-label {
  @apply block text-sm font-medium;
}

.text-input {
  @apply w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent;
}

.method-actions {
  @apply flex justify-end;
}

.install-btn {
  @apply flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50;
}

.install-btn.small {
  @apply px-3 py-1.5 text-sm;
}

.file-drop-zone {
  @apply border-2 border-dashed border-border rounded-lg p-6 transition-colors;
}

.file-drop-zone.drag-over {
  @apply border-primary bg-primary/5;
}

.file-input {
  @apply hidden;
}

.drop-area {
  @apply text-center;
}

.drop-icon {
  @apply mx-auto mb-3 text-muted-foreground;
}

.drop-text {
  @apply text-base font-medium mb-2;
}

.drop-hint {
  @apply text-sm text-muted-foreground mb-4;
}

.select-file-btn {
  @apply px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors;
}

.registry-search {
  @apply space-y-4 mb-6;
}

.search-container {
  @apply relative;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground;
}

.search-input {
  @apply w-full pl-10 pr-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent;
}

.category-filters {
  @apply flex flex-wrap gap-2;
}

.category-btn {
  @apply flex items-center gap-2 px-3 py-2 border border-border rounded-full text-sm hover:bg-accent transition-colors;
}

.category-btn.active {
  @apply bg-primary text-primary-foreground border-primary;
}

.registry-results {
  @apply min-h-64;
}

.search-loading,
.no-results {
  @apply flex flex-col items-center justify-center h-32 text-center;
}

.no-results-icon {
  @apply text-muted-foreground mb-2;
}

.plugin-results {
  @apply space-y-3;
}

.registry-plugin {
  @apply flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors;
}

.plugin-icon .icon-image {
  @apply w-8 h-8 rounded object-cover;
}

.plugin-details {
  @apply flex-1 min-w-0;
}

.plugin-name {
  @apply font-medium mb-1;
}

.plugin-description {
  @apply text-sm text-muted-foreground mb-2 line-clamp-2;
}

.plugin-meta {
  @apply flex items-center gap-3 text-xs text-muted-foreground;
}

.plugin-actions {
  @apply flex items-center;
}

.install-progress {
  @apply p-4 border-t border-border bg-muted/30;
}

.progress-header {
  @apply flex items-center justify-between mb-2;
}

.progress-header h3 {
  @apply font-medium;
}

.progress-percent {
  @apply text-sm font-mono text-muted-foreground;
}

.progress-bar {
  @apply w-full h-2 bg-muted rounded-full overflow-hidden mb-2;
}

.progress-fill {
  @apply h-full bg-primary transition-all duration-300;
}

.progress-description {
  @apply text-sm text-muted-foreground;
}

.install-error {
  @apply flex items-start gap-3 p-4 border-t border-border bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300;
}

.error-content {
  @apply flex-1;
}

.error-content h3 {
  @apply font-medium mb-1;
}

.error-dismiss {
  @apply p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors;
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

/* Responsive */
@media (max-width: 768px) {
  .install-dialog {
    @apply max-w-full mx-2;
  }

  .method-header {
    @apply flex-col gap-2;
  }

  .category-filters {
    @apply flex-col;
  }

  .registry-plugin {
    @apply flex-col gap-3;
  }

  .plugin-actions {
    @apply self-end;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .install-dialog {
    @apply border-2;
  }

  .install-method.active {
    @apply ring-2 ring-primary;
  }
}
</style>
