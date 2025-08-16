<template>
  <div class="message-skeleton" :class="skeletonClasses">
    <!-- Message layout mimicking real messages -->
    <div class="flex gap-3 w-full">
      <!-- Avatar with pulse effect -->
      <div class="skeleton-avatar-container">
        <div class="skeleton-avatar">
          <div class="avatar-pulse"></div>
        </div>
      </div>
      
      <!-- Content area -->
      <div class="skeleton-content flex-1 min-w-0">
        <!-- Message bubble skeleton -->
        <div class="skeleton-bubble">
          <!-- Dynamic content lines -->
          <div 
            v-for="(width, index) in lineWidths" 
            :key="index"
            class="skeleton-line"
            :style="{ width, animationDelay: `${index * 100}ms` }"
          />
          
          <!-- Typing dots simulation -->
          <div v-if="showTyping" class="skeleton-typing">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
        
        <!-- Metadata skeleton -->
        <div class="skeleton-metadata">
          <div class="skeleton-line skeleton-timestamp"></div>
        </div>
      </div>
    </div>
    
    <!-- Floating particles for enhanced effect -->
    <div class="skeleton-particles">
      <div class="particle" v-for="n in 3" :key="n"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  variant?: 'message' | 'compact' | 'detailed'
  showTyping?: boolean
  animate?: boolean
  role?: 'user' | 'assistant'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'message',
  showTyping: true,
  animate: true,
  role: 'assistant'
})

// Dynamic line widths for more realistic skeleton
const lineWidths = computed(() => {
  switch (props.variant) {
    case 'compact':
      return ['75%', '45%']
    case 'detailed':
      return ['85%', '60%', '70%', '40%', '80%']
    default:
      return ['80%', '55%', '75%']
  }
})

const skeletonClasses = computed(() => ({
  'skeleton-compact': props.variant === 'compact',
  'skeleton-detailed': props.variant === 'detailed',
  'skeleton-user': props.role === 'user',
  'skeleton-assistant': props.role === 'assistant',
  'skeleton-animated': props.animate
}))
</script>

<style scoped>
.message-skeleton {
  padding: 1rem 1.5rem;
  position: relative;
  overflow: hidden;
  animation: skeletonSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, rgba(var(--muted-rgb), 0.3), rgba(var(--muted-rgb), 0.1));
  border-radius: 1rem;
  margin-bottom: 1rem;
}

.skeleton-animated {
  animation: skeletonSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1), skeletonBreath 3s ease-in-out infinite 1s;
}

/* Avatar container with enhanced styling */
.skeleton-avatar-container {
  position: relative;
  flex-shrink: 0;
}

.skeleton-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(45deg, 
    rgba(var(--primary-rgb), 0.1) 0%, 
    rgba(var(--primary-rgb), 0.2) 50%, 
    rgba(var(--primary-rgb), 0.1) 100%);
  background-size: 200% 200%;
  animation: shimmerRotate 2s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.avatar-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--primary-rgb), 0.2), transparent 70%);
  animation: avatarPulse 2s ease-in-out infinite;
}

/* Enhanced content skeleton */
.skeleton-content {
  padding-top: 2px;
}

.skeleton-bubble {
  background: rgba(var(--background-rgb), 0.8);
  border-radius: 1.25rem;
  padding: 1rem 1.25rem;
  border: 1px solid rgba(var(--border-rgb), 0.2);
  position: relative;
  overflow: hidden;
}

.skeleton-bubble::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(var(--primary-rgb), 0.1), 
    transparent);
  animation: sweepGlow 3s ease-in-out infinite;
}

.skeleton-line {
  height: 18px;
  margin-bottom: 10px;
  border-radius: 6px;
  background: linear-gradient(90deg, 
    rgba(var(--muted-rgb), 0.3) 25%, 
    rgba(var(--muted-rgb), 0.5) 50%, 
    rgba(var(--muted-rgb), 0.3) 75%);
  background-size: 200% 100%;
  animation: shimmerWave 2s ease-in-out infinite;
  position: relative;
}

.skeleton-line:last-child {
  margin-bottom: 0;
}

/* Typing animation for skeleton */
.skeleton-typing {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  align-items: center;
}

.skeleton-typing .typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(var(--primary-rgb), 0.4);
  animation: typingDotBounce 1.4s ease-in-out infinite;
}

.skeleton-typing .typing-dot:nth-child(1) { animation-delay: 0s; }
.skeleton-typing .typing-dot:nth-child(2) { animation-delay: 0.2s; }
.skeleton-typing .typing-dot:nth-child(3) { animation-delay: 0.4s; }

/* Metadata skeleton */
.skeleton-metadata {
  margin-top: 8px;
  opacity: 0.6;
}

.skeleton-timestamp {
  height: 12px;
  width: 80px;
  margin-bottom: 0;
}

/* Floating particles */
.skeleton-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(var(--primary-rgb), 0.3);
}

.particle:nth-child(1) {
  top: 20%;
  left: 15%;
  animation: floatParticle1 4s ease-in-out infinite;
}

.particle:nth-child(2) {
  top: 60%;
  right: 20%;
  animation: floatParticle2 3.5s ease-in-out infinite 1s;
}

.particle:nth-child(3) {
  bottom: 25%;
  left: 70%;
  animation: floatParticle3 4.5s ease-in-out infinite 2s;
}

/* Variant styles */
.skeleton-compact {
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
}

.skeleton-compact .skeleton-avatar {
  width: 28px;
  height: 28px;
}

.skeleton-compact .skeleton-bubble {
  padding: 0.75rem 1rem;
}

.skeleton-detailed .skeleton-bubble {
  padding: 1.25rem 1.5rem;
}

/* Role-based styling */
.skeleton-user {
  margin-left: 20%;
}

.skeleton-user .skeleton-bubble {
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(var(--primary-rgb), 0.05));
}

.skeleton-assistant .skeleton-bubble {
  background: rgba(var(--secondary-rgb, 248, 249, 250), 0.8);
}

/* Enhanced animations */
@keyframes skeletonSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes skeletonBreath {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.01);
    opacity: 0.9;
  }
}

@keyframes shimmerWave {
  0% {
    background-position: -200% 0;
    transform: scaleX(1);
  }
  50% {
    transform: scaleX(1.02);
  }
  100% {
    background-position: 200% 0;
    transform: scaleX(1);
  }
}

@keyframes shimmerRotate {
  0% {
    background-position: 0% 0%;
    transform: rotate(0deg);
  }
  50% {
    background-position: 100% 100%;
    transform: rotate(180deg);
  }
  100% {
    background-position: 0% 0%;
    transform: rotate(360deg);
  }
}

@keyframes avatarPulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

@keyframes sweepGlow {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes typingDotBounce {
  0%, 60%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px) scale(1.2);
    opacity: 1;
  }
}

@keyframes floatParticle1 {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translate(10px, -15px) rotate(180deg);
    opacity: 0.7;
  }
}

@keyframes floatParticle2 {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.2;
  }
  50% {
    transform: translate(-8px, -12px) rotate(-180deg);
    opacity: 0.6;
  }
}

@keyframes floatParticle3 {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.4;
  }
  33% {
    transform: translate(5px, -10px) rotate(120deg);
    opacity: 0.8;
  }
  66% {
    transform: translate(-3px, -18px) rotate(240deg);
    opacity: 0.5;
  }
}

/* Theme variables */
:root {
  --primary-rgb: 59, 130, 246;
  --muted-rgb: 156, 163, 175;
  --background-rgb: 255, 255, 255;
  --border-rgb: 229, 231, 235;
  --secondary-rgb: 248, 249, 250;
}

/* Dark theme support */
:root[data-theme="dark"] {
  --primary-rgb: 96, 165, 250;
  --muted-rgb: 75, 85, 99;
  --background-rgb: 17, 24, 39;
  --border-rgb: 75, 85, 99;
  --secondary-rgb: 31, 41, 55;
}

/* Accessibility: Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .message-skeleton,
  .skeleton-avatar,
  .skeleton-line,
  .skeleton-typing .typing-dot,
  .particle {
    animation: none !important;
  }
  
  .skeleton-line {
    opacity: 0.6;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .skeleton-bubble {
    border-width: 2px;
    border-color: rgba(var(--primary-rgb), 0.5);
  }
  
  .skeleton-line {
    background: rgba(var(--primary-rgb), 0.3);
  }
}
</style>