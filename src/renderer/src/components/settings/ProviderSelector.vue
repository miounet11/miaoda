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
            aria-label="按钮"
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
            aria-label="按钮"
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
              aria-label="按钮"
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
                aria-label="按钮"
              >
                Edit
              </button>
              <button
                @click.stop="testProvider(provider)"
                class="text-xs px-2 py-1 bg-secondary/50 hover:bg-secondary rounded transition-colors"
                aria-label="按钮"
              >
                Test
              </button>
              <button
                @click.stop="deleteProvider(provider)"
                class="text-xs px-2 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded transition-colors ml-auto"
                aria-label="按钮"
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
                id="input-ocmxivkj3"
                v-model="apiKey"
                :type="showApiKey ? 'text' : 'password'"
                placeholder="Enter your API key..."
                class="w-full px-3 py-2 pr-10 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="输入框"
              />
              <button
                @click="showApiKey = !showApiKey"
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                aria-label="按钮"
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
              id="input-zc53h9a22"
              v-model="baseURL"
              type="url"
              :placeholder="getDefaultBaseURL(selectedProviderId)"
              class="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="输入框"
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
                id="input-mgnnsm9x4"
                v-if="selectedModel === 'custom'"
                v-model="customModel"
                type="text"
                placeholder="Enter model name"
                class="flex-1 px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="输入框"
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
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
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
  background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
