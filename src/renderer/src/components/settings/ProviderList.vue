<template>
  <div class="provider-list">
    <!-- Header with Add Button -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-xl font-semibold">Custom Providers</h3>
        <p class="text-muted-foreground text-sm mt-1">
          Manage your custom LLM providers and API configurations
        </p>
      </div>
      <button
        @click="showAddProvider = true"
        class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        aria-label="按钮"
      >
        <Plus :size="18" />
        <span>Add Provider</span>
      </button>
    </div>

    <!-- Providers Grid -->
    <div v-if="providers.length > 0" class="space-y-4">
      <!-- Drag and Drop Container -->
      <div ref="sortableContainer" class="space-y-3">
        <div
          v-for="(provider, index) in sortedProviders"
          :key="provider.id"
          :data-provider-id="provider.id"
          class="provider-item group relative bg-muted/30 rounded-lg border-2 border-transparent hover:border-primary/20 transition-all duration-200"
          :class="{
            'border-green-500/30 bg-green-500/5': provider.status === 'connected',
            'border-yellow-500/30 bg-yellow-500/5': provider.status === 'configuring',
            'border-red-500/30 bg-red-500/5': provider.status === 'error',
            'opacity-50': !provider.enabled,
            'cursor-move': isDraggable
          }"
        >
          <!-- Drag Handle -->
          <div
            v-if="isDraggable && providers.length > 1"
            class="drag-handle absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
          >
            <GripVertical :size="16" class="text-muted-foreground" />
          </div>

          <!-- Provider Content -->
          <div class="p-4" :class="{ 'pl-8': isDraggable && providers.length > 1 }">
            <div class="flex items-start justify-between">
              <!-- Provider Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-2">
                  <div class="text-2xl">{{ provider.icon }}</div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="font-semibold text-lg truncate">{{ provider.displayName }}</h4>
                      <StatusIndicator :status="provider.status" :size="'sm'" />
                    </div>
                    <p class="text-sm text-muted-foreground">{{ provider.name }}</p>
                  </div>
                </div>

                <div class="space-y-2">
                  <p v-if="provider.description" class="text-sm text-muted-foreground">
                    {{ provider.description }}
                  </p>

                  <!-- Provider Details -->
                  <div class="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span v-if="provider.configuration.baseUrl" class="flex items-center gap-1">
                      <Globe :size="12" />
                      {{ getHostFromUrl(provider.configuration.baseUrl) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Bot :size="12" />
                      {{ provider.models.length }} models
                    </span>
                    <span v-if="provider.configuration.apiKey" class="flex items-center gap-1">
                      <Key :size="12" />
                      API Key configured
                    </span>
                  </div>

                  <!-- Capabilities -->
                  <div class="flex flex-wrap gap-2 mt-2">
                    <CapabilityBadge
                      v-for="capability in getActiveCapabilities(provider.capabilities)"
                      :key="capability"
                      :capability="capability"
                    />
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 ml-4">
                <!-- Enable/Disable Toggle -->
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    id="input-kq6s0u7pu"
                    type="checkbox"
                    :checked="provider.enabled"
                    @change="toggleProvider(provider.id, $event.target.checked)"
                    class="sr-only peer"
                    aria-label="输入框"
                  />
                  <div
                    class="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary/80 transition-colors"
                  />
                  <div
                    class="absolute left-0.5 top-0.5 bg-background w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5"
                  />
                </label>

                <!-- Test Connection -->
                <button
                  @click="testProvider(provider)"
                  :disabled="!provider.enabled || provider.status === 'configuring'"
                  class="p-2 hover:bg-accent/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :title="provider.enabled ? 'Test connection' : 'Enable provider first'"
                  aria-label="按钮"
                >
                  <Zap v-if="!isTestingProvider(provider.id)" :size="16" />
                  <Loader2 v-else :size="16" class="animate-spin" />
                </button>

                <!-- Edit -->
                <button
                  @click="editProvider(provider)"
                  class="p-2 hover:bg-accent/50 rounded-lg transition-colors"
                  title="Edit provider"
                  aria-label="按钮"
                >
                  <Edit2 :size="16" />
                </button>

                <!-- Delete -->
                <button
                  @click="showDeleteConfirm(provider)"
                  class="p-2 hover:bg-red-500/10 text-red-600 rounded-lg transition-colors"
                  title="Delete provider"
                  aria-label="按钮"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div
        v-if="selectedProviders.length > 0"
        class="flex items-center gap-3 p-3 bg-accent/30 rounded-lg border"
      >
        <span class="text-sm font-medium">{{ selectedProviders.length }} providers selected</span>
        <div class="flex gap-2">
          <button
            @click="bulkEnable"
            class="text-xs px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
            aria-label="按钮"
          >
            Enable All
          </button>
          <button
            @click="bulkDisable"
            class="text-xs px-3 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
            aria-label="按钮"
          >
            Disable All
          </button>
          <button
            @click="bulkDelete"
            class="text-xs px-3 py-1 bg-red-500/10 text-red-600 rounded hover:bg-red-500/20 transition-colors"
            aria-label="按钮"
          >
            Delete All
          </button>
        </div>
        <button
          @click="clearSelection"
          class="ml-auto p-1 hover:bg-accent/50 rounded transition-colors"
          aria-label="按钮"
        >
          <X :size="14" />
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20"
    >
      <Bot :size="48" class="mx-auto mb-4 text-muted-foreground" />
      <h3 class="text-lg font-semibold mb-2">No custom providers</h3>
      <p class="text-muted-foreground mb-6 max-w-md mx-auto">
        Add custom LLM providers to extend your AI capabilities beyond the default options.
      </p>
      <button
        @click="showAddProvider = true"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        aria-label="按钮"
      >
        Add Your First Provider
      </button>
    </div>

    <!-- Add/Edit Provider Modal -->
    <ProviderForm
      v-if="showAddProvider || editingProvider"
      :provider="editingProvider"
      :is-open="showAddProvider || !!editingProvider"
      @close="closeProviderForm"
      @save="saveProvider"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmDialog
      v-if="providerToDelete"
      :is-open="!!providerToDelete"
      title="Delete Provider"
      :message="`Are you sure you want to delete ${providerToDelete.displayName}? This action cannot be undone.`"
      confirm-text="Delete"
      confirm-variant="destructive"
      @confirm="confirmDelete"
      @cancel="providerToDelete = null"
    />

    <!-- Bulk Delete Confirmation -->
    <ConfirmDialog
      v-if="showBulkDeleteConfirm"
      :is-open="showBulkDeleteConfirm"
      title="Delete Multiple Providers"
      :message="`Are you sure you want to delete ${selectedProviders.length} providers? This action cannot be undone.`"
      confirm-text="Delete All"
      confirm-variant="destructive"
      @confirm="confirmBulkDelete"
      @cancel="showBulkDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import {
  Plus,
  Edit2,
  Trash2,
  Bot,
  Globe,
  Key,
  Zap,
  Loader2,
  GripVertical,
  X
} from 'lucide-vue-next'
import type { LLMProvider, ProviderStatus } from '@renderer/src/types/api'
import ProviderForm from './ProviderForm.vue'
import StatusIndicator from './StatusIndicator.vue'
import CapabilityBadge from './CapabilityBadge.vue'
import ConfirmDialog from '../ui/ConfirmDialog.vue'
import Sortable from 'sortablejs'

interface Props {
  providers?: LLMProvider[]
  draggable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  providers: () => [],
  draggable: true
})

const emit = defineEmits<{
  'provider-added': [provider: LLMProvider]
  'provider-updated': [provider: LLMProvider]
  'provider-deleted': [providerId: string]
  'provider-toggled': [providerId: string, enabled: boolean]
  'provider-tested': [providerId: string]
  'providers-reordered': [providerIds: string[]]
}>()

// State
const showAddProvider = ref(false)
const editingProvider = ref<LLMProvider | null>(null)
const providerToDelete = ref<LLMProvider | null>(null)
const showBulkDeleteConfirm = ref(false)
const selectedProviders = ref<string[]>([])
const testingProviders = ref<Set<string>>(new Set())
const sortableContainer = ref<HTMLElement>()
const sortableInstance = ref<any>(null)

// Computed
const isDraggable = computed(() => props.draggable && props.providers.length > 1)

const sortedProviders = computed(() => {
  return [...props.providers].sort((a, b) => {
    // Enabled providers first
    if (a.enabled !== b.enabled) {
      return a.enabled ? -1 : 1
    }
    // Then by status (connected > configuring > error > disconnected)
    const statusOrder = { connected: 0, configuring: 1, error: 2, disconnected: 3 }
    const aOrder = statusOrder[a.status] ?? 99
    const bOrder = statusOrder[b.status] ?? 99
    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }
    // Finally by name
    return a.displayName.localeCompare(b.displayName)
  })
})

// Methods
const getHostFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const getActiveCapabilities = (capabilities: any): string[] => {
  return Object.entries(capabilities)
    .filter(([_, enabled]) => enabled)
    .map(([capability]) => capability)
    .slice(0, 4) // Limit to 4 badges
}

const isTestingProvider = (providerId: string): boolean => {
  return testingProviders.value.has(providerId)
}

const toggleProvider = async (providerId: string, enabled: boolean) => {
  emit('provider-toggled', providerId, enabled)
}

const testProvider = async (provider: LLMProvider) => {
  testingProviders.value.add(provider.id)
  try {
    emit('provider-tested', provider.id)
  } finally {
    // Remove from testing set after a delay
    setTimeout(() => {
      testingProviders.value.delete(provider.id)
    }, 2000)
  }
}

const editProvider = (provider: LLMProvider) => {
  editingProvider.value = { ...provider }
}

const showDeleteConfirm = (provider: LLMProvider) => {
  providerToDelete.value = provider
}

const confirmDelete = () => {
  if (providerToDelete.value) {
    emit('provider-deleted', providerToDelete.value.id)
    providerToDelete.value = null
  }
}

const closeProviderForm = () => {
  showAddProvider.value = false
  editingProvider.value = null
}

const saveProvider = (provider: LLMProvider) => {
  if (editingProvider.value) {
    emit('provider-updated', provider)
  } else {
    emit('provider-added', provider)
  }
  closeProviderForm()
}

// Bulk operations
const bulkEnable = () => {
  selectedProviders.value.forEach(providerId => {
    emit('provider-toggled', providerId, true)
  })
  clearSelection()
}

const bulkDisable = () => {
  selectedProviders.value.forEach(providerId => {
    emit('provider-toggled', providerId, false)
  })
  clearSelection()
}

const bulkDelete = () => {
  showBulkDeleteConfirm.value = true
}

const confirmBulkDelete = () => {
  selectedProviders.value.forEach(providerId => {
    emit('provider-deleted', providerId)
  })
  clearSelection()
  showBulkDeleteConfirm.value = false
}

const clearSelection = () => {
  selectedProviders.value = []
}

// Drag and Drop
const initSortable = () => {
  if (!sortableContainer.value || !isDraggable.value) return

  sortableInstance.value = Sortable.create(sortableContainer.value, {
    handle: '.drag-handle',
    ghostClass: 'opacity-50',
    chosenClass: 'ring-2 ring-primary/30',
    dragClass: 'rotate-2 scale-105',
    animation: 200,
    onEnd: evt => {
      const providerIds = Array.from(sortableContainer.value?.children || [])
        .map(el => el.getAttribute('data-provider-id'))
        .filter(Boolean) as string[]

      if (evt.oldIndex !== evt.newIndex) {
        emit('providers-reordered', providerIds)
      }
    }
  })
}

const destroySortable = () => {
  if (sortableInstance.value) {
    sortableInstance.value.destroy()
    sortableInstance.value = null
  }
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  if (isDraggable.value) {
    initSortable()
  }
})

// Watch for draggable changes
watch(
  () => isDraggable.value,
  async newVal => {
    if (newVal) {
      await nextTick()
      initSortable()
    } else {
      destroySortable()
    }
  }
)

// Cleanup
onUnmounted(() => {
  destroySortable()
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
.provider-item {
  transition: all 0.2s ease;
}

.provider-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.1);
}

.provider-item.sortable-chosen {
  transform: rotate(2deg) scale(1.05);
}

.provider-item.sortable-ghost {
  opacity: 0.5;
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Custom toggle switch styling */
.peer:checked + div {
  background: rgba(var(--primary-rgb), 0.8);
}

.peer:focus + div {
  outline: 2px solid rgba(var(--primary-rgb), 0.3);
  outline-offset: 2px;
}

/* Status-based animations */
@keyframes pulse-green {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
  }
}

@keyframes pulse-yellow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(234, 179, 8, 0);
  }
}

@keyframes pulse-red {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.provider-item.border-green-500\/30 {
  animation: pulse-green 2s infinite;
}

.provider-item.border-yellow-500\/30 {
  animation: pulse-yellow 2s infinite;
}

.provider-item.border-red-500\/30 {
  animation: pulse-red 2s infinite;
}

/* Responsive improvements */
@media (max-width: 768px) {
  .provider-item .flex {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .provider-item .ml-4 {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }

  .drag-handle {
    position: relative;
    left: auto;
    top: auto;
    transform: none;
    opacity: 1;
    margin-bottom: 0.5rem;
  }

  .pl-8 {
    padding-left: 1rem;
  }
}

/* Improved focus states for accessibility */
button:focus-visible {
  outline: 2px solid rgba(var(--primary-rgb), 0.6);
  outline-offset: 2px;
}

input:focus-visible + div {
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
</style>
