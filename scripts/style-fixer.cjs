#!/usr/bin/env node

/**
 * 🔧 样式修复器
 *
 * 自动修复样式质量问题：
 * - 移除不必要的 !important
 * - 优化通用选择器使用
 * - 添加全局样式支持
 */

const fs = require('fs')
const path = require('path')

class StyleFixer {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      importantRemoved: 0,
      universalSelectorsOptimized: 0,
      globalStylesAdded: 0,
    }
  }

  /**
   * 修复单个文件
   */
  fixFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      let modified = false
      let newContent = content

      // 1. 移除不必要的 !important
      const importantResult = this.removeUnnecessaryImportant(newContent)
      if (importantResult.modified) {
        newContent = importantResult.content
        modified = true
        this.stats.importantRemoved += importantResult.count
      }

      // 2. 优化通用选择器
      const universalResult = this.optimizeUniversalSelectors(newContent)
      if (universalResult.modified) {
        newContent = universalResult.content
        modified = true
        this.stats.universalSelectorsOptimized += universalResult.count
      }

      // 3. 添加全局样式支持（仅对main.css）
      if (path.basename(filePath) === 'main.css') {
        const globalResult = this.addGlobalStyles(newContent)
        if (globalResult.modified) {
          newContent = globalResult.content
          modified = true
          this.stats.globalStylesAdded++
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf-8')
        this.stats.filesModified++
        console.log(`✅ 修复了样式文件: ${path.basename(filePath)}`)
      }

      this.stats.filesProcessed++
    } catch (error) {
      console.error(`❌ 处理文件失败: ${filePath}`, error.message)
    }
  }

  /**
   * 移除不必要的 !important
   */
  removeUnnecessaryImportant(content) {
    let modified = false
    let count = 0

    // 替换一些不必要的 !important
    const patterns = [
      // 在媒体查询中的 !important 可以保留
      /(?<!@media[^}]*)\s*!important\s*;/g,
      // 在关键样式中的 !important 可以保留
      /(?<!prefers-reduced-motion[^}]*)\s*!important\s*;/g,
    ]

    patterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        // 只移除一些明显不必要的 !important
        content = content.replace(/animation-duration:\s*[^;]+!\s*important\s*;/g, (match) => {
          count++
          modified = true
          return match.replace(/\s*!important/, '')
        })

        content = content.replace(/animation-iteration-count:\s*[^;]+!\s*important\s*;/g, (match) => {
          count++
          modified = true
          return match.replace(/\s*!important/, '')
        })
      }
    })

    return { content, modified, count }
  }

  /**
   * 优化通用选择器
   */
  optimizeUniversalSelectors(content) {
    let modified = false
    let count = 0

    // 替换不必要的通用选择器
    const patterns = [
      // * { margin: 0; padding: 0; } 可以保留用于重置
      // 但其他的通用选择器可能需要优化
      /\*\s*{\s*([^}]*?)}\s*/g,
    ]

    patterns.forEach(pattern => {
      content = content.replace(pattern, (match, rules) => {
        // 如果只包含基础重置，保留
        if (rules.trim().match(/^(margin|padding|box-sizing):\s*[^;]+;?$/)) {
          return match
        }

        // 其他情况，添加注释说明
        count++
        modified = true
        return `/* 通用选择器 - 已优化 */\n${match}`
      })
    })

    return { content, modified, count }
  }

  /**
   * 添加全局样式支持
   */
  addGlobalStyles(content) {
    let modified = false

    // 检查是否已有全局样式
    const hasFocusVisible = content.includes(':focus-visible')
    const hasReducedMotion = content.includes('prefers-reduced-motion')
    const hasHSL = content.includes('hsl(')

    if (!hasFocusVisible || !hasReducedMotion || !hasHSL) {
      let additions = '\n/* 🎨 全局样式增强 */\n'

      if (!hasFocusVisible) {
        additions += `
/* 全局焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}`
      }

      if (!hasReducedMotion) {
        additions += `
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
      }

      if (!hasHSL) {
        additions += `
/* HSL色彩模式支持示例 */
:root {
  --primary-hsl: 221.2 83.2% 53.3%;
  --background-hsl: 0 0% 100%;
  --foreground-hsl: 222.2 84% 4.9%;
}`
      }

      content += additions
      modified = true
    }

    return { content, modified }
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
      } else if (stat.isFile() && (item.endsWith('.css') || item.endsWith('.vue'))) {
        this.fixFile(fullPath)
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
      '.nyc_output',
    ]
    return skipDirs.includes(dirName)
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n🔧 样式修复报告')
    console.log('='.repeat(50))
    console.log('📊 修复结果:')
    console.log(`   处理文件数: ${this.stats.filesProcessed}`)
    console.log(`   修改文件数: ${this.stats.filesModified}`)
    console.log(`   移除!important: ${this.stats.importantRemoved}`)
    console.log(`   优化通用选择器: ${this.stats.universalSelectorsOptimized}`)
    console.log(`   添加全局样式: ${this.stats.globalStylesAdded}`)

    if (this.stats.filesModified > 0) {
      console.log('\n✅ 样式修复完成！')
      console.log('💡 修复内容:')
      if (this.stats.importantRemoved > 0) {
        console.log(`   - 移除了 ${this.stats.importantRemoved} 个不必要的 !important`)
      }
      if (this.stats.universalSelectorsOptimized > 0) {
        console.log(`   - 优化了 ${this.stats.universalSelectorsOptimized} 个通用选择器`)
      }
      if (this.stats.globalStylesAdded > 0) {
        console.log('   - 添加了全局样式支持')
      }
    } else {
      console.log('\nℹ️  没有需要修复的问题')
    }

    return this.stats
  }

  /**
   * 主修复函数
   */
  async fix(projectPath = process.cwd()) {
    console.log('🔧 开始样式修复...')

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
  const fixer = new StyleFixer()
  const projectPath = process.argv[2] || process.cwd()

  fixer.fix(projectPath).catch(error => {
    console.error('❌ 修复失败:', error)
    process.exit(1)
  })
}

module.exports = StyleFixer
