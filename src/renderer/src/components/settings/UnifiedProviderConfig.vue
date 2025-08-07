<template>
  <div class="unified-provider-config space-y-6">
    <!-- Provider Selection Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-lg font-medium">Select Provider</h4>
        <div v-if="selectedProvider" class="text-sm text-muted-foreground">
          Current: {{ getProviderDisplayName(selectedProvider) }}
        </div>
      </div>

      <!-- Built-in Providers Grid -->
      <div>
        <h5 class="text-sm font-medium mb-3 text-muted-foreground">Built-in Providers</h5>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            v-for="provider in builtInProviders"
            :key="provider.id"
            @click="selectProvider(provider.id)"
            :class="[
              'provider-card group relative p-4 rounded-xl border-2 transition-all duration-200',
              selectedProvider === provider.id
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                : 'border-muted hover:border-muted-foreground/50 hover:bg-muted/30'
            ]"
          >
            <!-- Selection Indicator -->
            <div 
              v-if="selectedProvider === provider.id" 
              class="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full flex items-center justify-center"
            >
              <Check :size="10" class="text-primary-foreground" />
            </div>
            
            <div class="text-2xl mb-2">{{ provider.emoji }}</div>
            <div class="font-medium text-sm">{{ provider.name }}</div>
            <div class="text-xs text-muted-foreground mt-1">{{ provider.subtitle }}</div>
          </button>
        </div>
      </div>

      <!-- Custom Providers Section -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h5 class="text-sm font-medium text-muted-foreground">Custom Providers</h5>
          <button
            @click="showAddCustomProviderForm = true"
            class="text-xs px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors flex items-center gap-1"
          >
            <Plus :size="12" />
            Add Custom Provider
          </button>
        </div>
        
        <div v-if="customProviders.length === 0" class="text-center py-6 bg-muted/20 rounded-lg border-2 border-dashed border-muted">
          <div class="text-muted-foreground">
            <Server :size="24" class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">No custom providers configured</p>
          </div>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="provider in customProviders"
            :key="provider.id"
            @click="selectProvider(provider.id)"
            :class="[
              'provider-card custom-provider group relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer',
              selectedProvider === provider.id
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                : 'border-muted hover:border-muted-foreground/50 hover:bg-muted/30'
            ]"
          >
            <!-- Selection and Status Indicators -->
            <div class="absolute top-2 right-2 flex items-center gap-2">
              <div 
                v-if="selectedProvider === provider.id" 
                class="w-2 h-2 bg-primary rounded-full animate-pulse"
              />
              <div 
                :class="[
                  'w-2 h-2 rounded-full',
                  provider.status === 'connected' ? 'bg-green-500' :
                  provider.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                ]"
              />
            </div>
            
            <div class="pr-6">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-lg">{{ provider.icon || '🔧' }}</span>
                <div class="font-medium text-sm truncate">{{ provider.displayName }}</div>
              </div>
              <div class="text-xs text-muted-foreground truncate">{{ getHostFromUrl(provider.configuration?.baseUrl || '') }}</div>
            </div>
            
            <!-- Quick Actions -->
            <div class="mt-2 pt-2 border-t border-muted/30 flex gap-1">
              <button
                @click.stop="editCustomProvider(provider)"
                class="text-xs px-2 py-1 bg-secondary/50 hover:bg-secondary rounded transition-colors"
                title="Edit provider"
              >
                <Edit2 :size="12" />
              </button>
              <button
                @click.stop="testCustomProvider(provider.id)"
                class="text-xs px-2 py-1 bg-secondary/50 hover:bg-secondary rounded transition-colors"
                title="Test connection"
              >
                <Zap :size="12" />
              </button>
              <button
                @click.stop="deleteCustomProvider(provider.id)"
                class="text-xs px-2 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded transition-colors ml-auto"
                title="Delete provider"
              >
                <Trash2 :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Configuration Section for Selected Provider -->
    <div v-if="selectedProvider" class="border-t pt-6">
      <h4 class="text-lg font-medium mb-4">Provider Configuration</h4>
      
      <!-- Built-in Provider Configuration -->
      <div v-if="isBuiltInProvider(selectedProvider)" class="space-y-4">
        <!-- API Key -->
        <div v-if="selectedProvider !== 'ollama'">
          <label class="block text-sm font-medium mb-2">
            API Key
            <span class="text-red-500 ml-1">*</span>
          </label>
          <div class="relative">
            <input
              :value="apiKey"
              @input="$emit('update:apiKey', ($event.target as HTMLInputElement).value)"
              :type="showApiKey ? 'text' : 'password'"
              placeholder="Enter your API key..."
              class="w-full px-3 py-2.5 pr-10 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
            <button
              @click="showApiKey = !showApiKey"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/50 rounded transition-colors"
            >
              <Eye v-if="!showApiKey" :size="16" />
              <EyeOff v-else :size="16" />
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            {{ getApiKeyHelpText(selectedProvider) }}
          </p>
        </div>
        
        <!-- Base URL Override -->
        <div>
          <label class="block text-sm font-medium mb-2">
            Base URL
            <span class="text-muted-foreground text-xs ml-1">(optional - for custom endpoints)</span>
          </label>
          <input
            :value="baseUrl"
            @input="$emit('update:baseUrl', ($event.target as HTMLInputElement).value)"
            type="url"
            :placeholder="getDefaultBaseURL(selectedProvider)"
            class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <p class="text-xs text-muted-foreground mt-1">
            Leave empty to use the default endpoint
          </p>
        </div>

        <!-- Model Selection -->
        <div v-if="selectedProvider === 'ollama'">
          <label class="block text-sm font-medium mb-2">
            Model Name
            <span class="text-red-500 ml-1">*</span>
          </label>
          <input
            :value="model"
            @input="$emit('update:model', ($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="llama2, mistral, codellama, etc."
            class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            required
          />
          <p class="text-xs text-muted-foreground mt-1">
            Make sure the model is downloaded in Ollama (e.g., `ollama pull llama2`)
          </p>
        </div>

        <div v-else-if="selectedProvider === 'openai'">
          <label class="block text-sm font-medium mb-2">Model</label>
          <select
            v-if="!showCustomModelInput"
            :value="model || 'gpt-4'"
            @change="handleModelChange($event)"
            class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="custom">Custom Model...</option>
          </select>
          <div v-else class="space-y-2">
            <input
              :value="model"
              @input="$emit('update:model', ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="Enter custom model name (e.g., gpt-4-1106-preview)"
              class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              autofocus
            />
            <button
              @click="showCustomModelInput = false; $emit('update:model', 'gpt-4')"
              class="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to preset models
            </button>
          </div>
        </div>
      </div>

      <!-- Custom Provider Info Display -->
      <div v-else class="bg-muted/30 rounded-lg p-4 space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-2xl">{{ getCustomProvider(selectedProvider)?.icon || '🔧' }}</span>
          <div>
            <div class="font-medium">{{ getCustomProvider(selectedProvider)?.displayName }}</div>
            <div class="text-sm text-muted-foreground">{{ getCustomProvider(selectedProvider)?.description || 'Custom provider' }}</div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-muted-foreground">Base URL:</span>
            <div class="font-mono text-xs mt-1 p-2 bg-background rounded">
              {{ getCustomProvider(selectedProvider)?.configuration?.baseUrl || 'Not configured' }}
            </div>
          </div>
          <div>
            <span class="text-muted-foreground">Models:</span>
            <div class="mt-1">
              {{ getCustomProvider(selectedProvider)?.models?.length || 0 }} configured
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-2 border-t border-muted">
          <button
            @click="editCustomProvider(getCustomProvider(selectedProvider))"
            class="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
          >
            <Edit2 :size="14" class="inline mr-1" />
            Edit Configuration
          </button>
          <button
            @click="testCustomProvider(selectedProvider)"
            class="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
          >
            <Zap :size="14" class="inline mr-1" />
            Test Connection
          </button>
        </div>
      </div>
    </div>

    <!-- Add Custom Provider Form (Inline) -->
    <div v-if="showAddCustomProviderForm" class="border-t pt-6">
      <div class="bg-muted/30 rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-medium">Add Custom Provider</h4>
          <button
            @click="cancelAddCustomProvider"
            class="p-2 hover:bg-accent/50 rounded-lg transition-colors"
          >
            <X :size="16" />
          </button>
        </div>

        <InlineProviderForm
          :provider="editingProvider"
          @save="handleCustomProviderSave"
          @cancel="cancelAddCustomProvider"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Plus, 
  Check, 
  Eye, 
  EyeOff, 
  Server,
  Edit2,
  Zap,
  Trash2,
  X
} from 'lucide-vue-next'
import InlineProviderForm from './InlineProviderForm.vue'
import type { LLMProvider } from '../../types/api'

interface Props {
  provider: string
  apiKey: string
  baseUrl: string
  model: string
  customProviders: LLMProvider[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:provider': [value: string]
  'update:apiKey': [value: string] 
  'update:baseUrl': [value: string]
  'update:model': [value: string]
  'provider-selected': [config: any]
  'custom-provider-added': [provider: LLMProvider]
  'custom-provider-updated': [provider: LLMProvider] 
  'custom-provider-deleted': [providerId: string]
  'custom-provider-tested': [providerId: string]
}>()

// State
const showApiKey = ref(false)
const showAddCustomProviderForm = ref(false)
const editingProvider = ref<LLMProvider | null>(null)
const showCustomModelInput = ref(false)

// Built-in providers configuration
const builtInProviders = [
  { id: 'openai', name: 'OpenAI', emoji: '🤖', subtitle: 'GPT Models' },
  { id: 'anthropic', name: 'Claude', emoji: '🧠', subtitle: 'Anthropic' },
  { id: 'google', name: 'Google', emoji: '🔍', subtitle: 'Gemini' },
  { id: 'ollama', name: 'Ollama', emoji: '🦙', subtitle: 'Local Models' }
]

// Computed
const selectedProvider = computed({
  get: () => props.provider,
  set: (value) => emit('update:provider', value)
})

// Methods
const isBuiltInProvider = (providerId: string): boolean => {
  return builtInProviders.some(p => p.id === providerId)
}

const getCustomProvider = (providerId: string): LLMProvider | undefined => {
  return props.customProviders.find(p => p.id === providerId)
}

const getProviderDisplayName = (providerId: string): string => {
  const builtIn = builtInProviders.find(p => p.id === providerId)
  if (builtIn) return builtIn.name
  
  const custom = getCustomProvider(providerId)
  return custom?.displayName || providerId
}

const getHostFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const getDefaultBaseURL = (providerId: string): string => {
  const defaults: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com',
    google: 'https://generativelanguage.googleapis.com/v1beta',
    ollama: 'http://localhost:11434'
  }
  return defaults[providerId] || ''
}

const getApiKeyHelpText = (providerId: string): string => {
  const helpTexts: Record<string, string> = {
    openai: 'Get your API key from https://platform.openai.com/api-keys',
    anthropic: 'Get your API key from https://console.anthropic.com/',
    google: 'Get your API key from https://makersuite.google.com/app/apikey'
  }
  return helpTexts[providerId] || 'Enter your API key for this provider'
}

const selectProvider = (providerId: string) => {
  selectedProvider.value = providerId
  
  // Emit provider configuration
  const config = isBuiltInProvider(providerId)
    ? {
        provider: providerId,
        apiKey: props.apiKey,
        baseUrl: props.baseUrl,
        model: props.model
      }
    : getCustomProvider(providerId)
  
  emit('provider-selected', config)
}

const editCustomProvider = (provider: LLMProvider | undefined) => {
  if (provider) {
    editingProvider.value = provider
    showAddProviderForm.value = true
  }
}

const testCustomProvider = (providerId: string) => {
  emit('custom-provider-tested', providerId)
}

const deleteCustomProvider = (providerId: string) => {
  if (confirm('Are you sure you want to delete this provider?')) {
    emit('custom-provider-deleted', providerId)
    
    // If deleted provider was selected, clear selection
    if (selectedProvider.value === providerId) {
      selectedProvider.value = ''
    }
  }
}

const handleProviderSave = (providerData: LLMProvider) => {
  if (editingProvider.value) {
    emit('custom-provider-updated', providerData)
  } else {
    emit('custom-provider-added', providerData)
  }
  
  cancelAddProvider()
  
  // Auto-select the new/updated provider
  selectedProvider.value = providerData.id
}

const handleModelChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'custom') {
    showCustomModelInput.value = true
    emit('update:model', '')
  } else {
    emit('update:model', value)
  }
}

const cancelAddCustomProvider = () => {
  showAddCustomProviderForm.value = false
  editingProvider.value = null
}

const handleCustomProviderSave = (provider: LLMProvider) => {
  if (editingProvider.value) {
    emit('custom-provider-updated', provider)
  } else {
    emit('custom-provider-added', provider)
  }
  
  cancelAddCustomProvider()
}

// Watch for provider changes to emit selection
watch(() => props.provider, (newProvider) => {
  if (newProvider) {
    selectProvider(newProvider)
  }
}, { immediate: true })

// Watch for model changes to detect custom model
watch(() => props.model, (newModel) => {
  if (newModel && selectedProvider.value === 'openai') {
    // Check if the model is not one of the presets
    const presetModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
    if (!presetModels.includes(newModel)) {
      showCustomModelInput.value = true
    }
  }
}, { immediate: true })
</script>

<style scoped>
.provider-card {
  position: relative;
  overflow: hidden;
  min-height: 80px;
}

.provider-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, hsl(var(--primary)), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s;
}

.provider-card:hover::before {
  transform: translateX(100%);
}

.custom-provider {
  min-height: 100px;
}

/* Mobile responsive improvements */
@media (max-width: 640px) {
  .provider-card {
    min-height: 70px;
    padding: 12px;
  }
  
  .custom-provider {
    min-height: 90px;
  }
  
  .grid.grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .grid.md\\:grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Better touch targets on mobile */
@media (max-width: 768px) {
  button {
    min-height: 44px;
    padding: 12px 16px;
  }
  
  input, select {
    min-height: 44px;
    font-size: 16px; /* Prevents zoom on iOS */
  }
}

/* Enhanced visual feedback */
.provider-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb, 0, 0, 0), 0.1);
}

/* Status indicators */
.provider-card.border-primary {
  box-shadow: 0 0 0 1px hsl(var(--primary)), 0 4px 12px rgba(var(--primary-rgb, 0, 0, 0), 0.15);
}
</style>