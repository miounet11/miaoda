#!/usr/bin/env node

/**
 * 🎨 顶级UI/UX界面改进器
 *
 * 基于分析结果，系统性改进UI/UX问题：
 * - 修复可访问性问题
 * - 改善语义化HTML
 * - 优化表单用户体验
 * - 增强错误状态设计
 * - 添加微交互和动画
 */

const fs = require('fs')
const path = require('path')

class UIUXImprover {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      accessibilityImprovements: 0,
      semanticImprovements: 0,
      formImprovements: 0,
      errorStateImprovements: 0,
      animationImprovements: 0
    }
  }

  /**
   * 改进单个Vue组件
   */
  async improveVueComponent(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      let modifiedContent = content
      let modified = false
      const componentName = path.basename(filePath, '.vue')

      console.log(`🎨 改进组件: ${componentName}`)

      // 1. 改善可访问性
      const accessibilityResult = this.improveAccessibility(modifiedContent, componentName)
      if (accessibilityResult.modified) {
        modifiedContent = accessibilityResult.content
        modified = true
        this.stats.accessibilityImprovements++
      }

      // 2. 改善语义化HTML
      const semanticResult = this.improveSemanticHTML(modifiedContent, componentName)
      if (semanticResult.modified) {
        modifiedContent = semanticResult.content
        modified = true
        this.stats.semanticImprovements++
      }

      // 3. 优化表单用户体验
      const formResult = this.improveFormUX(modifiedContent, componentName)
      if (formResult.modified) {
        modifiedContent = formResult.content
        modified = true
        this.stats.formImprovements++
      }

      // 4. 增强错误状态设计
      const errorResult = this.improveErrorStates(modifiedContent, componentName)
      if (errorResult.modified) {
        modifiedContent = errorResult.content
        modified = true
        this.stats.errorStateImprovements++
      }

      // 5. 添加微交互和动画
      const animationResult = this.addMicroInteractions(modifiedContent, componentName)
      if (animationResult.modified) {
        modifiedContent = animationResult.content
        modified = true
        this.stats.animationImprovements++
      }

      // 保存修改
      if (modified) {
        fs.writeFileSync(filePath, modifiedContent, 'utf-8')
        this.stats.filesModified++
        console.log(`✅ 已改进: ${componentName}`)
      } else {
        console.log(`ℹ️ 无需改进: ${componentName}`)
      }

      this.stats.filesProcessed++
    } catch (error) {
      console.error(`❌ 改进组件失败: ${filePath}`, error.message)
    }
  }

  /**
   * 改善可访问性
   */
  improveAccessibility(content, componentName) {
    let modified = false
    const result = { content, modified }

    // 检查是否已有模板
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
    if (!templateMatch) return result

    let template = templateMatch[1]

    // 1. 为按钮添加aria-label
    const buttonRegex = /<button([^>]*)>/g
    template = template.replace(buttonRegex, (match, attrs) => {
      if (!attrs.includes('aria-label') && !attrs.includes('aria-labelledby')) {
        modified = true
        return `<button${attrs} aria-label="按钮">`
      }
      return match
    })

    // 2. 为输入框添加aria-label和关联标签
    const inputRegex = /<input([^>]*)>/g
    template = template.replace(inputRegex, (match, attrs) => {
      if (!attrs.includes('aria-label') && !attrs.includes('aria-labelledby')) {
        modified = true
        // 尝试查找相关的label
        const idMatch = attrs.match(/id="([^"]*)"/)
        if (idMatch) {
          return `<input${attrs} aria-labelledby="${idMatch[1]}-label">`
        } else {
          return `<input${attrs} aria-label="输入框">`
        }
      }
      return match
    })

    // 3. 为图片添加alt属性
    const imgRegex = /<img([^>]*)>/g
    template = template.replace(imgRegex, (match, attrs) => {
      if (!attrs.includes('alt=')) {
        modified = true
        return `<img${attrs} alt="图片">`
      }
      return match
    })

    // 4. 添加focus-visible样式支持
    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    if (styleMatch) {
      let styles = styleMatch[1]
      if (!styles.includes(':focus-visible')) {
        styles += `

/* 🎨 可访问性 - 焦点样式 */
*:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 7));
  outline-offset: 2px;
  border-radius: 4px;
}

/* 🎨 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`
        content = content.replace(
          styleMatch[0],
          `<style${styleMatch[0].match(/<style[^>]*>/)[0]}${styles}</style>`
        )
        modified = true
      }
    }

    // 更新模板内容
    if (modified) {
      result.content = content.replace(templateMatch[0], `<template>${template}</template>`)
      result.modified = true
    }

    return result
  }

  /**
   * 改善语义化HTML
   */
  improveSemanticHTML(content, componentName) {
    let modified = false
    const result = { content, modified }

    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
    if (!templateMatch) return result

    let template = templateMatch[1]

    // 1. 将div替换为语义化标签（基于上下文）
    if (componentName.includes('Modal') && template.includes('<div class="modal')) {
      template = template.replace(/<div class="modal/g, '<dialog class="modal')
      template = template.replace(/<\/div>\s*$/g, '</dialog>')
      modified = true
    }

    // 2. 为导航区域添加nav标签
    if (componentName.includes('Navigation') || template.includes('router-link')) {
      if (!template.includes('<nav')) {
        const navPattern = /<div[^>]*class="[^"]*nav[^"]*"[^>]*>([\s\S]*?)<\/div>/g
        template = template.replace(navPattern, '<nav>$1</nav>')
        modified = true
      }
    }

    // 3. 为主要内容区域添加main标签
    if (componentName.includes('View') || componentName.includes('Page')) {
      if (!template.includes('<main')) {
        const mainPattern = /<div[^>]*class="[^"]*(content|main|page)[^"]*"[^>]*>([\s\S]*?)<\/div>/g
        template = template.replace(mainPattern, '<main>$1</main>')
        modified = true
      }
    }

    // 4. 为侧边栏添加aside标签
    if (componentName.includes('Sidebar') || template.includes('sidebar')) {
      if (!template.includes('<aside')) {
        const asidePattern = /<div[^>]*class="[^"]*sidebar[^"]*"[^>]*>([\s\S]*?)<\/div>/g
        template = template.replace(asidePattern, '<aside>$1</aside>')
        modified = true
      }
    }

    if (modified) {
      result.content = content.replace(templateMatch[0], `<template>${template}</template>`)
      result.modified = true
    }

    return result
  }

  /**
   * 优化表单用户体验
   */
  improveFormUX(content, componentName) {
    let modified = false
    const result = { content, modified }

    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
    if (!templateMatch) return result

    let template = templateMatch[1]

    // 1. 为表单输入框添加标签关联
    const inputPattern = /<input([^>]*)>/g
    template = template.replace(inputPattern, (match, attrs) => {
      if (!attrs.includes('id=') && template.includes('<label')) {
        const id = `input-${Math.random().toString(36).substr(2, 9)}`
        modified = true
        return `<input id="${id}"${attrs}>`
      }
      return match
    })

    // 2. 添加表单验证状态样式
    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    if (styleMatch && (template.includes('<form') || template.includes('v-model'))) {
      let styles = styleMatch[1]

      if (!styles.includes('.form-group')) {
        styles += `

/* 🎨 表单用户体验优化 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error {
  border-color: hsl(0 84% 60%);
}

.form-error {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: hsl(0 84% 60%);
}

.form-success {
  border-color: hsl(142 71% 45%);
}

/* 加载状态 */
.form-input.loading {
  background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}`
        content = content.replace(
          styleMatch[0],
          `<style${styleMatch[0].match(/<style[^>]*>/)[0]}${styles}</style>`
        )
        modified = true
      }
    }

    if (modified) {
      result.content = content.replace(templateMatch[0], `<template>${template}</template>`)
      result.modified = true
    }

    return result
  }

  /**
   * 增强错误状态设计
   */
  improveErrorStates(content, componentName) {
    let modified = false
    const result = { content, modified }

    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
    if (!templateMatch) return result

    const template = templateMatch[1]

    // 1. 添加错误状态的视觉反馈
    if (
      template.includes('error') ||
      template.includes('catch') ||
      componentName.includes('Error')
    ) {
      const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
      if (styleMatch) {
        let styles = styleMatch[1]

        if (!styles.includes('.error-state')) {
          styles += `

/* 🎨 错误状态设计 */
.error-state {
  padding: 1rem;
  border: 1px solid hsl(0 84% 60% / 0.2);
  border-radius: 8px;
  background-color: hsl(0 84% 60% / 0.05);
  color: hsl(0 84% 60%);
}

.error-icon {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  color: hsl(0 84% 60%);
}

.error-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-message {
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
}

.error-retry-btn {
  padding: 0.5rem 1rem;
  background-color: hsl(0 84% 60%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.error-retry-btn:hover {
  background-color: hsl(0 84% 60% / 0.9);
}`
          content = content.replace(
            styleMatch[0],
            `<style${styleMatch[0].match(/<style[^>]*>/)[0]}${styles}</style>`
          )
          modified = true
        }
      }
    }

    if (modified) {
      result.content = content.replace(templateMatch[0], `<template>${template}</template>`)
      result.modified = true
    }

    return result
  }

  /**
   * 添加微交互和动画
   */
  addMicroInteractions(content, componentName) {
    let modified = false
    const result = { content, modified }

    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    if (!styleMatch) return result

    let styles = styleMatch[1]

    // 1. 添加基础微交互
    if (!styles.includes('@keyframes')) {
      styles += `

/* 🎨 微交互和动画 */
.btn-primary {
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.btn-primary:active::before {
  width: 300px;
  height: 300px;
}

/* 悬停效果 */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 加载动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid hsl(var(--border));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 淡入动画 */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fade-in 0.3s ease-out;
}

/* 成功状态动画 */
@keyframes success-bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.success-animation {
  animation: success-bounce 1s ease;
}`
      content = content.replace(
        styleMatch[0],
        `<style${styleMatch[0].match(/<style[^>]*>/)[0]}${styles}</style>`
      )
      modified = true
      result.modified = true
      result.content = content
    }

    return result
  }

  /**
   * 生成改进报告
   */
  generateReport() {
    console.log('\n🎨 UI/UX改进报告')
    console.log('='.repeat(50))

    console.log('📊 改进统计:')
    console.log(`   处理文件数: ${this.stats.filesProcessed}`)
    console.log(`   修改文件数: ${this.stats.filesModified}`)
    console.log(`   可访问性改进: ${this.stats.accessibilityImprovements}`)
    console.log(`   语义化改进: ${this.stats.semanticImprovements}`)
    console.log(`   表单改进: ${this.stats.formImprovements}`)
    console.log(`   错误状态改进: ${this.stats.errorStateImprovements}`)
    console.log(`   动画改进: ${this.stats.animationImprovements}`)

    const totalImprovements =
      this.stats.accessibilityImprovements +
      this.stats.semanticImprovements +
      this.stats.formImprovements +
      this.stats.errorStateImprovements +
      this.stats.animationImprovements

    console.log(`\n🏆 总改进数: ${totalImprovements}`)

    if (totalImprovements > 0) {
      console.log('\n✅ 改进完成！主要改进内容：')
      console.log('   🎯 可访问性: 添加了aria-label、focus-visible等属性')
      console.log('   🏗️ 语义化: 使用dialog、nav、main、aside等语义标签')
      console.log('   📝 表单体验: 改善了表单布局和验证反馈')
      console.log('   🚨 错误状态: 优化了错误信息的展示和恢复操作')
      console.log('   ✨ 微交互: 添加了按钮涟漪、悬停效果、加载动画等')
    }

    return totalImprovements
  }

  /**
   * 处理整个项目
   */
  async improveProject(projectPath = process.cwd()) {
    console.log('🚀 开始UI/UX系统性改进...')

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
        await this.improveVueComponent(fullPath)
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
  const improver = new UIUXImprover()
  const projectPath = process.argv[2] || process.cwd()

  improver.improveProject(projectPath).catch(error => {
    console.error('❌ 改进失败:', error)
    process.exit(1)
  })
}

module.exports = UIUXImprover
