<template>
  <div class="space-y-4">
    <h4 class="text-md font-semibold text-gray-900 dark:text-white">Export Template</h4>
    
    <div class="grid grid-cols-1 gap-3">
      <div
        v-for="tmpl in templates"
        :key="tmpl.id"
        @click="template = tmpl"
        :class="[
          'p-4 border-2 rounded-lg cursor-pointer transition-all',
          template?.id === tmpl.id
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        ]"
      >
        <div class="flex items-start justify-between">
          <div>
            <h5 class="font-medium text-gray-900 dark:text-white">{{ tmpl.name }}</h5>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ tmpl.description }}</p>
            <div class="flex items-center space-x-2 mt-2">
              <span
                v-for="format in tmpl.formats"
                :key="format"
                class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                {{ format.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="text-xs text-gray-500 dark:text-gray-400">
      Templates control the visual styling and layout of your exported content.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ExportTemplate } from '@renderer/src/services/export/ExportService'

interface Props {
  template?: ExportTemplate
}

interface Emits {
  (e: 'update:template', value: ExportTemplate | undefined): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const template = computed({
  get: () => props.template,
  set: (value) => emit('update:template', value)
})

// Predefined templates
const templates: ExportTemplate[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and simple styling suitable for most use cases',
    formats: ['html', 'pdf', 'docx'],
    css: `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .chat { margin-bottom: 2rem; }
      .message { padding: 1rem; margin-bottom: 1rem; border-radius: 8px; }
    `
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Formal styling with proper citations and references',
    formats: ['pdf', 'docx'],
    css: `
      body { font-family: 'Times New Roman', serif; line-height: 1.6; }
      .message { border-left: 3px solid #ccc; padding-left: 1rem; }
    `
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with vibrant colors and modern typography',
    formats: ['html', 'pdf'],
    css: `
      body { font-family: 'Helvetica Neue', sans-serif; }
      .user-message { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    `
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Stripped-down design focusing on content readability',
    formats: ['html', 'pdf', 'markdown'],
    css: `
      body { font-family: 'SF Pro Text', -apple-system, sans-serif; }
      .message { border: none; padding: 0.5rem 0; }
    `
  }
]
</script>