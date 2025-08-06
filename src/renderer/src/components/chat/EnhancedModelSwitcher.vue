<template>
  <div class="enhanced-model-switcher relative">
    <!-- Current Model Button -->
    <button
      @click="toggleDropdown"
      :disabled="disabled"
      class="model-button flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted/70 rounded-lg transition-all duration-200 border border-transparent hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed min-w-[220px]"
      :class="{
        'border-primary/30 bg-primary/5': isOpen,
        'border-green-500/30 bg-green-500/5': currentModel?.status === 'connected' && !isOpen,
        'border-yellow-500/30 bg-yellow-500/5': currentModel?.status === 'configuring' && !isOpen,
        'border-red-500/30 bg-red-500/5': currentModel?.status === 'error' && !isOpen
      }"
    >
      <!-- Model Info -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="text-2xl">{{ currentModel?.icon || '🤖' }}</div>
        <div class="flex flex-col items-start min-w-0">
          <span class="text-sm font-medium truncate">{{ currentModel?.displayName || 'Select Model' }}</span>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{{ currentModel?.providerName || 'No provider' }}</span>
            <div v-if="currentModel?.contextLength" class="flex items-center gap-1">
              <span>•</span>
              <span>{{ formatContextLength(currentModel.contextLength) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Status and Arrow -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <StatusIndicator 
          v-if="currentModel?.status"
          :status="currentModel.status" 
          :size="'sm'"
          :show-text="false"
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
        class="dropdown-menu absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
        @click.stop
      >
        <!-- Search -->
        <div class="p-3 border-b border-border">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search models..."
              class="w-full pl-8 pr-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
            <Search :size="16" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div class="overflow-y-auto max-h-80">
          <!-- Provider Groups -->
          <div v-for="provider in filteredProviders" :key="provider.id" class="provider-group">
            <!-- Provider Header -->
            <div class="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-muted-foreground/10">
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ provider.icon }}</span>
                <div class="flex flex-col">
                  <span class="text-sm font-medium">{{ provider.displayName }}</span>
                  <span class="text-xs text-muted-foreground">{{ provider.models.length }} models</span>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <StatusIndicator :status="provider.status" :size="'xs'" />
                <button
                  v-if="provider.isCustom"
                  @click="editProvider(provider)"
                  class="p-1 hover:bg-accent/50 rounded transition-colors"
                  title="Edit provider"
                >
                  <Settings :size="12" />
                </button>
              </div>
            </div>

            <!-- Models -->
            <div class="models-list">
              <div
                v-for="model in provider.models"
                :key="model.id"
                @click="selectModel(model, provider)"
                class="model-option flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-accent/50"
                :class="{
                  'bg-primary/10 border-l-2 border-primary': isCurrentModel(model, provider),
                  'opacity-60': provider.status !== 'connected'
                }"
              >
                <!-- Model Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium">{{ model.displayName }}</span>
                    <Check 
                      v-if="isCurrentModel(model, provider)" 
                      :size="14" 
                      class="text-primary flex-shrink-0" 
                    />
                  </div>
                  
                  <div class="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{{ model.id }}</span>
                    <span v-if="model.contextLength">{{ formatContextLength(model.contextLength) }}</span>
                  </div>

                  <!-- Model Capabilities -->
                  <div v-if="showCapabilities" class="flex flex-wrap gap-1 mt-2">
                    <CapabilityBadge
                      v-for="capability in getModelCapabilities(model)"
                      :key="capability"
                      :capability="capability"
                      :size="'sm'"
                    />
                  </div>
                </div>

                <!-- Pricing Info -->
                <div v-if="model.inputCostPer1k || model.outputCostPer1k" class="text-right text-xs text-muted-foreground">
                  <div v-if="model.inputCostPer1k">${{ model.inputCostPer1k.toFixed(4) }}/1K in</div>
                  <div v-if="model.outputCostPer1k">${{ model.outputCostPer1k.toFixed(4) }}/1K out</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div v-if="filteredProviders.length === 0" class="p-6 text-center text-muted-foreground">
          <Search :size="32" class="mx-auto mb-2 opacity-50" />
          <p>No models found matching "{{ searchQuery }}"</p>
        </div>

        <!-- Quick Actions -->
        <div class="border-t border-border p-3 bg-muted/20">
          <div class="flex items-center justify-between">
            <div class="flex gap-2">
              <button
                @click="toggleCapabilities"
                class="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors"
              >
                <component :is="showCapabilities ? EyeOff : Eye" :size="12" />
                <span>{{ showCapabilities ? 'Hide' : 'Show' }} Capabilities</span>
              </button>
            </div>
            
            <div class="flex gap-2">
              <button
                @click="refreshProviders"
                :disabled="isRefreshing"
                class="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors disabled:opacity-50"
              >
                <RefreshCw :size="12" :class="{ 'animate-spin': isRefreshing }" />
                <span>Refresh</span>
              </button>
              
              <button
                @click="openSettings"
                class="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors"
              >
                <Settings :size="12" />
                <span>Providers</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Click Outside Handler -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  ChevronDown, 
  Check, 
  Settings, 
  Search, 
  Eye, 
  EyeOff, 
  RefreshCw
} from 'lucide-vue-next'
import type { LLMProvider, LLMModel } from '@renderer/src/types/api'
import StatusIndicator from '../settings/StatusIndicator.vue'
import CapabilityBadge from '../settings/CapabilityBadge.vue'
import { useRouter } from 'vue-router'

interface ExtendedProvider extends LLMProvider {
  isCustom: boolean
  providerName: string
}

interface ExtendedModel extends LLMModel {
  providerId: string
  providerName: string
  icon?: string
  status?: string
}

interface Props {
  disabled?: boolean
  currentModelId?: string
  currentProviderId?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'model-changed': [modelId: string, providerId: string]
  'edit-provider': [providerId: string]
  'refresh-requested': []
}>()

// State
const router = useRouter()
const isOpen = ref(false)
const searchQuery = ref('')
const showCapabilities = ref(false)
const isRefreshing = ref(false)
const providers = ref<ExtendedProvider[]>([])

// Mock data - in real app, this would come from a store/API
const mockProviders: ExtendedProvider[] = [
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    icon: '🤖',
    status: 'connected',
    isCustom: false,
    providerName: 'OpenAI',
    description: 'Official OpenAI API',
    models: [
      {
        id: 'gpt-4-turbo',
        name: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        contextLength: 128000,
        inputCostPer1k: 0.01,
        outputCostPer1k: 0.03,
        providerId: 'openai',
        providerName: 'OpenAI',
        capabilities: {
          chat: true,
          streaming: true,
          toolCalling: true,
          imageInput: true,
          systemMessages: true,
          temperature: true,
          topP: true,
          presencePenalty: true,
          frequencyPenalty: true
        }
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        contextLength: 16385,
        inputCostPer1k: 0.0015,
        outputCostPer1k: 0.002,
        providerId: 'openai',
        providerName: 'OpenAI',
        capabilities: {
          chat: true,
          streaming: true,
          toolCalling: true,
          systemMessages: true,
          temperature: true,
          topP: true,
          presencePenalty: true,
          frequencyPenalty: true
        }
      }
    ],
    capabilities: {
      chat: true,
      streaming: true,
      toolCalling: true,
      imageInput: true,
      systemMessages: true,
      temperature: true,
      topP: true,
      presencePenalty: true,
      frequencyPenalty: true
    },
    configuration: {
      baseUrl: 'https://api.openai.com/v1'
    }
  },
  {
    id: 'custom-openai',
    name: 'custom-openai',
    displayName: 'My Custom OpenAI',
    icon: '⚡',
    status: 'configuring',
    isCustom: true,
    providerName: 'Custom OpenAI',
    description: 'Custom OpenAI-compatible API',
    models: [
      {
        id: 'custom-model',
        name: 'custom-model',
        displayName: 'Custom Model',
        contextLength: 8192,
        providerId: 'custom-openai',
        providerName: 'Custom OpenAI',
        capabilities: {
          chat: true,
          streaming: true,
          systemMessages: true,
          temperature: true
        }
      }
    ],
    capabilities: {
      chat: true,
      streaming: true,
      systemMessages: true,
      temperature: true
    },
    configuration: {
      baseUrl: 'https://api.example.com/v1'
    }
  }
]

// Computed
const currentModel = computed((): ExtendedModel | null => {
  for (const provider of providers.value) {
    const model = provider.models.find(m => 
      m.id === props.currentModelId && provider.id === props.currentProviderId
    )
    if (model) {
      return {
        ...model,
        icon: provider.icon,
        status: provider.status
      }
    }
  }
  return null
})

const filteredProviders = computed(() => {
  if (!searchQuery.value.trim()) {
    return providers.value.filter(p => p.models.length > 0)
  }
  
  const query = searchQuery.value.toLowerCase()
  return providers.value.map(provider => ({
    ...provider,
    models: provider.models.filter(model => 
      model.displayName.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query) ||
      provider.displayName.toLowerCase().includes(query)
    )
  })).filter(p => p.models.length > 0)
})

// Methods
const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    loadProviders()
  }
}

const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
}

const loadProviders = async () => {
  // In real app, load from API/store
  providers.value = mockProviders
}

const selectModel = (model: LLMModel, provider: ExtendedProvider) => {
  if (provider.status !== 'connected') {
    // Maybe show a warning or try to connect
    return
  }
  
  emit('model-changed', model.id, provider.id)
  closeDropdown()
}

const isCurrentModel = (model: LLMModel, provider: ExtendedProvider): boolean => {
  return model.id === props.currentModelId && provider.id === props.currentProviderId
}

const editProvider = (provider: ExtendedProvider) => {
  emit('edit-provider', provider.id)
  closeDropdown()
}

const openSettings = () => {
  closeDropdown()
  router.push('/settings?tab=providers')
}

const toggleCapabilities = () => {
  showCapabilities.value = !showCapabilities.value
}

const refreshProviders = async () => {
  isRefreshing.value = true
  emit('refresh-requested')
  
  try {
    await loadProviders()
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 1000)
  }
}

const formatContextLength = (length: number): string => {
  if (length >= 1000000) {
    return `${(length / 1000000).toFixed(1)}M`
  } else if (length >= 1000) {
    return `${(length / 1000).toFixed(0)}K`
  }
  return length.toString()
}

const getModelCapabilities = (model: LLMModel): string[] => {
  return Object.entries(model.capabilities || {})
    .filter(([_, enabled]) => enabled)
    .map(([capability]) => capability)
    .slice(0, 3) // Limit to 3 for space
}

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  const element = event.target as Element
  if (!element.closest('.enhanced-model-switcher')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadProviders()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.enhanced-model-switcher {
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
  transform: translateX(2px);
}

.model-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.15);
}

.provider-group:not(:last-child) {
  border-bottom: 1px solid rgba(var(--border-rgb), 0.5);
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(var(--muted-foreground-rgb), 0.3);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--muted-foreground-rgb), 0.5);
}

/* Search input styling */
.relative input:focus {
  outline: none;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .model-button {
    min-width: 180px;
  }
  
  .dropdown-menu {
    left: -8px;
    right: -8px;
  }
  
  .model-option {
    padding: 0.75rem 1rem;
  }
  
  .provider-group .px-3 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Focus states for accessibility */
.model-button:focus {
  outline: none;
}

.model-option:focus {
  outline: none;
  background: rgba(var(--accent-rgb), 0.7);
}

/* Animations for status changes */
.model-button {
  transition: all 0.3s ease;
}

/* Dark mode optimizations */
@media (prefers-color-scheme: dark) {
  .dropdown-menu {
    background: rgba(15, 23, 42, 0.95);
    border-color: rgba(51, 65, 85, 0.5);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .model-option {
    border-bottom: 1px solid rgba(var(--border-rgb), 0.3);
  }
}
</style>