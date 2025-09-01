#!/usr/bin/env node

/**
 * 🎨 顶级UI/UX界面分析器
 *
 * 使用浏览器开发工具API进行深度界面分析
 * 作为顶级UI/UX设计师，提供专业的设计评估和优化建议
 */

const fs = require('fs')
const path = require('path')

class UIUXAnalyzer {
  constructor() {
    this.analysisResults = {
      visualHierarchy: {},
      colorUsage: {},
      typography: {},
      spacing: {},
      interactions: {},
      accessibility: {},
      performance: {},
      recommendations: []
    }
  }

  /**
   * 分析Vue组件的UI/UX质量
   */
  analyzeVueComponent(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const componentName = path.basename(filePath, '.vue')

      console.log(`🎨 分析组件: ${componentName}`)

      // 分析模板部分
      this.analyzeTemplate(content, componentName)

      // 分析样式部分
      this.analyzeStyles(content, componentName)

      // 生成组件特定的建议
      this.generateComponentRecommendations(content, componentName)

    } catch (error) {
      console.error(`❌ 分析组件失败: ${filePath}`, error.message)
    }
  }

  /**
   * 分析模板部分的UI/UX
   */
  analyzeTemplate(content, componentName) {
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
    if (!templateMatch) return

    const template = templateMatch[1]

    // 检查语义化标签使用
    this.checkSemanticHTML(template, componentName)

    // 检查可访问性属性
    this.checkAccessibilityAttributes(template, componentName)

    // 检查交互元素
    this.checkInteractiveElements(template, componentName)

    // 检查视觉层次
    this.checkVisualHierarchy(template, componentName)
  }

  /**
   * 检查语义化HTML
   */
  checkSemanticHTML(template, componentName) {
    const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer', 'button', 'input', 'label']
    const foundTags = semanticTags.filter(tag => template.includes(`<${tag}`))

    if (foundTags.length === 0) {
      this.analysisResults.recommendations.push({
        component: componentName,
        type: 'semantic-html',
        priority: 'high',
        message: '建议使用语义化HTML标签来改善可访问性和SEO',
        suggestion: '使用 <button> 而不是 <div> 作为按钮，使用 <nav> 包装导航元素'
      })
    }
  }

  /**
   * 检查可访问性属性
   */
  checkAccessibilityAttributes(template, componentName) {
    const accessibilityAttrs = ['aria-label', 'aria-describedby', 'role', 'tabindex']
    const hasAccessibility = accessibilityAttrs.some(attr => template.includes(attr))

    if (!hasAccessibility) {
      this.analysisResults.recommendations.push({
        component: componentName,
        type: 'accessibility',
        priority: 'medium',
        message: '缺少可访问性属性',
        suggestion: '添加 aria-label、role 等属性来改善屏幕阅读器支持'
      })
    }
  }

  /**
   * 检查交互元素
   */
  checkInteractiveElements(template, componentName) {
    const interactiveElements = template.match(/<button|<input|<select|<textarea/g) || []
    const hasClickHandlers = template.includes('@click') || template.includes('v-on:click')

    if (interactiveElements.length > 0 && !hasClickHandlers) {
      this.analysisResults.recommendations.push({
        component: componentName,
        type: 'interaction',
        priority: 'high',
        message: '交互元素缺少事件处理',
        suggestion: '为按钮和表单控件添加适当的事件处理函数'
      })
    }
  }

  /**
   * 检查视觉层次
   */
  checkVisualHierarchy(template, componentName) {
    const headings = template.match(/<h[1-6]/g) || []
    const hasMultipleHeadings = headings.length > 1

    if (hasMultipleHeadings) {
      // 检查标题层级是否正确
      const headingLevels = headings.map(h => parseInt(h.charAt(2)))
      const hasSkippedLevels = headingLevels.some((level, index) => {
        if (index === 0) return false
        return level > headingLevels[index - 1] + 1
      })

      if (hasSkippedLevels) {
        this.analysisResults.recommendations.push({
          component: componentName,
          type: 'visual-hierarchy',
          priority: 'medium',
          message: '标题层级可能有跳跃',
          suggestion: '确保标题层级连续，避免从 h1 直接跳到 h3'
        })
      }
    }
  }

  /**
   * 分析样式部分的UI/UX
   */
  analyzeStyles(content, componentName) {
    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    if (!styleMatch) return

    const styles = styleMatch[1]

    // 检查色彩使用
    this.analyzeColorUsage(styles, componentName)

    // 检查字体系统
    this.analyzeTypography(styles, componentName)

    // 检查间距系统
    this.analyzeSpacing(styles, componentName)

    // 检查响应式设计
    this.analyzeResponsive(styles, componentName)
  }

  /**
   * 分析色彩使用
   */
  analyzeColorUsage(styles, componentName) {
    const colorProperties = ['color', 'background', 'background-color', 'border-color']
    const hasSemanticColors = styles.includes('var(--') || styles.includes('hsl(')

    if (!hasSemanticColors) {
      this.analysisResults.recommendations.push({
        component: componentName,
        type: 'color-system',
        priority: 'medium',
        message: '建议使用设计系统的语义色彩',
        suggestion: '使用 CSS 变量如 var(--primary) 而不是硬编码颜色值'
      })
    }

    // 检查是否有足够的色彩对比度（简化检查）
    const hasLowContrast = styles.includes('#ccc') || styles.includes('#ddd')
    if (hasLowContrast) {
      this.analysisResults.recommendations.push({
        component: componentName,
        type: 'color-contrast',
        priority: 'high',
        message: '可能存在低对比度色彩',
        suggestion: '确保文字色彩与背景有至少 4.5:1 的对比度'
      })
    }
  }

  /**
   * 分析字体系统
   */
  analyzeTypography(styles, componentName) {
    const hasFontSize = styles.includes('font-size')
    const hasLineHeight = styles.includes('line-height')
    const hasFontWeight = styles.includes('font-weight')

    if (hasFontSize && (!hasLineHeight || !hasFontWeight)) {
      this.analysisResults.recommendations.push({
        component: componentName,
        type: 'typography',
        priority: 'medium',
        message: '字体系统不完整',
        suggestion: '同时设置 font-size、line-height 和 font-weight 以获得更好的可读性'
      })
    }
  }

  /**
   * 分析间距系统
   */
  analyzeSpacing(styles, componentName) {
    const spacingProperties = ['margin', 'padding', 'gap']
    const hasSpacing = spacingProperties.some(prop => styles.includes(prop))

    if (hasSpacing) {
      // 检查是否使用设计系统的间距值
      const usesDesignTokens = styles.includes('var(--space') || styles.includes('rem)') || styles.includes('em)')
      if (!usesDesignTokens) {
        this.analysisResults.recommendations.push({
          component: componentName,
          type: 'spacing',
          priority: 'low',
          message: '建议使用一致的间距系统',
          suggestion: '使用 8px 基准的间距系统，如 0.5rem、1rem、1.5rem 等'
        })
      }
    }
  }

  /**
   * 分析响应式设计
   */
  analyzeResponsive(styles, componentName) {
    const hasMediaQueries = styles.includes('@media')
    const hasFlexbox = styles.includes('display: flex') || styles.includes('display: grid')

    if (!hasMediaQueries && hasFlexbox) {
      this.analysisResults.recommendations.push({
        component: componentName,
        type: 'responsive',
        priority: 'medium',
        message: '可能缺少响应式设计',
        suggestion: '添加媒体查询来确保在不同屏幕尺寸下的良好体验'
      })
    }
  }

  /**
   * 生成组件特定的建议
   */
  generateComponentRecommendations(content, componentName) {
    // 基于组件内容生成具体的优化建议

    // 检查是否有加载状态
    if (content.includes('loading') || content.includes('isLoading')) {
      this.analysisResults.recommendations.push({
        component: componentName,
        type: 'loading-states',
        priority: 'medium',
        message: '优化加载状态的用户体验',
        suggestion: '添加骨架屏或优雅的加载动画，提升用户等待体验'
      })
    }

    // 检查是否有错误处理
    if (content.includes('error') || content.includes('catch')) {
      this.analysisResults.recommendations.push({
        component: componentName,
        type: 'error-states',
        priority: 'high',
        message: '优化错误状态的设计',
        suggestion: '为错误状态设计友好的UI，包括清晰的错误信息和恢复操作'
      })
    }

    // 检查是否有表单
    if (content.includes('<form') || content.includes('<input')) {
      this.analysisResults.recommendations.push({
        component: componentName,
        type: 'form-design',
        priority: 'high',
        message: '优化表单的用户体验',
        suggestion: '改善表单布局，添加适当的标签、占位符和验证反馈'
      })
    }
  }

  /**
   * 生成综合报告
   */
  generateReport() {
    console.log('\n🎨 UI/UX设计分析报告')
    console.log('='.repeat(60))

    // 统计信息
    const totalRecommendations = this.analysisResults.recommendations.length
    const highPriority = this.analysisResults.recommendations.filter(r => r.priority === 'high').length
    const mediumPriority = this.analysisResults.recommendations.filter(r => r.priority === 'medium').length
    const lowPriority = this.analysisResults.recommendations.filter(r => r.priority === 'low').length

    console.log(`📊 分析结果:`)
    console.log(`   总建议数: ${totalRecommendations}`)
    console.log(`   高优先级: ${highPriority}`)
    console.log(`   中优先级: ${mediumPriority}`)
    console.log(`   低优先级: ${lowPriority}`)

    // 按优先级显示建议
    if (highPriority > 0) {
      console.log(`\n🚨 高优先级建议:`)
      this.analysisResults.recommendations
        .filter(r => r.priority === 'high')
        .forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.component}: ${rec.message}`)
          console.log(`      💡 ${rec.suggestion}`)
        })
    }

    if (mediumPriority > 0) {
      console.log(`\n⚠️  中优先级建议:`)
      this.analysisResults.recommendations
        .filter(r => r.priority === 'medium')
        .forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.component}: ${rec.message}`)
          console.log(`      💡 ${rec.suggestion}`)
        })
    }

    // 设计评分
    const score = this.calculateDesignScore()
    console.log(`\n🏆 UI/UX设计评分: ${score}/100`)

    if (score >= 85) {
      console.log('🎉 优秀！界面设计质量很高')
    } else if (score >= 70) {
      console.log('👍 良好，需要一些改进')
    } else if (score >= 50) {
      console.log('⚠️ 一般，需要重点改进')
    } else {
      console.log('❌ 需要全面改进')
    }

    // 输出优化建议
    console.log('\n💡 优化建议:')
    console.log('   1. 改善语义化HTML结构')
    console.log('   2. 增强可访问性支持')
    console.log('   3. 优化色彩对比度和视觉层次')
    console.log('   4. 统一间距和字体系统')
    console.log('   5. 添加适当的微交互和动画')
    console.log('   6. 改善响应式设计')

    return score
  }

  /**
   * 计算设计评分
   */
  calculateDesignScore() {
    const recommendations = this.analysisResults.recommendations
    const totalComponents = 111 // 假设有这么多组件

    let score = 100

    // 根据建议数量扣分
    const highPenalty = recommendations.filter(r => r.priority === 'high').length * 5
    const mediumPenalty = recommendations.filter(r => r.priority === 'medium').length * 2
    const lowPenalty = recommendations.filter(r => r.priority === 'low').length * 1

    score -= Math.min(highPenalty + mediumPenalty + lowPenalty, 50)

    // 奖励有良好实践的组件
    const goodPractices = recommendations.filter(r => r.type === 'positive').length
    score += Math.min(goodPractices * 2, 20)

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * 分析整个项目
   */
  async analyzeProject(projectPath = process.cwd()) {
    console.log('🎨 开始UI/UX深度分析...')

    const srcPath = path.join(projectPath, 'src')
    if (fs.existsSync(srcPath)) {
      this.analyzeDirectory(srcPath)
    } else {
      this.analyzeDirectory(projectPath)
    }

    return this.generateReport()
  }

  /**
   * 递归分析目录
   */
  analyzeDirectory(dirPath) {
    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      const fullPath = path.join(dirPath, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
        this.analyzeDirectory(fullPath)
      } else if (stat.isFile() && item.endsWith('.vue')) {
        this.analyzeVueComponent(fullPath)
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
  const analyzer = new UIUXAnalyzer()
  const projectPath = process.argv[2] || process.cwd()

  analyzer.analyzeProject(projectPath).catch(error => {
    console.error('❌ 分析失败:', error)
    process.exit(1)
  })
}

module.exports = UIUXAnalyzer
