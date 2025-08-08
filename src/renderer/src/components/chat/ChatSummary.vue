<template>
  <div class="chat-summary" v-if="showSummary">
    <!-- Summary Header -->
    <div class="summary-header flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <FileText :size="16" class="text-muted-foreground" />
        <span class="text-sm font-medium text-muted-foreground">Smart Summary</span>
        <button
          v-if="!isExpanded && summaryData"
          @click="toggleExpansion"
          class="p-1 hover:bg-accent rounded transition-colors"
          title="Expand summary"
        >
          <ChevronRight :size="14" class="text-muted-foreground" />
        </button>
        <button
          v-if="isExpanded"
          @click="toggleExpansion"
          class="p-1 hover:bg-accent rounded transition-colors"
          title="Collapse summary"
        >
          <ChevronDown :size="14" class="text-muted-foreground" />
        </button>
      </div>
      
      <div class="flex items-center gap-1">
        <button
          v-if="canGenerate && !isGenerating"
          @click="generateSummary"
          class="p-1 hover:bg-accent rounded transition-colors"
          title="Generate summary"
        >
          <Sparkles :size="14" class="text-muted-foreground hover:text-primary" />
        </button>
        <button
          v-if="summaryData && !isGenerating"
          @click="editSummary"
          class="p-1 hover:bg-accent rounded transition-colors"
          title="Edit summary"
        >
          <Edit2 :size="14" class="text-muted-foreground hover:text-primary" />
        </button>
        <button
          v-if="summaryData && !isGenerating"
          @click="clearSummary"
          class="p-1 hover:bg-accent rounded transition-colors"
          title="Clear summary"
        >
          <X :size="14" class="text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isGenerating" class="summary-loading flex items-center gap-2 p-2 bg-accent/30 rounded-lg">
      <div class="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
      <span class="text-sm text-muted-foreground">Generating summary...</span>
    </div>

    <!-- Summary Content -->
    <div v-if="summaryData && !isGenerating" class="summary-content">
      <!-- Collapsed View -->
      <div v-if="!isExpanded" class="summary-collapsed">
        <p class="text-sm text-foreground line-clamp-2 leading-relaxed">{{ summaryData.summary }}</p>
        <div v-if="summaryData.tags && summaryData.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
          <span
            v-for="tag in summaryData.tags.slice(0, 3)"
            :key="tag"
            class="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
          >
            {{ tag }}
          </span>
          <span 
            v-if="summaryData.tags.length > 3"
            class="inline-flex items-center px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
          >
            +{{ summaryData.tags.length - 3 }}
          </span>
        </div>
      </div>

      <!-- Expanded View -->
      <div v-if="isExpanded" class="summary-expanded space-y-3">
        <div class="summary-text">
          <p class="text-sm text-foreground leading-relaxed">{{ summaryData.summary }}</p>
        </div>

        <!-- Key Points -->
        <div v-if="summaryData.keyPoints && summaryData.keyPoints.length > 0" class="key-points">
          <h4 class="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <List :size="12" />
            Key Points
          </h4>
          <ul class="space-y-1">
            <li
              v-for="point in summaryData.keyPoints"
              :key="point"
              class="text-sm text-foreground flex items-start gap-2"
            >
              <span class="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
              <span class="leading-relaxed">{{ point }}</span>
            </li>
          </ul>
        </div>

        <!-- Tags -->
        <div v-if="summaryData.tags && summaryData.tags.length > 0" class="summary-tags">
          <h4 class="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Tag :size="12" />
            Tags
          </h4>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="tag in summaryData.tags"
              :key="tag"
              class="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
              @click="$emit('tag-clicked', tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Summary Info -->
        <div class="summary-info flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span v-if="summaryData.summaryUpdatedAt">
            Updated {{ formatRelativeTime(summaryData.summaryUpdatedAt) }}
          </span>
          <span v-if="summaryData.summaryTokens">
            {{ summaryData.summaryTokens }} tokens
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!summaryData && !isGenerating && canGenerate" class="summary-empty">
      <button
        @click="generateSummary"
        class="w-full p-2 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all group"
      >
        <div class="flex items-center justify-center gap-2 text-muted-foreground group-hover:text-primary">
          <Sparkles :size="16" />
          <span class="text-sm">Generate Summary</span>
        </div>
      </button>
    </div>

    <!-- Edit Summary Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-background border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div class="p-4 border-b">
          <h3 class="text-lg font-medium">Edit Summary</h3>
        </div>
        <div class="p-4 space-y-4 overflow-y-auto">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Summary</label>
            <textarea
              v-model="editData.summary"
              class="w-full mt-1 p-2 border rounded-md resize-none"
              rows="4"
              placeholder="Enter summary..."
            ></textarea>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Tags (comma-separated)</label>
            <input
              v-model="tagsInput"
              type="text"
              class="w-full mt-1 p-2 border rounded-md"
              placeholder="technology, discussion, important"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Key Points (one per line)</label>
            <textarea
              v-model="keyPointsInput"
              class="w-full mt-1 p-2 border rounded-md resize-none"
              rows="4"
              placeholder="Key point 1&#10;Key point 2&#10;Key point 3"
            ></textarea>
          </div>
        </div>
        <div class="p-4 border-t flex justify-end gap-2">
          <button
            @click="cancelEdit"
            class="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            @click="saveSummary"
            :disabled="isSaving"
            class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Edit2, 
  X, 
  List, 
  Tag 
} from 'lucide-vue-next'
import type { ChatSummary, Message } from '@renderer/src/types'
import { SummaryService } from '@renderer/src/services/summary/SummaryService'
import { formatDistanceToNow } from '@renderer/src/utils/time'

interface Props {
  chatId: string
  messages: Message[]
  autoGenerate?: boolean
  showWhenEmpty?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoGenerate: true,
  showWhenEmpty: true
})

const emit = defineEmits<{
  'summary-updated': [summary: ChatSummary | null]
  'tag-clicked': [tag: string]
}>()

// State
const summaryData = ref<ChatSummary | null>(null)
const isExpanded = ref(false)
const isGenerating = ref(false)
const showEditModal = ref(false)
const isSaving = ref(false)

// Edit modal data
const editData = ref<Partial<ChatSummary>>({})
const tagsInput = ref('')
const keyPointsInput = ref('')

// Service instance
const summaryService = SummaryService.getInstance()

// Computed
const showSummary = computed(() => {
  return props.showWhenEmpty || summaryData.value || isGenerating.value
})

const canGenerate = computed(() => {
  return props.messages.length >= 3 // Minimum messages to generate summary
})

// Methods
const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value
}

const generateSummary = async () => {
  if (isGenerating.value || props.messages.length < 3) return

  try {
    isGenerating.value = true
    const summary = await summaryService.generateSummary(props.chatId, props.messages, {
      maxLength: 200,
      includeKeyPoints: true,
      includeTags: true
    })
    
    summaryData.value = summary
    emit('summary-updated', summary)
    
    // Auto-expand after generation
    isExpanded.value = true
  } catch (error) {
    console.error('Failed to generate summary:', error)
    // TODO: Show error toast
  } finally {
    isGenerating.value = false
  }
}

const editSummary = () => {
  if (!summaryData.value) return

  editData.value = { ...summaryData.value }
  tagsInput.value = summaryData.value.tags.join(', ')
  keyPointsInput.value = summaryData.value.keyPoints.join('\n')
  showEditModal.value = true
}

const cancelEdit = () => {
  showEditModal.value = false
  editData.value = {}
  tagsInput.value = ''
  keyPointsInput.value = ''
}

const saveSummary = async () => {
  if (isSaving.value) return

  try {
    isSaving.value = true
    
    const updatedSummary: Partial<ChatSummary> = {
      summary: editData.value.summary || '',
      tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
      keyPoints: keyPointsInput.value.split('\n').map(point => point.trim()).filter(point => point)
    }

    await summaryService.updateSummary(props.chatId, updatedSummary)
    
    summaryData.value = {
      ...summaryData.value!,
      ...updatedSummary,
      summaryUpdatedAt: new Date()
    }
    
    emit('summary-updated', summaryData.value)
    showEditModal.value = false
  } catch (error) {
    console.error('Failed to save summary:', error)
    // TODO: Show error toast
  } finally {
    isSaving.value = false
  }
}

const clearSummary = async () => {
  if (!confirm('Are you sure you want to clear this summary?')) return

  try {
    await summaryService.clearSummary(props.chatId)
    summaryData.value = null
    emit('summary-updated', null)
  } catch (error) {
    console.error('Failed to clear summary:', error)
  }
}

const formatRelativeTime = (date: Date) => {
  return formatDistanceToNow(date)
}

// Load existing summary on mount
const loadSummary = async () => {
  try {
    const summary = await summaryService.getChatSummary(props.chatId)
    summaryData.value = summary
    
    if (summary) {
      emit('summary-updated', summary)
    }
  } catch (error) {
    console.error('Failed to load summary:', error)
  }
}

// Check if summary needs update
const checkSummaryUpdate = async () => {
  if (!props.autoGenerate || isGenerating.value) return

  try {
    const needsUpdate = await summaryService.needsSummaryUpdate(props.chatId)
    if (needsUpdate && props.messages.length >= 5) {
      // Auto-generate summary for conversations that need it
      await generateSummary()
    }
  } catch (error) {
    console.error('Failed to check summary update:', error)
  }
}

// Watchers
watch(() => props.chatId, () => {
  summaryData.value = null
  isExpanded.value = false
  loadSummary()
}, { immediate: false })

watch(() => props.messages.length, async (newLength, oldLength) => {
  if (newLength > oldLength && newLength >= 5) {
    // New messages added, check if we need to update summary
    await checkSummaryUpdate()
  }
}, { immediate: false })

// Lifecycle
onMounted(() => {
  loadSummary()
  checkSummaryUpdate()
})
</script>

<style scoped>
.chat-summary {
  @apply border-b pb-3 mb-3;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animation for expand/collapse */
.summary-expanded {
  animation: slideDown 0.2s ease-out;
}

.summary-collapsed {
  animation: slideUp 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Modal backdrop */
.fixed {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Loading spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>