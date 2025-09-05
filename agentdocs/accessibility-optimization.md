# MiaoDa Chat 可访问性优化方案

## 设计理念

**核心原则**: "Inclusive Design - 无障碍即优秀设计"

将可访问性融入设计流程，确保所有用户都能平等使用：

- **键盘导航优先**: 支持完整的键盘操作
- **屏幕阅读器友好**: 语义化标签和ARIA支持
- **高对比度适配**: 支持系统偏好设置
- **减少动画选项**: 考虑运动敏感用户

---

## 当前可访问性状态分析

### 现有可访问性功能

✅ **已实现**:

- 基础的 ARIA 标签支持
- 键盘导航框架 (`useKeyboardNavigation.ts`)
- 主题系统 (浅色/深色模式)
- 国际化支持 (多语言)

⚠️ **需要改进**:

- 弹窗和模态框的焦点管理
- 复杂组件的键盘导航
- 屏幕阅读器的上下文信息
- 高对比度模式的支持

❌ **缺失功能**:

- 减少动画模式的系统支持
- 语音导航辅助
- 字体大小调整支持
- 颜色对比度检测

---

## 可访问性优化实施方案

### 1. 键盘导航系统重构

#### 全局键盘导航框架

**键盘导航管理器** (`KeyboardNavigationManager.ts`):

```typescript
export class KeyboardNavigationManager {
  private focusableElements: HTMLElement[] = []
  private currentIndex = 0
  private modalStack: HTMLElement[] = []

  // 注册可聚焦元素
  registerFocusable(element: HTMLElement) {
    this.focusableElements.push(element)
    element.setAttribute('tabindex', '0')
  }

  // 处理 Tab 键导航
  handleTabKey(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault()

      if (event.shiftKey) {
        this.focusPrevious()
      } else {
        this.focusNext()
      }
    }
  }

  // 处理方向键导航
  handleArrowKeys(event: KeyboardEvent) {
    const { key } = event

    switch (key) {
      case 'ArrowUp':
        event.preventDefault()
        this.navigateUp()
        break
      case 'ArrowDown':
        event.preventDefault()
        this.navigateDown()
        break
      case 'ArrowLeft':
        event.preventDefault()
        this.navigateLeft()
        break
      case 'ArrowRight':
        event.preventDefault()
        this.navigateRight()
        break
    }
  }

  // 模态框焦点陷阱
  trapFocus(modal: HTMLElement) {
    this.modalStack.push(modal)
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    // 设置焦点陷阱
    modal.setAttribute('aria-modal', 'true')
    modal.setAttribute('role', 'dialog')

    // 自动聚焦第一个可聚焦元素
    if (focusableElements.length > 0) {
      ;(focusableElements[0] as HTMLElement).focus()
    }
  }

  // 释放焦点陷阱
  releaseFocusTrap() {
    const modal = this.modalStack.pop()
    if (modal) {
      modal.removeAttribute('aria-modal')
      modal.removeAttribute('role')
    }
  }
}
```

#### 快捷键系统优化

**语义化快捷键** (`AccessibleShortcuts.ts`):

```typescript
export const ACCESSIBLE_SHORTCUTS = {
  // 主要操作
  NEW_CHAT: {
    key: 'n',
    ctrlKey: true,
    description: '新建聊天',
    ariaLabel: '新建聊天 (Ctrl+N)'
  },

  // 导航操作
  FOCUS_SIDEBAR: {
    key: 'b',
    ctrlKey: true,
    description: '聚焦侧边栏',
    ariaLabel: '聚焦侧边栏 (Ctrl+B)'
  },

  // 搜索操作
  QUICK_SEARCH: {
    key: 'k',
    ctrlKey: true,
    description: '快速搜索',
    ariaLabel: '快速搜索 (Ctrl+K)'
  },

  // 设置操作
  OPEN_SETTINGS: {
    key: ',',
    ctrlKey: true,
    description: '打开设置',
    ariaLabel: '打开设置 (Ctrl+,)'
  }
} as const
```

### 2. 屏幕阅读器支持增强

#### ARIA 属性标准化

**智能 ARIA 管理器** (`AriaManager.ts`):

```typescript
export class AriaManager {
  // 动态更新 ARIA 标签
  updateAriaLive(regionId: string, message: string, priority: 'polite' | 'assertive' = 'polite') {
    const region = document.getElementById(regionId)
    if (region) {
      region.setAttribute('aria-live', priority)
      region.textContent = message

      // 自动清理
      setTimeout(() => {
        region.textContent = ''
      }, 1000)
    }
  }

  // 状态变化通知
  announceStatusChange(message: string) {
    this.updateAriaLive('status-region', message, 'polite')
  }

  // 错误通知
  announceError(message: string) {
    this.updateAriaLive('error-region', message, 'assertive')
  }

  // 加载状态通知
  announceLoading(message: string) {
    this.updateAriaLive('loading-region', message, 'polite')
  }
}
```

#### 语义化组件模板

**可访问聊天消息组件**:

```vue
<!-- AccessibleMessageItem.vue -->
<template>
  <article
    :id="`message-${message.id}`"
    :aria-label="`消息 ${isUser ? '发送' : '接收'} 时间 ${formatTime(message.timestamp)}`"
    :aria-describedby="`message-content-${message.id}`"
    class="message-item"
    :class="{ 'message-user': isUser, 'message-assistant': !isUser }"
    role="article"
  >
    <!-- 消息头部 -->
    <header class="message-header">
      <span
        class="message-author"
        :aria-label="isUser ? '用户消息' : `AI助手 ${message.model || '默认模型'}`"
      >
        {{ isUser ? '我' : message.model || 'AI助手' }}
      </span>
      <time
        :datetime="message.timestamp.toISOString()"
        class="message-time"
        :aria-label="`发送时间 ${formatTime(message.timestamp)}`"
      >
        {{ formatTime(message.timestamp) }}
      </time>
    </header>

    <!-- 消息内容 -->
    <div
      :id="`message-content-${message.id}`"
      class="message-content"
      :aria-label="`消息内容: ${getPlainTextContent()}`"
    >
      <!-- 渲染消息内容 -->
      <MessageContentRenderer :content="message.content" :attachments="message.attachments" />
    </div>

    <!-- 消息操作 -->
    <div class="message-actions" role="toolbar" :aria-label="`消息 ${message.id} 操作`">
      <button
        @click="copyMessage"
        class="action-button"
        :aria-label="`复制消息 ${message.id} 的内容`"
        :aria-describedby="`copy-tooltip-${message.id}`"
      >
        <CopyIcon />
        <span :id="`copy-tooltip-${message.id}`" class="sr-only">复制消息内容到剪贴板</span>
      </button>

      <button
        @click="regenerateMessage"
        v-if="!isUser"
        class="action-button"
        :aria-label="`重新生成消息 ${message.id}`"
        :aria-describedby="`regenerate-tooltip-${message.id}`"
      >
        <RefreshIcon />
        <span :id="`regenerate-tooltip-${message.id}`" class="sr-only">重新生成AI回复</span>
      </button>
    </div>
  </article>
</template>
```

### 3. 高对比度和视觉优化

#### 高对比度主题支持

**自动对比度检测** (`ContrastDetector.ts`):

```typescript
export class ContrastDetector {
  // WCAG 对比度计算
  static calculateContrast(color1: string, color2: string): number {
    const l1 = this.getLuminance(color1)
    const l2 = this.getLuminance(color2)

    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)

    return (lighter + 0.05) / (darker + 0.05)
  }

  // 获取颜色的相对亮度
  static getLuminance(color: string): number {
    const rgb = this.hexToRgb(color)
    if (!rgb) return 0

    const [r, g, b] = rgb.map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  // 检查对比度是否符合 WCAG 标准
  static isWCAGCompliant(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const contrast = this.calculateContrast(color1, color2)
    const threshold = level === 'AAA' ? 7 : 4.5
    return contrast >= threshold
  }
}
```

**高对比度主题** (`high-contrast-theme.css`):

```css
/* 高对比度主题 */
@media (prefers-contrast: high) {
  :root {
    --bg-primary: #000000;
    --bg-secondary: #ffffff;
    --text-primary: #ffffff;
    --text-secondary: #000000;
    --border-color: #ffffff;
    --focus-color: #ffff00;
    --error-color: #ff0000;
    --success-color: #00ff00;
  }

  /* 确保所有交互元素有清晰的焦点指示器 */
  *:focus {
    outline: 3px solid var(--focus-color);
    outline-offset: 2px;
  }

  /* 按钮高对比度样式 */
  .button {
    border: 2px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .button:hover {
    background: var(--text-primary);
    color: var(--bg-primary);
  }
}
```

#### 减少动画偏好支持

**动画控制系统** (`MotionPreferences.ts`):

```typescript
export class MotionPreferences {
  private static readonly MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)'

  static isReducedMotionPreferred(): boolean {
    return window.matchMedia(this.MOTION_MEDIA_QUERY).matches
  }

  static applyReducedMotion() {
    if (this.isReducedMotionPreferred()) {
      // 禁用所有动画
      document.documentElement.style.setProperty('--animation-duration', '0s')
      document.documentElement.style.setProperty('--transition-duration', '0s')

      // 添加无动画类
      document.body.classList.add('reduced-motion')
    }
  }

  static watchMotionPreference(callback: (prefersReduced: boolean) => void) {
    const mediaQuery = window.matchMedia(this.MOTION_MEDIA_QUERY)
    callback(mediaQuery.matches)

    mediaQuery.addEventListener('change', event => {
      callback(event.matches)
    })
  }
}
```

### 4. 字体和文本可访问性

#### 动态字体大小调整

**字体缩放系统** (`FontScaler.ts`):

```typescript
export class FontScaler {
  private static readonly FONT_SCALE_KEY = 'font-scale-preference'
  private static readonly SCALE_OPTIONS = [0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 2.0]

  static getCurrentScale(): number {
    const saved = localStorage.getItem(this.FONT_SCALE_KEY)
    return saved ? parseFloat(saved) : 1.0
  }

  static setScale(scale: number) {
    if (this.SCALE_OPTIONS.includes(scale)) {
      localStorage.setItem(this.FONT_SCALE_KEY, scale.toString())
      this.applyScale(scale)
    }
  }

  static applyScale(scale: number) {
    const root = document.documentElement
    root.style.setProperty('--font-scale', scale.toString())

    // 更新所有字体大小变量
    const fontVars = [
      '--text-xs',
      '--text-sm',
      '--text-base',
      '--text-lg',
      '--text-xl',
      '--text-2xl'
    ]

    fontVars.forEach(varName => {
      const baseSize = this.getBaseSize(varName)
      const scaledSize = baseSize * scale
      root.style.setProperty(varName, `${scaledSize}px`)
    })
  }

  private static getBaseSize(varName: string): number {
    const computedStyle = getComputedStyle(document.documentElement)
    const value = computedStyle.getPropertyValue(varName)
    return parseFloat(value) || 16 // 默认 16px
  }
}
```

### 5. 语音和辅助技术集成

#### 语音导航支持

**语音命令处理器** (`VoiceNavigation.ts`):

```typescript
export class VoiceNavigation {
  private recognition: SpeechRecognition | null = null
  private isListening = false

  constructor() {
    this.initializeSpeechRecognition()
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()

      this.recognition.continuous = true
      this.recognition.interimResults = false
      this.recognition.lang = navigator.language || 'en-US'

      this.recognition.onresult = this.handleSpeechResult.bind(this)
      this.recognition.onerror = this.handleSpeechError.bind(this)
    }
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      this.recognition.start()
      this.isListening = true
      this.announceStatus('语音导航已启动')
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
      this.announceStatus('语音导航已停止')
    }
  }

  private handleSpeechResult(event: SpeechRecognitionEvent) {
    const command = event.results[event.results.length - 1][0].transcript.toLowerCase()

    // 语音命令映射
    const commandMap: Record<string, () => void> = {
      新建聊天: () => this.executeCommand('new-chat'),
      搜索: () => this.executeCommand('search'),
      设置: () => this.executeCommand('settings'),
      关闭: () => this.executeCommand('close-modal'),
      下一个: () => this.executeCommand('next-item'),
      上一个: () => this.executeCommand('previous-item')
    }

    const action = commandMap[command]
    if (action) {
      action()
      this.announceStatus(`执行命令: ${command}`)
    } else {
      this.announceStatus(`未识别命令: ${command}`)
    }
  }

  private executeCommand(command: string) {
    // 执行相应的命令
    switch (command) {
      case 'new-chat':
        // 触发新建聊天
        break
      case 'search':
        // 聚焦搜索框
        break
      // ... 其他命令
    }
  }

  private announceStatus(message: string) {
    // 使用屏幕阅读器宣布状态
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
}
```

### 6. 可访问性测试和验证

#### 自动化可访问性检查

**可访问性测试套件** (`AccessibilityTester.ts`):

```typescript
export class AccessibilityTester {
  static async runFullAudit(): Promise<AccessibilityReport> {
    const report: AccessibilityReport = {
      score: 0,
      issues: [],
      recommendations: []
    }

    // 检查 ARIA 属性
    report.issues.push(...this.checkAriaAttributes())

    // 检查键盘导航
    report.issues.push(...(await this.checkKeyboardNavigation()))

    // 检查颜色对比度
    report.issues.push(...this.checkColorContrast())

    // 检查焦点管理
    report.issues.push(...this.checkFocusManagement())

    // 计算综合评分
    report.score = this.calculateScore(report.issues)

    // 生成建议
    report.recommendations = this.generateRecommendations(report.issues)

    return report
  }

  private static checkAriaAttributes(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []
    const elements = document.querySelectorAll(
      '[aria-label], [aria-labelledby], [aria-describedby]'
    )

    elements.forEach(element => {
      // 检查 ARIA 标签的有效性
      if (
        !element.getAttribute('aria-label') &&
        !element.getAttribute('aria-labelledby') &&
        !element.getAttribute('aria-describedby')
      ) {
        issues.push({
          type: 'error',
          element: element as HTMLElement,
          message: 'ARIA 属性不完整',
          suggestion: '添加适当的 aria-label 或关联标签'
        })
      }
    })

    return issues
  }

  private static async checkKeyboardNavigation(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = []

    // 模拟 Tab 键导航
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    // 检查焦点顺序
    for (let i = 0; i < focusableElements.length; i++) {
      const element = focusableElements[i] as HTMLElement

      // 检查是否有可见的焦点指示器
      const computedStyle = window.getComputedStyle(element)
      const hasFocusIndicator =
        computedStyle.outline !== 'none' || computedStyle.boxShadow !== 'none'

      if (!hasFocusIndicator) {
        issues.push({
          type: 'warning',
          element,
          message: '缺少可见的焦点指示器',
          suggestion: '添加 outline 或 box-shadow 焦点样式'
        })
      }
    }

    return issues
  }

  private static checkColorContrast(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []

    // 检查主要颜色组合
    const colorPairs = [
      { fg: '--text-primary', bg: '--bg-primary' },
      { fg: '--text-secondary', bg: '--bg-secondary' }
      // ... 更多颜色对
    ]

    colorPairs.forEach(pair => {
      const fgColor = getComputedStyle(document.documentElement).getPropertyValue(pair.fg).trim()
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue(pair.bg).trim()

      if (fgColor && bgColor) {
        const contrast = ContrastDetector.calculateContrast(fgColor, bgColor)

        if (contrast < 4.5) {
          issues.push({
            type: 'error',
            element: document.documentElement,
            message: `对比度不足: ${contrast.toFixed(2)} (需要 ≥4.5)`,
            suggestion: '调整颜色以提高对比度'
          })
        }
      }
    })

    return issues
  }
}
```

### 7. 实施计划

#### Phase 1: 基础可访问性 (1周)

1. **键盘导航完善**
   - 实现全局键盘导航管理器
   - 修复模态框焦点陷阱
   - 完善快捷键系统

2. **ARIA 属性标准化**
   - 为所有组件添加完整的 ARIA 属性
   - 实现动态状态通知
   - 优化屏幕阅读器支持

#### Phase 2: 视觉可访问性 (1周)

1. **高对比度支持**
   - 实现自动对比度检测
   - 设计高对比度主题
   - 支持系统偏好设置

2. **动画和字体优化**
   - 实现减少动画模式
   - 添加字体大小调整功能
   - 优化文本可读性

#### Phase 3: 高级功能集成 (1周)

1. **语音导航**
   - 实现语音命令识别
   - 添加语音反馈
   - 集成辅助技术

2. **自动化测试**
   - 建立可访问性测试套件
   - 实施持续监控
   - 生成改进报告

---

## 成功指标

### 可访问性合规指标

- **WCAG 2.1 AA 合规**: 100% 通过
- **键盘导航覆盖**: 100% 功能
- **屏幕阅读器支持**: 100% 组件
- **高对比度支持**: 100% 主题

### 用户体验指标

- **键盘用户完成率**: > 95%
- **辅助技术兼容性**: 100% 支持
- **可访问性问题数**: 0 个严重问题
- **用户满意度**: > 4.5/5.0

### 技术指标

- **自动化测试覆盖**: > 90%
- **可访问性评分**: > 95/100
- **性能影响**: < 5% 额外开销
- **维护成本**: 可持续更新

---

## 设计原则总结

1. **包容性优先**: 设计即考虑所有用户需求
2. **渐进增强**: 基础功能保证，高级功能增强
3. **标准遵循**: 严格遵守 WCAG 指南
4. **持续改进**: 定期测试和优化
5. **用户中心**: 以实际用户需求为导向

---

_可访问性目标: 让每个人都能平等地享受 AI 聊天的乐趣和便利。_
