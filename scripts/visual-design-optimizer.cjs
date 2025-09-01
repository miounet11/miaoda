#!/usr/bin/env node

/**
 * 🎨 顶级视觉设计优化器
 *
 * 作为顶级UI/UX设计师，专注于：
 * - 色彩理论应用和对比度优化
 * - 视觉层次结构的完善
 * - 响应式设计和网格系统
 * - 字体系统和排版优化
 * - 空间关系和布局美学
 */

const fs = require('fs')
const path = require('path')

class VisualDesignOptimizer {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      colorOptimizations: 0,
      typographyImprovements: 0,
      spacingOptimizations: 0,
      layoutImprovements: 0,
      responsiveEnhancements: 0
    }
  }

  /**
   * 优化单个Vue组件的视觉设计
   */
  async optimizeVueComponent(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      let modifiedContent = content
      let modified = false
      const componentName = path.basename(filePath, '.vue')

      console.log(`🎨 优化视觉设计: ${componentName}`)

      // 1. 优化色彩系统
      const colorResult = this.optimizeColorSystem(modifiedContent, componentName)
      if (colorResult.modified) {
        modifiedContent = colorResult.content
        modified = true
        this.stats.colorOptimizations++
      }

      // 2. 完善字体系统
      const typographyResult = this.optimizeTypography(modifiedContent, componentName)
      if (typographyResult.modified) {
        modifiedContent = typographyResult.content
        modified = true
        this.stats.typographyImprovements++
      }

      // 3. 优化间距系统
      const spacingResult = this.optimizeSpacing(modifiedContent, componentName)
      if (spacingResult.modified) {
        modifiedContent = spacingResult.content
        modified = true
        this.stats.spacingOptimizations++
      }

      // 4. 改善布局设计
      const layoutResult = this.optimizeLayout(modifiedContent, componentName)
      if (layoutResult.modified) {
        modifiedContent = layoutResult.content
        modified = true
        this.stats.layoutImprovements++
      }

      // 5. 增强响应式设计
      const responsiveResult = this.optimizeResponsiveDesign(modifiedContent, componentName)
      if (responsiveResult.modified) {
        modifiedContent = responsiveResult.content
        modified = true
        this.stats.responsiveEnhancements++
      }

      // 保存修改
      if (modified) {
        fs.writeFileSync(filePath, modifiedContent, 'utf-8')
        this.stats.filesModified++
        console.log(`✅ 已优化: ${componentName}`)
      } else {
        console.log(`ℹ️ 无需优化: ${componentName}`)
      }

      this.stats.filesProcessed++

    } catch (error) {
      console.error(`❌ 优化组件失败: ${filePath}`, error.message)
    }
  }

  /**
   * 优化色彩系统
   */
  optimizeColorSystem(content, componentName) {
    let modified = false
    let result = { content, modified }

    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    if (!styleMatch) return result

    let styles = styleMatch[1]

    // 1. 添加高级色彩系统
    if (!styles.includes('--color-primary')) {
      const colorSystem = `

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
.text-primary { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
.text-gray-500 { color: var(--color-gray-500); }
.text-gray-600 { color: var(--color-gray-600); }
.text-gray-700 { color: var(--color-gray-700); }

.bg-primary { background-color: var(--color-primary); }
.bg-primary-hover:hover { background-color: var(--color-primary-hover); }
.bg-success { background-color: var(--color-success); }
.bg-warning { background-color: var(--color-warning); }
.bg-error { background-color: var(--color-error); }

.border-primary { border-color: var(--color-primary); }
.border-success { border-color: var(--color-success); }
.border-error { border-color: var(--color-error); }

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
}`
      styles = colorSystem + styles
      modified = true
    }

    // 2. 优化现有色彩使用
    styles = styles.replace(/color:\s*#([0-9a-fA-F]{3,6})/g, (match, hex) => {
      // 转换为HSL格式以获得更好的可控性
      return `color: hsl(${this.hexToHsl(hex)});`
    })

    styles = styles.replace(/background-color:\s*#([0-9a-fA-F]{3,6})/g, (match, hex) => {
      return `background-color: hsl(${this.hexToHsl(hex)});`
    })

    if (modified) {
      result.content = content.replace(styleMatch[0], `<style${styleMatch[0].match(/<style[^>]*>/)[0]}${styles}</style>`)
      result.modified = true
    }

    return result
  }

  /**
   * 完善字体系统
   */
  optimizeTypography(content, componentName) {
    let modified = false
    let result = { content, modified }

    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    if (!styleMatch) return result

    let styles = styleMatch[1]

    // 1. 添加完整的字体系统
    if (!styles.includes('--font-family')) {
      const typographySystem = `

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */

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
.font-sans { font-family: var(--font-family-sans); }
.font-mono { font-family: var(--font-family-mono); }

.text-xs { font-size: var(--font-size-xs); line-height: var(--line-height-tight); }
.text-sm { font-size: var(--font-size-sm); line-height: var(--line-height-snug); }
.text-base { font-size: var(--font-size-base); line-height: var(--line-height-normal); }
.text-lg { font-size: var(--font-size-lg); line-height: var(--line-height-relaxed); }
.text-xl { font-size: var(--font-size-xl); line-height: var(--line-height-relaxed); }
.text-2xl { font-size: var(--font-size-2xl); line-height: var(--line-height-loose); }
.text-3xl { font-size: var(--font-size-3xl); line-height: var(--line-height-loose); }

.font-thin { font-weight: var(--font-weight-thin); }
.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.leading-tight { line-height: var(--line-height-tight); }
.leading-snug { line-height: var(--line-height-snug); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }

.tracking-tight { letter-spacing: var(--letter-spacing-tight); }
.tracking-normal { letter-spacing: var(--letter-spacing-normal); }
.tracking-wide { letter-spacing: var(--letter-spacing-wide); }

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
}`
      styles = typographySystem + styles
      modified = true
    }

    if (modified) {
      result.content = content.replace(styleMatch[0], `<style${styleMatch[0].match(/<style[^>]*>/)[0]}${styles}</style>`)
      result.modified = true
    }

    return result
  }

  /**
   * 优化间距系统
   */
  optimizeSpacing(content, componentName) {
    let modified = false
    let result = { content, modified }

    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    if (!styleMatch) return result

    let styles = styleMatch[1]

    // 1. 添加完整的间距系统
    if (!styles.includes('--space-')) {
      const spacingSystem = `

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

.mx-auto { margin-left: auto; margin-right: auto; }
.my-auto { margin-top: auto; margin-bottom: auto; }

.px-1 { padding-left: var(--space-1); padding-right: var(--space-1); }
.px-2 { padding-left: var(--space-2); padding-right: var(--space-2); }
.px-3 { padding-left: var(--space-3); padding-right: var(--space-3); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.px-6 { padding-left: var(--space-6); padding-right: var(--space-6); }

.py-1 { padding-top: var(--space-1); padding-bottom: var(--space-1); }
.py-2 { padding-top: var(--space-2); padding-bottom: var(--space-2); }
.py-3 { padding-top: var(--space-3); padding-bottom: var(--space-3); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }
.py-6 { padding-top: var(--space-6); padding-bottom: var(--space-6); }

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

.stack-sm > * + * { margin-top: var(--space-2); }
.stack-md > * + * { margin-top: var(--space-4); }
.stack-lg > * + * { margin-top: var(--space-6); }
.stack-xl > * + * { margin-top: var(--space-8); }

.inline-sm > * + * { margin-left: var(--space-2); }
.inline-md > * + * { margin-left: var(--space-4); }
.inline-lg > * + * { margin-left: var(--space-6); }`
      styles = spacingSystem + styles
      modified = true
    }

    if (modified) {
      result.content = content.replace(styleMatch[0], `<style${styleMatch[0].match(/<style[^>]*>/)[0]}${styles}</style>`)
      result.modified = true
    }

    return result
  }

  /**
   * 改善布局设计
   */
  optimizeLayout(content, componentName) {
    let modified = false
    let result = { content, modified }

    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    if (!styleMatch) return result

    let styles = styleMatch[1]

    // 1. 添加现代布局系统
    if (!styles.includes('.grid-auto-fit')) {
      const layoutSystem = `

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

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.grid-gap-2 { gap: var(--space-2); }
.grid-gap-4 { gap: var(--space-4); }
.grid-gap-6 { gap: var(--space-6); }

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
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

  .hidden-mobile { display: none; }
  .flex-mobile-col { flex-direction: column; }
  .grid-mobile-1 { grid-template-columns: 1fr; }
}`
      styles = layoutSystem + styles
      modified = true
    }

    if (modified) {
      result.content = content.replace(styleMatch[0], `<style${styleMatch[0].match(/<style[^>]*>/)[0]}${styles}</style>`)
      result.modified = true
    }

    return result
  }

  /**
   * 增强响应式设计
   */
  optimizeResponsiveDesign(content, componentName) {
    let modified = false
    let result = { content, modified }

    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    if (!styleMatch) return result

    let styles = styleMatch[1]

    // 1. 添加响应式断点系统
    if (!styles.includes('--breakpoint-')) {
      const responsiveSystem = `

/* 🎨 响应式设计系统 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 🎨 响应式实用类 */
.container-sm { max-width: var(--breakpoint-sm); }
.container-md { max-width: var(--breakpoint-md); }
.container-lg { max-width: var(--breakpoint-lg); }
.container-xl { max-width: var(--breakpoint-xl); }

/* 响应式显示 */
.hidden-sm { display: none; }
.hidden-md { display: none; }
.hidden-lg { display: none; }

@media (min-width: 640px) {
  .hidden-sm { display: block; }
}

@media (min-width: 768px) {
  .hidden-md { display: block; }
}

@media (min-width: 1024px) {
  .hidden-lg { display: block; }
}

/* 响应式文本 */
.text-responsive-sm { font-size: clamp(0.875rem, 2vw, 1rem); }
.text-responsive-base { font-size: clamp(1rem, 2.5vw, 1.125rem); }
.text-responsive-lg { font-size: clamp(1.125rem, 3vw, 1.25rem); }
.text-responsive-xl { font-size: clamp(1.25rem, 3.5vw, 1.5rem); }

/* 响应式间距 */
.space-responsive-sm { gap: clamp(0.5rem, 2vw, 1rem); }
.space-responsive-md { gap: clamp(1rem, 3vw, 1.5rem); }
.space-responsive-lg { gap: clamp(1.5rem, 4vw, 2rem); }

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
  .flex-col-mobile { flex-direction: column; }
  .grid-1-mobile { grid-template-columns: 1fr; }
  .gap-2-mobile { gap: var(--space-2); }
  .p-4-mobile { padding: var(--space-4); }
}

@media (max-width: 768px) {
  .flex-col-tablet { flex-direction: column; }
  .grid-2-tablet { grid-template-columns: repeat(2, 1fr); }
  .gap-4-tablet { gap: var(--space-4); }
  .p-6-tablet { padding: var(--space-6); }
}

@media (max-width: 1024px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
}`
      styles = responsiveSystem + styles
      modified = true
    }

    if (modified) {
      result.content = content.replace(styleMatch[0], `<style${styleMatch[0].match(/<style[^>]*>/)[0]}${styles}</style>`)
      result.modified = true
    }

    return result
  }

  /**
   * 十六进制颜色转换为HSL
   */
  hexToHsl(hex) {
    // 简化的十六进制到HSL转换
    // 在实际项目中，应该使用专业的色彩库
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }

  /**
   * 生成改进报告
   */
  generateReport() {
    console.log('\n🎨 视觉设计优化报告')
    console.log('='.repeat(50))

    console.log('📊 优化统计:')
    console.log(`   处理文件数: ${this.stats.filesProcessed}`)
    console.log(`   修改文件数: ${this.stats.filesModified}`)
    console.log(`   色彩优化: ${this.stats.colorOptimizations}`)
    console.log(`   字体改进: ${this.stats.typographyImprovements}`)
    console.log(`   间距优化: ${this.stats.spacingOptimizations}`)
    console.log(`   布局改进: ${this.stats.layoutImprovements}`)
    console.log(`   响应式增强: ${this.stats.responsiveEnhancements}`)

    const totalOptimizations = this.stats.colorOptimizations +
                              this.stats.typographyImprovements +
                              this.stats.spacingOptimizations +
                              this.stats.layoutImprovements +
                              this.stats.responsiveEnhancements

    console.log(`\n🏆 总优化数: ${totalOptimizations}`)

    if (totalOptimizations > 0) {
      console.log('\n✅ 优化完成！主要改进内容：')
      console.log('   🎨 色彩系统: 高级HSL色彩系统，暗色主题支持，对比度优化')
      console.log('   📝 字体系统: 完整的字体层次，响应式字体大小，字母间距优化')
      console.log('   📏 间距系统: 基于4px网格的完整间距系统，响应式间距')
      console.log('   🏗️ 布局系统: 现代Flexbox/Grid布局，卡片设计，页面布局模板')
      console.log('   📱 响应式设计: 完整的断点系统，响应式工具类，移动端优化')
    }

    return totalOptimizations
  }

  /**
   * 处理整个项目
   */
  async optimizeProject(projectPath = process.cwd()) {
    console.log('🎨 开始视觉设计深度优化...')

    const srcPath = path.join(projectPath, 'src')
    if (fs.existsSync(srcPath)) {
      await this.processDirectory(srcPath)
    } else {
      await this.processDirectory(projectPath)
    }

    return this.generateReport()
  }

  /**
   * 递归处理目录
   */
  async processDirectory(dirPath) {
    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      const fullPath = path.join(dirPath, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
        await this.processDirectory(fullPath)
      } else if (stat.isFile() && item.endsWith('.vue')) {
        await this.optimizeVueComponent(fullPath)
      }
    }
  }

  /**
   * 判断是否跳过目录
   */
  shouldSkipDirectory(dirName) {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'out']
    return skipDirs.includes(dirName)
  }
}

// CLI 接口
if (require.main === module) {
  const optimizer = new VisualDesignOptimizer()
  const projectPath = process.argv[2] || process.cwd()

  optimizer.optimizeProject(projectPath).catch(error => {
    console.error('❌ 优化失败:', error)
    process.exit(1)
  })
}

module.exports = VisualDesignOptimizer
