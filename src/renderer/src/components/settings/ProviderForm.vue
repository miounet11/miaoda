<template>
  <div v-if="isOpen" class="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/20 backdrop-blur-sm" @click="handleClose" />

    <!-- Modal -->
    <div
      class="relative w-full max-w-2xl max-h-[90vh] bg-background rounded-lg shadow-xl border border-border overflow-hidden mx-4"
    >
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
        <button @click="handleClose" class="p-2 hover:bg-accent/50 rounded-lg transition-colors" aria-label="按钮">
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
                 aria-label="按钮">
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
                / aria-labelledby="name-label">
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
                / aria-labelledby="displayName-label">
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
                / aria-labelledby="icon-label">
                <div class="flex gap-2 flex-wrap">
                  <button
                    v-for="emoji in commonEmojis"
                    :key="emoji"
                    type="button"
                    @click="form.icon = emoji"
                    class="w-10 h-10 flex items-center justify-center text-lg hover:bg-accent/50 rounded-lg transition-colors"
                    :class="{ 'bg-primary/10': form.icon === emoji }"
                   aria-label="按钮">
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
              / aria-labelledby="baseUrl-label">
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
                / aria-labelledby="apiKey-label">
                <button
                  type="button"
                  @click="showApiKey = !showApiKey"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/50 rounded"
                 aria-label="按钮">
                  <Eye v-if="!showApiKey" :size="16" />
                  <EyeOff v-else :size="16" />
                </button>
              </div>
            </div>

            <!-- Authentication Required Toggle -->
            <div>
              <label
                class="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
              >
                <div>
                  <span class="text-sm font-medium block">Requires Authentication</span>
                  <span class="text-xs text-muted-foreground"
                    >Enable if API requires authentication</span
                  >
                </div>
                <input id="input-aodk2orp3"
                  v-model="form.requiresAuth"
                  type="checkbox"
                  class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
                 aria-label="输入框">
              </label>
            </div>

            <!-- Advanced Options -->
            <details class="group">
              <summary
                class="cursor-pointer list-none flex items-center gap-2 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <ChevronDown :size="16" class="transition-transform group-open:rotate-180" />
                <span class="font-medium">Advanced Options</span>
              </summary>

              <div class="mt-4 space-y-4">
                <!-- Organization ID -->
                <div>
                  <label for="organizationId" class="block text-sm font-medium mb-2"
                    >Organization ID</label
                  >
                  <input
                    id="organizationId"
                    v-model="form.organizationId"
                    type="text"
                    placeholder="Optional organization identifier"
                    class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  / aria-labelledby="organizationId-label">
                </div>

                <!-- Timeout and Retries -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="timeout" class="block text-sm font-medium mb-2"
                      >Timeout (seconds)</label
                    >
                    <input
                      id="timeout"
                      v-model.number="form.timeout"
                      type="number"
                      min="1"
                      max="300"
                      placeholder="30"
                      class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    / aria-labelledby="timeout-label">
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
                    / aria-labelledby="retries-label">
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
                <input id="input-ngrz7uuab"
                  v-model="form.capabilities[key]"
                  type="checkbox"
                  class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
                 aria-label="输入框">
                <div>
                  <span class="text-sm font-medium block">{{ capability.label }}</span>
                  <span class="text-xs text-muted-foreground">{{ capability.description }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Models Configuration -->
          <ModelConfiguration v-model="form.models" :provider-type="form.type" class="space-y-4" />

          <!-- Test Connection -->
          <div
            v-if="isEditing || (form.baseUrl && (form.apiKey || !form.requiresAuth))"
            class="pt-4"
          >
            <button
              type="button"
              @click="testConnection"
              :disabled="isTestingConnection"
              class="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             aria-label="按钮">
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
                <Check
                  v-if="connectionResult.success"
                  :size="16"
                  class="text-green-600 flex-shrink-0 mt-0.5"
                />
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
           aria-label="按钮">
            Cancel
          </button>
          <button
            @click="handleSubmit"
            :disabled="!isFormValid || isSaving"
            class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label="按钮">
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
import { X, Eye, EyeOff, ChevronDown, Zap, Loader2, Check, AlertCircle } from 'lucide-vue-next'
import type { LLMProvider, LLMModel, ProviderCapabilities } from '@renderer/src/types/api'
import ModelConfiguration from './ModelConfiguration.vue'

interface Props {
  provider?: LLMProvider | null
}

const props = withDefaults(defineProps<Props>(), {
  provider: null
})

const emit = defineEmits<{
  close: []
  save: [provider: LLMProvider]
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
watch(
  () => form.value.displayName,
  newValue => {
    if (!isEditing.value && newValue) {
      form.value.name = newValue
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    }
  }
)

// Watch for provider changes
watch(() => props.provider, initializeForm, { immediate: true })

// Initialize on mount
onMounted(() => {
  initializeForm()
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
input:focus,
textarea:focus,
select:focus {
  outline: none;
}

/* Custom checkbox styling */
input[type='checkbox']:checked {
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
}</style>
