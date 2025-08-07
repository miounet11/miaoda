<template>
  <div class="notes-view">
    <div class="notes-header">
      <div class="note-info">
        <FileText :size="16" />
        <span>{{ noteTitle }}</span>
        <span v-if="modified" class="modified-indicator">•</span>
      </div>
      
      <div class="note-actions">
        <div class="format-selector">
          <button
            v-for="format in formats"
            :key="format.value"
            @click="setFormat(format.value)"
            :class="['format-btn', { active: currentFormat === format.value }]"
            :title="format.label"
          >
            <component :is="format.icon" :size="16" />
          </button>
        </div>
        
        <div class="action-buttons">
          <button
            @click="togglePreview"
            :class="['action-btn', { active: showPreview }]"
            :title="$t('notes.preview')"
          >
            <Eye :size="16" />
          </button>
          <button
            @click="save"
            :disabled="!modified"
            class="action-btn"
            :title="$t('common.save')"
          >
            <Save :size="16" />
          </button>
          <button
            @click="showExportMenu"
            class="action-btn"
            :title="$t('notes.export')"
          >
            <Download :size="16" />
          </button>
        </div>
      </div>
    </div>
    
    <div class="notes-content" :class="{ 'split-view': showPreview }">
      <!-- Editor -->
      <div class="editor-panel">
        <div class="editor-toolbar" v-if="currentFormat === 'markdown'">
          <div class="toolbar-group">
            <button
              v-for="tool in markdownTools"
              :key="tool.name"
              @click="applyFormat(tool)"
              class="toolbar-btn"
              :title="tool.label"
            >
              <component :is="tool.icon" :size="14" />
            </button>
          </div>
        </div>
        
        <textarea
          ref="editorRef"
          v-model="content"
          @input="handleInput"
          @keydown="handleKeyDown"
          @scroll="syncScroll"
          class="note-editor"
          :class="`editor-${currentFormat}`"
          :placeholder="$t('notes.placeholder')"
          spellcheck="true"
        ></textarea>
      </div>
      
      <!-- Preview -->
      <div v-if="showPreview" class="preview-panel">
        <div class="preview-toolbar">
          <h4>{{ $t('notes.preview') }}</h4>
          <button
            @click="syncScrollToPreview"
            class="toolbar-btn"
            :title="$t('notes.syncScroll')"
          >
            <ArrowUpDown :size="14" />
          </button>
        </div>
        
        <div
          ref="previewRef"
          class="note-preview"
          :class="`preview-${currentFormat}`"
          @scroll="syncScroll"
          v-html="previewContent"
        ></div>
      </div>
    </div>
    
    <!-- Status Bar -->
    <div class="notes-status">
      <div class="status-left">
        <span>{{ $t('notes.format') }}: {{ getCurrentFormatLabel() }}</span>
        <span>{{ $t('notes.lines', { count: lineCount }) }}</span>
        <span>{{ $t('notes.words', { count: wordCount }) }}</span>
        <span>{{ $t('notes.characters', { count: characterCount }) }}</span>
      </div>
      
      <div class="status-right">
        <span v-if="lastSaved">
          {{ $t('notes.lastSaved') }}: {{ formatTime(lastSaved) }}
        </span>
        <span>Line {{ currentLine }}, Col {{ currentColumn }}</span>
      </div>
    </div>
    
    <!-- Export Menu -->
    <div v-if="exportMenuVisible" class="export-menu">
      <div class="export-menu-content">
        <h4>{{ $t('notes.export') }}</h4>
        <div class="export-options">
          <button
            v-for="option in exportOptions"
            :key="option.format"
            @click="exportNote(option.format)"
            class="export-option"
          >
            <component :is="option.icon" :size="16" />
            <span>{{ option.label }}</span>
          </button>
        </div>
        <button @click="exportMenuVisible = false" class="close-menu-btn">
          {{ $t('common.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  FileText, Eye, Save, Download, ArrowUpDown,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Link, Image, Code, Quote, Hash, Type, FileDown
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'

interface Props {
  tabId: string
  noteId?: string
  noteContent?: string
  noteFormat?: 'markdown' | 'plaintext' | 'html'
  initialData?: any
}

interface FormatTool {
  name: string
  label: string
  icon: any
  prefix: string
  suffix?: string
}

const props = withDefaults(defineProps<Props>(), {
  noteContent: '',
  noteFormat: 'markdown'
})

const emit = defineEmits<{
  'title-change': [title: string]
  'modified-change': [modified: boolean]
  'error': [error: string]
  'loading': [loading: boolean]
}>()

const { t } = useI18n()

// Refs
const editorRef = ref<HTMLTextAreaElement>()
const previewRef = ref<HTMLElement>()

// State
const content = ref(props.noteContent)
const currentFormat = ref(props.noteFormat)
const modified = ref(false)
const showPreview = ref(false)
const exportMenuVisible = ref(false)
const lastSaved = ref<Date | null>(null)
const currentLine = ref(1)
const currentColumn = ref(1)
const syncScrollEnabled = ref(true)

// Auto-save
const autoSaveInterval = ref<NodeJS.Timeout | null>(null)

// Format options
const formats = [
  { value: 'markdown', label: 'Markdown', icon: Hash },
  { value: 'plaintext', label: 'Plain Text', icon: Type },
  { value: 'html', label: 'HTML', icon: Code }
]

// Markdown tools
const markdownTools: FormatTool[] = [
  { name: 'bold', label: 'Bold', icon: Bold, prefix: '**', suffix: '**' },
  { name: 'italic', label: 'Italic', icon: Italic, prefix: '*', suffix: '*' },
  { name: 'strikethrough', label: 'Strikethrough', icon: Strikethrough, prefix: '~~', suffix: '~~' },
  { name: 'code', label: 'Code', icon: Code, prefix: '`', suffix: '`' },
  { name: 'quote', label: 'Quote', icon: Quote, prefix: '> ' },
  { name: 'list', label: 'Bullet List', icon: List, prefix: '- ' },
  { name: 'ordered-list', label: 'Numbered List', icon: ListOrdered, prefix: '1. ' },
  { name: 'link', label: 'Link', icon: Link, prefix: '[', suffix: '](url)' },
  { name: 'image', label: 'Image', icon: Image, prefix: '![alt](', suffix: ')' }
]

// Export options
const exportOptions = [
  { format: 'markdown', label: 'Markdown (.md)', icon: Hash },
  { format: 'html', label: 'HTML (.html)', icon: Code },
  { format: 'txt', label: 'Plain Text (.txt)', icon: Type },
  { format: 'pdf', label: 'PDF (.pdf)', icon: FileDown }
]

// Computed
const noteTitle = computed(() => {
  const firstLine = content.value.split('\n')[0]
  if (firstLine.startsWith('# ')) {
    return firstLine.substring(2).trim()
  }
  if (firstLine.trim()) {
    return firstLine.trim().substring(0, 50) + (firstLine.length > 50 ? '...' : '')
  }
  return 'Untitled Note'
})

const lineCount = computed(() => {
  return content.value.split('\n').length
})

const wordCount = computed(() => {
  return content.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

const characterCount = computed(() => {
  return content.value.length
})

const previewContent = computed(() => {
  switch (currentFormat.value) {
    case 'markdown':
      try {
        return marked(content.value)
      } catch (error) {
        return `<p>Error rendering markdown: ${error}</p>`
      }
    case 'html':
      return content.value
    default:
      return `<pre>${escapeHtml(content.value)}</pre>`
  }
})

// Methods
const handleInput = () => {
  modified.value = true
  emit('modified-change', true)
  updateCursorPosition()
  
  // Update title if first line changed
  const title = noteTitle.value
  emit('title-change', title)
}

const handleKeyDown = (event: KeyboardEvent) => {
  const { key, ctrlKey, metaKey, shiftKey } = event
  const cmd = ctrlKey || metaKey
  
  // Ctrl/Cmd + S: Save
  if (cmd && key === 's') {
    event.preventDefault()
    save()
    return
  }
  
  // Ctrl/Cmd + B: Bold (markdown)
  if (cmd && key === 'b' && currentFormat.value === 'markdown') {
    event.preventDefault()
    applyFormat(markdownTools.find(t => t.name === 'bold')!)
    return
  }
  
  // Ctrl/Cmd + I: Italic (markdown)
  if (cmd && key === 'i' && currentFormat.value === 'markdown') {
    event.preventDefault()
    applyFormat(markdownTools.find(t => t.name === 'italic')!)
    return
  }
  
  // Tab: Insert spaces
  if (key === 'Tab') {
    event.preventDefault()
    insertText('  ')
    return
  }
  
  // Handle list continuation
  if (key === 'Enter' && currentFormat.value === 'markdown') {
    const textarea = editorRef.value!
    const lines = content.value.split('\n')
    const currentLineIndex = content.value.substring(0, textarea.selectionStart).split('\n').length - 1
    const currentLineText = lines[currentLineIndex]
    
    // Continue bullet lists
    if (currentLineText.match(/^\s*[-*+]\s/)) {
      event.preventDefault()
      const indent = currentLineText.match(/^\s*/)?.[0] || ''
      const bullet = currentLineText.match(/^\s*([-*+])/)?.[1] || '-'
      insertText(`\n${indent}${bullet} `)
      return
    }
    
    // Continue numbered lists
    const numberedMatch = currentLineText.match(/^\s*(\d+)\.\s/)
    if (numberedMatch) {
      event.preventDefault()
      const indent = currentLineText.match(/^\s*/)?.[0] || ''
      const nextNumber = parseInt(numberedMatch[1]) + 1
      insertText(`\n${indent}${nextNumber}. `)
      return
    }
  }
}

const updateCursorPosition = () => {
  if (editorRef.value) {
    const pos = editorRef.value.selectionStart
    const textBeforeCursor = content.value.substring(0, pos)
    const lines = textBeforeCursor.split('\n')
    currentLine.value = lines.length
    currentColumn.value = lines[lines.length - 1].length + 1
  }
}

const insertText = (text: string) => {
  if (!editorRef.value) return
  
  const start = editorRef.value.selectionStart
  const end = editorRef.value.selectionEnd
  const before = content.value.substring(0, start)
  const after = content.value.substring(end)
  
  content.value = before + text + after
  
  nextTick(() => {
    if (editorRef.value) {
      editorRef.value.selectionStart = editorRef.value.selectionEnd = start + text.length
      editorRef.value.focus()
    }
  })
}

const applyFormat = (tool: FormatTool) => {
  if (!editorRef.value) return
  
  const start = editorRef.value.selectionStart
  const end = editorRef.value.selectionEnd
  const selectedText = content.value.substring(start, end)
  
  let replacement: string
  if (tool.suffix) {
    replacement = tool.prefix + selectedText + tool.suffix
  } else {
    replacement = tool.prefix + selectedText
  }
  
  const before = content.value.substring(0, start)
  const after = content.value.substring(end)
  
  content.value = before + replacement + after
  
  nextTick(() => {
    if (editorRef.value) {
      const newStart = start + tool.prefix.length
      const newEnd = newStart + selectedText.length
      editorRef.value.selectionStart = newStart
      editorRef.value.selectionEnd = newEnd
      editorRef.value.focus()
    }
  })
  
  handleInput()
}

const setFormat = (format: string) => {
  currentFormat.value = format as any
  modified.value = true
  emit('modified-change', true)
}

const getCurrentFormatLabel = () => {
  return formats.find(f => f.value === currentFormat.value)?.label || currentFormat.value
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const syncScroll = (event: Event) => {
  if (!syncScrollEnabled.value || !showPreview.value) return
  
  const source = event.target as HTMLElement
  const isEditor = source === editorRef.value
  const target = isEditor ? previewRef.value : editorRef.value
  
  if (target) {
    const scrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight)
    target.scrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight)
  }
}

const syncScrollToPreview = () => {
  if (editorRef.value && previewRef.value) {
    const scrollPercentage = editorRef.value.scrollTop / (editorRef.value.scrollHeight - editorRef.value.clientHeight)
    previewRef.value.scrollTop = scrollPercentage * (previewRef.value.scrollHeight - previewRef.value.clientHeight)
  }
}

const save = async () => {
  try {
    emit('loading', true)
    
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // In a real implementation, save to storage
    if (window.api?.notes?.save) {
      await window.api.notes.save(props.noteId || 'new', {
        content: content.value,
        format: currentFormat.value,
        title: noteTitle.value
      })
    }
    
    modified.value = false
    lastSaved.value = new Date()
    emit('modified-change', false)
    
  } catch (error) {
    emit('error', 'Failed to save note')
  } finally {
    emit('loading', false)
  }
}

const showExportMenu = () => {
  exportMenuVisible.value = true
}

const exportNote = async (format: string) => {
  try {
    let exportContent = content.value
    let mimeType = 'text/plain'
    let extension = '.txt'
    
    switch (format) {
      case 'markdown':
        mimeType = 'text/markdown'
        extension = '.md'
        break
      case 'html':
        exportContent = previewContent.value
        mimeType = 'text/html'
        extension = '.html'
        break
      case 'txt':
        exportContent = content.value
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'pdf':
        // PDF export would require additional processing
        emit('error', 'PDF export not yet implemented')
        return
    }
    
    // Create and download file
    const blob = new Blob([exportContent], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${noteTitle.value}${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    exportMenuVisible.value = false
    
  } catch (error) {
    emit('error', 'Failed to export note')
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString()
}

const escapeHtml = (text: string) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const startAutoSave = () => {
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value)
  }
  
  autoSaveInterval.value = setInterval(() => {
    if (modified.value) {
      save()
    }
  }, 30000) // Auto-save every 30 seconds
}

const stopAutoSave = () => {
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value)
    autoSaveInterval.value = null
  }
}

// Lifecycle
onMounted(() => {
  // Focus editor
  editorRef.value?.focus()
  
  // Start auto-save
  startAutoSave()
  
  // Set initial title
  if (noteTitle.value) {
    emit('title-change', noteTitle.value)
  }
  
  // Setup cursor position tracking
  updateCursorPosition()
})

onUnmounted(() => {
  stopAutoSave()
})

// Watch content changes
watch(content, () => {
  updateCursorPosition()
}, { flush: 'post' })

defineExpose({
  save,
  getContent: () => content.value,
  setContent: (newContent: string) => {
    content.value = newContent
  },
  exportNote
})
</script>

<style scoped>
.notes-view {
  @apply flex flex-col h-full bg-yellow-50 dark:bg-yellow-950/10;
}

.notes-header {
  @apply flex items-center justify-between p-3 border-b border-border bg-background/50;
}

.note-info {
  @apply flex items-center gap-2 text-sm;
}

.modified-indicator {
  @apply text-orange-500 font-bold text-lg;
}

.note-actions {
  @apply flex items-center gap-4;
}

.format-selector {
  @apply flex items-center gap-1 border border-border rounded-lg p-1;
}

.format-btn {
  @apply p-2 rounded hover:bg-accent transition-colors;
}

.format-btn.active {
  @apply bg-primary text-primary-foreground;
}

.action-buttons {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-2 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-btn.active {
  @apply bg-accent;
}

.notes-content {
  @apply flex-1 flex overflow-hidden;
}

.notes-content.split-view .editor-panel {
  @apply w-1/2 border-r border-border;
}

.editor-panel {
  @apply flex flex-col flex-1;
}

.editor-toolbar {
  @apply flex items-center gap-1 p-2 border-b border-border bg-muted/20;
}

.toolbar-group {
  @apply flex items-center gap-1;
}

.toolbar-btn {
  @apply p-1 rounded hover:bg-accent transition-colors;
}

.note-editor {
  @apply flex-1 p-4 resize-none outline-none bg-transparent font-mono leading-relaxed;
}

.note-editor.editor-markdown {
  @apply font-sans;
}

.note-editor.editor-html {
  @apply font-mono;
}

.preview-panel {
  @apply w-1/2 flex flex-col;
}

.preview-toolbar {
  @apply flex items-center justify-between p-2 border-b border-border bg-muted/20;
}

.preview-toolbar h4 {
  @apply font-semibold text-sm;
}

.note-preview {
  @apply flex-1 p-4 overflow-auto prose prose-sm max-w-none;
}

.note-preview.preview-html {
  /* Remove prose styling for HTML format */
  max-width: none;
}

.notes-status {
  @apply flex items-center justify-between px-3 py-1 text-xs bg-muted/20 border-t border-border;
}

.status-left {
  @apply flex items-center gap-4 text-muted-foreground;
}

.status-right {
  @apply flex items-center gap-4 text-muted-foreground;
}

/* Export Menu */
.export-menu {
  @apply fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center;
}

.export-menu-content {
  @apply bg-background border border-border rounded-lg shadow-lg max-w-sm w-full mx-4 p-6;
}

.export-menu-content h4 {
  @apply font-semibold mb-4;
}

.export-options {
  @apply space-y-2 mb-4;
}

.export-option {
  @apply w-full flex items-center gap-3 p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors;
}

.close-menu-btn {
  @apply w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors;
}

/* Scrollbar styling */
.note-editor::-webkit-scrollbar,
.note-preview::-webkit-scrollbar {
  width: 8px;
}

.note-editor::-webkit-scrollbar-track,
.note-preview::-webkit-scrollbar-track {
  @apply bg-muted/20;
}

.note-editor::-webkit-scrollbar-thumb,
.note-preview::-webkit-scrollbar-thumb {
  @apply bg-border rounded;
}

/* Responsive */
@media (max-width: 768px) {
  .notes-content.split-view {
    @apply flex-col;
  }
  
  .notes-content.split-view .editor-panel {
    @apply w-full h-1/2 border-r-0 border-b border-border;
  }
  
  .preview-panel {
    @apply w-full h-1/2;
  }
}
</style>