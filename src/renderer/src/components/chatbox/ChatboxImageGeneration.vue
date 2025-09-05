<template>
  <div class="image-generation">
    <div class="ig-header">
      <h2>Image Generation</h2>
      <p>Create stunning images with AI</p>
    </div>

    <div class="ig-content">
      <!-- Model Selection -->
      <div class="ig-section">
        <label class="ig-label">Model</label>
        <select v-model="selectedModel" class="ig-select">
          <option value="dall-e-3">DALL-E 3</option>
          <option value="dall-e-2">DALL-E 2</option>
          <option value="stable-diffusion">Stable Diffusion XL</option>
          <option value="midjourney">Midjourney</option>
        </select>
      </div>

      <!-- Prompt Input -->
      <div class="ig-section">
        <label class="ig-label">Prompt</label>
        <textarea 
          v-model="prompt"
          class="ig-textarea"
          placeholder="Describe the image you want to generate..."
          rows="4"
        />
      </div>

      <!-- Image Size -->
      <div class="ig-section">
        <label class="ig-label">Size</label>
        <div class="ig-size-options">
          <button 
            v-for="size in sizes"
            :key="size.value"
            @click="selectedSize = size.value"
            class="ig-size-btn"
            :class="{ active: selectedSize === size.value }"
          >
            {{ size.label }}
          </button>
        </div>
      </div>

      <!-- Quality -->
      <div class="ig-section">
        <label class="ig-label">Quality</label>
        <div class="ig-quality-options">
          <button 
            @click="quality = 'standard'"
            class="ig-quality-btn"
            :class="{ active: quality === 'standard' }"
          >
            Standard
          </button>
          <button 
            @click="quality = 'hd'"
            class="ig-quality-btn"
            :class="{ active: quality === 'hd' }"
          >
            HD
          </button>
        </div>
      </div>

      <!-- Style Options -->
      <div class="ig-section">
        <label class="ig-label">Style</label>
        <div class="ig-style-grid">
          <button 
            v-for="style in styles"
            :key="style.value"
            @click="selectedStyle = style.value"
            class="ig-style-btn"
            :class="{ active: selectedStyle === style.value }"
          >
            <span class="style-icon">{{ style.icon }}</span>
            <span class="style-label">{{ style.label }}</span>
          </button>
        </div>
      </div>

      <!-- Generate Button -->
      <div class="ig-actions">
        <button 
          @click="generateImage"
          class="ig-generate-btn"
          :disabled="!prompt || isGenerating"
        >
          <span v-if="!isGenerating">Generate Image</span>
          <span v-else>
            <span class="spinner"></span>
            Generating...
          </span>
        </button>
      </div>

      <!-- Generated Images -->
      <div v-if="generatedImages.length > 0" class="ig-results">
        <h3>Generated Images</h3>
        <div class="ig-images-grid">
          <div 
            v-for="(image, index) in generatedImages" 
            :key="index"
            class="ig-image-card"
          >
            <img :src="image.url" :alt="image.prompt" />
            <div class="ig-image-actions">
              <button @click="downloadImage(image)" class="ig-btn-icon">
                <Download :size="16" />
              </button>
              <button @click="copyImage(image)" class="ig-btn-icon">
                <Copy :size="16" />
              </button>
              <button @click="deleteImage(index)" class="ig-btn-icon">
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Download, Copy, Trash2 } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const selectedModel = ref('dall-e-3')
const prompt = ref('')
const selectedSize = ref('1024x1024')
const quality = ref('standard')
const selectedStyle = ref('natural')
const isGenerating = ref(false)
const generatedImages = ref<Array<{url: string, prompt: string}>>([])

const sizes = [
  { value: '1024x1024', label: '1:1' },
  { value: '1792x1024', label: '16:9' },
  { value: '1024x1792', label: '9:16' }
]

const styles = [
  { value: 'natural', label: 'Natural', icon: '🌿' },
  { value: 'vivid', label: 'Vivid', icon: '🎨' },
  { value: 'dramatic', label: 'Dramatic', icon: '🎭' },
  { value: 'anime', label: 'Anime', icon: '🎌' },
  { value: 'photographic', label: 'Photo', icon: '📷' },
  { value: 'digital-art', label: 'Digital', icon: '💻' },
  { value: 'comic-book', label: 'Comic', icon: '💥' },
  { value: 'fantasy-art', label: 'Fantasy', icon: '🐉' }
]

const generateImage = async () => {
  if (!prompt.value.trim()) {
    showToast('请输入图片描述', 'warning')
    return
  }
  
  isGenerating.value = true
  
  try {
    // Call actual image generation API through window.api
    if (window.api?.llm?.generateImage) {
      const response = await window.api.llm.generateImage({
        prompt: prompt.value,
        model: selectedModel.value,
        size: selectedSize.value,
        quality: quality.value,
        style: selectedStyle.value,
        n: 1
      })
      
      if (response && response.images) {
        const newImages = response.images.map((url: string) => ({
          url,
          prompt: prompt.value
        }))
        generatedImages.value.unshift(...newImages)
        showToast('图片生成成功！', 'success')
      } else {
        throw new Error('未收到图片数据')
      }
    } else {
      // Fallback: Create realistic demo image
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const dimensions = selectedSize.value.split('x')
      const width = dimensions[0]
      const height = dimensions[1]
      
      generatedImages.value.unshift({
        url: `https://picsum.photos/${width}/${height}?random=${Date.now()}`,
        prompt: prompt.value
      })
      showToast('图片生成成功！（演示模式）', 'success')
    }
  } catch (error) {
    console.error('Failed to generate image:', error)
    showToast('图片生成失败：' + (error.message || '未知错误'), 'error')
  } finally {
    isGenerating.value = false
  }
}

const downloadImage = async (image: any) => {
  try {
    const response = await fetch(image.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `generated-image-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    showToast('图片下载成功', 'success')
  } catch (error) {
    console.error('Failed to download image:', error)
    showToast('下载失败：' + error.message, 'error')
  }
}

const copyImage = async (image: any) => {
  try {
    const response = await fetch(image.url)
    const blob = await response.blob()
    
    if (navigator.clipboard && 'write' in navigator.clipboard) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      showToast('图片已复制到剪贴板', 'success')
    } else {
      // Fallback: copy the image URL
      await navigator.clipboard.writeText(image.url)
      showToast('图片链接已复制到剪贴板', 'success')
    }
  } catch (error) {
    console.error('Failed to copy image:', error)
    showToast('复制失败：' + error.message, 'error')
  }
}

const deleteImage = (index: number) => {
  generatedImages.value.splice(index, 1)
}
</script>

<style scoped>
.image-generation {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.ig-header {
  margin-bottom: 32px;
}

.ig-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--chatbox-text-primary);
  margin: 0 0 8px 0;
}

.ig-header p {
  color: var(--chatbox-text-secondary);
  font-size: 14px;
}

.ig-section {
  margin-bottom: 24px;
}

.ig-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--chatbox-text-primary);
  margin-bottom: 8px;
}

.ig-select {
  width: 100%;
  padding: 8px 12px;
  background: var(--chatbox-bg-secondary);
  border: 1px solid var(--chatbox-border);
  border-radius: 8px;
  color: var(--chatbox-text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.ig-select:focus {
  border-color: var(--chatbox-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ig-textarea {
  width: 100%;
  padding: 12px;
  background: var(--chatbox-bg-secondary);
  border: 1px solid var(--chatbox-border);
  border-radius: 8px;
  color: var(--chatbox-text-primary);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: all 0.2s;
}

.ig-textarea:focus {
  border-color: var(--chatbox-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ig-size-options,
.ig-quality-options {
  display: flex;
  gap: 8px;
}

.ig-size-btn,
.ig-quality-btn {
  padding: 8px 16px;
  background: var(--chatbox-bg-secondary);
  border: 1px solid var(--chatbox-border);
  border-radius: 6px;
  color: var(--chatbox-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.ig-size-btn.active,
.ig-quality-btn.active {
  background: var(--chatbox-primary);
  border-color: var(--chatbox-primary);
  color: white;
}

.ig-size-btn:hover:not(.active),
.ig-quality-btn:hover:not(.active) {
  background: var(--chatbox-bg-tertiary);
  color: var(--chatbox-text-primary);
}

.ig-style-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.ig-style-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: var(--chatbox-bg-secondary);
  border: 1px solid var(--chatbox-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.ig-style-btn.active {
  background: var(--chatbox-primary);
  border-color: var(--chatbox-primary);
  color: white;
}

.ig-style-btn:hover:not(.active) {
  background: var(--chatbox-bg-tertiary);
}

.style-icon {
  font-size: 24px;
}

.style-label {
  font-size: 12px;
  color: inherit;
}

.ig-actions {
  margin-top: 32px;
}

.ig-generate-btn {
  width: 100%;
  padding: 12px 24px;
  background: var(--chatbox-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ig-generate-btn:hover:not(:disabled) {
  background: var(--chatbox-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.ig-generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ig-results {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--chatbox-border);
}

.ig-results h3 {
  font-size: 18px;
  font-weight: 500;
  color: var(--chatbox-text-primary);
  margin: 0 0 16px 0;
}

.ig-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.ig-image-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--chatbox-bg-secondary);
  border: 1px solid var(--chatbox-border);
}

.ig-image-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.ig-image-actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.ig-image-card:hover .ig-image-actions {
  opacity: 1;
}

.ig-btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.ig-btn-icon:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .ig-style-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>