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
          >
            <Settings :size="16" />
            <span>Model Settings</span>
          </button>

          <button
            @click="testConnection"
            :disabled="!isConfigured || isTestingConnection"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
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
</style>
