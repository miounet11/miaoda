<template>
  <div class="message-skeleton" :class="skeletonClasses">
    <!-- Message layout mimicking real messages -->
    <div class="flex gap-3 w-full">
      <!-- Avatar with pulse effect -->
      <div class="skeleton-avatar-container">
        <div class="skeleton-avatar">
          <div class="avatar-pulse" />
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
            <span class="typing-dot" />
            <span class="typing-dot" />
            <span class="typing-dot" />
          </div>
        </div>

        <!-- Metadata skeleton -->
        <div class="skeleton-metadata">
          <div class="skeleton-line skeleton-timestamp" />
        </div>
      </div>
    </div>

    <!-- Floating particles for enhanced effect -->
    <div class="skeleton-particles">
      <div class="particle" v-for="n in 3" :key="n" />
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
/* 🎨 响应式设计系统 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 🎨 响应式实用类 */
.container-sm {
  max-width: var(--breakpoint-sm);
}
.container-md {
  max-width: var(--breakpoint-md);
}
.container-lg {
  max-width: var(--breakpoint-lg);
}
.container-xl {
  max-width: var(--breakpoint-xl);
}

/* 响应式显示 */
.hidden-sm {
  display: none;
}
.hidden-md {
  display: none;
}
.hidden-lg {
  display: none;
}

@media (min-width: 640px) {
  .hidden-sm {
    display: block;
  }
}

@media (min-width: 768px) {
  .hidden-md {
    display: block;
  }
}

@media (min-width: 1024px) {
  .hidden-lg {
    display: block;
  }
}

/* 响应式文本 */
.text-responsive-sm {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
.text-responsive-base {
  font-size: clamp(1rem, 2.5vw, 1.125rem);
}
.text-responsive-lg {
  font-size: clamp(1.125rem, 3vw, 1.25rem);
}
.text-responsive-xl {
  font-size: clamp(1.25rem, 3.5vw, 1.5rem);
}

/* 响应式间距 */
.space-responsive-sm {
  gap: clamp(0.5rem, 2vw, 1rem);
}
.space-responsive-md {
  gap: clamp(1rem, 3vw, 1.5rem);
}
.space-responsive-lg {
  gap: clamp(1.5rem, 4vw, 2rem);
}

/* 响应式网格 */
.grid-responsive-sm {
  grid-template-columns: repeat(auto-fit, minmax(clamp(200px, 25vw, 300px), 1fr));
}

.grid-responsive-md {
  grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 30vw, 350px), 1fr));
}

.grid-responsive-lg {
  grid-template-columns: repeat(auto-fit, minmax(clamp(300px, 35vw, 400px), 1fr));
}

/* 响应式布局调整 */
@media (max-width: 640px) {
  .flex-col-mobile {
    flex-direction: column;
  }
  .grid-1-mobile {
    grid-template-columns: 1fr;
  }
  .gap-2-mobile {
    gap: var(--space-2);
  }
  .p-4-mobile {
    padding: var(--space-4);
  }
}

@media (max-width: 768px) {
  .flex-col-tablet {
    flex-direction: column;
  }
  .grid-2-tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  .gap-4-tablet {
    gap: var(--space-4);
  }
  .p-6-tablet {
    padding: var(--space-6);
  }
}

@media (max-width: 1024px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
}

/* 🎨 现代布局系统 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.flex-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}

/* 🎨 网格系统 */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-gap-2 {
  gap: var(--space-2);
}
.grid-gap-4 {
  gap: var(--space-4);
}
.grid-gap-6 {
  gap: var(--space-6);
}

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.card:hover {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 🎨 页面布局 */
.page-layout {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
}

.page-main {
  padding: var(--space-6) 0;
}

.page-footer {
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

/* 🎨 侧边栏布局 */
.sidebar-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-6);
}

.sidebar {
  position: sticky;
  top: var(--space-6);
  height: fit-content;
}

.sidebar-content {
  padding: var(--space-6);
  background: white;
  border-radius: 12px;
  border: 1px solid var(--color-gray-200);
}

/* 🎨 响应式工具 */
@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .hidden-mobile {
    display: none;
  }
  .flex-mobile-col {
    flex-direction: column;
  }
  .grid-mobile-1 {
    grid-template-columns: 1fr;
  }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
  --space-32: 8rem; /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 {
  margin: var(--space-1);
}
.m-2 {
  margin: var(--space-2);
}
.m-3 {
  margin: var(--space-3);
}
.m-4 {
  margin: var(--space-4);
}
.m-6 {
  margin: var(--space-6);
}
.m-8 {
  margin: var(--space-8);
}

.p-1 {
  padding: var(--space-1);
}
.p-2 {
  padding: var(--space-2);
}
.p-3 {
  padding: var(--space-3);
}
.p-4 {
  padding: var(--space-4);
}
.p-6 {
  padding: var(--space-6);
}
.p-8 {
  padding: var(--space-8);
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-auto {
  margin-top: auto;
  margin-bottom: auto;
}

.px-1 {
  padding-left: var(--space-1);
  padding-right: var(--space-1);
}
.px-2 {
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.px-3 {
  padding-left: var(--space-3);
  padding-right: var(--space-3);
}
.px-4 {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
.px-6 {
  padding-left: var(--space-6);
  padding-right: var(--space-6);
}

.py-1 {
  padding-top: var(--space-1);
  padding-bottom: var(--space-1);
}
.py-2 {
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}
.py-3 {
  padding-top: var(--space-3);
  padding-bottom: var(--space-3);
}
.py-4 {
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
}
.py-6 {
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}

/* 🎨 容器和布局间距 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.section-spacing {
  padding-top: var(--space-12);
  padding-bottom: var(--space-12);
}

.card-spacing {
  padding: var(--space-6);
}

.stack-sm > * + * {
  margin-top: var(--space-2);
}
.stack-md > * + * {
  margin-top: var(--space-4);
}
.stack-lg > * + * {
  margin-top: var(--space-6);
}
.stack-xl > * + * {
  margin-top: var(--space-8);
}

.inline-sm > * + * {
  margin-left: var(--space-2);
}
.inline-md > * + * {
  margin-left: var(--space-4);
}
.inline-lg > * + * {
  margin-left: var(--space-6);
}

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  --font-size-5xl: 3rem; /* 48px */

  /* 字体权重 */
  --font-weight-thin: 100;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* 字母间距 */
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
}

/* 🎨 字体实用类 */
.font-sans {
  font-family: var(--font-family-sans);
}
.font-mono {
  font-family: var(--font-family-mono);
}

.text-xs {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
}
.text-sm {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-snug);
}
.text-base {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}
.text-lg {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
}
.text-xl {
  font-size: var(--font-size-xl);
  line-height: var(--line-height-relaxed);
}
.text-2xl {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-loose);
}
.text-3xl {
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-loose);
}

.font-thin {
  font-weight: var(--font-weight-thin);
}
.font-light {
  font-weight: var(--font-weight-light);
}
.font-normal {
  font-weight: var(--font-weight-normal);
}
.font-medium {
  font-weight: var(--font-weight-medium);
}
.font-semibold {
  font-weight: var(--font-weight-semibold);
}
.font-bold {
  font-weight: var(--font-weight-bold);
}

.leading-tight {
  line-height: var(--line-height-tight);
}
.leading-snug {
  line-height: var(--line-height-snug);
}
.leading-normal {
  line-height: var(--line-height-normal);
}
.leading-relaxed {
  line-height: var(--line-height-relaxed);
}

.tracking-tight {
  letter-spacing: var(--letter-spacing-tight);
}
.tracking-normal {
  letter-spacing: var(--letter-spacing-normal);
}
.tracking-wide {
  letter-spacing: var(--letter-spacing-wide);
}

/* 🎨 文本层次优化 */
.heading-1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 1rem;
}

.heading-2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 0.875rem;
}

.heading-3 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
  margin-bottom: 0.75rem;
}

.body-large {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
}

.body-regular {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}

.body-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.caption {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-gray-600);
}

/* 🎨 高级色彩系统 */
:root {
  /* 基础色彩 */
  --color-primary: hsl(221 83% 53%);
  --color-primary-hover: hsl(221 83% 48%);
  --color-primary-active: hsl(221 83% 43%);

  /* 语义色彩 */
  --color-success: hsl(142 71% 45%);
  --color-warning: hsl(38 92% 50%);
  --color-error: hsl(0 84% 60%);
  --color-info: hsl(217 91% 60%);

  /* 中性色彩 */
  --color-gray-50: hsl(210 20% 98%);
  --color-gray-100: hsl(210 15% 95%);
  --color-gray-200: hsl(210 10% 89%);
  --color-gray-300: hsl(210 8% 75%);
  --color-gray-400: hsl(210 8% 56%);
  --color-gray-500: hsl(210 6% 43%);
  --color-gray-600: hsl(210 8% 35%);
  --color-gray-700: hsl(210 10% 28%);
  --color-gray-800: hsl(210 12% 21%);
  --color-gray-900: hsl(210 15% 15%);

  /* 透明度变体 */
  --color-primary-10: hsl(221 83% 53% / 0.1);
  --color-primary-20: hsl(221 83% 53% / 0.2);
  --color-primary-30: hsl(221 83% 53% / 0.3);
  --color-success-10: hsl(142 71% 45% / 0.1);
  --color-error-10: hsl(0 84% 60% / 0.1);
}

/* 🎨 色彩实用类 */
.text-primary {
  color: var(--color-primary);
}
.text-success {
  color: var(--color-success);
}
.text-warning {
  color: var(--color-warning);
}
.text-error {
  color: var(--color-error);
}
.text-gray-500 {
  color: var(--color-gray-500);
}
.text-gray-600 {
  color: var(--color-gray-600);
}
.text-gray-700 {
  color: var(--color-gray-700);
}

.bg-primary {
  background-color: var(--color-primary);
}
.bg-primary-hover:hover {
  background-color: var(--color-primary-hover);
}
.bg-success {
  background-color: var(--color-success);
}
.bg-warning {
  background-color: var(--color-warning);
}
.bg-error {
  background-color: var(--color-error);
}

.border-primary {
  border-color: var(--color-primary);
}
.border-success {
  border-color: var(--color-success);
}
.border-error {
  border-color: var(--color-error);
}

/* 🎨 对比度增强 */
.high-contrast {
  --color-primary: hsl(221 100% 40%);
  --color-gray-900: hsl(210 20% 10%);
  --color-gray-100: hsl(210 15% 95%);
}

/* 🎨 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: hsl(210 15% 15%);
    --color-gray-100: hsl(210 12% 21%);
    --color-gray-200: hsl(210 10% 28%);
    --color-gray-300: hsl(210 8% 35%);
    --color-gray-400: hsl(210 6% 43%);
    --color-gray-500: hsl(210 8% 56%);
    --color-gray-600: hsl(210 8% 75%);
    --color-gray-700: hsl(210 10% 89%);
    --color-gray-800: hsl(210 15% 95%);
    --color-gray-900: hsl(210 20% 98%);
  }
}
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
  animation:
    skeletonSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    skeletonBreath 3s ease-in-out infinite 1s;
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
  background: linear-gradient(
    45deg,
    rgba(var(--primary-rgb), 0.1) 0%,
    rgba(var(--primary-rgb), 0.2) 50%,
    rgba(var(--primary-rgb), 0.1) 100%
  );
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
  background: linear-gradient(90deg, transparent, rgba(var(--primary-rgb), 0.1), transparent);
  animation: sweepGlow 3s ease-in-out infinite;
}

.skeleton-line {
  height: 18px;
  margin-bottom: 10px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    rgba(var(--muted-rgb), 0.3) 25%,
    rgba(var(--muted-rgb), 0.5) 50%,
    rgba(var(--muted-rgb), 0.3) 75%
  );
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

.skeleton-typing .typing-dot:nth-child(1) {
  animation-delay: 0s;
}
.skeleton-typing .typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.skeleton-typing .typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

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
  background: linear-gradient(
    135deg,
    rgba(var(--primary-rgb), 0.1),
    rgba(var(--primary-rgb), 0.05)
  );
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
  0%,
  100% {
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
  0%,
  100% {
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
  0%,
  60%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px) scale(1.2);
    opacity: 1;
  }
}

@keyframes floatParticle1 {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translate(10px, -15px) rotate(180deg);
    opacity: 0.7;
  }
}

@keyframes floatParticle2 {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.2;
  }
  50% {
    transform: translate(-8px, -12px) rotate(-180deg);
    opacity: 0.6;
  }
}

@keyframes floatParticle3 {
  0%,
  100% {
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
:root[data-theme='dark'] {
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

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}
</style>
