<template>
  <div class="provider-model-selector relative">
    <!-- Current Provider/Model Button -->
    <button
      ref="buttonRef"
      @click="toggleDropdown"
      :disabled="disabled"
      class="selector-button group flex items-center gap-2 px-3 py-2 bg-background hover:bg-muted/70 rounded-xl transition-all duration-200 border border-muted-foreground/20 hover:border-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] max-w-[200px]"
      :class="{
        'border-primary/40 bg-primary/10 shadow-md': isOpen,
        'border-green-500/40 bg-green-500/10': isConnected && !isOpen,
        'border-yellow-500/40 bg-yellow-500/10': isConfigured && !isConnected && !isOpen,
        'border-red-500/40 bg-red-500/10': !isConfigured && !isOpen
      }"
      :title="getButtonTooltip()"
     aria-label="按钮">
      <!-- Provider Icon and Info -->
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="text-base flex-shrink-0 group-hover:scale-110 transition-transform">{{
          currentProviderIcon
        }}</span>
        <div class="flex flex-col items-start min-w-0">
          <span class="text-sm font-medium text-foreground truncate leading-tight">{{
            currentProviderName
          }}</span>
          <span class="text-xs text-muted-foreground truncate leading-tight">{{
            currentModelName
          }}</span>
        </div>
      </div>

      <!-- Status and Chevron -->
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <div
          class="w-1.5 h-1.5 rounded-full transition-all duration-300"
          :class="statusIndicatorClass"
        />
        <ChevronDown
          :size="14"
          class="transition-transform duration-200 text-muted-foreground group-hover:text-foreground"
          :class="{ 'rotate-180': isOpen }"
        />
      </div>
    </button>

    <!-- Dropdown Menu - Using Portal to avoid z-index conflicts -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div v-if="isOpen" class="fixed inset-0 z-[10000]" @click="closeDropdown">
          <div
            ref="dropdownRef"
            class="dropdown-menu absolute bg-background border border-border rounded-xl shadow-xl overflow-hidden w-80"
            :style="dropdownStyle"
            @click.stop
          >
            <!-- Header -->
            <div class="p-3 border-b border-muted-foreground/10 bg-muted/10">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  LLM Provider & Model
                </h3>
                <button
                  @click="closeDropdown"
                  class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                 aria-label="按钮">
                  <X :size="14" class="text-muted-foreground" />
                </button>
              </div>
            </div>

            <!-- Provider Selection -->
            <div class="p-3">
              <!-- Built-in Providers -->
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">
                Built-in Providers
              </div>
              <div class="space-y-1 mb-3">
                <div
                  v-for="provider in availableProviders.filter(p => !p.isCustom)"
                  :key="provider.id"
                  @click="selectProvider(provider)"
                  class="provider-option flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-muted/30 group"
                  :class="{
                    'bg-primary/15 border border-primary/30': provider.id === currentProviderId,
                    'opacity-60': !provider.isHealthy && provider.id !== currentProviderId
                  }"
                >
                  <!-- Provider Icon -->
                  <span class="text-lg group-hover:scale-110 transition-transform">{{
                    provider.icon
                  }}</span>

                  <!-- Provider Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium truncate">{{ provider.displayName }}</span>
                      <Check
                        v-if="provider.id === currentProviderId"
                        :size="12"
                        class="text-primary flex-shrink-0"
                      />
                    </div>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-xs text-muted-foreground">{{ provider.description }}</span>
                      <div
                        v-if="provider.isCustom"
                        class="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 text-xs rounded-md border border-blue-500/20"
                      >
                        Custom
                      </div>
                    </div>
                  </div>

                  <!-- Status Indicator -->
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <div class="w-2 h-2 rounded-full" :class="getProviderStatusClass(provider)" />
                  </div>
                </div>
              </div>

              <!-- Custom Providers -->
              <div v-if="availableProviders.some(p => p.isCustom)">
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1 mt-3">
                  Custom Providers
                </div>
                <div class="space-y-1">
                  <div
                    v-for="provider in availableProviders.filter(p => p.isCustom)"
                    :key="provider.id"
                    @click="selectProvider(provider)"
                    class="provider-option flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700 group"
                    :class="{
                      'bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600':
                        provider.id === currentProviderId,
                      'border border-transparent': provider.id !== currentProviderId,
                      'opacity-60': !provider.isHealthy && provider.id !== currentProviderId
                    }"
                  >
                    <!-- Provider Icon -->
                    <span class="text-lg group-hover:scale-110 transition-transform">{{
                      provider.icon
                    }}</span>

                    <!-- Provider Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span
                          class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                          >{{ provider.displayName }}</span
                        >
                        <Check
                          v-if="provider.id === currentProviderId"
                          :size="12"
                          class="text-primary flex-shrink-0"
                        />
                      </div>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{
                          provider.description
                        }}</span>
                        <div
                          class="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded-md border border-blue-500/20"
                        >
                          Custom
                        </div>
                      </div>
                    </div>

                    <!-- Status Indicator -->
                    <div class="flex items-center gap-1 flex-shrink-0">
                      <div class="w-2 h-2 rounded-full" :class="getProviderStatusClass(provider)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Model Selection (if provider has multiple models) -->
            <div v-if="availableModels.length > 1" class="border-t border-muted-foreground/10 p-3">
              <div class="text-xs font-medium text-muted-foreground mb-2 px-1">
                Available Models
              </div>
              <div class="space-y-1 max-h-32 overflow-y-auto">
                <div
                  v-for="model in availableModels"
                  :key="model.id"
                  @click="selectModel(model)"
                  class="model-option flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-muted/30"
                  :class="{
                    'bg-primary/15 border border-primary/30': model.id === currentModelId
                  }"
                >
                  <span class="text-sm font-medium flex-1">{{ model.name }}</span>
                  <Check v-if="model.id === currentModelId" :size="12" class="text-primary" />
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="border-t border-muted-foreground/10 p-2 bg-muted/5">
              <div class="flex items-center gap-1">
                <button
                  @click="openSettings"
                  class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
                 aria-label="按钮">
                  <Settings :size="14" />
                  <span>Settings</span>
                </button>

                <button
                  v-if="isConfigured"
                  @click="testConnection"
                  :disabled="isTestingConnection"
                  class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 aria-label="按钮">
                  <Zap v-if="!isTestingConnection" :size="14" />
                  <Loader2 v-else :size="14" class="animate-spin" />
                  <span>{{ isTestingConnection ? 'Testing...' : 'Test' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ChevronDown, Check, Settings, Zap, Loader2, X } from 'lucide-vue-next'
import { useSettingsStore } from '@renderer/src/stores/settings'
import { useCustomProvidersStore } from '@renderer/src/stores/customProviders'
import { useRouter } from 'vue-router'

interface ProviderOption {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  isHealthy: boolean
  isCustom: boolean
  models?: ModelOption[]
}

interface ModelOption {
  id: string
  name: string
  providerId: string
}

interface Props {
  disabled?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  compact: false
})

const emit = defineEmits<{
  'provider-changed': [providerId: string]
  'model-changed': [modelId: string]
  'settings-opened': []
}>()

// Stores
const settingsStore = useSettingsStore()
const customProvidersStore = useCustomProvidersStore()
const router = useRouter()

// State
const isOpen = ref(false)
const isTestingConnection = ref(false)
const dropdownRef = ref<HTMLElement>()
const buttonRef = ref<HTMLElement>()

// Dropdown positioning
const dropdownStyle = computed(() => {
  if (!isOpen.value || !buttonRef.value) return {}

  const rect = buttonRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = 400 // estimated dropdown height

  // Position dropdown below button by default, above if not enough space
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  const shouldPositionAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

  return {
    position: 'fixed',
    left: `${Math.max(8, rect.right - 320)}px`, // 320px = dropdown width
    top: shouldPositionAbove
      ? `${rect.top - Math.min(dropdownHeight, spaceAbove - 8)}px`
      : `${rect.bottom + 8}px`,
    maxHeight: shouldPositionAbove ? `${spaceAbove - 16}px` : `${spaceBelow - 16}px`,
    zIndex: 10001
  }
})

// Provider configurations with icons and descriptions
const providerConfigs = {
  openai: {
    icon: '🤖',
    description: 'OpenAI GPT Models',
    models: [
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ]
  },
  anthropic: {
    icon: '🧠',
    description: 'Claude AI Models',
    models: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
    ]
  },
  google: {
    icon: '🌟',
    description: 'Google Gemini',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' }
    ]
  },
  local: {
    icon: '🏠',
    description: 'Local Ollama',
    models: [
      { id: 'llama2', name: 'Llama 2' },
      { id: 'codellama', name: 'Code Llama' },
      { id: 'mistral', name: 'Mistral' }
    ]
  }
}

// Computed properties
const availableProviders = computed(() => {
  const standardProviders: ProviderOption[] = Object.entries(providerConfigs).map(
    ([id, config]) => ({
      id,
      name: id,
      displayName:
        settingsStore.allProviders.find(p => p.id === id)?.displayName || config.description,
      description: config.description,
      icon: config.icon,
      isHealthy: id === settingsStore.llmProvider && settingsStore.isConfigured,
      isCustom: false,
      models: config.models.map(model => ({ ...model, providerId: id }))
    })
  )

  const customProviders: ProviderOption[] = customProvidersStore.providers.map(provider => ({
    id: provider.id,
    name: provider.config.name,
    displayName: provider.config.displayName || provider.config.name,
    description: provider.config.description || 'Custom Provider',
    icon: '⚡',
    isHealthy: provider.isHealthy || false,
    isCustom: true,
    models: provider.config.model
      ? [{ id: provider.config.model, name: provider.config.model, providerId: provider.id }]
      : provider.config.models?.map(m => ({
          id: m,
          name: m,
          providerId: provider.id
        })) || [{ id: 'default', name: 'Default Model', providerId: provider.id }]
  }))

  return [...standardProviders, ...customProviders]
})

const currentProviderId = computed(() => settingsStore.llmProvider)
const currentProvider = computed(
  () =>
    availableProviders.value.find(p => p.id === currentProviderId.value) ||
    availableProviders.value[0]
)

const currentProviderName = computed(() => currentProvider.value?.displayName || 'Select Provider')
const currentProviderIcon = computed(() => currentProvider.value?.icon || '🤖')

const availableModels = computed(() => {
  const provider = currentProvider.value
  if (!provider) return []

  // For custom providers, we might need to fetch models dynamically
  if (provider.isCustom) {
    return [
      {
        id: settingsStore.modelName,
        name: settingsStore.modelName || 'Default',
        providerId: provider.id
      }
    ]
  }

  return provider.models || []
})

const currentModelId = computed(() => settingsStore.modelName)
const currentModelName = computed(() => {
  const model = availableModels.value.find(m => m.id === currentModelId.value)
  return model?.name || settingsStore.modelName || 'Default'
})

const isConfigured = computed(() => settingsStore.isConfigured)
const isConnected = computed(() => {
  // For now, assume connected if configured
  // In a real implementation, you'd check actual connection status
  return isConfigured.value && currentProvider.value?.isHealthy
})

const statusIndicatorClass = computed(() => ({
  'bg-green-500 animate-pulse': isConnected.value,
  'bg-yellow-500': isConfigured.value && !isConnected.value,
  'bg-red-500': !isConfigured.value
}))

// Methods
const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectProvider = async (provider: ProviderOption) => {
  if (provider.id === currentProviderId.value) {
    closeDropdown()
    return
  }

  try {
    // Update settings store
    settingsStore.setLLMProvider(provider.id as any)

    // Set default model for the provider
    if (provider.models && provider.models.length > 0) {
      settingsStore.setModelName(provider.models[0].id)
    }

    // Get the appropriate configuration based on provider type
    let apiKey = settingsStore.apiKey
    let baseURL = settingsStore.apiEndpoint
    let model = settingsStore.modelName

    // For custom providers, get configuration from customProvidersStore
    if (provider.isCustom) {
      const customProvider = customProvidersStore.getProvider(provider.id)
      if (customProvider) {
        apiKey = customProvider.config.apiKey
        baseURL = customProvider.config.baseURL
        model = customProvider.config.model || model
      }
    }

    // Apply configuration to backend
    const result = await window.api.llm.setProvider({
      provider: provider.id as any,
      apiKey: apiKey || undefined,
      baseURL: baseURL || undefined,
      model: model || undefined
    })

    if (result.success) {
      emit('provider-changed', provider.id)
    } else {
      console.error('Failed to switch provider:', result.error)
      // You might want to show a toast notification here
    }
  } catch (error) {
    console.error('Error switching provider:', error)
  }
}

const selectModel = async (model: ModelOption) => {
  if (model.id === currentModelId.value) {
    closeDropdown()
    return
  }

  try {
    settingsStore.setModelName(model.id)

    // Apply configuration to backend
    const result = await window.api.llm.setProvider({
      provider: settingsStore.llmProvider,
      apiKey: settingsStore.apiKey || undefined,
      baseURL: settingsStore.apiEndpoint || undefined,
      model: model.id
    })

    if (result.success) {
      emit('model-changed', model.id)
    } else {
      console.error('Failed to switch model:', result.error)
    }
  } catch (error) {
    console.error('Error switching model:', error)
  }

  closeDropdown()
}

const getProviderStatusClass = (provider: ProviderOption) => ({
  'bg-green-500': provider.isHealthy,
  'bg-yellow-500': provider.id === currentProviderId.value && !provider.isHealthy,
  'bg-gray-400': provider.id !== currentProviderId.value && !provider.isHealthy
})

const getButtonTooltip = () => {
  if (!isConfigured.value) return 'Not configured - click to setup'
  if (!isConnected.value) return 'Configured but not verified - click to manage'
  return `${currentProviderName.value} - ${currentModelName.value} (Ready)`
}

const openSettings = () => {
  closeDropdown()
  emit('settings-opened')
  router.push('/settings')
}

const testConnection = async () => {
  if (!isConfigured.value) return

  isTestingConnection.value = true

  try {
    // Test with a simple message
    await window.api.llm.sendMessage('test', 'test', 'connection-test')
    // You might want to show a success toast here
  } catch (error) {
    console.error('Connection test failed:', error)
    // You might want to show an error toast here
  } finally {
    isTestingConnection.value = false
  }
}

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  const element = event.target as Element
  if (!element.closest('.provider-model-selector')) {
    closeDropdown()
  }
}

// Watch for provider/model changes to refresh available models
watch(
  () => currentProviderId.value,
  async () => {
    // Refresh available models when provider changes
    if (currentProvider.value?.isCustom) {
      // For custom providers, you might want to fetch available models
      await customProvidersStore.checkProviderHealth(currentProviderId.value)
    }
  }
)

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  // Initialize custom providers if needed
  await customProvidersStore.initialize()

  // Load current LLM configuration from backend
  const config = await window.api.llm.getConfig()
  if (config) {
    // Update settings store with the current backend configuration
    settingsStore.setLLMProvider(config.provider as any)
    if (config.model) {
      settingsStore.setModelName(config.model)
    }
    if (config.apiKey) {
      settingsStore.setApiKey(config.apiKey)
    }
    if (config.baseURL) {
      settingsStore.setApiEndpoint(config.baseURL)
    }
  }
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
.provider-model-selector {
  user-select: none;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
  transform-origin: top right;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.dropdown-menu {
  backdrop-filter: blur(16px);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.provider-option:hover,
.model-option:hover {
  transform: translateY(-1px);
}

.selector-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Custom scrollbar */
.dropdown-menu::-webkit-scrollbar {
  width: 4px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: rgba(var(--muted-foreground-rgb, 100, 116, 139), 0.3);
  border-radius: 2px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--muted-foreground-rgb, 100, 116, 139), 0.5);
}

/* Status indicator animation */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.w-1\.5.h-1\.5.rounded-full {
  transition: all 0.3s ease;
}

/* Focus states for accessibility */
.selector-button:focus {
  outline: none;
  ring: 2px;
  ring-color: rgba(var(--primary-rgb, 139, 69, 19), 0.3);
}

.provider-option:focus,
.model-option:focus {
  outline: none;
  background: rgba(var(--muted-rgb, 241, 245, 249), 0.5);
  border: 1px solid rgba(var(--primary-rgb, 139, 69, 19), 0.3);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .dropdown-menu {
    right: -4px;
    left: -4px;
    width: auto;
  }

  .selector-button {
    min-width: 120px;
    max-width: 160px;
  }
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
}</style>
