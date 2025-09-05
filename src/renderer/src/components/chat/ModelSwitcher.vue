<template>
  <div class="model-switcher relative">
    <!-- Current Model Button -->
    <button
      @click="toggleDropdown"
      :disabled="disabled"
      class="model-button flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/70 rounded-lg transition-all duration-200 border border-transparent hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
      :class="{
        'border-primary/30 bg-primary/5': isOpen,
        'border-green-500/30 bg-green-500/5': isConnected && !isOpen,
        'border-yellow-500/30 bg-yellow-500/5': isConfigured && !isConnected && !isOpen,
        'border-red-500/30 bg-red-500/5': !isConfigured && !isOpen
      }"
      aria-label="按钮"
    >
      <!-- Model Icon -->
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="text-lg flex-shrink-0">{{ currentModelIcon }}</span>
        <div class="flex flex-col items-start min-w-0">
          <span class="text-sm font-medium truncate">{{ currentModelName }}</span>
          <span class="text-xs text-muted-foreground">{{ currentModelProvider }}</span>
        </div>
      </div>

      <!-- Status Indicator -->
      <div class="flex items-center gap-1 flex-shrink-0">
        <div
          class="w-2 h-2 rounded-full transition-colors"
          :class="statusIndicatorClass"
          :title="statusTooltip"
        />
        <ChevronDown
          :size="16"
          class="transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
        />
      </div>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="dropdown-menu absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        @click.stop
      >
        <!-- Available Models -->
        <div class="p-2">
          <div class="text-xs font-medium text-muted-foreground mb-2 px-2">Available Models</div>

          <div
            v-for="model in availableModels"
            :key="model.id"
            @click="selectModel(model)"
            class="model-option flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-accent/50"
            :class="{
              'bg-primary/10 border border-primary/20': model.id === currentModelId,
              'opacity-50': model.status === 'disconnected'
            }"
          >
            <!-- Model Info -->
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <span class="text-lg">{{ model.icon }}</span>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium truncate">{{ model.name }}</span>
                  <Check
                    v-if="model.id === currentModelId"
                    :size="14"
                    class="text-primary flex-shrink-0"
                  />
                </div>
                <span class="text-xs text-muted-foreground">{{ model.provider }}</span>
              </div>
            </div>

            <!-- Status Indicator -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <div
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-green-500': model.status === 'connected',
                  'bg-yellow-500': model.status === 'configured',
                  'bg-red-500': model.status === 'disconnected'
                }"
              />
              <span
                class="text-xs font-medium"
                :class="{
                  'text-green-600': model.status === 'connected',
                  'text-yellow-600': model.status === 'configured',
                  'text-red-600': model.status === 'disconnected'
                }"
              >
                {{ getStatusText(model.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="border-t border-border p-2">
          <button
            @click="openSettings"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
            aria-label="按钮"
          >
            <Settings :size="16" />
            <span>Model Settings</span>
          </button>

          <button
            @click="testConnection"
            :disabled="!isConfigured || isTestingConnection"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            aria-label="按钮"
          >
            <Zap v-if="!isTestingConnection" :size="16" />
            <Loader2 v-else :size="16" class="animate-spin" />
            <span>{{ isTestingConnection ? 'Testing...' : 'Test Connection' }}</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Click Outside Handler -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="closeDropdown" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Check, Settings, Zap, Loader2 } from 'lucide-vue-next'
import { useSettingsStore } from '@renderer/src/stores/settings'
import { useRouter } from 'vue-router'

interface ModelOption {
  id: string
  name: string
  provider: string
  icon: string
  status: 'connected' | 'configured' | 'disconnected'
  description?: string
}

interface Props {
  disabled?: boolean
  showQuickActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showQuickActions: true
})

const emit = defineEmits<{
  'model-changed': [modelId: string]
  'settings-opened': []
}>()

// State
const settingsStore = useSettingsStore()
const router = useRouter()
const isOpen = ref(false)
const isTestingConnection = ref(false)
const availableModels = ref<ModelOption[]>([])

// Model configurations
const modelConfigs = {
  'openai-gpt4': {
    id: 'openai-gpt4',
    name: 'GPT-4',
    provider: 'OpenAI',
    icon: '🤖',
    models: ['gpt-4', 'gpt-4-turbo']
  },
  'openai-gpt35': {
    id: 'openai-gpt35',
    name: 'GPT-3.5',
    provider: 'OpenAI',
    icon: '🤖',
    models: ['gpt-3.5-turbo']
  },
  'anthropic-claude3': {
    id: 'anthropic-claude3',
    name: 'Claude 3',
    provider: 'Anthropic',
    icon: '🧠',
    models: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229']
  },
  'ollama-llama2': {
    id: 'ollama-llama2',
    name: 'Llama 2',
    provider: 'Ollama',
    icon: '🦙',
    models: ['llama2']
  },
  'ollama-mistral': {
    id: 'ollama-mistral',
    name: 'Mistral',
    provider: 'Ollama',
    icon: '🦙',
    models: ['mistral']
  }
}

// Computed properties
const currentModelId = computed(() => {
  const provider = settingsStore.llmProvider
  const model = settingsStore.modelName

  // Map current provider/model to our model options
  if (provider === 'openai') {
    return model.includes('gpt-4') ? 'openai-gpt4' : 'openai-gpt35'
  } else if (provider === 'anthropic') {
    return 'anthropic-claude3'
  } else if (provider === 'ollama') {
    return model === 'llama2' ? 'ollama-llama2' : 'ollama-mistral'
  }

  return 'openai-gpt4' // fallback
})

const currentModel = computed(() => {
  return availableModels.value.find(m => m.id === currentModelId.value) || availableModels.value[0]
})

const currentModelName = computed(() => currentModel.value?.name || 'Select Model')
const currentModelProvider = computed(() => currentModel.value?.provider || '')
const currentModelIcon = computed(() => currentModel.value?.icon || '🤖')

const isConfigured = computed(() => settingsStore.isConfigured)
const isConnected = computed(() => {
  // In a real implementation, this would check actual connection status
  return isConfigured.value && currentModel.value?.status === 'connected'
})

const statusIndicatorClass = computed(() => ({
  'bg-green-500': isConnected.value,
  'bg-yellow-500': isConfigured.value && !isConnected.value,
  'bg-red-500': !isConfigured.value
}))

const statusTooltip = computed(() => {
  if (isConnected.value) return 'Connected and ready'
  if (isConfigured.value) return 'Configured but not verified'
  return 'Not configured'
})

// Methods
const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    loadAvailableModels()
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

const loadAvailableModels = async () => {
  // In a real implementation, this would fetch from the backend
  const models: ModelOption[] = Object.values(modelConfigs).map(config => ({
    ...config,
    status: getModelStatus(config.id)
  }))

  availableModels.value = models
}

const getModelStatus = (modelId: string): 'connected' | 'configured' | 'disconnected' => {
  const config = modelConfigs[modelId as keyof typeof modelConfigs]

  if (
    config.provider === 'OpenAI' &&
    settingsStore.llmProvider === 'openai' &&
    settingsStore.apiKey
  ) {
    return 'connected' // Should verify actual connection
  } else if (
    config.provider === 'Anthropic' &&
    settingsStore.llmProvider === 'anthropic' &&
    settingsStore.apiKey
  ) {
    return 'connected'
  } else if (config.provider === 'Ollama' && settingsStore.llmProvider === 'ollama') {
    return 'configured' // Ollama doesn't need API key
  }

  return 'disconnected'
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'connected':
      return 'Ready'
    case 'configured':
      return 'Setup'
    case 'disconnected':
      return 'Config'
    default:
      return 'Unknown'
  }
}

const selectModel = async (model: ModelOption) => {
  if (model.id === currentModelId.value) {
    closeDropdown()
    return
  }

  try {
    const config = modelConfigs[model.id as keyof typeof modelConfigs]

    // Update settings based on selected model
    if (config.provider === 'OpenAI') {
      settingsStore.setLLMProvider('openai')
      settingsStore.setModelName(config.models[0])
    } else if (config.provider === 'Anthropic') {
      settingsStore.setLLMProvider('anthropic')
      settingsStore.setModelName(config.models[0])
    } else if (config.provider === 'Ollama') {
      settingsStore.setLLMProvider('ollama')
      settingsStore.setModelName(config.models[0])
    }

    // Apply configuration to backend
    const result = await window.api.llm.setProvider({
      provider: settingsStore.llmProvider,
      apiKey: settingsStore.apiKey || undefined,
      baseURL: settingsStore.apiEndpoint || undefined,
      model: settingsStore.modelName || undefined
    })

    if (result.success) {
      emit('model-changed', model.id)
      // Refresh model statuses
      await loadAvailableModels()
    } else {
      console.error('Failed to switch model:', result.error)
      // You might want to show a toast notification here
    }
  } catch (error) {
    console.error('Error switching model:', error)
  }

  closeDropdown()
}

const openSettings = () => {
  closeDropdown()
  emit('settings-opened')
  router.push('/settings')
}

const testConnection = async () => {
  isTestingConnection.value = true

  try {
    // Test with a simple message
    await window.api.llm.sendMessage('Hello', 'test', 'test-connection')
    // Update model status on success
    await loadAvailableModels()
  } catch (error) {
    console.error('Connection test failed:', error)
  } finally {
    isTestingConnection.value = false
  }
}

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  const element = event.target as Element
  if (!element.closest('.model-switcher')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadAvailableModels()
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
.model-switcher {
  user-select: none;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
  transform-origin: top;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.dropdown-menu {
  backdrop-filter: blur(12px);
  background: rgba(var(--background-rgb), 0.95);
  border: 1px solid rgba(var(--border-rgb), 0.5);
}

.model-option:hover {
  transform: translateY(-1px);
}

.model-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.15);
}

/* Custom scrollbar for dropdown */
.dropdown-menu::-webkit-scrollbar {
  width: 4px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: rgba(var(--muted-foreground-rgb), 0.3);
  border-radius: 2px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--muted-foreground-rgb), 0.5);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .model-button {
    min-width: 140px;
  }

  .dropdown-menu {
    left: -8px;
    right: -8px;
  }
}

/* Animation for status indicator */
.w-2.h-2.rounded-full {
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Focus states for accessibility */
.model-button:focus {
  outline: none;
  ring: 2px;
  ring-color: rgba(var(--primary-rgb), 0.3);
}

.model-option:focus {
  outline: none;
  background: rgba(var(--accent-rgb), 0.7);
}

/* Dark mode optimizations */
@media (prefers-color-scheme: dark) {
  .dropdown-menu {
    background: rgba(15, 23, 42, 0.95);
    border-color: rgba(51, 65, 85, 0.5);
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
</style>
