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
         aria-label="按钮">
          <ChevronRight :size="14" class="text-muted-foreground" />
        </button>
        <button
          v-if="isExpanded"
          @click="toggleExpansion"
          class="p-1 hover:bg-accent rounded transition-colors"
          title="Collapse summary"
         aria-label="按钮">
          <ChevronDown :size="14" class="text-muted-foreground" />
        </button>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-if="canGenerate && !isGenerating"
          @click="generateSummary"
          class="p-1 hover:bg-accent rounded transition-colors"
          title="Generate summary"
         aria-label="按钮">
          <Sparkles :size="14" class="text-muted-foreground hover:text-primary" />
        </button>
        <button
          v-if="summaryData && !isGenerating"
          @click="editSummary"
          class="p-1 hover:bg-accent rounded transition-colors"
          title="Edit summary"
         aria-label="按钮">
          <Edit2 :size="14" class="text-muted-foreground hover:text-primary" />
        </button>
        <button
          v-if="summaryData && !isGenerating"
          @click="clearSummary"
          class="p-1 hover:bg-accent rounded transition-colors"
          title="Clear summary"
         aria-label="按钮">
          <X :size="14" class="text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isGenerating"
      class="summary-loading flex items-center gap-2 p-2 bg-accent/30 rounded-lg"
    >
      <div class="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
      <span class="text-sm text-muted-foreground">Generating summary...</span>
    </div>

    <!-- Summary Content -->
    <div v-if="summaryData && !isGenerating" class="summary-content">
      <!-- Collapsed View -->
      <div v-if="!isExpanded" class="summary-collapsed">
        <p class="text-sm text-foreground line-clamp-2 leading-relaxed">
          {{ summaryData.summary }}
        </p>
        <div
          v-if="summaryData.tags && summaryData.tags.length > 0"
          class="flex flex-wrap gap-1 mt-2"
        >
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
              <span class="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
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
              class="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full cursor-pointer hover:bg-primary/20 transition-all duration-200 transform hover:scale-105"
              :class="{ 'tag-clicked': tagAnimations[tag] }"
              @click="handleTagClick(tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Summary Info -->
        <div
          class="summary-info flex items-center justify-between text-xs text-muted-foreground pt-2 border-t"
        >
          <span v-if="summaryData.summaryUpdatedAt">
            Updated {{ formatRelativeTime(summaryData.summaryUpdatedAt) }}
          </span>
          <span v-if="summaryData.summaryTokens"> {{ summaryData.summaryTokens }} tokens </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!summaryData && !isGenerating && canGenerate" class="summary-empty">
      <button
        @click="generateSummary"
        class="w-full p-2 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all group"
       aria-label="按钮">
        <div
          class="flex items-center justify-center gap-2 text-muted-foreground group-hover:text-primary"
        >
          <Sparkles :size="16" />
          <span class="text-sm">Generate Summary</span>
        </div>
      </button>
    </div>

    <!-- Edit Summary Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-background border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
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
            />
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Tags (comma-separated)</label>
            <input id="input-cfngy735u"
              v-model="tagsInput"
              type="text"
              class="w-full mt-1 p-2 border rounded-md"
              placeholder="technology, discussion, important"
             aria-label="输入框">
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground"
              >Key Points (one per line)</label
            >
            <textarea
              v-model="keyPointsInput"
              class="w-full mt-1 p-2 border rounded-md resize-none"
              rows="4"
              placeholder="Key point 1&#10;Key point 2&#10;Key point 3"
            />
          </div>
        </div>
        <div class="p-4 border-t flex justify-end gap-2">
          <button
            @click="cancelEdit"
            class="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
           aria-label="按钮">
            Cancel
          </button>
          <button
            @click="saveSummary"
            :disabled="isSaving"
            class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
           aria-label="按钮">
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { FileText, ChevronRight, ChevronDown, Sparkles, Edit2, X, List, Tag } from 'lucide-vue-next'
import type { ChatSummary, Message } from '@renderer/src/types'
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
const isHovered = ref(false)
const tagAnimations = ref<Record<string, boolean>>({})
const summaryAnimationState = ref<'idle' | 'generating' | 'success' | 'error'>('idle')

// Edit modal data
const editData = ref<Partial<ChatSummary>>({})
const tagsInput = ref('')
const keyPointsInput = ref('')

// Use IPC for summary operations

// Computed
const showSummary = computed(() => {
  return props.showWhenEmpty || summaryData.value || isGenerating.value
})

const canGenerate = computed(() => {
  return props.messages.length >= 3 // Minimum messages to generate summary
})

// Methods
const toggleExpansion = () => {
  const wasExpanded = isExpanded.value
  isExpanded.value = !isExpanded.value

  // Add micro-interaction feedback
  const summaryElement = document.querySelector('.chat-summary')
  if (summaryElement) {
    if (isExpanded.value) {
      summaryElement.classList.add('expanding')
      setTimeout(() => {
        summaryElement.classList.remove('expanding')
      }, 300)
    } else {
      summaryElement.classList.add('collapsing')
      setTimeout(() => {
        summaryElement.classList.remove('collapsing')
      }, 300)
    }
  }
}

const generateSummary = async () => {
  if (isGenerating.value || props.messages.length < 3) return

  try {
    isGenerating.value = true

    // Generate summary content using LLM
    const messageText = props.messages.map(m => `${m.role}: ${m.content}`).join('\n')

    const prompt = `Please generate a concise summary of this conversation. Include key points and relevant tags:

${messageText}

Format your response as:
SUMMARY: [brief summary in 1-2 sentences]
KEY_POINTS: [bullet points of main topics]
TAGS: [comma-separated relevant tags]`

    const summaryText = await window.api.llm.generateSummary(prompt)

    // Parse the response (simplified)
    const lines = summaryText.split('\n')
    let summary = ''
    let keyPoints: string[] = []
    let tags: string[] = []

    for (const line of lines) {
      if (line.startsWith('SUMMARY:')) {
        summary = line.replace('SUMMARY:', '').trim()
      } else if (line.startsWith('KEY_POINTS:')) {
        keyPoints = line
          .replace('KEY_POINTS:', '')
          .split('•')
          .map(p => p.trim())
          .filter(p => p)
      } else if (line.startsWith('TAGS:')) {
        tags = line
          .replace('TAGS:', '')
          .split(',')
          .map(t => t.trim())
          .filter(t => t)
      }
    }

    const chatSummary: ChatSummary = {
      id: `summary-${props.chatId}-${Date.now()}`,
      chatId: props.chatId,
      summary: summary || summaryText.slice(0, 200),
      keyPoints: keyPoints.length > 0 ? keyPoints : ['Generated summary'],
      tags: tags.length > 0 ? tags : ['conversation'],
      wordCount: props.messages.reduce((sum, m) => sum + (m.content?.length || 0), 0),
      messageCount: props.messages.length,
      generatedAt: new Date(),
      lastUpdated: new Date()
    }

    // Save to database
    await window.api.db.updateChatSummary(
      props.chatId,
      chatSummary.summary,
      chatSummary.tags,
      chatSummary.keyPoints,
      chatSummary.wordCount
    )

    summaryData.value = chatSummary
    emit('summary-updated', chatSummary)

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
      tags: tagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag),
      keyPoints: keyPointsInput.value
        .split('\n')
        .map(point => point.trim())
        .filter(point => point)
    }

    await window.api.db.updateChatSummary(
      props.chatId,
      updatedSummary.summary,
      updatedSummary.tags,
      updatedSummary.keyPoints
    )

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
    await window.api.db.clearChatSummary(props.chatId)
    summaryData.value = null
    emit('summary-updated', null)
  } catch (error) {
    console.error('Failed to clear summary:', error)
  }
}

// Enhanced tag click handler
const handleTagClick = (tag: string) => {
  // Add click animation
  tagAnimations.value[tag] = true
  setTimeout(() => {
    tagAnimations.value[tag] = false
  }, 300)

  emit('tag-clicked', tag)
}

const formatRelativeTime = (date: Date) => {
  return formatDistanceToNow(date)
}

// Load existing summary on mount
const loadSummary = async () => {
  try {
    const summary = await window.api.db.getChatSummary(props.chatId)
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
    const needsUpdate = await window.api.db.needsSummaryUpdate(props.chatId)
    if (needsUpdate && props.messages.length >= 5) {
      // Auto-generate summary for conversations that need it
      await generateSummary()
    }
  } catch (error) {
    console.error('Failed to check summary update:', error)
  }
}

// Watchers
watch(
  () => props.chatId,
  () => {
    summaryData.value = null
    isExpanded.value = false
    loadSummary()
  },
  { immediate: false }
)

watch(
  () => props.messages.length,
  async (newLength, oldLength) => {
    if (newLength > oldLength && newLength >= 5) {
      // New messages added, check if we need to update summary
      await checkSummaryUpdate()
    }
  },
  { immediate: false }
)

// Lifecycle
onMounted(() => {
  loadSummary()
  checkSummaryUpdate()
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
.chat-summary {
  @apply border-b pb-3 mb-3 transition-all duration-300;
  position: relative;
  overflow: hidden;
}

.chat-summary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  transition: left 0.6s ease;
}

.chat-summary:hover::before {
  left: 100%;
}

.chat-summary.expanding {
  animation: summaryExpand 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-summary.collapsing {
  animation: summaryCollapse 0.3s ease-in;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes summaryExpand {
  0% {
    transform: scale(1);
    box-shadow: none;
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 4px 20px rgba(var(--primary-rgb), 0.15);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 2px 10px rgba(var(--primary-rgb), 0.1);
  }
}

@keyframes summaryCollapse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

@keyframes tagClick {
  0% {
    transform: scale(1) rotate(0deg);
    background: rgba(var(--primary-rgb), 0.1);
  }
  50% {
    transform: scale(1.15) rotate(2deg);
    background: rgba(var(--primary-rgb), 0.2);
    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
  }
  100% {
    transform: scale(1) rotate(0deg);
    background: rgba(var(--primary-rgb), 0.15);
  }
}

@keyframes generatePulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 6px rgba(var(--primary-rgb), 0.2);
  }
}

/* Tag interactions */
.tag-clicked {
  animation: tagClick 0.3s ease-out;
}

/* Button states */
.generating-pulse {
  animation: generatePulse 1s ease-in-out infinite;
}

/* Enhanced transitions */
.summary-expanded {
  animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}

.summary-collapsed {
  animation: slideUp 0.3s ease-out;
}

/* Hover effects for interactive elements */
.summary-header button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.summary-header button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 60%);
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s ease;
}

.summary-header button:hover::before {
  opacity: 1;
  transform: scale(1);
}

.summary-header button:active::before {
  animation: rippleEffect 0.6s ease-out;
}

/* Empty state button enhancement */
.summary-empty button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.summary-empty button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(var(--primary-rgb), 0.15);
}

.summary-empty button:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.1s;
}

/* Accessibility - Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .chat-summary,
  .chat-summary *,
  .tag-clicked {
    animation: none !important;
    transition: none !important;
  }

  .chat-summary.expanding,
  .chat-summary.collapsing {
    transform: none !important;
  }

  .summary-header button:hover {
    transform: none !important;
  }
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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Loading spinner */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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
