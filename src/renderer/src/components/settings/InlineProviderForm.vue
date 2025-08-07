<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Basic Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="displayName" class="block text-sm font-medium mb-2">
          Display Name <span class="text-red-500">*</span>
        </label>
        <div class="space-y-1">
          <input
            id="displayName"
            v-model="form.displayName"
            type="text"
            placeholder="My Custom Provider"
            :class="[
              'w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all',
              isDisplayNameTaken 
                ? 'border-red-500/50 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-muted-foreground/20 focus:border-primary'
            ]"
            required
          />
          <p 
            v-if="isDisplayNameTaken" 
            class="text-xs text-red-600 mt-1"
          >
            This provider name is already in use. Please choose a unique name.
          </p>
        </div>
      </div>
      
      <div>
        <label for="providerType" class="block text-sm font-medium mb-2">Provider Type</label>
        <select
          id="providerType"
          v-model="form.type"
          @change="updateProviderDefaults"
          class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        >
          <option value="openai-compatible">OpenAI Compatible</option>
          <option value="anthropic-compatible">Anthropic Compatible</option>
          <option value="ollama">Ollama</option>
          <option value="custom">Custom</option>
        </select>
      </div>
    </div>

    <!-- Icon and Description -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="icon" class="block text-sm font-medium mb-2">Icon</label>
        <div class="flex gap-2 items-center">
          <input
            id="icon"
            v-model="form.icon"
            type="text"
            placeholder="🔧"
            maxlength="2"
            class="w-16 px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center"
          />
          <div class="flex gap-1">
            <button
              v-for="emoji in quickEmojis"
              :key="emoji"
              type="button"
              @click="form.icon = emoji"
              class="w-8 h-8 flex items-center justify-center hover:bg-accent/50 rounded transition-colors text-sm"
              :class="{ 'bg-primary/10': form.icon === emoji }"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="md:col-span-2">
        <label for="description" class="block text-sm font-medium mb-2">Description</label>
        <input
          id="description"
          v-model="form.description"
          type="text"
          placeholder="Brief description of this provider"
          class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>
    </div>

    <!-- API Configuration -->
    <div class="space-y-4 pt-4 border-t border-muted">
      <h5 class="text-sm font-medium text-muted-foreground">API Configuration</h5>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="baseUrl" class="block text-sm font-medium mb-2">
            Base URL <span class="text-red-500">*</span>
          </label>
          <input
            id="baseUrl"
            v-model="form.baseUrl"
            type="url"
            placeholder="https://api.example.com/v1"
            class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            required
          />
        </div>
        
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
              class="w-full px-3 py-2 pr-10 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              :required="form.requiresAuth"
            />
            <button
              type="button"
              @click="showApiKey = !showApiKey"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/50 rounded transition-colors"
            >
              <Eye v-if="!showApiKey" :size="14" />
              <EyeOff v-else :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Options -->
      <div class="flex flex-wrap gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.requiresAuth"
            type="checkbox"
            class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
          />
          <span class="text-sm">Requires Authentication</span>
        </label>
        
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.supportsStreaming"
            type="checkbox"
            class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
          />
          <span class="text-sm">Supports Streaming</span>
        </label>
      </div>
    </div>

    <!-- Models Configuration -->
    <div class="space-y-3 pt-4 border-t border-muted">
      <div class="flex items-center justify-between">
        <h5 class="text-sm font-medium text-muted-foreground">Models</h5>
        <button
          type="button"
          @click="addModel"
          class="text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
        >
          <Plus :size="12" class="inline mr-1" />
          Add Model
        </button>
      </div>
      
      <div v-if="form.models.length === 0" class="text-center py-4 text-sm text-muted-foreground">
        No models configured. Add at least one model.
      </div>
      
      <div v-else class="space-y-2">
        <div
          v-for="(model, index) in form.models"
          :key="index"
          class="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
        >
          <input
            v-model="model.id"
            type="text"
            placeholder="Model ID (e.g., gpt-4)"
            class="flex-1 px-2 py-1 bg-background border border-muted-foreground/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
            required
          />
          <input
            v-model="model.displayName"
            type="text"
            placeholder="Display Name"
            class="flex-1 px-2 py-1 bg-background border border-muted-foreground/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <button
            type="button"
            @click="removeModel(index)"
            class="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Test Connection -->
    <div v-if="canTestConnection" class="pt-4">
      <button
        type="button"
        @click="testConnection"
        :disabled="isTestingConnection"
        class="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        <Zap v-if="!isTestingConnection" :size="14" />
        <Loader2 v-else :size="14" class="animate-spin" />
        <span>{{ isTestingConnection ? 'Testing...' : 'Test Connection' }}</span>
      </button>
      
      <!-- Test Result -->
      <div
        v-if="testResult"
        class="mt-2 p-2 rounded-lg border text-sm"
        :class="{
          'bg-green-500/10 border-green-500/20 text-green-800': testResult.success,
          'bg-red-500/10 border-red-500/20 text-red-800': !testResult.success
        }"
      >
        <div class="flex items-start gap-2">
          <Check v-if="testResult.success" :size="14" class="text-green-600 flex-shrink-0 mt-0.5" />
          <AlertCircle v-else :size="14" class="text-red-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-medium">
              {{ testResult.success ? 'Connection successful!' : 'Connection failed' }}
            </p>
            <p v-if="testResult.message" class="text-xs mt-1 opacity-80">
              {{ testResult.message }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex gap-3 pt-4 border-t border-muted">
      <button
        type="submit"
        :disabled="!isFormValid || isSaving"
        class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
        <span>{{ isEditing ? 'Update' : 'Add' }} Provider</span>
      </button>
      
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
      >
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  Zap, 
  Loader2, 
  Check, 
  AlertCircle 
} from 'lucide-vue-next'
import type { LLMProvider } from '../../types/api'

interface Props {
  provider?: LLMProvider | null
}

const props = withDefaults(defineProps<Props>(), {
  provider: null
})

const emit = defineEmits<{
  save: [provider: LLMProvider]
  cancel: []
}>()

// Form state
const form = ref({
  displayName: '',
  type: 'openai-compatible',
  icon: '🔧',
  description: '',
  baseUrl: '',
  apiKey: '',
  requiresAuth: true,
  supportsStreaming: true,
  models: [] as Array<{ id: string; displayName: string; description?: string }>
})

// UI state
const showApiKey = ref(false)
const isTestingConnection = ref(false)
const isSaving = ref(false)
const testResult = ref<{ success: boolean; message?: string } | null>(null)

// Quick emoji options
const quickEmojis = ['🤖', '🧠', '⚡', '🔧', '🌟', '🚀']

// Computed
const isEditing = computed(() => !!props.provider)

const isDisplayNameTaken = computed(() => 
  props.customProviders?.some(
    p => p.displayName.toLowerCase() === form.value.displayName.toLowerCase() &&
         p.id !== props.provider?.id
  )
)

const isFormValid = computed(() => {
  return !!(
    form.value.displayName &&
    !isDisplayNameTaken.value &&
    form.value.baseUrl &&
    (!form.value.requiresAuth || form.value.apiKey) &&
    form.value.models.length > 0 &&
    form.value.models.every(m => m.id)
  )
})

const canTestConnection = computed(() => {
  return !!(
    form.value.baseUrl &&
    (!form.value.requiresAuth || form.value.apiKey)
  )
})

// Provider type defaults
const providerDefaults = {
  'openai-compatible': {
    icon: '🤖',
    supportsStreaming: true,
    requiresAuth: true,
    models: [
      { id: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo' },
      { id: 'gpt-4', displayName: 'GPT-4' }
    ]
  },
  'anthropic-compatible': {
    icon: '🧠',
    supportsStreaming: true,
    requiresAuth: true,
    models: [
      { id: 'claude-3-sonnet', displayName: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku', displayName: 'Claude 3 Haiku' }
    ]
  },
  'ollama': {
    icon: '🦙',
    supportsStreaming: true,
    requiresAuth: false,
    models: [
      { id: 'llama2', displayName: 'Llama 2' },
      { id: 'mistral', displayName: 'Mistral' }
    ]
  },
  'custom': {
    icon: '⚡',
    supportsStreaming: false,
    requiresAuth: true,
    models: []
  }
}

// Methods
const updateProviderDefaults = () => {
  const defaults = providerDefaults[form.value.type as keyof typeof providerDefaults]
  if (defaults && !isEditing.value) {
    form.value.icon = defaults.icon
    form.value.supportsStreaming = defaults.supportsStreaming
    form.value.requiresAuth = defaults.requiresAuth
    if (form.value.models.length === 0) {
      form.value.models = [...defaults.models]
    }
  }
}

const addModel = () => {
  form.value.models.push({
    id: '',
    displayName: ''
  })
}

const removeModel = (index: number) => {
  form.value.models.splice(index, 1)
}

const testConnection = async () => {
  if (isTestingConnection.value || !canTestConnection.value) return
  
  isTestingConnection.value = true
  testResult.value = null
  
  try {
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // For now, randomly succeed or fail for demo
    const success = Math.random() > 0.3
    
    testResult.value = {
      success,
      message: success 
        ? 'Successfully connected to the API endpoint'
        : 'Failed to connect. Please check your URL and API key.'
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: error.message || 'Connection test failed'
    }
  } finally {
    isTestingConnection.value = false
  }
}

const handleSubmit = async () => {
  // Validate form before submission
  if (!isFormValid.value) {
    testResult.value = {
      success: false,
      message: 'Please check your form. Make sure all required fields are filled and the provider name is unique.'
    }
    return
  }

  if (isSaving.value) return
  
  isSaving.value = true
  testResult.value = null
  
  try {
    // Generate unique provider ID
    const generateUniqueId = (baseName: string, existingIds: string[] = []): string => {
      const sanitizedName = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      let uniqueId = sanitizedName
      let counter = 1
      while (existingIds.includes(uniqueId)) {
        uniqueId = `${sanitizedName}-${counter}`
        counter++
      }
      
      return uniqueId
    }

    const providerId = isEditing.value 
      ? props.provider!.id
      : generateUniqueId(
          form.value.displayName, 
          props.customProviders?.map(p => p.id) || []
        )
    
    const provider: LLMProvider = {
      id: providerId,
      name: providerId,
      displayName: form.value.displayName,
      description: form.value.description || undefined,
      icon: form.value.icon,
      models: form.value.models.map(m => ({
        id: m.id,
        name: m.id,
        displayName: m.displayName || m.id,
        description: m.description,
        contextLength: 4096,
        capabilities: {
          chat: true,
          streaming: form.value.supportsStreaming,
          toolCalling: form.value.type === 'openai-compatible',
          imageInput: form.value.type === 'openai-compatible',
          imageOutput: false,
          audioInput: false,
          audioOutput: false,
          videoInput: false,
          systemMessages: true,
          temperature: true,
          topP: form.value.type === 'openai-compatible',
          topK: form.value.type === 'anthropic-compatible',
          presencePenalty: form.value.type === 'openai-compatible',
          frequencyPenalty: form.value.type === 'openai-compatible'
        }
      })),
      capabilities: {
        chat: true,
        streaming: form.value.supportsStreaming,
        toolCalling: form.value.type === 'openai-compatible',
        imageInput: form.value.type === 'openai-compatible',
        imageOutput: false,
        audioInput: false,
        audioOutput: false,
        videoInput: false,
        systemMessages: true,
        temperature: true,
        topP: form.value.type === 'openai-compatible',
        topK: form.value.type === 'anthropic-compatible',
        presencePenalty: form.value.type === 'openai-compatible',
        frequencyPenalty: form.value.type === 'openai-compatible'
      },
      configuration: {
        baseUrl: form.value.baseUrl,
        apiKey: form.value.apiKey || undefined,
        timeout: 30,
        retries: 3
      },
      status: 'disconnected',
      enabled: true
    }
    
    // Simulate some additional validation
    if (!provider.models.length) {
      throw new Error('At least one model must be configured')
    }

    emit('save', provider)
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: error.message || 'Failed to save provider configuration'
    }
  } finally {
    isSaving.value = false
  }
}

// Initialize form from provider
const initializeForm = () => {
  if (props.provider) {
    form.value = {
      displayName: props.provider.displayName,
      type: 'custom', // Existing providers are always custom
      icon: props.provider.icon || '🔧',
      description: props.provider.description || '',
      baseUrl: props.provider.configuration.baseUrl || '',
      apiKey: props.provider.configuration.apiKey || '',
      requiresAuth: !!props.provider.configuration.apiKey,
      supportsStreaming: props.provider.capabilities?.streaming || false,
      models: props.provider.models.map(m => ({
        id: m.id,
        displayName: m.displayName || m.id,
        description: m.description
      }))
    }
  } else {
    // Reset for new provider
    form.value = {
      displayName: '',
      type: 'openai-compatible',
      icon: '🔧',
      description: '',
      baseUrl: '',
      apiKey: '',
      requiresAuth: true,
      supportsStreaming: true,
      models: []
    }
    updateProviderDefaults()
  }
  
  // Clear test result
  testResult.value = null
}

// Watch for provider changes
watch(() => props.provider, initializeForm, { immediate: true })

// Initialize on mount
onMounted(() => {
  initializeForm()
})
</script>

<style scoped>
/* Form styling */
input:focus, select:focus, textarea:focus {
  outline: none;
}

/* Custom checkbox styling */
input[type="checkbox"]:checked {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

/* Mobile responsive improvements */
@media (max-width: 768px) {
  .grid.grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .grid.grid-cols-1.md\\:grid-cols-3 {
    grid-template-columns: 1fr;
  }
  
  input, select, button {
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  button {
    min-height: 44px; /* Better touch targets */
  }
}

/* Enhanced focus states */
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
</style>