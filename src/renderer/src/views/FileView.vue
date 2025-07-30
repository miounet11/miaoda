<template>
  <div class="file-view">
    <div class="file-header">
      <div class="file-path">
        <FileText :size="16" />
        <span>{{ filePath || 'New File' }}</span>
        <span v-if="modified" class="modified-indicator">•</span>
      </div>
      <div class="file-actions">
        <button
          v-if="!readOnly"
          @click="save"
          :disabled="!modified"
          class="action-btn"
        >
          <Save :size="16" />
          {{ $t('common.save') }}
        </button>
        <button @click="toggleReadOnly" class="action-btn">
          <Lock :size="16" v-if="readOnly" />
          <Unlock :size="16" v-else />
          {{ readOnly ? $t('file.edit') : $t('file.readonly') }}
        </button>
      </div>
    </div>
    
    <div class="file-content">
      <div
        ref="editorRef"
        class="editor"
        :class="{ 'editor-readonly': readOnly }"
      ></div>
    </div>
    
    <div class="file-status">
      <div class="status-left">
        <span>{{ fileType || 'Plain Text' }}</span>
        <span>{{ $t('file.lines', { count: lineCount }) }}</span>
        <span>{{ $t('file.characters', { count: characterCount }) }}</span>
      </div>
      <div class="status-right">
        <span>Line {{ currentLine }}, Col {{ currentColumn }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { FileText, Save, Lock, Unlock } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

interface Props {
  tabId: string
  filePath?: string
  fileType?: string
  readOnly?: boolean
  initialData?: any
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false
})

const emit = defineEmits<{
  'title-change': [title: string]
  'modified-change': [modified: boolean]
  'error': [error: string]
  'loading': [loading: boolean]
}>()

const { t } = useI18n()

const editorRef = ref<HTMLElement>()
const content = ref('')
const modified = ref(false)
const readOnly = ref(props.readOnly)
const currentLine = ref(1)
const currentColumn = ref(1)

const lineCount = computed(() => {
  return content.value.split('\n').length
})

const characterCount = computed(() => {
  return content.value.length
})

let editor: any = null

const initializeEditor = async () => {
  try {
    // This would initialize a code editor like Monaco or CodeMirror
    // For now, using a simple textarea
    if (editorRef.value) {
      const textarea = document.createElement('textarea')
      textarea.className = 'w-full h-full resize-none outline-none bg-transparent font-mono'
      textarea.value = content.value
      textarea.readOnly = readOnly.value
      
      textarea.addEventListener('input', (e) => {
        content.value = (e.target as HTMLTextAreaElement).value
        modified.value = true
        emit('modified-change', true)
      })
      
      textarea.addEventListener('keyup', updateCursorPosition)
      textarea.addEventListener('click', updateCursorPosition)
      
      editorRef.value.appendChild(textarea)
      editor = textarea
    }
  } catch (error) {
    emit('error', 'Failed to initialize editor')
  }
}

const updateCursorPosition = () => {
  if (editor) {
    const pos = editor.selectionStart
    const textBeforeCursor = content.value.substring(0, pos)
    const lines = textBeforeCursor.split('\n')
    currentLine.value = lines.length
    currentColumn.value = lines[lines.length - 1].length + 1
  }
}

const save = async () => {
  try {
    emit('loading', true)
    
    // Save file content
    if (window.api?.fileSystem?.writeFile && props.filePath) {
      await window.api.fileSystem.writeFile(props.filePath, content.value)
    }
    
    modified.value = false
    emit('modified-change', false)
    
    // Update title to show file name
    if (props.filePath) {
      const fileName = props.filePath.split('/').pop() || 'File'
      emit('title-change', fileName)
    }
  } catch (error) {
    emit('error', 'Failed to save file')
  } finally {
    emit('loading', false)
  }
}

const toggleReadOnly = () => {
  readOnly.value = !readOnly.value
  if (editor) {
    editor.readOnly = readOnly.value
  }
}

const loadFile = async () => {
  if (!props.filePath) return
  
  try {
    emit('loading', true)
    
    if (window.api?.fileSystem?.readFile) {
      const fileContent = await window.api.fileSystem.readFile(props.filePath)
      content.value = fileContent
      
      if (editor) {
        editor.value = fileContent
      }
      
      // Update title
      const fileName = props.filePath.split('/').pop() || 'File'
      emit('title-change', fileName)
    }
  } catch (error) {
    emit('error', 'Failed to load file')
  } finally {
    emit('loading', false)
  }
}

onMounted(async () => {
  await initializeEditor()
  await loadFile()
})

watch(() => props.filePath, () => {
  loadFile()
})

watch(() => props.readOnly, (newReadOnly) => {
  readOnly.value = newReadOnly
  if (editor) {
    editor.readOnly = newReadOnly
  }
})

defineExpose({
  save,
  getContent: () => content.value,
  setContent: (newContent: string) => {
    content.value = newContent
    if (editor) {
      editor.value = newContent
    }
  }
})
</script>

<style scoped>
.file-view {
  @apply flex flex-col h-full;
}

.file-header {
  @apply flex items-center justify-between p-3 border-b border-border bg-muted/20;
}

.file-path {
  @apply flex items-center gap-2 text-sm;
}

.modified-indicator {
  @apply text-orange-500 font-bold text-lg;
}

.file-actions {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply flex items-center gap-2 px-3 py-1 text-sm border border-border rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.file-content {
  @apply flex-1 overflow-hidden;
}

.editor {
  @apply w-full h-full p-4;
}

.editor-readonly {
  @apply bg-muted/10;
}

.file-status {
  @apply flex items-center justify-between px-3 py-1 text-xs bg-muted/20 border-t border-border;
}

.status-left {
  @apply flex items-center gap-4 text-muted-foreground;
}

.status-right {
  @apply text-muted-foreground;
}
</style>