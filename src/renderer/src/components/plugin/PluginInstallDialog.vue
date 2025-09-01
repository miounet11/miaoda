<template>
  <div class="install-dialog-overlay" @click.self="$emit('close')">
    <div class="install-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <h2 class="dialog-title">{{ $t('plugin.installPlugin') }}</h2>
        <button @click="$emit('close')" class="close-btn" aria-label="按钮">
          <X :size="20" />
        </button>
      </div>

      <!-- Install Methods -->
      <div class="dialog-content">
        <div class="install-methods">
          <!-- From URL -->
          <div class="install-method" :class="{ active: installMethod === 'url' }">
            <button @click="installMethod = 'url'" class="method-header" aria-label="按钮">
              <Globe :size="20" />
              <div class="method-info">
                <h3>{{ $t('plugin.installFromUrl') }}</h3>
                <p>{{ $t('plugin.installFromUrlDescription') }}</p>
              </div>
            </button>

            <div v-if="installMethod === 'url'" class="method-content">
              <div class="input-group">
                <label class="input-label">{{ $t('plugin.pluginUrl') }}</label>
                <input id="input-kc8izbt5f"
                  v-model="pluginUrl"
                  type="url"
                  :placeholder="$t('plugin.pluginUrlPlaceholder')"
                  class="text-input"
                  @keydown.enter="installFromUrl"
                 aria-label="输入框">
              </div>

              <div class="method-actions">
                <button
                  @click="installFromUrl"
                  :disabled="!pluginUrl || isInstalling"
                  class="install-btn"
                 aria-label="按钮">
                  <Download :size="16" :class="{ 'animate-spin': isInstalling }" />
                  {{ isInstalling ? $t('plugin.installing') : $t('plugin.install') }}
                </button>
              </div>
            </div>
          </div>

          <!-- From File -->
          <div class="install-method" :class="{ active: installMethod === 'file' }">
            <button @click="installMethod = 'file'" class="method-header" aria-label="按钮">
              <FileUp :size="20" />
              <div class="method-info">
                <h3>{{ $t('plugin.installFromFile') }}</h3>
                <p>{{ $t('plugin.installFromFileDescription') }}</p>
              </div>
            </button>

            <div v-if="installMethod === 'file'" class="method-content">
              <div class="file-drop-zone" :class="{ 'drag-over': isDragOver }">
                <input id="input-7uctq8s7m"
                  ref="fileInputRef"
                  type="file"
                  accept=".zip,.tar.gz,.plugin"
                  @change="handleFileSelect"
                  class="file-input"
                 aria-label="输入框">

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

                  <button @click="$refs.fileInputRef?.click()" class="select-file-btn" aria-label="按钮">
                    {{ $t('plugin.selectFile') }}
                  </button>
                </div>
              </div>

              <div v-if="selectedFile" class="method-actions">
                <button @click="installFromFile" :disabled="isInstalling" class="install-btn" aria-label="按钮">
                  <FileUp :size="16" :class="{ 'animate-spin': isInstalling }" />
                  {{ isInstalling ? $t('plugin.installing') : $t('plugin.install') }}
                </button>
              </div>
            </div>
          </div>

          <!-- From Registry -->
          <div class="install-method" :class="{ active: installMethod === 'registry' }">
            <button @click="installMethod = 'registry'" class="method-header" aria-label="按钮">
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
                  <input id="input-76kla09l7"
                    v-model="registryQuery"
                    type="text"
                    :placeholder="$t('plugin.searchRegistry')"
                    class="search-input"
                    @input="searchRegistry"
                   aria-label="输入框">
                </div>

                <div class="category-filters">
                  <button
                    v-for="category in categories"
                    :key="category.key"
                    @click="selectedCategory = category.key"
                    class="category-btn"
                    :class="{ active: selectedCategory === category.key }"
                   aria-label="按钮">
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
                       aria-label="按钮">
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
        <button @click="installError = null" class="error-dismiss" aria-label="按钮">
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
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
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
  background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
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
