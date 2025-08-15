<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal-overlay"
      @click.self="$emit('close')"
    >
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-title">评价插件</h2>
          <button @click="$emit('close')" class="close-btn">
            <X :size="24" />
          </button>
        </div>

        <div class="modal-content">
          <div class="plugin-info">
            <div class="plugin-icon">
              <img
                v-if="plugin.icon"
                :src="plugin.icon"
                :alt="plugin.name"
                class="icon-image"
              >
              <Package v-else :size="32" />
            </div>
            <div class="plugin-details">
              <h3 class="plugin-name">{{ plugin.name }}</h3>
              <p class="plugin-author">by {{ plugin.author }}</p>
            </div>
          </div>

          <form @submit.prevent="submitRating" class="rating-form">
            <!-- Star Rating -->
            <div class="rating-section">
              <label class="section-label">评分</label>
              <div class="star-rating">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  @click="setRating(star)"
                  @mouseover="hoverRating = star"
                  @mouseleave="hoverRating = 0"
                  class="star-btn"
                >
                  <Star
                    :size="24"
                    :class="[
                      'star',
                      {
                        filled: star <= (hoverRating || rating),
                        hover: star <= hoverRating
                      }
                    ]"
                  />
                </button>
              </div>
              <p class="rating-text">{{ getRatingText() }}</p>
            </div>

            <!-- Review Text -->
            <div class="review-section">
              <label class="section-label">评价内容 (可选)</label>
              <textarea
                v-model="reviewText"
                placeholder="分享您的使用体验..."
                class="review-input"
                rows="4"
                maxlength="500"
              />
              <p class="char-count">{{ reviewText.length }}/500</p>
            </div>

            <!-- Review Tags -->
            <div class="tags-section">
              <label class="section-label">标签 (可选)</label>
              <div class="tags-container">
                <button
                  v-for="tag in availableTags"
                  :key="tag"
                  type="button"
                  @click="toggleTag(tag)"
                  :class="['tag-btn', { active: selectedTags.includes(tag) }]"
                >
                  {{ tag }}
                </button>
              </div>
            </div>

            <!-- Anonymous Option -->
            <div class="options-section">
              <label class="option-item">
                <input
                  v-model="isAnonymous"
                  type="checkbox"
                  class="option-checkbox"
                >
                <span class="option-text">匿名发布评价</span>
              </label>
            </div>

            <!-- Actions -->
            <div class="modal-actions">
              <button
                type="button"
                @click="$emit('close')"
                class="action-btn cancel"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="rating === 0 || isSubmitting"
                class="action-btn submit"
              >
                <Loader2 v-if="isSubmitting" :size="16" class="animate-spin" />
                提交评价
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Package, Star, Loader2 } from 'lucide-vue-next'

import type { PluginMarketListing } from '../../types/plugins'

interface Props {
  plugin: PluginMarketListing
  show: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [rating: { rating: number; review?: string; tags?: string[]; anonymous?: boolean }]
}>()

// State
const rating = ref(0)
const hoverRating = ref(0)
const reviewText = ref('')
const selectedTags = ref<string[]>([])
const isAnonymous = ref(false)
const isSubmitting = ref(false)

// Available tags for reviews
const availableTags = [
  '易于使用',
  '功能强大',
  '界面美观',
  '性能优异',
  '文档清晰',
  '响应迅速',
  '值得推荐',
  '需要改进',
  '有 Bug',
  '功能缺失'
]

// Methods
const setRating = (value: number) => {
  rating.value = value
}

const getRatingText = (): string => {
  const currentRating = hoverRating.value || rating.value
  const texts = [
    '',
    '很差',
    '一般',
    '不错',
    '很好',
    '非常好'
  ]
  return texts[currentRating] || ''
}

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    if (selectedTags.value.length < 5) { // Limit to 5 tags
      selectedTags.value.push(tag)
    }
  }
}

const submitRating = async () => {
  if (rating.value === 0) return
  
  isSubmitting.value = true
  
  try {
    const ratingData = {
      rating: rating.value,
      review: reviewText.value.trim() || undefined,
      tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
      anonymous: isAnonymous.value || undefined
    }
    
    emit('submit', ratingData)
  } catch (error) {
    console.error('Failed to submit rating:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-background border border-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-border;
}

.modal-title {
  @apply text-lg font-semibold;
}

.close-btn {
  @apply p-1 hover:bg-accent rounded-md transition-colors;
}

.modal-content {
  @apply p-6;
}

.plugin-info {
  @apply flex items-center gap-3 mb-6 p-3 bg-muted/50 rounded-lg;
}

.plugin-icon {
  @apply w-12 h-12 rounded-lg bg-background flex items-center justify-center overflow-hidden;
}

.icon-image {
  @apply w-full h-full object-cover;
}

.plugin-details {
  @apply flex-1;
}

.plugin-name {
  @apply font-semibold;
}

.plugin-author {
  @apply text-sm text-muted-foreground;
}

.rating-form {
  @apply space-y-6;
}

.rating-section, .review-section, .tags-section, .options-section {
  @apply space-y-3;
}

.section-label {
  @apply block text-sm font-medium mb-2;
}

.star-rating {
  @apply flex gap-1;
}

.star-btn {
  @apply p-1 hover:scale-110 transition-transform;
}

.star {
  @apply text-muted-foreground transition-colors;
}

.star.filled {
  @apply text-yellow-500 fill-current;
}

.star.hover {
  @apply text-yellow-400;
}

.rating-text {
  @apply text-sm text-muted-foreground;
}

.review-input {
  @apply w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none;
}

.char-count {
  @apply text-xs text-muted-foreground text-right;
}

.tags-container {
  @apply flex flex-wrap gap-2;
}

.tag-btn {
  @apply px-3 py-1 text-sm border border-border rounded-full bg-background hover:bg-accent transition-colors;
}

.tag-btn.active {
  @apply bg-primary text-primary-foreground border-primary;
}

.option-item {
  @apply flex items-center gap-3 cursor-pointer;
}

.option-checkbox {
  @apply w-4 h-4 text-primary border-border rounded focus:ring-primary;
}

.option-text {
  @apply text-sm;
}

.modal-actions {
  @apply flex gap-3 pt-4;
}

.action-btn {
  @apply flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors;
}

.action-btn.cancel {
  @apply border border-border hover:bg-accent;
}

.action-btn.submit {
  @apply bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>