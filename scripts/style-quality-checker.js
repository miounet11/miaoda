#!/usr/bin/env node

/**
 * 🎨 样式质量检查器
 *
 * 这个工具会检查项目中的所有样式文件，确保它们符合质量标准
 * 包括：
 * - 样式一致性检查
 * - 最佳实践验证
 * - 美观性评估
 * - 性能优化建议
 */

const fs = require('fs')
const path = require('path')
const { STYLE_QUALITY_CONFIG, checkStyleQuality } = require('../style-quality-config.js')

class StyleQualityChecker {
  constructor() {
    this.results = {
      totalFiles: 0,
      passed: 0,
      issues: [],
      warnings: [],
      suggestions: [],
    }
  }

  /**
   * 检查单个样式文件
   */
  checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const result = checkStyleQuality(content, filePath)

      this.results.issues.push(...result.issues)
      this.results.warnings.push(...result.warnings)
      this.results.suggestions.push(...result.suggestions)

      return result.issues.length === 0
    } catch (error) {
      console.error(`❌ 读取文件失败: ${filePath}`, error.message)
      return false
    }
  }

  /**
   * 递归检查目录
   */
  checkDirectory(dirPath, extensions = ['.css', '.scss', '.less', '.vue']) {
    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      const fullPath = path.join(dirPath, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
        this.checkDirectory(fullPath, extensions)
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        this.results.totalFiles++
        const passed = this.checkFile(fullPath)
        if (passed) {
          this.results.passed++
        }
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
    console.log('🎨 样式质量检查报告')
    console.log('='.repeat(50))

    console.log('📊 检查结果:')
    console.log(`   总文件数: ${this.results.totalFiles}`)
    console.log(`   通过文件: ${this.results.passed}`)
    console.log(`   失败文件: ${this.results.totalFiles - this.results.passed}`)

    if (this.results.issues.length > 0) {
      console.log(`\n❌ 问题 (${this.results.issues.length}):`)
      this.results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.message}`)
        console.log(`      文件: ${issue.file}`)
        if (issue.matches) {
          console.log(`      匹配次数: ${issue.matches}`)
        }
      })
    }

    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  警告 (${this.results.warnings.length}):`)
      this.results.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.message}`)
        console.log(`      文件: ${warning.file}`)
      })
    }

    if (this.results.suggestions.length > 0) {
      console.log(`\n💡 建议 (${this.results.suggestions.length}):`)
      this.results.suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion.message}`)
        console.log(`      文件: ${suggestion.file}`)
      })
    }

    // 评分
    const score = this.calculateScore()
    console.log(`\n🏆 综合评分: ${score}/100`)

    if (score >= 90) {
      console.log('🎉 优秀！样式质量非常好')
    } else if (score >= 70) {
      console.log('👍 良好，需要一些改进')
    } else if (score >= 50) {
      console.log('⚠️ 一般，需要重点改进')
    } else {
      console.log('❌ 较差，需要全面改进')
    }

    return score
  }

  /**
   * 计算评分
   */
  calculateScore() {
    const { totalFiles, passed, issues, warnings } = this.results

    if (totalFiles === 0) return 100

    // 基础分数：通过率
    const passRate = passed / totalFiles
    let score = passRate * 60 // 60% 权重

    // 问题扣分
    score -= issues.length * 10
    score -= warnings.length * 2

    // 确保分数在0-100范围内
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * 主检查函数
   */
  async check(projectPath = process.cwd()) {
    console.log('🔍 开始样式质量检查...')

    const srcPath = path.join(projectPath, 'src')
    if (fs.existsSync(srcPath)) {
      this.checkDirectory(srcPath)
    } else {
      this.checkDirectory(projectPath)
    }

    const score = this.generateReport()

    // 如果分数太低，退出码为1
    if (score < 70) {
      process.exit(1)
    }

    return score
  }
}

// CLI 接口
if (require.main === module) {
  const checker = new StyleQualityChecker()
  const projectPath = process.argv[2] || process.cwd()

  checker.check(projectPath).catch(error => {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  })
}

module.exports = StyleQualityChecker
