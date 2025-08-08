<template>
  <div class="message-content-wrapper">
    <!-- Text Content -->
    <div v-if="content" class="message-text" v-html="renderedContent" />
    
    <!-- Image Attachments with Thumbnails -->
    <div v-if="imageAttachments.length > 0" class="image-attachments mt-2">
      <div 
        class="image-grid"
        :class="getImageGridClass(imageAttachments.length)"
      >
        <div
          v-for="(attachment, index) in imageAttachments"
          :key="attachment.id || index"
          class="image-attachment-item relative group"
        >
          <!-- Image Thumbnail -->
          <div 
            class="image-thumbnail cursor-pointer overflow-hidden rounded-lg bg-secondary/20 border border-border/50 hover:border-primary/50 transition-all"
            @click="openImagePreview(attachment)"
          >
            <img
              v-if="!imageErrors[attachment.url]"
              :src="getThumbnailUrl(attachment)"
              :alt="attachment.name"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              @error="handleImageError(attachment.url)"
              loading="lazy"
            />
            
            <!-- Error State -->
            <div v-else class="image-error flex items-center justify-center h-full bg-muted/20">
              <div class="text-center p-4">
                <ImageOff :size="32" class="mx-auto mb-2 text-muted-foreground/50" />
                <p class="text-xs text-muted-foreground">图片加载失败</p>
              </div>
            </div>
            
            <!-- Hover Overlay -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                @click.stop="openImagePreview(attachment)"
                class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                title="查看大图"
              >
                <Maximize2 :size="16" class="text-gray-800" />
              </button>
              <button
                @click.stop="downloadImage(attachment)"
                class="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                title="下载图片"
              >
                <Download :size="16" class="text-gray-800" />
              </button>
            </div>
          </div>
          
          <!-- Image Name -->
          <div class="image-name mt-1 px-1">
            <p class="text-xs text-muted-foreground truncate" :title="attachment.name">
              {{ getDisplayName(attachment.name) }}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Other Attachments -->
    <div v-if="otherAttachments.length > 0" class="other-attachments mt-2 space-y-2">
      <div
        v-for="(attachment, index) in otherAttachments"
        :key="attachment.id || index"
        class="attachment-item flex items-center gap-2 p-2 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors"
      >
        <FileText :size="16" class="text-muted-foreground" />
        <span class="text-sm flex-1 truncate">{{ attachment.name }}</span>
        <button
          @click="downloadFile(attachment)"
          class="p-1 hover:bg-secondary rounded transition-colors"
          title="下载文件"
        >
          <Download :size="14" class="text-muted-foreground" />
        </button>
      </div>
    </div>
    
    <!-- Image Preview Modal -->
    <Teleport to="body">
      <div
        v-if="previewImage"
        class="image-preview-modal fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        @click="closeImagePreview"
      >
        <div class="relative max-w-full max-h-full">
          <img
            :src="previewImage.url"
            :alt="previewImage.name"
            class="max-w-full max-h-[90vh] object-contain rounded-lg"
            @click.stop
          />
          
          <!-- Close Button -->
          <button
            @click="closeImagePreview"
            class="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <X :size="20" />
          </button>
          
          <!-- Image Info -->
          <div class="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm text-white p-3 rounded-lg">
            <p class="text-sm font-medium">{{ previewImage.name }}</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { marked } from 'marked'
import { ImageOff, Maximize2, Download, FileText, X } from 'lucide-vue-next'

interface Attachment {
  id?: string
  name: string
  url: string
  type: string
  size?: number
}

interface Props {
  content?: string
  attachments?: Attachment[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  attachments: () => [],
  isLoading: false
})

// State
const imageErrors = ref<Record<string, boolean>>({})
const previewImage = ref<Attachment | null>(null)

// Computed
const imageAttachments = computed(() => {
  return props.attachments.filter(a => 
    a.type === 'image' || 
    a.type?.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(a.name)
  )
})

const otherAttachments = computed(() => {
  return props.attachments.filter(a => 
    !imageAttachments.value.includes(a)
  )
})

const renderedContent = computed(() => {
  if (!props.content) return ''
  
  try {
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
      sanitize: false
    })
    
    return marked(props.content)
  } catch (error) {
    console.error('Error rendering markdown:', error)
    return props.content
  }
})

// Methods
const getImageGridClass = (count: number) => {
  if (count === 1) return 'grid-cols-1 max-w-md'
  if (count === 2) return 'grid-cols-2 gap-2 max-w-lg'
  if (count === 3) return 'grid-cols-3 gap-2 max-w-2xl'
  return 'grid-cols-2 sm:grid-cols-3 gap-2 max-w-3xl'
}

const getThumbnailUrl = (attachment: Attachment) => {
  // For pasted images with base64 URLs, return as-is
  if (attachment.url.startsWith('data:')) {
    return attachment.url
  }
  
  // For file URLs, you might want to generate thumbnails on the backend
  // For now, just return the original URL
  return attachment.url
}

const getDisplayName = (name: string) => {
  // Handle pasted image names (e.g., "pasted-fede6cba.jpeg")
  if (name.startsWith('pasted-')) {
    return '粘贴的图片'
  }
  
  // Truncate long names
  if (name.length > 30) {
    const ext = name.split('.').pop()
    return name.substring(0, 25) + '...' + (ext ? `.${ext}` : '')
  }
  
  return name
}

const handleImageError = (url: string) => {
  imageErrors.value[url] = true
}

const openImagePreview = (attachment: Attachment) => {
  previewImage.value = attachment
}

const closeImagePreview = () => {
  previewImage.value = null
}

const downloadImage = (attachment: Attachment) => {
  const link = document.createElement('a')
  link.href = attachment.url
  link.download = attachment.name
  link.click()
}

const downloadFile = (attachment: Attachment) => {
  const link = document.createElement('a')
  link.href = attachment.url
  link.download = attachment.name
  link.click()
}
</script>

<style scoped>
.image-grid {
  display: grid;
}

.image-thumbnail {
  aspect-ratio: 1;
  width: 100%;
  max-width: 200px;
}

.image-thumbnail img {
  width: 100%;
  height: 100%;
}

/* Responsive thumbnail sizes */
@media (max-width: 640px) {
  .image-thumbnail {
    max-width: 150px;
  }
}

/* Message content styles */
.message-text :deep(p) {
  margin-bottom: 0.5rem;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(code) {
  background: hsl(var(--muted) / 0.3);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.message-text :deep(pre) {
  background: hsl(var(--muted) / 0.2);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.message-text :deep(a) {
  color: hsl(var(--primary));
  text-decoration: underline;
}

.message-text :deep(a:hover) {
  opacity: 0.8;
}

/* Animation for preview modal */
.image-preview-modal {
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
</style>