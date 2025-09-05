<template>
  <Teleport to="body">
    <!-- 桌面端：弹窗形式 -->
    <Transition name="dropdown" v-if="!isMobile">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        @click="handleBackdropClick"
      >
        <div
          ref="contentRef"
          class="bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4"
          @click.stop
        >
          <ModelPickerContent
            :current-provider-id="currentProviderId"
            :current-model-id="currentModelId"
            :available-providers="availableProviders"
            @select="$emit('select', $event.providerId, $event.modelId)"
            @close="$emit('close')"
          />
        </div>
      </div>
    </Transition>

    <!-- 移动端：底部抽屉 -->
    <Transition name="slide-up" v-else>
      <div v-if="show" class="fixed inset-0 z-50 flex items-end" @click="handleBackdropClick">
        <div
          ref="contentRef"
          class="bg-background border-t border-border rounded-t-xl shadow-xl w-full max-h-[80vh] overflow-hidden"
          @click.stop
        >
          <ModelPickerContent
            :current-provider-id="currentProviderId"
            :current-model-id="currentModelId"
            :available-providers="availableProviders"
            :is-mobile="true"
            @select="$emit('select', $event.providerId, $event.modelId)"
            @close="$emit('close')"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ModelPickerContent from './ModelPickerContent.vue'
import type { Provider } from '@/types'

// Props
interface Props {
  currentProviderId: string
  currentModelId: string
  availableProviders: Provider[]
  show?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: true
})

// Emits
const emit = defineEmits<{
  select: [providerId: string, modelId: string]
  close: []
}>()

// Refs
const contentRef = ref<HTMLElement>()

// 计算属性
const isMobile = computed(() => {
  return window.innerWidth < 768 || 'ontouchstart' in window
})

// 方法
const handleBackdropClick = () => {
  emit('close')
}

// 自动聚焦
onMounted(() => {
  if (contentRef.value) {
    // 延迟聚焦以确保动画完成
    setTimeout(() => {
      const focusableElement = contentRef.value?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement

      if (focusableElement) {
        focusableElement.focus()
      }
    }, 100)
  }
})
</script>

<style scoped>
/* 弹窗动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease-out;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* 底部抽屉动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
