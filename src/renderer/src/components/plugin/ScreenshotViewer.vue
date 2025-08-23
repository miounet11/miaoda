<template>
  <div class="screenshot-viewer">
    <div class="screenshot-container">
      <!-- Main screenshot display -->
      <div class="main-screenshot">
        <img
          :src="selectedScreenshot"
          :alt="`Screenshot ${selectedIndex + 1}`"
          class="screenshot-image"
          @click="openFullscreen"
        />

        <!-- Navigation overlay -->
        <div v-if="screenshots.length > 1" class="navigation-overlay">
          <button
            v-if="selectedIndex > 0"
            type="button"
            class="nav-button nav-prev"
            @click="prevScreenshot"
            aria-label="Previous screenshot"
          >
            <ChevronLeft :size="20" />
          </button>

          <button
            v-if="selectedIndex < screenshots.length - 1"
            type="button"
            class="nav-button nav-next"
            @click="nextScreenshot"
            aria-label="Next screenshot"
          >
            <ChevronRight :size="20" />
          </button>
        </div>

        <!-- Screenshot counter -->
        <div v-if="screenshots.length > 1" class="screenshot-counter">
          {{ selectedIndex + 1 }} / {{ screenshots.length }}
        </div>
      </div>

      <!-- Thumbnail strip -->
      <div v-if="screenshots.length > 1" class="thumbnail-strip">
        <button
          v-for="(screenshot, index) in screenshots"
          :key="index"
          type="button"
          class="thumbnail-button"
          :class="{ active: index === selectedIndex }"
          @click="selectScreenshot(index)"
        >
          <img :src="screenshot" :alt="`Screenshot ${index + 1}`" class="thumbnail-image" />
        </button>
      </div>
    </div>

    <!-- Fullscreen modal -->
    <Teleport to="body">
      <div
        v-if="showFullscreen"
        class="fullscreen-modal"
        @click="closeFullscreen"
        @keydown.esc="closeFullscreen"
        tabindex="0"
      >
        <div class="fullscreen-container">
          <button
            type="button"
            class="close-fullscreen"
            @click="closeFullscreen"
            aria-label="Close fullscreen"
          >
            <X :size="24" />
          </button>

          <img
            :src="selectedScreenshot"
            :alt="`Screenshot ${selectedIndex + 1}`"
            class="fullscreen-image"
            @click.stop
          />

          <!-- Fullscreen navigation -->
          <div v-if="screenshots.length > 1" class="fullscreen-navigation">
            <button
              v-if="selectedIndex > 0"
              type="button"
              class="fullscreen-nav-button nav-prev"
              @click="prevScreenshot"
              aria-label="Previous screenshot"
            >
              <ChevronLeft :size="24" />
            </button>

            <div class="fullscreen-counter">{{ selectedIndex + 1 }} / {{ screenshots.length }}</div>

            <button
              v-if="selectedIndex < screenshots.length - 1"
              type="button"
              class="fullscreen-nav-button nav-next"
              @click="nextScreenshot"
              aria-label="Next screenshot"
            >
              <ChevronRight :size="24" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

interface Props {
  screenshots: string[]
  initialIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0
})

const selectedIndex = ref(props.initialIndex)
const showFullscreen = ref(false)

const selectedScreenshot = computed(() => {
  return props.screenshots[selectedIndex.value] || ''
})

const selectScreenshot = (index: number) => {
  selectedIndex.value = index
}

const prevScreenshot = () => {
  if (selectedIndex.value > 0) {
    selectedIndex.value--
  }
}

const nextScreenshot = () => {
  if (selectedIndex.value < props.screenshots.length - 1) {
    selectedIndex.value++
  }
}

const openFullscreen = () => {
  showFullscreen.value = true
  document.body.style.overflow = 'hidden'
}

const closeFullscreen = () => {
  showFullscreen.value = false
  document.body.style.overflow = ''
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showFullscreen.value) return

  switch (event.key) {
    case 'ArrowLeft':
      prevScreenshot()
      break
    case 'ArrowRight':
      nextScreenshot()
      break
    case 'Escape':
      closeFullscreen()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  // Clean up body overflow in case component is unmounted while fullscreen is open
  document.body.style.overflow = ''
})
</script>

<style scoped>
.screenshot-viewer {
  width: 100%;
}

.screenshot-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-screenshot {
  position: relative;
  background-color: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
}

.screenshot-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.2s;
}

.screenshot-image:hover {
  transform: scale(1.02);
}

.navigation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.nav-button {
  pointer-events: auto;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  margin: 0 12px;
}

.main-screenshot:hover .nav-button {
  opacity: 1;
}

.nav-button:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.screenshot-counter {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.thumbnail-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
}

.thumbnail-button {
  flex-shrink: 0;
  background: none;
  border: 2px solid transparent;
  border-radius: 6px;
  padding: 0;
  cursor: pointer;
  transition: border-color 0.2s;
  width: 80px;
  height: 50px;
}

.thumbnail-button.active {
  border-color: #3b82f6;
}

.thumbnail-button:hover {
  border-color: #93c5fd;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

/* Fullscreen Modal */
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.fullscreen-container {
  position: relative;
  width: 90vw;
  height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-fullscreen {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  z-index: 10;
}

.close-fullscreen:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.fullscreen-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.fullscreen-navigation {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 12px 20px;
  border-radius: 24px;
}

.fullscreen-nav-button {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.fullscreen-nav-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.fullscreen-counter {
  color: white;
  font-size: 14px;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

/* Scrollbar styling */
.thumbnail-strip::-webkit-scrollbar {
  height: 6px;
}

.thumbnail-strip::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.thumbnail-strip::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.thumbnail-strip::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .main-screenshot {
    background-color: #374151;
  }

  .thumbnail-strip::-webkit-scrollbar-track {
    background: #374151;
  }

  .thumbnail-strip::-webkit-scrollbar-thumb {
    background: #6b7280;
  }

  .thumbnail-strip::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .thumbnail-button {
    width: 60px;
    height: 40px;
  }

  .nav-button {
    width: 36px;
    height: 36px;
  }

  .fullscreen-navigation {
    bottom: 10px;
    padding: 8px 16px;
  }

  .fullscreen-nav-button {
    width: 36px;
    height: 36px;
  }

  .close-fullscreen {
    width: 40px;
    height: 40px;
    top: 10px;
    right: 10px;
  }
}
</style>
