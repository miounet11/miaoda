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
          class="bg-background border border-border rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden"
          @click.stop
        >
          <EnhancedModelPickerContent
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
          class="bg-background border-t border-border rounded-t-xl shadow-xl w-full max-h-[85vh] overflow-hidden"
          @click.stop
        >
          <EnhancedModelPickerContent
            mobile
            @select="$emit('select', $event.providerId, $event.modelId)"
            @close="$emit('close')"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import EnhancedModelPickerContent from './EnhancedModelPickerContent.vue'

interface Props {
  show?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  select: [{ providerId: string; modelId: string }]
  close: []
}>()

const contentRef = ref<HTMLElement>()
const isMobile = ref(window.innerWidth < 768)

// 响应式检测
const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<style scoped>
/* 弹窗动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 底部抽屉动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
