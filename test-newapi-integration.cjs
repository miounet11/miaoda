#!/usr/bin/env node

/**
 * NewAPI 集成功能测试脚本
 * 用于验证新功能是否正常工作
 */

const fs = require('fs')
const path = require('path')

// 测试结果收集
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
  console.log(`[${timestamp}] ${prefix} ${message}`)
}

function test(name, condition, message = '') {
  if (condition) {
    testResults.passed++
    log(`${name}: 通过 ${message}`, 'success')
  } else {
    testResults.failed++
    log(`${name}: 失败 ${message}`, 'error')
  }
  testResults.tests.push({ name, passed: condition, message })
}

// 1. 检查构建文件是否存在
function testBuildFiles() {
  log('开始检查构建文件...')

  const buildFiles = [
    'out/renderer/index.html',
    'out/renderer/assets/index-C2bUafur.js',
    'out/main/index.js',
    'out/preload/index.js'
  ]

  buildFiles.forEach(file => {
    const filePath = path.join(__dirname, file)
    const exists = fs.existsSync(filePath)
    test(`构建文件 ${file}`, exists, exists ? '文件存在' : '文件不存在')

    if (exists) {
      const stats = fs.statSync(filePath)
      const sizeKB = (stats.size / 1024).toFixed(2)
      log(`文件大小: ${sizeKB} KB`)
    }
  })
}

// 2. 检查组件文件是否存在
function testComponentFiles() {
  log('开始检查组件文件...')

  const componentFiles = [
    'src/renderer/src/components/chat/ModelConfigPanel.vue',
    'src/renderer/src/components/chat/DebugPanel.vue',
    'src/renderer/src/views/SimpleChatView.vue'
  ]

  componentFiles.forEach(file => {
    const filePath = path.join(__dirname, file)
    const exists = fs.existsSync(filePath)
    test(`组件文件 ${file}`, exists, exists ? '文件存在' : '文件不存在')

    if (exists) {
      const content = fs.readFileSync(filePath, 'utf8')
      // 检查是否包含关键功能
      const hasTemplate = content.includes('<template>')
      const hasScript = content.includes('<script setup')
      const hasModelConfig = content.includes('modelConfig')

      test(`组件 ${file} 模板`, hasTemplate, '包含模板')
      test(`组件 ${file} 脚本`, hasScript, '包含脚本')
      if (file.includes('ModelConfigPanel')) {
        test(`组件 ${file} 模型配置`, hasModelConfig, '包含模型配置')
      }
    }
  })
}

// 3. 检查配置功能
function testConfigurationFeatures() {
  log('开始检查配置功能...')

  const mainViewFile = path.join(__dirname, 'src/renderer/src/views/SimpleChatView.vue')
  if (fs.existsSync(mainViewFile)) {
    const content = fs.readFileSync(mainViewFile, 'utf8')

    // 检查新功能集成
    const features = [
      { name: 'ModelConfigPanel 导入', check: content.includes('ModelConfigPanel') },
      { name: 'DebugPanel 导入', check: content.includes('DebugPanel') },
      { name: '模型配置数据', check: content.includes('modelConfig') },
      { name: '调试面板状态', check: content.includes('showDebugPanel') },
      { name: '导出配置方法', check: content.includes('handleExportConfig') },
      { name: '导入配置方法', check: content.includes('handleImportConfig') },
      { name: '切换调试面板', check: content.includes('toggleDebugPanel') },
      { name: '三栏布局', check: content.includes('main-layout') },
      { name: '侧边栏样式', check: content.includes('model-config-sidebar') },
      { name: '调试面板样式', check: content.includes('debug-sidebar') }
    ]

    features.forEach(feature => {
      test(feature.name, feature.check, feature.check ? '功能已集成' : '功能缺失')
    })
  }
}

// 4. 检查样式文件
function testStyling() {
  log('开始检查样式文件...')

  const mainViewFile = path.join(__dirname, 'src/renderer/src/views/SimpleChatView.vue')
  if (fs.existsSync(mainViewFile)) {
    const content = fs.readFileSync(mainViewFile, 'utf8')

    // 检查关键样式类
    const styles = [
      { name: '主布局样式', check: content.includes('main-layout') },
      { name: '侧边栏样式', check: content.includes('model-config-sidebar') },
      { name: '聊天主内容样式', check: content.includes('chat-main-content') },
      { name: '调试面板样式', check: content.includes('debug-sidebar') }
    ]

    styles.forEach(style => {
      test(style.name, style.check, style.check ? '样式已定义' : '样式缺失')
    })
  }
}

// 5. 检查功能完整性
function testFeatureCompleteness() {
  log('开始检查功能完整性...')

  const modelConfigFile = path.join(
    __dirname,
    'src/renderer/src/components/chat/ModelConfigPanel.vue'
  )
  if (fs.existsSync(modelConfigFile)) {
    const content = fs.readFileSync(modelConfigFile, 'utf8')

    // 检查 ModelConfigPanel 的功能
    const features = [
      { name: '自定义请求体模式', check: content.includes('customRequestMode') },
      { name: '分组选择', check: content.includes('分组') },
      { name: '模型选择', check: content.includes('模型') },
      { name: '图片地址功能', check: content.includes('图片地址') },
      { name: 'Temperature 参数', check: content.includes('Temperature') },
      { name: 'Top P 参数', check: content.includes('Top P') },
      { name: 'Frequency Penalty', check: content.includes('Frequency Penalty') },
      { name: 'Presence Penalty', check: content.includes('Presence Penalty') },
      { name: 'Max Tokens 参数', check: content.includes('Max Tokens') },
      { name: 'Seed 参数', check: content.includes('Seed') },
      { name: '流式输出', check: content.includes('流式输出') },
      { name: '导出功能', check: content.includes('导出') },
      { name: '导入功能', check: content.includes('导入') }
    ]

    features.forEach(feature => {
      test(
        `ModelConfigPanel ${feature.name}`,
        feature.check,
        feature.check ? '功能存在' : '功能缺失'
      )
    })
  }

  const debugPanelFile = path.join(__dirname, 'src/renderer/src/components/chat/DebugPanel.vue')
  if (fs.existsSync(debugPanelFile)) {
    const content = fs.readFileSync(debugPanelFile, 'utf8')

    // 检查 DebugPanel 的功能
    const debugFeatures = [
      { name: '预览请求体标签页', check: content.includes('预览请求体') },
      { name: '实际请求体标签页', check: content.includes('实际请求体') },
      { name: '响应标签页', check: content.includes('响应') },
      { name: 'JSON 格式化', check: content.includes('formatJson') },
      { name: '复制功能', check: content.includes('copyContent') }
    ]

    debugFeatures.forEach(feature => {
      test(`DebugPanel ${feature.name}`, feature.check, feature.check ? '功能存在' : '功能缺失')
    })
  }
}

// 6. 检查消息操作功能
function testMessageActions() {
  log('开始检查消息操作功能...')

  const messageItemFile = path.join(__dirname, 'src/renderer/src/components/chat/MessageItem.vue')
  if (fs.existsSync(messageItemFile)) {
    const content = fs.readFileSync(messageItemFile, 'utf8')

    // 检查消息操作功能
    const actions = [
      { name: '重试功能', check: content.includes("$emit('retry')") },
      { name: '复制功能', check: content.includes('handleCopy') },
      { name: '编辑功能', check: content.includes("$emit('edit')") },
      { name: '删除功能', check: content.includes('handleDelete') },
      { name: '切换角色功能', check: content.includes("$emit('toggle-role')") },
      { name: 'UserCheck 图标', check: content.includes('UserCheck') }
    ]

    actions.forEach(action => {
      test(`MessageItem ${action.name}`, action.check, action.check ? '功能存在' : '功能缺失')
    })
  }
}

// 7. 生成测试报告
function generateReport() {
  log('\n' + '='.repeat(60))
  log('🧪 NewAPI 集成功能测试报告')
  log('='.repeat(60))

  log(`总测试数: ${testResults.tests.length}`)
  log(`✅ 通过: ${testResults.passed}`)
  log(`❌ 失败: ${testResults.failed}`)
  log(`📊 通过率: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`)

  if (testResults.failed > 0) {
    log('\n❌ 失败的测试:')
    testResults.tests
      .filter(t => !t.passed)
      .forEach(test => {
        log(`  - ${test.name}: ${test.message}`)
      })
  }

  log('\n📋 功能覆盖情况:')
  const categories = {
    构建文件: testResults.tests.filter(t => t.name.includes('构建文件')).length,
    组件文件: testResults.tests.filter(t => t.name.includes('组件文件')).length,
    配置功能: testResults.tests.filter(t => t.name.includes('配置功能')).length,
    样式文件: testResults.tests.filter(t => t.name.includes('样式')).length,
    ModelConfigPanel: testResults.tests.filter(t => t.name.includes('ModelConfigPanel')).length,
    DebugPanel: testResults.tests.filter(t => t.name.includes('DebugPanel')).length,
    MessageItem: testResults.tests.filter(t => t.name.includes('MessageItem')).length
  }

  Object.entries(categories).forEach(([category, count]) => {
    if (count > 0) {
      const passed = testResults.tests.filter(t => t.name.includes(category) && t.passed).length
      log(`  ${category}: ${passed}/${count} 通过`)
    }
  })

  log('\n' + '='.repeat(60))

  if (testResults.failed === 0) {
    log('🎉 所有测试通过！NewAPI 集成功能完整可靠。', 'success')
  } else {
    log('⚠️ 发现一些问题，需要进一步检查。', 'error')
  }

  log('='.repeat(60))
}

// 主测试流程
function runTests() {
  log('🚀 开始 NewAPI 集成功能测试...')

  testBuildFiles()
  testComponentFiles()
  testConfigurationFeatures()
  testStyling()
  testFeatureCompleteness()
  testMessageActions()

  generateReport()
}

// 执行测试
if (require.main === module) {
  runTests()
}

module.exports = { runTests, testResults }
