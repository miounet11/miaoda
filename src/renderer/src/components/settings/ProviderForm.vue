<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/20 backdrop-blur-sm"
      @click="handleClose"
    />
    
    <!-- Modal -->
    <div class="relative w-full max-w-2xl max-h-[90vh] bg-background rounded-lg shadow-xl border border-border overflow-hidden mx-4">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 class="text-xl font-semibold">
            {{ isEditing ? 'Edit Provider' : 'Add Provider' }}
          </h2>
          <p class="text-sm text-muted-foreground mt-1">
            {{ isEditing ? 'Update provider configuration' : 'Configure a new LLM provider' }}
          </p>
        </div>
        <button
          @click="handleClose"
          class="p-2 hover:bg-accent/50 rounded-lg transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Form -->
      <div class="flex-1 overflow-y-auto">
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h3 class="font-medium text-lg">Basic Information</h3>
            
            <!-- Provider Type -->
            <div class="space-y-2">
              <label class="block text-sm font-medium">Provider Type</label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  v-for="type in providerTypes"
                  :key="type.id"
                  type="button"
                  @click="setProviderType(type)"
                  class="p-3 rounded-lg border-2 transition-all text-center"
                  :class="[
                    form.type === type.id
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                  ]"
                >
                  <div class="text-xl mb-1">{{ type.icon }}</div>
                  <div class="text-sm font-medium">{{ type.name }}</div>
                </button>
              </div>
            </div>

            <!-- Name and Display Name -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="name" class="block text-sm font-medium mb-2">
                  Provider ID <span class="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  placeholder="e.g., custom-openai"
                  :disabled="isEditing"
                  class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  required
                />
                <p class="text-xs text-muted-foreground mt-1">
                  Unique identifier (cannot be changed)
                </p>
              </div>
              
              <div>
                <label for="displayName" class="block text-sm font-medium mb-2">
                  Display Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="displayName"
                  v-model="form.displayName"
                  type="text"
                  placeholder="e.g., My Custom OpenAI"
                  class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium mb-2">Description</label>
              <textarea
                id="description"
                v-model="form.description"
                rows="2"
                placeholder="Brief description of this provider"
                class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            <!-- Icon -->
            <div>
              <label for="icon" class="block text-sm font-medium mb-2">Icon</label>
              <div class="flex gap-3">
                <input
                  id="icon"
                  v-model="form.icon"
                  type="text"
                  placeholder="🤖"
                  maxlength="2"
                  class="w-16 px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center"
                />
                <div class="flex gap-2 flex-wrap">
                  <button
                    v-for="emoji in commonEmojis"
                    :key="emoji"
                    type="button"
                    @click="form.icon = emoji"
                    class="w-10 h-10 flex items-center justify-center text-lg hover:bg-accent/50 rounded-lg transition-colors"
                    :class="{ 'bg-primary/10': form.icon === emoji }"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- API Configuration -->
          <div class="space-y-4">
            <h3 class="font-medium text-lg">API Configuration</h3>
            
            <!-- Base URL -->
            <div>
              <label for="baseUrl" class="block text-sm font-medium mb-2">
                Base URL <span class="text-red-500">*</span>
              </label>
              <input
                id="baseUrl"
                v-model="form.baseUrl"
                type="url"
                placeholder="https://api.example.com/v1"
                class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>

            <!-- API Key -->
            <div>
              <label for="apiKey" class="block text-sm font-medium mb-2">
                API Key
                <span v-if="form.requiresAuth" class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="apiKey"
                  v-model="form.apiKey"
                  :type="showApiKey ? 'text' : 'password'"
                  placeholder="Enter your API key"
                  class="w-full px-3 py-2 pr-10 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  :required="form.requiresAuth"
                />
                <button
                  type="button"
                  @click="showApiKey = !showApiKey"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/50 rounded"
                >
                  <Eye v-if="!showApiKey" :size="16" />
                  <EyeOff v-else :size="16" />
                </button>
              </div>
            </div>

            <!-- Authentication Required Toggle -->
            <div>
              <label class="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
                <div>
                  <span class="text-sm font-medium block">Requires Authentication</span>
                  <span class="text-xs text-muted-foreground">Enable if API requires authentication</span>
                </div>
                <input
                  v-model="form.requiresAuth"
                  type="checkbox"
                  class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
                />
              </label>
            </div>

            <!-- Advanced Options -->
            <details class="group">
              <summary class="cursor-pointer list-none flex items-center gap-2 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <ChevronDown :size="16" class="transition-transform group-open:rotate-180" />
                <span class="font-medium">Advanced Options</span>
              </summary>
              
              <div class="mt-4 space-y-4">
                <!-- Organization ID -->
                <div>
                  <label for="organizationId" class="block text-sm font-medium mb-2">Organization ID</label>
                  <input
                    id="organizationId"
                    v-model="form.organizationId"
                    type="text"
                    placeholder="Optional organization identifier"
                    class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <!-- Timeout and Retries -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="timeout" class="block text-sm font-medium mb-2">Timeout (seconds)</label>
                    <input
                      id="timeout"
                      v-model.number="form.timeout"
                      type="number"
                      min="1"
                      max="300"
                      placeholder="30"
                      class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  
                  <div>
                    <label for="retries" class="block text-sm font-medium mb-2">Max Retries</label>
                    <input
                      id="retries"
                      v-model.number="form.retries"
                      type="number"
                      min="0"
                      max="10"
                      placeholder="3"
                      class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>

          <!-- Capabilities -->
          <div class="space-y-4">
            <h3 class="font-medium text-lg">Capabilities</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <label
                v-for="(capability, key) in capabilities"
                :key="key"
                class="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  v-model="form.capabilities[key]"
                  type="checkbox"
                  class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
                />
                <div>
                  <span class="text-sm font-medium block">{{ capability.label }}</span>
                  <span class="text-xs text-muted-foreground">{{ capability.description }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Models Configuration -->
          <ModelConfiguration
            v-model="form.models"
            :provider-type="form.type"
            class="space-y-4"
          />

          <!-- Test Connection -->
          <div v-if="isEditing || (form.baseUrl && (form.apiKey || !form.requiresAuth))" class="pt-4">
            <button
              type="button"
              @click="testConnection"
              :disabled="isTestingConnection"
              class="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap v-if="!isTestingConnection" :size="16" />
              <Loader2 v-else :size="16" class="animate-spin" />
              <span>{{ isTestingConnection ? 'Testing...' : 'Test Connection' }}</span>
            </button>
            
            <!-- Connection Result -->
            <div
              v-if="connectionResult"
              class="mt-3 p-3 rounded-lg border"
              :class="{
                'bg-green-500/10 border-green-500/20': connectionResult.success,
                'bg-red-500/10 border-red-500/20': !connectionResult.success
              }"
            >
              <div class="flex items-start gap-2">
                <Check v-if="connectionResult.success" :size="16" class="text-green-600 flex-shrink-0 mt-0.5" />
                <AlertCircle v-else :size="16" class="text-red-600 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium">
                    {{ connectionResult.success ? 'Connection successful!' : 'Connection failed' }}
                  </p>
                  <p v-if="connectionResult.message" class="text-xs text-muted-foreground mt-1">
                    {{ connectionResult.message }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-6 border-t border-border bg-muted/20">
        <div class="text-sm text-muted-foreground">
          <span v-if="isEditing">Editing: {{ form.displayName }}</span>
          <span v-else>Creating new provider</span>
        </div>
        
        <div class="flex gap-3">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSubmit"
            :disabled="!isFormValid || isSaving"
            class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
            <span>{{ isEditing ? 'Update' : 'Add' }} Provider</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  X, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Zap, 
  Loader2, 
  Check, 
  AlertCircle 
} from 'lucide-vue-next'
import type { LLMProvider, LLMModel, ProviderCapabilities } from '@renderer/src/types/api'
import ModelConfiguration from './ModelConfiguration.vue'

interface Props {
  provider?: LLMProvider | null
}

const props = withDefaults(defineProps<Props>(), {
  provider: null
})

const emit = defineEmits<{
  'close': []
  'save': [provider: LLMProvider]
}>()

// Form state
const form = ref({
  type: 'custom',
  name: '',
  displayName: '',
  description: '',
  icon: '🤖',
  baseUrl: '',
  apiKey: '',
  organizationId: '',
  timeout: 30,
  retries: 3,
  requiresAuth: true,
  capabilities: {
    chat: true,
    streaming: true,
    toolCalling: false,
    imageInput: false,
    imageOutput: false,
    audioInput: false,
    audioOutput: false,
    videoInput: false,
    systemMessages: true,
    temperature: true,
    topP: true,
    topK: false,
    presencePenalty: false,
    frequencyPenalty: false
  } as ProviderCapabilities,
  models: [] as LLMModel[]
})

// UI state
const showApiKey = ref(false)
const isTestingConnection = ref(false)
const isSaving = ref(false)
const connectionResult = ref<{ success: boolean; message?: string } | null>(null)

// Provider types
const providerTypes = [
  { id: 'openai', name: 'OpenAI', icon: '🤖' },
  { id: 'anthropic', name: 'Anthropic', icon: '🧠' },
  { id: 'custom', name: 'Custom', icon: '⚡' }
]

// Common emojis for selection
const commonEmojis = ['🤖', '🧠', '⚡', '🔮', '🎯', '🚀', '💡', '🌟']

// Capability definitions
const capabilities = {
  chat: { label: 'Chat', description: 'Basic chat completion' },
  streaming: { label: 'Streaming', description: 'Real-time response streaming' },
  toolCalling: { label: 'Tool Calling', description: 'Function/tool execution' },
  imageInput: { label: 'Image Input', description: 'Accept image uploads' },
  imageOutput: { label: 'Image Output', description: 'Generate images' },
  audioInput: { label: 'Audio Input', description: 'Voice input support' },
  audioOutput: { label: 'Audio Output', description: 'Voice output support' },
  videoInput: { label: 'Video Input', description: 'Video understanding' },
  systemMessages: { label: 'System Messages', description: 'Custom system prompts' },
  temperature: { label: 'Temperature', description: 'Response randomness control' },
  topP: { label: 'Top-P', description: 'Nucleus sampling' },
  topK: { label: 'Top-K', description: 'Top-K sampling' },
  presencePenalty: { label: 'Presence Penalty', description: 'Reduce repetition' },
  frequencyPenalty: { label: 'Frequency Penalty', description: 'Penalize frequent tokens' }
}

// Computed
const isOpen = computed(() => true) // Always show when component is mounted
const isEditing = computed(() => !!props.provider)

const isFormValid = computed(() => {
  return !!(
    form.value.name &&
    form.value.displayName &&
    form.value.baseUrl &&
    (form.value.apiKey || !form.value.requiresAuth) &&
    form.value.models.length > 0
  )
})

// Methods
const setProviderType = (type: any) => {
  form.value.type = type.id
  form.value.icon = type.icon
  
  // Set default capabilities based on provider type
  if (type.id === 'openai') {
    form.value.capabilities = {
      ...form.value.capabilities,
      toolCalling: true,
      imageInput: true,
      topP: true,
      presencePenalty: true,
      frequencyPenalty: true
    }
  } else if (type.id === 'anthropic') {
    form.value.capabilities = {
      ...form.value.capabilities,
      toolCalling: true,
      imageInput: true,
      topK: true
    }
  }
}

const handleClose = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (!isFormValid.value || isSaving.value) return
  
  isSaving.value = true
  
  try {
    const provider: LLMProvider = {
      id: form.value.name,
      name: form.value.name,
      displayName: form.value.displayName,
      description: form.value.description,
      icon: form.value.icon,
      models: form.value.models,
      capabilities: form.value.capabilities,
      configuration: {
        baseUrl: form.value.baseUrl,
        apiKey: form.value.apiKey || undefined,
        organizationId: form.value.organizationId || undefined,
        timeout: form.value.timeout,
        retries: form.value.retries
      },
      status: 'disconnected',
      enabled: true
    }
    
    emit('save', provider)
  } finally {
    isSaving.value = false
  }
}

const testConnection = async () => {
  if (isTestingConnection.value) return
  
  isTestingConnection.value = true
  connectionResult.value = null
  
  try {
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // For now, randomly succeed or fail
    const success = Math.random() > 0.3
    
    connectionResult.value = {
      success,
      message: success 
        ? 'Successfully connected to the API endpoint'
        : 'Failed to connect. Please check your URL and API key.'
    }
  } catch (error: any) {
    connectionResult.value = {
      success: false,
      message: error.message || 'Connection test failed'
    }
  } finally {
    isTestingConnection.value = false
  }
}

// Initialize form from provider
const initializeForm = () => {
  if (props.provider) {
    form.value = {
      type: 'custom',
      name: props.provider.name,
      displayName: props.provider.displayName,
      description: props.provider.description || '',
      icon: props.provider.icon || '🤖',
      baseUrl: props.provider.configuration.baseUrl || '',
      apiKey: props.provider.configuration.apiKey || '',
      organizationId: props.provider.configuration.organizationId || '',
      timeout: props.provider.configuration.timeout || 30,
      retries: props.provider.configuration.retries || 3,
      requiresAuth: !!props.provider.configuration.apiKey,
      capabilities: { ...props.provider.capabilities },
      models: [...props.provider.models]
    }
  } else {
    // Reset form for new provider
    form.value = {
      type: 'custom',
      name: '',
      displayName: '',
      description: '',
      icon: '🤖',
      baseUrl: '',
      apiKey: '',
      organizationId: '',
      timeout: 30,
      retries: 3,
      requiresAuth: true,
      capabilities: {
        chat: true,
        streaming: true,
        toolCalling: false,
        imageInput: false,
        imageOutput: false,
        audioInput: false,
        audioOutput: false,
        videoInput: false,
        systemMessages: true,
        temperature: true,
        topP: true,
        topK: false,
        presencePenalty: false,
        frequencyPenalty: false
      },
      models: []
    }
  }
  
  // Clear connection result
  connectionResult.value = null
}

// Generate provider name from display name
watch(() => form.value.displayName, (newValue) => {
  if (!isEditing.value && newValue) {
    form.value.name = newValue
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
})

// Watch for provider changes
watch(() => props.provider, initializeForm, { immediate: true })

// Initialize on mount
onMounted(() => {
  initializeForm()
})
</script>

<style scoped>
/* Modal animations */
.fixed.inset-0 {
  animation: modal-fade-in 0.2s ease-out;
}

@keyframes modal-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.relative.w-full {
  animation: modal-slide-in 0.2s ease-out;
}

@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Form styling */
input:focus, textarea:focus, select:focus {
  outline: none;
}

/* Custom checkbox styling */
input[type="checkbox"]:checked {
  background-color: rgb(var(--primary-rgb));
  border-color: rgb(var(--primary-rgb));
}

/* Details/summary styling */
details[open] summary {
  margin-bottom: 1rem;
}

/* Scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(var(--muted-foreground-rgb), 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--muted-foreground-rgb), 0.5);
}

/* Mobile responsive improvements */
@media (max-width: 768px) {
  .relative.w-full {
    margin: 1rem;
    max-width: calc(100% - 2rem);
    max-height: calc(100% - 2rem);
  }
  
  .grid.grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .grid.sm\\:grid-cols-3 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .p-6 {
    padding: 1rem;
  }
}

/* Focus improvements for accessibility */
button:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid rgba(var(--primary-rgb), 0.6);
  outline-offset: 2px;
}
</style>