<template>
  <div
    class="typing-indicator flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm"
  >
    <!-- Enhanced typing animation container -->
    <div class="typing-animation-container relative">
      <!-- Outer pulse ring -->
      <div class="pulse-ring" />

      <!-- Main dots -->
      <div class="flex items-center gap-1.5">
        <span class="typing-dot" />
        <span class="typing-dot" />
        <span class="typing-dot" />
      </div>

      <!-- Floating particles -->
      <div class="particle particle-1" />
      <div class="particle particle-2" />
      <div class="particle particle-3" />
    </div>

    <!-- Message with typewriter effect -->
    <div class="typing-message">
      <span class="text-sm text-muted-foreground font-medium">{{ displayMessage }}</span>
      <span class="typing-cursor">|</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  message?: string
  variant?: 'default' | 'minimal' | 'enhanced'
  showTypewriter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  message: 'AI is thinking...',
  variant: 'enhanced',
  showTypewriter: true
})

// Typewriter effect state
const displayMessage = ref('')
const typewriterIndex = ref(0)
const typewriterTimer = ref<NodeJS.Timeout | null>(null)

// Typewriter effect
const startTypewriter = () => {
  if (!props.showTypewriter) {
    displayMessage.value = props.message
    return
  }

  displayMessage.value = ''
  typewriterIndex.value = 0

  const typeNextChar = () => {
    if (typewriterIndex.value < props.message.length) {
      displayMessage.value += props.message[typewriterIndex.value]
      typewriterIndex.value++
      typewriterTimer.value = setTimeout(typeNextChar, 50 + Math.random() * 50)
    }
  }

  typeNextChar()
}

onMounted(() => {
  startTypewriter()
})

onUnmounted(() => {
  if (typewriterTimer.value) {
    clearTimeout(typewriterTimer.value)
  }
})
</script>

<style scoped>
.typing-indicator {
  animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--border-rgb, 229, 231, 235), 0.3);
  transition: all 0.3s ease;
}

.typing-indicator:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Animation container */
.typing-animation-container {
  position: relative;
  padding: 8px;
}

/* Pulse ring effect */
.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--primary-rgb), 0.1), transparent);
  transform: translate(-50%, -50%);
  animation: pulseRing 2s ease-in-out infinite;
}

/* Enhanced typing dots */
.typing-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark, #2563eb));
  box-shadow: 0 2px 4px rgba(var(--primary-rgb), 0.3);
  animation: typingBounce 1.6s ease-in-out infinite;
  position: relative;
}

.typing-dot::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.4), transparent);
  animation: dotGlow 1.6s ease-in-out infinite;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.3s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.6s;
}

/* Floating particles */
.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(var(--primary-rgb), 0.6);
  pointer-events: none;
}

.particle-1 {
  top: 10%;
  left: 20%;
  animation: float1 3s ease-in-out infinite;
}

.particle-2 {
  top: 60%;
  right: 15%;
  animation: float2 2.5s ease-in-out infinite 0.5s;
}

.particle-3 {
  bottom: 20%;
  left: 60%;
  animation: float3 3.5s ease-in-out infinite 1s;
}

/* Message container */
.typing-message {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* Typing cursor */
.typing-cursor {
  color: var(--primary);
  animation: cursorBlink 1s ease-in-out infinite;
  font-weight: bold;
}

/* Animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulseRing {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.3;
  }
}

@keyframes typingBounce {
  0%,
  40%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.7;
  }
  20% {
    transform: translateY(-8px) scale(1.1);
    opacity: 1;
  }
}

@keyframes dotGlow {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.5);
  }
}

@keyframes float1 {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-15px) rotate(180deg);
    opacity: 0.8;
  }
}

@keyframes float2 {
  0%,
  100% {
    transform: translateX(0px) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateX(10px) rotate(-180deg);
    opacity: 0.7;
  }
}

@keyframes float3 {
  0%,
  100% {
    transform: translate(0px, 0px) rotate(0deg);
    opacity: 0.5;
  }
  33% {
    transform: translate(5px, -8px) rotate(120deg);
    opacity: 0.8;
  }
  66% {
    transform: translate(-3px, -12px) rotate(240deg);
    opacity: 0.6;
  }
}

@keyframes cursorBlink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* Theme variables */
:root {
  --primary: hsl(221, 83%, 53%);
  --primary-rgb: 59, 130, 246;
  --primary-dark: #2563eb;
  --border-rgb: 229, 231, 235;
}

:root[data-theme='dark'] {
  --primary: hsl(221, 83%, 65%);
  --primary-rgb: 96, 165, 250;
  --primary-dark: #3b82f6;
  --border-rgb: 75, 85, 99;
}

/* Accessibility: Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .typing-indicator,
  .typing-dot,
  .pulse-ring,
  .particle,
  .typing-cursor {
    animation: none !important;
  }

  .typing-dot {
    opacity: 0.7;
  }

  .typing-cursor {
    opacity: 1;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .typing-indicator {
    border-width: 2px;
    border-color: var(--primary);
  }

  .typing-dot {
    background: var(--primary);
    box-shadow: none;
  }
}
</style>
