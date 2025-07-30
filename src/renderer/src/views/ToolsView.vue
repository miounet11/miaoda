<template>
  <div class="tools-view">
    <div class="tools-header">
      <h2>{{ $t('tools.title') }}</h2>
      <p class="tools-description">{{ $t('tools.description') }}</p>
    </div>
    
    <div class="tools-content">
      <div class="tools-sidebar">
        <div class="tool-categories">
          <button
            v-for="category in categories"
            :key="category"
            @click="selectedCategory = category"
            :class="['category-btn', { active: selectedCategory === category }]"
          >
            {{ $t(`tools.categories.${category}`) }}
          </button>
        </div>
      </div>
      
      <div class="tools-main">
        <div class="tools-grid">
          <div
            v-for="tool in filteredTools"
            :key="tool.name"
            @click="selectTool(tool)"
            :class="['tool-card', { active: selectedTool?.name === tool.name }]"
          >
            <div class="tool-icon">
              <component :is="getToolIcon(tool)" :size="32" />
            </div>
            <h3>{{ tool.name }}</h3>
            <p>{{ tool.description }}</p>
            <div class="tool-tags">
              <span v-for="tag in tool.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Wrench, Terminal, FileText, Image, Calculator } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { mcpService, type MCPTool } from '@renderer/src/services/mcp/MCPService'

const { t } = useI18n()

const selectedCategory = ref('all')
const selectedTool = ref<MCPTool | null>(null)
const tools = ref<MCPTool[]>([])

const categories = ['all', 'development', 'productivity', 'media', 'system']

const filteredTools = computed(() => {
  if (selectedCategory.value === 'all') {
    return tools.value
  }
  return tools.value.filter(tool => tool.category === selectedCategory.value)
})

const getToolIcon = (tool: MCPTool) => {
  switch (tool.category) {
    case 'development':
      return Terminal
    case 'productivity':
      return FileText
    case 'media':
      return Image
    case 'system':
      return Calculator
    default:
      return Wrench
  }
}

const selectTool = (tool: MCPTool) => {
  selectedTool.value = tool
}

onMounted(() => {
  tools.value = mcpService.getAvailableTools()
})
</script>

<style scoped>
.tools-view {
  @apply flex flex-col h-full;
}

.tools-header {
  @apply p-6 border-b border-border;
}

.tools-header h2 {
  @apply text-2xl font-bold mb-2;
}

.tools-description {
  @apply text-muted-foreground;
}

.tools-content {
  @apply flex-1 flex overflow-hidden;
}

.tools-sidebar {
  @apply w-64 border-r border-border p-4;
}

.tool-categories {
  @apply space-y-2;
}

.category-btn {
  @apply w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors;
}

.category-btn.active {
  @apply bg-primary text-primary-foreground;
}

.tools-main {
  @apply flex-1 p-6 overflow-auto;
}

.tools-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.tool-card {
  @apply p-4 border border-border rounded-lg cursor-pointer hover:shadow-md transition-all;
}

.tool-card.active {
  @apply border-primary shadow-md;
}

.tool-icon {
  @apply text-primary mb-3;
}

.tool-card h3 {
  @apply font-semibold mb-2;
}

.tool-card p {
  @apply text-sm text-muted-foreground mb-3;
}

.tool-tags {
  @apply flex gap-2 flex-wrap;
}

.tag {
  @apply px-2 py-1 text-xs bg-muted rounded;
}
</style>