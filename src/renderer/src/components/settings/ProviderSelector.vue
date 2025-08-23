<template>
  <div class="provider-selector">
    <!-- Provider Grid -->
    <div class="space-y-6">
      <!-- Built-in Providers -->
      <div>
        <h4 class="text-sm font-medium mb-3">Built-in Providers</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            v-for="provider in builtInProviders"
            :key="provider.id"
            @click="selectProvider(provider.id)"
            :class="[
              'provider-card group relative p-4 rounded-xl border-2 transition-all duration-200',
              selectedProviderId === provider.id
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                : 'border-muted hover:border-muted-foreground/50 hover:bg-muted/30'
            ]"
          >
            <!-- Status Indicator -->
            <div
              v-if="selectedProviderId === provider.id"
              class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse"
            />

            <div class="text-2xl mb-2">{{ provider.emoji }}</div>
            <div class="font-medium text-sm">{{ provider.name }}</div>
            <div class="text-xs text-muted-foreground mt-1">{{ provider.subtitle }}</div>
          </button>
        </div>
      </div>

      <!-- Custom Providers -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-medium">Custom Providers</h4>
          <button
            @click="showAddProvider = true"
            class="text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
          >
            + Add Provider
          </button>
        </div>

        <div
          v-if="customProviders.length === 0"
          class="text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed border-muted"
        >
          <div class="text-muted-foreground">
            <Plus :size="32" class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">No custom providers configured</p>
            <button
              @click="showAddProvider = true"
              class="mt-2 text-xs text-primary hover:underline"
            >
              Add your first custom provider
            </button>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="provider in customProviders"
            :key="provider.id"
            @click="selectProvider(provider.id)"
            :class="[
              'provider-card custom-provider group relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
              selectedProviderId === provider.id
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                : 'border-muted hover:border-muted-foreground/50 hover:bg-muted/30'
            ]"
          >
            <!-- Status Indicator -->
            <div class="absolute top-3 right-3 flex items-center gap-2">
              <div
                v-if="selectedProviderId === provider.id"
                class="w-2 h-2 bg-primary rounded-full animate-pulse"
              />
              <StatusIndicator :status="getProviderStatus(provider.id)" size="sm" />
            </div>

            <div class="pr-8">
              <div class="font-medium text-sm mb-1">{{ provider.displayName }}</div>
              <div class="text-xs text-muted-foreground truncate">{{ provider.baseURL }}</div>
              <div class="text-xs text-muted-foreground mt-2">
                Model: <span class="text-foreground">{{ provider.model }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-3 pt-3 border-t border-muted/50 flex gap-2">
              <button
                @click.stop="editProvider(provider)"
                class="text-xs px-2 py-1 bg-secondary/50 hover:bg-secondary rounded transition-colors"
              >
                Edit
              </button>
              <button
                @click.stop="testProvider(provider)"
                class="text-xs px-2 py-1 bg-secondary/50 hover:bg-secondary rounded transition-colors"
              >
                Test
              </button>
              <button
                @click.stop="deleteProvider(provider)"
                class="text-xs px-2 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded transition-colors ml-auto"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration Section for Selected Provider -->
      <div v-if="selectedProviderId" class="mt-6 p-4 bg-muted/20 rounded-lg">
        <h4 class="text-sm font-medium mb-3">Provider Configuration</h4>

        <!-- API Key for built-in providers -->
        <div v-if="!isCustomProvider(selectedProviderId)" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">API Key</label>
            <div class="relative">
              <input
                v-model="apiKey"
                :type="showApiKey ? 'text' : 'password'"
                placeholder="Enter your API key..."
                class="w-full px-3 py-2 pr-10 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                @click="showApiKey = !showApiKey"
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <Eye v-if="!showApiKey" :size="16" />
                <EyeOff v-else :size="16" />
              </button>
            </div>
          </div>

          <!-- Optional Base URL Override -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Base URL
              <span class="text-muted-foreground text-xs">(optional - for custom endpoints)</span>
            </label>
            <input
              v-model="baseURL"
              type="url"
              :placeholder="getDefaultBaseURL(selectedProviderId)"
              class="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <!-- Model Selection for providers that support it -->
          <div v-if="selectedProviderId === 'openai'">
            <label class="block text-sm font-medium mb-2">Model</label>
            <div class="flex gap-2">
              <select
                v-model="selectedModel"
                class="flex-1 px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="custom">Custom Model...</option>
              </select>
              <input
                v-if="selectedModel === 'custom'"
                v-model="customModel"
                type="text"
                placeholder="Enter model name"
                class="flex-1 px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <!-- Custom Provider Info -->
        <div v-else class="space-y-3">
          <div class="text-sm">
            <span class="text-muted-foreground">Type:</span>
            <span class="ml-2">{{ getCustomProvider(selectedProviderId)?.type }}</span>
          </div>
          <div class="text-sm">
            <span class="text-muted-foreground">Model:</span>
            <span class="ml-2">{{ getCustomProvider(selectedProviderId)?.model }}</span>
          </div>
          <div class="text-sm">
            <span class="text-muted-foreground">Base URL:</span>
            <span class="ml-2 text-xs font-mono">{{
              getCustomProvider(selectedProviderId)?.baseURL
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Provider Modal -->
    <ProviderForm
      v-if="showAddProvider || editingProvider"
      :provider="editingProvider"
      @save="handleProviderSave"
      @close="closeProviderForm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Eye, EyeOff } from 'lucide-vue-next'
import ProviderForm from './ProviderForm.vue'
import StatusIndicator from './StatusIndicator.vue'
import { useSettingsStore } from '@renderer/src/stores/settings'
import { CustomProviderService } from '@renderer/src/services/CustomProviderService'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'provider-selected': [config: any]
}>()

const settingsStore = useSettingsStore()
const customProviderService = CustomProviderService.getInstance()

const selectedProviderId = ref(props.modelValue)
const customProviders = ref<any[]>([])
const showAddProvider = ref(false)
const editingProvider = ref<any>(null)
const showApiKey = ref(false)
const apiKey = ref('')
const baseURL = ref('')
const selectedModel = ref('gpt-4')
const customModel = ref('')
const providerStatuses = ref<Map<string, string>>(new Map())

const builtInProviders = [
  { id: 'openai', name: 'OpenAI', emoji: '🤖', subtitle: 'GPT Models' },
  { id: 'anthropic', name: 'Claude', emoji: '🧠', subtitle: 'Anthropic' },
  { id: 'google', name: 'Google', emoji: '🔍', subtitle: 'Gemini' },
  { id: 'ollama', name: 'Ollama', emoji: '🦙', subtitle: 'Local Models' }
]

const isCustomProvider = (id: string) => {
  return !builtInProviders.some(p => p.id === id)
}

const getCustomProvider = (id: string) => {
  return customProviders.value.find(p => p.id === id)
}

const getDefaultBaseURL = (providerId: string) => {
  const defaults: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com',
    google: 'https://generativelanguage.googleapis.com',
    ollama: 'http://localhost:11434'
  }
  return defaults[providerId] || ''
}

const getProviderStatus = (providerId: string) => {
  return providerStatuses.value.get(providerId) || 'unknown'
}

const selectProvider = (providerId: string) => {
  selectedProviderId.value = providerId
  emit('update:modelValue', providerId)

  // Emit provider configuration
  const config = isCustomProvider(providerId)
    ? getCustomProvider(providerId)
    : {
        provider: providerId,
        apiKey: apiKey.value,
        baseURL: baseURL.value || undefined,
        model: selectedModel.value === 'custom' ? customModel.value : selectedModel.value
      }

  emit('provider-selected', config)
}

const editProvider = (provider: any) => {
  editingProvider.value = provider
}

const testProvider = async (provider: any) => {
  const result = await customProviderService.testProvider(provider.id)
  if (result.success) {
    providerStatuses.value.set(provider.id, 'healthy')
  } else {
    providerStatuses.value.set(provider.id, 'unhealthy')
  }
}

const deleteProvider = async (provider: any) => {
  if (confirm(`Delete provider "${provider.displayName}"?`)) {
    const result = await customProviderService.deleteProvider(provider.id)
    if (result.success) {
      await loadCustomProviders()
    }
  }
}

const handleProviderSave = async (providerData: any) => {
  if (editingProvider.value) {
    await customProviderService.updateProvider(editingProvider.value.id, providerData)
  } else {
    await customProviderService.createProvider(providerData)
  }
  await loadCustomProviders()
  closeProviderForm()
}

const closeProviderForm = () => {
  showAddProvider.value = false
  editingProvider.value = null
}

const loadCustomProviders = async () => {
  const result = await customProviderService.getAllProviders()
  if (result.success && result.data) {
    customProviders.value = result.data
  }
}

onMounted(() => {
  loadCustomProviders()
})
</script>

<style scoped>
.provider-card {
  position: relative;
  overflow: hidden;
}

.provider-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s;
}

.provider-card:hover::before {
  transform: translateX(100%);
}

.custom-provider {
  min-height: 140px;
}

/* Mobile responsive improvements */
@media (max-width: 640px) {
  .provider-card {
    min-height: 100px;
    padding: 12px;
  }

  .custom-provider {
    min-height: 120px;
  }

  .grid.grid-cols-1 {
    gap: 12px;
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
</style>
