<template>
  <div v-if="format" class="space-y-6">
    <!-- PDF Options -->
    <div v-if="format === 'pdf'" class="space-y-4">
      <h4 class="text-md font-semibold text-gray-900 dark:text-white">PDF Settings</h4>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Generation Method</label>
          <select 
            v-model="pdfOptions.method"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="direct">Direct (Faster)</option>
            <option value="html2canvas">HTML Canvas (Better formatting)</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
          <select 
            v-model="pdfOptions.theme"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
          <select 
            v-model="pdfOptions.fontSize"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Orientation</label>
          <select 
            v-model="pdfOptions.pageOrientation"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
      </div>
      
      <div class="space-y-3">
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            v-model="pdfOptions.includePageNumbers"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">Include page numbers</span>
        </label>
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            v-model="pdfOptions.includeHeader"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">Include header</span>
        </label>
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            v-model="pdfOptions.includeFooter"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">Include footer</span>
        </label>
      </div>
    </div>

    <!-- CSV Options -->
    <div v-if="format === 'csv'" class="space-y-4">
      <h4 class="text-md font-semibold text-gray-900 dark:text-white">CSV Settings</h4>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delimiter</label>
          <select 
            v-model="csvOptions.delimiter"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="\t">Tab</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Encoding</label>
          <select 
            v-model="csvOptions.encoding"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="utf-8">UTF-8</option>
            <option value="utf-16">UTF-16</option>
            <option value="ascii">ASCII</option>
          </select>
        </div>
      </div>
      
      <div class="space-y-3">
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            v-model="csvOptions.includeHeaders"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">Include column headers</span>
        </label>
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            v-model="csvOptions.flattenContent"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">Flatten multiline content</span>
        </label>
      </div>
    </div>

    <!-- DOCX Options -->
    <div v-if="format === 'docx'" class="space-y-4">
      <h4 class="text-md font-semibold text-gray-900 dark:text-white">Word Document Settings</h4>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template</label>
          <select 
            v-model="docxOptions.template"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="default">Default</option>
            <option value="academic">Academic</option>
            <option value="business">Business</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Family</label>
          <select 
            v-model="docxOptions.fontFamily"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="Calibri">Calibri</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Helvetica">Helvetica</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
          <input
            type="number"
            v-model.number="docxOptions.fontSize"
            min="8"
            max="72"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
        </div>
      </div>
      
      <div class="space-y-3">
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            v-model="docxOptions.includeTableOfContents"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">Include table of contents</span>
        </label>
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            v-model="docxOptions.pageBreakBetweenChats"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">Page break between chats</span>
        </label>
      </div>
    </div>

    <!-- ZIP Options -->
    <div v-if="format === 'zip'" class="space-y-4">
      <h4 class="text-md font-semibold text-gray-900 dark:text-white">ZIP Archive Settings</h4>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Compression</label>
        <select 
          v-model="zipOptions.compression"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="none">No Compression</option>
          <option value="fast">Fast</option>
          <option value="best">Best Compression</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Include Formats</label>
        <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
          <label
            v-for="fmt in availableFormats"
            :key="fmt"
            class="flex items-center space-x-2"
          >
            <input
              type="checkbox"
              :value="fmt"
              v-model="zipOptions.includeFormats"
              class="w-4 h-4 text-blue-600 focus:ring-blue-500"
            >
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ fmt.toUpperCase() }}</span>
          </label>
        </div>
      </div>
      
      <div class="space-y-3">
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            v-model="zipOptions.separateFilePerChat"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">Separate file per chat</span>
        </label>
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            v-model="zipOptions.createFolderStructure"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">Create folder structure</span>
        </label>
      </div>
    </div>

    <!-- Custom Information -->
    <div class="space-y-4">
      <h4 class="text-md font-semibold text-gray-900 dark:text-white">Custom Information</h4>
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export Title</label>
          <input
            type="text"
            v-model="options.title"
            placeholder="My Chat Export"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Author</label>
          <input
            type="text"
            v-model="options.author"
            placeholder="Your Name"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ExportOptions } from '@renderer/src/services/export/ExportService'

interface Props {
  format: string
  options: ExportOptions
}

interface Emits {
  (e: 'update:options', value: ExportOptions): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Available formats for ZIP inclusion
const availableFormats = ['markdown', 'html', 'json', 'txt', 'pdf', 'csv', 'docx']

// Create reactive refs for each option type
const pdfOptions = computed({
  get: () => props.options.pdfOptions || {
    method: 'direct',
    theme: 'light',
    fontSize: 'medium',
    pageOrientation: 'portrait',
    margins: { top: 72, right: 72, bottom: 72, left: 72 },
    includePageNumbers: true,
    includeHeader: true,
    includeFooter: true
  },
  set: (value) => {
    emit('update:options', {
      ...props.options,
      pdfOptions: value
    })
  }
})

const csvOptions = computed({
  get: () => props.options.csvOptions || {
    delimiter: ',',
    includeHeaders: true,
    encoding: 'utf-8',
    flattenContent: false
  },
  set: (value) => {
    emit('update:options', {
      ...props.options,
      csvOptions: value
    })
  }
})

const docxOptions = computed({
  get: () => props.options.docxOptions || {
    template: 'default',
    fontSize: 22,
    fontFamily: 'Calibri',
    includeTableOfContents: true,
    pageBreakBetweenChats: true
  },
  set: (value) => {
    emit('update:options', {
      ...props.options,
      docxOptions: value
    })
  }
})

const zipOptions = computed({
  get: () => props.options.zipOptions || {
    compression: 'best',
    includeFormats: ['markdown', 'html', 'json'],
    separateFilePerChat: false,
    createFolderStructure: true
  },
  set: (value) => {
    emit('update:options', {
      ...props.options,
      zipOptions: value
    })
  }
})
</script>