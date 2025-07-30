<template>
  <div class="attachments-preview mb-3">
    <div class="flex flex-wrap gap-2">
      <div
        v-for="attachment in attachments"
        :key="attachment.id"
        class="attachment-item relative group"
      >
        <!-- Image Attachment -->
        <div v-if="attachment.type === 'image'" class="image-attachment relative">
          <img
            :src="attachment.data"
            :alt="attachment.name"
            class="h-20 w-20 object-cover rounded-lg border border-border"
            @load="onImageLoad"
            @error="onImageError"
          />
          <div class="attachment-overlay absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <div class="absolute bottom-1 left-1 right-1">
              <div class="text-xs text-white bg-black/50 rounded px-1 py-0.5 truncate">
                {{ attachment.name }}
              </div>
            </div>
          </div>
          <button
            @click="$emit('remove', attachment.id)"
            class="remove-btn absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Remove attachment"
          >
            <X :size="12" />
          </button>
        </div>
        
        <!-- File Attachment -->
        <div v-else class="file-attachment flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
          <div class="file-icon">
            <FileText v-if="attachment.type === 'text'" :size="16" class="text-blue-500" />
            <File v-else :size="16" class="text-gray-500" />
          </div>
          
          <div class="file-info flex-1 min-w-0">
            <div class="file-name text-sm font-medium truncate">{{ attachment.name }}</div>
            <div v-if="attachment.size" class="file-size text-xs text-muted-foreground">
              {{ formatFileSize(attachment.size) }}
            </div>
          </div>
          
          <button
            @click="$emit('remove', attachment.id)"
            class="remove-btn p-1 hover:bg-background rounded transition-colors text-muted-foreground hover:text-foreground"
            title="Remove attachment"
          >
            <X :size="12" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Upload Progress (if needed) -->
    <div v-if="uploadProgress.length > 0" class="upload-progress mt-2 space-y-1">
      <div
        v-for="progress in uploadProgress"
        :key="progress.id"
        class="progress-item flex items-center gap-2 text-sm"
      >
        <div class="progress-bar flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div
            class="progress-fill h-full bg-primary transition-all duration-300"
            :style="{ width: `${progress.progress}%` }"
          ></div>
        </div>
        <span class="progress-text text-xs text-muted-foreground">{{ progress.progress }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X, FileText, File } from 'lucide-vue-next'

interface Attachment {
  id: string
  name: string
  type: 'image' | 'text' | 'file'
  data?: string
  content?: string
  size?: number
}

interface UploadProgress {
  id: string
  progress: number
}

interface Props {
  attachments: Attachment[]
  uploadProgress?: UploadProgress[]
}

withDefaults(defineProps<Props>(), {
  uploadProgress: () => []
})

defineEmits<{
  remove: [id: string]
}>()

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Handle image loading events
const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.classList.add('loaded')
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.classList.add('error')
  // Could show a placeholder or error state
  console.error('Failed to load image:', img.src)
}
</script>

<style scoped>
.attachments-preview {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.attachment-item {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    scale: 0.8;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}

/* Image attachment styles */
.image-attachment img {
  transition: all 0.3s ease;
}

.image-attachment img:hover {
  transform: scale(1.05);
}

.image-attachment img.loaded {
  opacity: 1;
}

.image-attachment img.error {
  opacity: 0.5;
  filter: grayscale(100%);
}

/* File attachment styles */
.file-attachment {
  min-width: 200px;
  transition: all 0.2s ease;
}

.file-attachment:hover {
  background: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Remove button styles */
.remove-btn {
  transition: all 0.2s ease;
}

.remove-btn:hover {
  transform: scale(1.1);
}

/* Progress bar animation */
.progress-fill {
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
}

/* Drag and drop styles (for future enhancement) */
.attachment-item.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

/* Loading state */
.attachment-item.loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
}

.attachment-item.loading::after {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z' opacity='.25'/%3E%3Cpath fill='%23666' d='M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z'%3E%3CanimateTransform attributeName='transform' dur='0.75s' repeatCount='indefinite' type='rotate' values='0 12 12;360 12 12'/%3E%3C/path%3E%3C/svg%3E");
  background-size: 24px 24px;
  background-repeat: no-repeat;
  background-position: center;
}

/* Responsive design */
@media (max-width: 640px) {
  .file-attachment {
    min-width: auto;
    flex: 1;
  }
  
  .attachments-preview .flex {
    flex-direction: column;
  }
  
  .image-attachment {
    align-self: flex-start;
  }
}

/* Theme variables */
:root {
  --border: hsl(214, 32%, 91%);
  --muted: hsl(210, 20%, 96%);
  --muted-foreground: hsl(215, 20%, 45%);
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(222, 47%, 11%);
  --accent: hsl(210, 20%, 98%);
  --primary: hsl(221, 83%, 53%);
  --primary-light: hsl(221, 83%, 63%);
}

:root[data-theme="dark"] {
  --border: hsl(215, 20%, 25%);
  --muted: hsl(217, 33%, 17%);
  --muted-foreground: hsl(215, 20%, 65%);
  --background: hsl(222, 47%, 11%);
  --foreground: hsl(210, 20%, 98%);
  --accent: hsl(217, 33%, 15%);
  --primary: hsl(221, 83%, 65%);
  --primary-light: hsl(221, 83%, 75%);
}
</style>