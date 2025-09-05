<template>
  <div class="unified-provider-config space-y-6">
    <!-- Provider Selection Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-lg font-medium">Select Provider</h4>
        <div v-if="selectedProvider" class="text-sm text-muted-foreground">
          Current: {{ getProviderDisplayName(selectedProvider) }} ({{ selectedProvider }})
        </div>
      </div>

      <!-- Built-in Providers Grid -->
      <div>
        <h5 class="text-sm font-medium mb-3 text-muted-foreground">Built-in Providers</h5>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            v-for="provider in builtInProviders"
            :key="provider.id"
            @click.prevent="selectProvider(provider.id)"
            :class="[
              'provider-card group relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
              selectedProvider === provider.id
                ? 'border-primary border-4 bg-primary/15 shadow-lg shadow-primary/25 ring-4 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:bg-secondary/50 hover:shadow-md'
            ]"
            :title="`Select ${provider.name} - Currently: ${selectedProvider === provider.id ? 'Selected' : 'Not selected'}`"
            type="button"
            aria-label="按钮"
          >
            <!-- Selection Indicator -->
            <div
              v-if="selectedProvider === provider.id"
              class="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-lg z-10"
            >
              <Check :size="12" class="text-primary-foreground font-bold" />
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
            aria-label="按钮"
          >
            <Plus :size="12" />
            Add Custom Provider
          </button>
        </div>

        <div
          v-if="customProviders.length === 0"
          class="text-center py-6 bg-muted/20 rounded-lg border-2 border-dashed border-muted"
        >
          <div class="text-muted-foreground">
            <Server :size="24" class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">No custom providers configured</p>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            v-for="provider in customProviders"
            :key="provider.id"
            @click.prevent="selectProvider(provider.id)"
            :class="[
              'provider-card custom-provider group relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer',
              selectedProvider === provider.id
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                : 'border-muted hover:border-muted-foreground/50 hover:bg-muted/30'
            ]"
            type="button"
            aria-label="按钮"
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
                  provider.status === 'connected'
                    ? 'bg-green-500'
                    : provider.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                ]"
              />
            </div>

            <div class="pr-6">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-lg">{{ provider.icon || '🔧' }}</span>
                <div class="font-medium text-sm truncate">{{ provider.displayName }}</div>
              </div>
              <div class="text-xs text-muted-foreground truncate">
                {{ getHostFromUrl(provider.configuration?.baseUrl || '') }}
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-2 pt-2 border-t border-muted/30 flex gap-1">
              <button
                @click.stop="editCustomProvider(provider)"
                class="text-xs px-2 py-1 bg-secondary/50 hover:bg-secondary rounded transition-colors"
                title="Edit provider"
                aria-label="按钮"
              >
                <Edit2 :size="12" />
              </button>
              <button
                @click.stop="testCustomProvider(provider.id)"
                class="text-xs px-2 py-1 bg-secondary/50 hover:bg-secondary rounded transition-colors"
                title="Test connection"
                aria-label="按钮"
              >
                <Zap :size="12" />
              </button>
              <button
                @click.stop="deleteCustomProvider(provider.id)"
                class="text-xs px-2 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded transition-colors ml-auto"
                title="Delete provider"
                aria-label="按钮"
              >
                <Trash2 :size="12" />
              </button>
            </div>
          </button>
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
              id="input-8w8d45ubm"
              :value="apiKey"
              @input="$emit('update:apiKey', ($event.target as HTMLInputElement).value)"
              :type="showApiKey ? 'text' : 'password'"
              placeholder="Enter your API key..."
              class="w-full px-3 py-2.5 pr-10 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
              aria-label="输入框"
            />
            <button
              @click="showApiKey = !showApiKey"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/50 rounded transition-colors"
              aria-label="按钮"
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
            <span class="text-muted-foreground text-xs ml-1"
              >(optional - for custom endpoints)</span
            >
          </label>
          <input
            id="input-7qgwvbddt"
            :value="baseUrl"
            @input="$emit('update:baseUrl', ($event.target as HTMLInputElement).value)"
            type="url"
            :placeholder="getDefaultBaseURL(selectedProvider)"
            class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            aria-label="输入框"
          />
          <p class="text-xs text-muted-foreground mt-1">Leave empty to use the default endpoint</p>
        </div>

        <!-- Model Selection -->
        <div v-if="selectedProvider === 'ollama'">
          <label class="block text-sm font-medium mb-2">
            Model Name
            <span class="text-red-500 ml-1">*</span>
          </label>
          <input
            id="input-tcq1t8xc8"
            :value="model"
            @input="$emit('update:model', ($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="llama2, mistral, codellama, etc."
            class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            required
            aria-label="输入框"
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
              id="input-v04p4jqji"
              :value="model"
              @input="$emit('update:model', ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="Enter custom model name (e.g., gpt-4-1106-preview)"
              class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              autofocus
              aria-label="输入框"
            />
            <button
              @click="((showCustomModelInput = false), $emit('update:model', 'gpt-4'))"
              class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="按钮"
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
            <div class="text-sm text-muted-foreground">
              {{ getCustomProvider(selectedProvider)?.description || 'Custom provider' }}
            </div>
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
            aria-label="按钮"
          >
            <Edit2 :size="14" class="inline mr-1" />
            Edit Configuration
          </button>
          <button
            @click="testCustomProvider(selectedProvider)"
            class="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
            aria-label="按钮"
          >
            <Zap :size="14" class="inline mr-1" />
            Test Connection
          </button>
        </div>
      </div>
    </div>

    <!-- Add Custom Provider Form (Modal Style) -->
    <div
      v-if="showAddCustomProviderForm"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        class="bg-background rounded-xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div
          class="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 flex items-center justify-between"
        >
          <h4 class="text-lg font-medium">
            {{ editingProvider ? 'Edit Provider' : 'Add Custom Provider' }}
          </h4>
          <button
            @click="cancelAddCustomProvider"
            class="p-2 hover:bg-accent/50 rounded-lg transition-colors"
            aria-label="按钮"
          >
            <X :size="16" />
          </button>
        </div>

        <div class="p-4">
          <InlineProviderForm
            :provider="editingProvider"
            @save="handleCustomProviderSave"
            @cancel="cancelAddCustomProvider"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Check, Eye, EyeOff, Server, Edit2, Zap, Trash2, X } from 'lucide-vue-next'
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
  get: () => {
    console.log('Getting selectedProvider:', props.provider)
    return props.provider
  },
  set: value => {
    console.log('Setting selectedProvider:', value)
    emit('update:provider', value)
  }
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
  console.log('Selecting provider:', providerId)

  // First emit the provider update to parent
  emit('update:provider', providerId)

  // Then emit provider configuration
  const config = isBuiltInProvider(providerId)
    ? {
        provider: providerId,
        id: providerId,
        apiKey: props.apiKey,
        baseUrl: props.baseUrl,
        baseURL: props.baseUrl, // Also include baseURL for compatibility
        model: props.model
      }
    : getCustomProvider(providerId)

  console.log('Emitting provider config:', config)
  emit('provider-selected', config)
}

const editCustomProvider = (provider: LLMProvider | undefined) => {
  if (provider) {
    editingProvider.value = provider
    showAddCustomProviderForm.value = true
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

  cancelAddCustomProvider()

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

// Watch for provider changes (removed selectProvider call to avoid circular updates)
watch(
  () => props.provider,
  newProvider => {
    console.log('Provider prop changed to:', newProvider)
  },
  { immediate: true }
)

// Watch for model changes to detect custom model
watch(
  () => props.model,
  newModel => {
    if (newModel && selectedProvider.value === 'openai') {
      // Check if the model is not one of the presets
      const presetModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
      if (!presetModels.includes(newModel)) {
        showCustomModelInput.value = true
      }
    }
  },
  { immediate: true }
)
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

  input,
  select {
    min-height: 44px;
    font-size: 16px; /* Prevents zoom on iOS */
  }
}

/* Enhanced visual feedback */
.provider-card {
  cursor: pointer !important;
  user-select: none;
  background: hsl(var(--card));
  pointer-events: auto !important;
  position: relative;
  z-index: 1;
}

.provider-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  background: hsl(var(--accent));
  z-index: 2;
}

.provider-card:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background: hsl(var(--primary) / 0.1);
}

/* Status indicators */
.provider-card.border-primary {
  box-shadow:
    0 0 0 1px hsl(var(--primary)),
    0 4px 12px rgba(var(--primary-rgb, 0, 0, 0), 0.15);
  z-index: 3;
}

/* Ensure all interactive elements work properly */
.provider-card /* 通用选择器 - 已优化 */
/* 通用选择器 - 已优化 */
* {
  pointer-events: none;
}

.provider-card button {
  pointer-events: auto !important;
  z-index: 10;
  position: relative;
}

/* Fix for mobile touch */
@media (max-width: 768px) {
  .provider-card {
    touch-action: manipulation;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  }

  .provider-card:active {
    background: hsl(var(--primary) / 0.2) !important;
    transform: scale(0.98);
  }
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
    transition-duration: 0.01ms !important;
  }
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
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
}

/* 🎨 微交互和动画 */
.btn-primary {
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition:
    width 0.3s ease,
    height 0.3s ease;
}

.btn-primary:active::before {
  width: 300px;
  height: 300px;
}

/* 悬停效果 */
.hover-lift {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 加载动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid hsl(var(--border));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 淡入动画 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fade-in 0.3s ease-out;
}

/* 成功状态动画 */
@keyframes success-bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.success-animation {
  animation: success-bounce 1s ease;
}
</style>
