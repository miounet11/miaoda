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
      >
        <Plus :size="18" />
        <span>Add Provider</span>
      </button>
    </div>

    <!-- Providers Grid -->
    <div v-if="providers.length > 0" class="space-y-4">
      <!-- Drag and Drop Container -->
      <div
        ref="sortableContainer"
        class="space-y-3"
      >
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
                    type="checkbox"
                    :checked="provider.enabled"
                    @change="toggleProvider(provider.id, $event.target.checked)"
                    class="sr-only peer"
                  >
                  <div class="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary/80 transition-colors" />
                  <div class="absolute left-0.5 top-0.5 bg-background w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
                </label>

                <!-- Test Connection -->
                <button
                  @click="testProvider(provider)"
                  :disabled="!provider.enabled || provider.status === 'configuring'"
                  class="p-2 hover:bg-accent/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :title="provider.enabled ? 'Test connection' : 'Enable provider first'"
                >
                  <Zap v-if="!isTestingProvider(provider.id)" :size="16" />
                  <Loader2 v-else :size="16" class="animate-spin" />
                </button>

                <!-- Edit -->
                <button
                  @click="editProvider(provider)"
                  class="p-2 hover:bg-accent/50 rounded-lg transition-colors"
                  title="Edit provider"
                >
                  <Edit2 :size="16" />
                </button>

                <!-- Delete -->
                <button
                  @click="showDeleteConfirm(provider)"
                  class="p-2 hover:bg-red-500/10 text-red-600 rounded-lg transition-colors"
                  title="Delete provider"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedProviders.length > 0" class="flex items-center gap-3 p-3 bg-accent/30 rounded-lg border">
        <span class="text-sm font-medium">{{ selectedProviders.length }} providers selected</span>
        <div class="flex gap-2">
          <button
            @click="bulkEnable"
            class="text-xs px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
          >
            Enable All
          </button>
          <button
            @click="bulkDisable"
            class="text-xs px-3 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
          >
            Disable All
          </button>
          <button
            @click="bulkDelete"
            class="text-xs px-3 py-1 bg-red-500/10 text-red-600 rounded hover:bg-red-500/20 transition-colors"
          >
            Delete All
          </button>
        </div>
        <button
          @click="clearSelection"
          class="ml-auto p-1 hover:bg-accent/50 rounded transition-colors"
        >
          <X :size="14" />
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
      <Bot :size="48" class="mx-auto mb-4 text-muted-foreground" />
      <h3 class="text-lg font-semibold mb-2">No custom providers</h3>
      <p class="text-muted-foreground mb-6 max-w-md mx-auto">
        Add custom LLM providers to extend your AI capabilities beyond the default options.
      </p>
      <button
        @click="showAddProvider = true"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
    onEnd: (evt) => {
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
watch(() => isDraggable.value, async (newVal) => {
  if (newVal) {
    await nextTick()
    initSortable()
  } else {
    destroySortable()
  }
})

// Cleanup
onUnmounted(() => {
  destroySortable()
})
</script>

<style scoped>
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
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
}

@keyframes pulse-yellow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(234, 179, 8, 0); }
}

@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
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
</style>