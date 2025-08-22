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
    >
      <!-- Provider Icon and Info -->
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="text-base flex-shrink-0 group-hover:scale-110 transition-transform">{{ currentProviderIcon }}</span>
        <div class="flex flex-col items-start min-w-0">
          <span class="text-sm font-medium text-foreground truncate leading-tight">{{ currentProviderName }}</span>
          <span class="text-xs text-muted-foreground truncate leading-tight">{{ currentModelName }}</span>
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
        <div
          v-if="isOpen"
          class="fixed inset-0 z-[10000]" 
          @click="closeDropdown"
        >
          <div
            ref="dropdownRef"
            class="dropdown-menu absolute bg-background border border-border rounded-xl shadow-xl overflow-hidden w-80"
            :style="dropdownStyle"
            @click.stop
          >
            <!-- Header -->
            <div class="p-3 border-b border-muted-foreground/10 bg-muted/10">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">LLM Provider & Model</h3>
                <button
                  @click="closeDropdown"
                  class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X :size="14" class="text-muted-foreground" />
                </button>
              </div>
            </div>

            <!-- Provider Selection -->
            <div class="p-3">
              <!-- Built-in Providers -->
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">Built-in Providers</div>
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
                  <span class="text-lg group-hover:scale-110 transition-transform">{{ provider.icon }}</span>
              
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
                    <div 
                      class="w-2 h-2 rounded-full"
                      :class="getProviderStatusClass(provider)"
                    />
                  </div>
                </div>
              </div>
          
              <!-- Custom Providers -->
              <div v-if="availableProviders.some(p => p.isCustom)">
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1 mt-3">Custom Providers</div>
                <div class="space-y-1">
                  <div
                    v-for="provider in availableProviders.filter(p => p.isCustom)"
                    :key="provider.id"
                    @click="selectProvider(provider)"
                    class="provider-option flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700 group"
                    :class="{
                      'bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600': provider.id === currentProviderId,
                      'border border-transparent': provider.id !== currentProviderId,
                      'opacity-60': !provider.isHealthy && provider.id !== currentProviderId
                    }"
                  >
                    <!-- Provider Icon -->
                    <span class="text-lg group-hover:scale-110 transition-transform">{{ provider.icon }}</span>
                
                    <!-- Provider Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ provider.displayName }}</span>
                        <Check 
                          v-if="provider.id === currentProviderId" 
                          :size="12" 
                          class="text-primary flex-shrink-0" 
                        />
                      </div>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ provider.description }}</span>
                        <div 
                          class="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded-md border border-blue-500/20"
                        >
                          Custom
                        </div>
                      </div>
                    </div>
                
                    <!-- Status Indicator -->
                    <div class="flex items-center gap-1 flex-shrink-0">
                      <div 
                        class="w-2 h-2 rounded-full"
                        :class="getProviderStatusClass(provider)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Model Selection (if provider has multiple models) -->
            <div v-if="availableModels.length > 1" class="border-t border-muted-foreground/10 p-3">
              <div class="text-xs font-medium text-muted-foreground mb-2 px-1">Available Models</div>
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
                  <Check 
                    v-if="model.id === currentModelId" 
                    :size="12" 
                    class="text-primary" 
                  />
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="border-t border-muted-foreground/10 p-2 bg-muted/5">
              <div class="flex items-center gap-1">
                <button
                  @click="openSettings"
                  class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
                >
                  <Settings :size="14" />
                  <span>Settings</span>
                </button>
            
                <button
                  v-if="isConfigured"
                  @click="testConnection"
                  :disabled="isTestingConnection"
                  class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
    maxHeight: shouldPositionAbove 
      ? `${spaceAbove - 16}px`
      : `${spaceBelow - 16}px`,
    zIndex: 10001
  }
})

// Provider configurations with icons and descriptions
const providerConfigs = {
  'openai': {
    icon: '🤖',
    description: 'OpenAI GPT Models',
    models: [
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ]
  },
  'anthropic': {
    icon: '🧠',
    description: 'Claude AI Models',
    models: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
    ]
  },
  'google': {
    icon: '🌟',
    description: 'Google Gemini',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' }
    ]
  },
  'local': {
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
  const standardProviders: ProviderOption[] = Object.entries(providerConfigs).map(([id, config]) => ({
    id,
    name: id,
    displayName: settingsStore.allProviders.find(p => p.id === id)?.displayName || config.description,
    description: config.description,
    icon: config.icon,
    isHealthy: id === settingsStore.llmProvider && settingsStore.isConfigured,
    isCustom: false,
    models: config.models.map(model => ({ ...model, providerId: id }))
  }))

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
const currentProvider = computed(() => 
  availableProviders.value.find(p => p.id === currentProviderId.value) || availableProviders.value[0]
)

const currentProviderName = computed(() => currentProvider.value?.displayName || 'Select Provider')
const currentProviderIcon = computed(() => currentProvider.value?.icon || '🤖')

const availableModels = computed(() => {
  const provider = currentProvider.value
  if (!provider) return []
  
  // For custom providers, we might need to fetch models dynamically
  if (provider.isCustom) {
    return [{ id: settingsStore.modelName, name: settingsStore.modelName || 'Default', providerId: provider.id }]
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
watch(() => currentProviderId.value, async () => {
  // Refresh available models when provider changes
  if (currentProvider.value?.isCustom) {
    // For custom providers, you might want to fetch available models
    await customProvidersStore.checkProviderHealth(currentProviderId.value)
  }
})

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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1);
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
  0%, 100% {
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
</style>