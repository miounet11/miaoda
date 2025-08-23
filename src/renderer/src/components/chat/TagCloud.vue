<template>
  <div class="tag-cloud" v-if="showTagCloud">
    <!-- Header -->
    <div class="tag-cloud-header flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <Hash :size="16" class="text-muted-foreground" />
        <span class="text-sm font-medium text-muted-foreground">Topics</span>
        <span
          v-if="selectedTags.length > 0"
          class="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full"
        >
          {{ selectedTags.length }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-if="selectedTags.length > 0"
          @click="clearSelection"
          class="text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Clear selection"
        >
          Clear
        </button>
        <button
          @click="toggleExpansion"
          class="p-1 hover:bg-accent rounded transition-colors"
          :title="isExpanded ? 'Collapse tags' : 'Expand tags'"
        >
          <ChevronDown v-if="isExpanded" :size="14" class="text-muted-foreground" />
          <ChevronRight v-else :size="14" class="text-muted-foreground" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="tag-loading">
      <div class="animate-pulse flex space-x-2">
        <div class="h-6 bg-accent rounded-full w-16" />
        <div class="h-6 bg-accent rounded-full w-20" />
        <div class="h-6 bg-accent rounded-full w-14" />
      </div>
    </div>

    <!-- Tag Cloud -->
    <div v-if="!isLoading && tags.length > 0" class="tag-content">
      <!-- Collapsed View -->
      <div v-if="!isExpanded" class="tag-cloud-collapsed">
        <div class="flex flex-wrap gap-1">
          <button
            v-for="tag in popularTags.slice(0, maxCollapsedTags)"
            :key="tag.name"
            @click="toggleTag(tag.name)"
            :class="[
              'tag-item inline-flex items-center px-2 py-1 text-xs rounded-full transition-all',
              isTagSelected(tag.name)
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-accent/50 text-foreground hover:bg-accent'
            ]"
            :title="`${tag.count} conversations`"
          >
            <span>{{ tag.name }}</span>
            <span v-if="showCounts" class="ml-1 text-xs opacity-75">({{ tag.count }})</span>
          </button>

          <button
            v-if="tags.length > maxCollapsedTags"
            @click="toggleExpansion"
            class="inline-flex items-center px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:bg-accent transition-colors"
          >
            +{{ tags.length - maxCollapsedTags }} more
          </button>
        </div>
      </div>

      <!-- Expanded View -->
      <div v-if="isExpanded" class="tag-cloud-expanded space-y-3">
        <!-- Search Filter -->
        <div class="tag-search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filter tags..."
            class="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <!-- Tag Categories -->
        <div class="tag-categories">
          <!-- Popular Tags -->
          <div v-if="popularTags.length > 0" class="tag-category mb-3">
            <h4 class="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp :size="12" />
              Popular
            </h4>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="tag in filteredPopularTags"
                :key="tag.name"
                @click="toggleTag(tag.name)"
                :class="[
                  'tag-item inline-flex items-center px-2 py-1 text-xs rounded-full transition-all hover:scale-105',
                  isTagSelected(tag.name)
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : getTagStyle(tag)
                ]"
                :title="`${tag.count} conversations`"
              >
                <span>{{ tag.name }}</span>
                <span v-if="showCounts" class="ml-1 text-xs opacity-75">({{ tag.count }})</span>
              </button>
            </div>
          </div>

          <!-- Recent Tags -->
          <div v-if="recentTags.length > 0" class="tag-category">
            <h4 class="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Clock :size="12" />
              Recent
            </h4>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="tag in filteredRecentTags"
                :key="tag.name"
                @click="toggleTag(tag.name)"
                :class="[
                  'tag-item inline-flex items-center px-2 py-1 text-xs rounded-full transition-all',
                  isTagSelected(tag.name)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent/50 text-foreground hover:bg-accent'
                ]"
                :title="`${tag.count} conversations`"
              >
                <span>{{ tag.name }}</span>
                <span v-if="showCounts" class="ml-1 text-xs opacity-75">({{ tag.count }})</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Selected Tags Summary -->
        <div v-if="selectedTags.length > 0" class="selected-summary p-2 bg-primary/10 rounded-lg">
          <div class="text-xs text-muted-foreground mb-1">Selected filters:</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="tag in selectedTags"
              :key="tag"
              class="inline-flex items-center px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full"
            >
              {{ tag }}
              <button
                @click="toggleTag(tag)"
                class="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
              >
                <X :size="10" />
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && tags.length === 0" class="tag-empty">
      <div class="text-center py-4 text-sm text-muted-foreground">
        <Hash :size="24" class="mx-auto mb-2 opacity-50" />
        <p>No tags available</p>
        <p class="text-xs mt-1">Tags will appear as you generate summaries</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Hash, ChevronDown, ChevronRight, TrendingUp, Clock, X } from 'lucide-vue-next'
import { SummaryService } from '@renderer/src/services/summary/SummaryService'

interface TagData {
  name: string
  count: number
  lastUsed?: Date
}

interface Props {
  showWhenEmpty?: boolean
  maxCollapsedTags?: number
  showCounts?: boolean
  autoExpand?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showWhenEmpty: false,
  maxCollapsedTags: 6,
  showCounts: true,
  autoExpand: false
})

const emit = defineEmits<{
  'tags-changed': [tags: string[]]
  'tag-clicked': [tag: string]
}>()

// State
const tags = ref<TagData[]>([])
const selectedTags = ref<string[]>([])
const isExpanded = ref(props.autoExpand)
const isLoading = ref(false)
const searchQuery = ref('')

// Service instance
const summaryService = SummaryService.getInstance()

// Computed
const showTagCloud = computed(() => {
  return props.showWhenEmpty || tags.value.length > 0
})

const popularTags = computed(() => {
  return [...tags.value].sort((a, b) => b.count - a.count).slice(0, 20) // Top 20 most popular tags
})

const recentTags = computed(() => {
  return [...tags.value]
    .filter(tag => tag.lastUsed)
    .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
    .slice(0, 10) // Top 10 most recent tags
})

const filteredPopularTags = computed(() => {
  if (!searchQuery.value) return popularTags.value
  const query = searchQuery.value.toLowerCase()
  return popularTags.value.filter(tag => tag.name.toLowerCase().includes(query))
})

const filteredRecentTags = computed(() => {
  if (!searchQuery.value) return recentTags.value
  const query = searchQuery.value.toLowerCase()
  return recentTags.value.filter(tag => tag.name.toLowerCase().includes(query))
})

// Methods
const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value
}

const toggleTag = (tagName: string) => {
  const index = selectedTags.value.indexOf(tagName)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagName)
  }

  emit('tags-changed', [...selectedTags.value])
  emit('tag-clicked', tagName)
}

const isTagSelected = (tagName: string): boolean => {
  return selectedTags.value.includes(tagName)
}

const clearSelection = () => {
  selectedTags.value = []
  emit('tags-changed', [])
}

const getTagStyle = (tag: TagData): string => {
  const intensity = Math.min(tag.count / Math.max(...tags.value.map(t => t.count)), 1)

  if (intensity > 0.7) {
    return 'bg-primary/20 text-primary hover:bg-primary/30'
  } else if (intensity > 0.4) {
    return 'bg-primary/10 text-primary hover:bg-primary/20'
  } else {
    return 'bg-accent/50 text-foreground hover:bg-accent'
  }
}

const loadTags = async () => {
  try {
    isLoading.value = true
    const allTags = await summaryService.getAllTags()

    // Convert to TagData with mock counts (in real implementation, this would come from the backend)
    tags.value = allTags.map(tagName => ({
      name: tagName,
      count: Math.floor(Math.random() * 10) + 1, // Mock count
      lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
    }))
  } catch (error) {
    console.error('Failed to load tags:', error)
    tags.value = []
  } finally {
    isLoading.value = false
  }
}

const refreshTags = async () => {
  await loadTags()
}

// Expose methods for parent components
defineExpose({
  refreshTags,
  clearSelection,
  selectedTags: computed(() => selectedTags.value)
})

// Lifecycle
onMounted(() => {
  loadTags()
})

// Watchers
watch(searchQuery, newQuery => {
  // Auto-expand when searching
  if (newQuery && !isExpanded.value) {
    isExpanded.value = true
  }
})
</script>

<style scoped>
.tag-cloud {
  @apply border-b pb-3 mb-3;
}

.tag-item {
  cursor: pointer;
  user-select: none;
}

.tag-item:hover {
  transform: translateY(-1px);
}

.tag-item:active {
  transform: translateY(0);
}

/* Search input focus styles */
.tag-search input:focus {
  @apply ring-2 ring-primary/20 border-primary;
}

/* Animation for expand/collapse */
.tag-cloud-expanded {
  animation: expandIn 0.2s ease-out;
}

.tag-cloud-collapsed {
  animation: collapseIn 0.2s ease-out;
}

@keyframes expandIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes collapseIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading animation */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
