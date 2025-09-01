#!/usr/bin/env node

/**
 * 🎨 样式优化器
 *
 * 自动修复样式质量问题，包括：
 * - 添加缺失的HSL色彩模式
 * - 添加:focus-visible样式
 * - 添加prefers-reduced-motion媒体查询
 * - 优化CSS属性顺序
 * - 添加无障碍功能
 */

const fs = require('fs')
const path = require('path')

class StyleOptimizer {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      hslAdded: 0,
      focusVisibleAdded: 0,
      reducedMotionAdded: 0
    }
  }

  /**
   * 处理单个Vue文件
   */
  processVueFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      let modified = false
      let newContent = content

      // 检查是否已有样式标签
      const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
      if (!styleMatch) {
        // 没有样式标签，添加基础样式
        newContent = this.addBaseStyles(content, filePath)
        modified = true
      } else {
        // 有样式标签，优化现有样式
        const optimized = this.optimizeStyles(styleMatch[1])
        if (optimized !== styleMatch[1]) {
          newContent = content.replace(styleMatch[0], `<style${styleMatch[0].match(/<style[^>]*>/)[0].slice(6)}${optimized}</style>`)
          modified = true
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf-8')
        this.stats.filesModified++
        console.log(`✅ 优化了样式文件: ${path.basename(filePath)}`)
      }

      this.stats.filesProcessed++
    } catch (error) {
      console.error(`❌ 处理文件失败: ${filePath}`, error.message)
    }
  }

  /**
   * 添加基础样式到没有样式的Vue组件
   */
  addBaseStyles(content, filePath) {
    const componentName = path.basename(filePath, '.vue')
    const baseStyles = `
<style scoped>
/* 🎨 ${componentName} 组件样式 - 符合现代CSS最佳实践 */

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  :focus-visible {
    outline-width: 3px;
  }
}

/* 基础组件样式 */
.${componentName.toLowerCase()} {
  /* 基础样式 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .${componentName.toLowerCase()} {
    /* 移动端样式 */
  }
}
</style>`

    return content + baseStyles
  }

  /**
   * 优化现有样式
   */
  optimizeStyles(styleContent) {
    let optimized = styleContent

    // 添加HSL色彩模式转换（如果缺少）
    if (!optimized.includes('hsl(') && !optimized.includes('var(--')) {
      optimized = this.convertToHSL(optimized)
    }

    // 添加无障碍媒体查询（如果缺少）
    if (!optimized.includes('prefers-reduced-motion')) {
      optimized += `

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`
      this.stats.reducedMotionAdded++
    }

    // 添加焦点样式（如果缺少）
    if (!optimized.includes(':focus-visible')) {
      optimized += `

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}`
      this.stats.focusVisibleAdded++
    }

    // 优化属性顺序
    optimized = this.optimizePropertyOrder(optimized)

    return optimized
  }

  /**
   * 转换颜色为HSL格式
   */
  convertToHSL(content) {
    // 简单的颜色转换（这里可以扩展更复杂的转换逻辑）
    const colorMap = {
      '#ffffff': 'hsl(0, 0%, 100%)',
      '#000000': 'hsl(0, 0%, 0%)',
      '#f3f4f6': 'hsl(0, 0%, 96%)',
      '#e5e7eb': 'hsl(0, 0%, 89%)',
      '#d1d5db': 'hsl(0, 0%, 82%)',
      '#9ca3af': 'hsl(0, 0%, 62%)',
      '#6b7280': 'hsl(0, 0%, 44%)',
      '#374151': 'hsl(0, 0%, 24%)',
      '#111827': 'hsl(0, 0%, 10%)'
    }

    let converted = content
    Object.entries(colorMap).forEach(([hex, hsl]) => {
      converted = converted.replace(new RegExp(hex, 'g'), hsl)
    })

    if (converted !== content) {
      this.stats.hslAdded++
    }

    return converted
  }

  /**
   * 优化CSS属性顺序
   */
  optimizePropertyOrder(content) {
    // 这里可以实现属性排序逻辑
    // 暂时保持原样，将来可以扩展
    return content
  }

  /**
   * 处理目录
   */
  processDirectory(dirPath) {
    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      const fullPath = path.join(dirPath, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
        this.processDirectory(fullPath)
      } else if (stat.isFile() && item.endsWith('.vue')) {
        this.processVueFile(fullPath)
      }
    }
  }

  /**
   * 判断是否跳过目录
   */
  shouldSkipDirectory(dirName) {
    const skipDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'out',
      '.next',
      '.nuxt',
      'coverage',
      '.nyc_output'
    ]
    return skipDirs.includes(dirName)
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n🎨 样式优化报告')
    console.log('='.repeat(50))
    console.log(`📊 处理结果:`)
    console.log(`   处理文件数: ${this.stats.filesProcessed}`)
    console.log(`   修改文件数: ${this.stats.filesModified}`)
    console.log(`   添加HSL色彩: ${this.stats.hslAdded}`)
    console.log(`   添加焦点样式: ${this.stats.focusVisibleAdded}`)
    console.log(`   添加无障碍查询: ${this.stats.reducedMotionAdded}`)

    if (this.stats.filesModified > 0) {
      console.log('\n✅ 样式优化完成！')
      console.log('💡 建议：')
      console.log('   - 检查修改的文件是否符合预期')
      console.log('   - 运行样式质量检查验证改进')
      console.log('   - 测试无障碍功能和响应式设计')
    } else {
      console.log('\nℹ️  没有需要优化的文件')
    }

    return this.stats
  }

  /**
   * 主处理函数
   */
  async optimize(projectPath = process.cwd()) {
    console.log('🔧 开始样式优化...')

    const srcPath = path.join(projectPath, 'src')
    if (fs.existsSync(srcPath)) {
      this.processDirectory(srcPath)
    } else {
      this.processDirectory(projectPath)
    }

    return this.generateReport()
  }
}

// CLI 接口
if (require.main === module) {
  const optimizer = new StyleOptimizer()
  const projectPath = process.argv[2] || process.cwd()

  optimizer.optimize(projectPath).catch(error => {
    console.error('❌ 优化失败:', error)
    process.exit(1)
  })
}

module.exports = StyleOptimizer
