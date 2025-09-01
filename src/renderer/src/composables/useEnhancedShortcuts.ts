import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { logger } from '@/utils/Logger'

// 快捷键配置类型
export interface ShortcutConfig {
  id: string
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  category: string
  action: () => void
  enabled?: boolean
  global?: boolean
}

// 快捷键类别
export const SHORTCUT_CATEGORIES = {
  GENERAL: '通用',
  NAVIGATION: '导航',
  CHAT: '聊天',
  SEARCH: '搜索',
  EDITING: '编辑',
  WINDOW: '窗口'
} as const

// 默认快捷键配置
const defaultShortcuts: ShortcutConfig[] = [
  // 通用快捷键
  {
    id: 'new-chat',
    key: 'n',
    meta: true,
    description: '新建聊天',
    category: SHORTCUT_CATEGORIES.GENERAL,
    action: () => {},
    global: true
  },
  {
    id: 'open-settings',
    key: ',',
    meta: true,
    description: '打开设置',
    category: SHORTCUT_CATEGORIES.GENERAL,
    action: () => {},
    global: true
  },
  {
    id: 'toggle-theme',
    key: 't',
    meta: true,
    shift: true,
    description: '切换主题',
    category: SHORTCUT_CATEGORIES.GENERAL,
    action: () => {},
    global: true
  },
  {
    id: 'quit-app',
    key: 'q',
    meta: true,
    description: '退出应用',
    category: SHORTCUT_CATEGORIES.GENERAL,
    action: () => {},
    global: true
  },

  // 导航快捷键
  {
    id: 'focus-input',
    key: 'i',
    meta: true,
    description: '聚焦输入框',
    category: SHORTCUT_CATEGORIES.NAVIGATION,
    action: () => {}
  },
  {
    id: 'toggle-sidebar',
    key: 'b',
    meta: true,
    description: '切换侧边栏',
    category: SHORTCUT_CATEGORIES.NAVIGATION,
    action: () => {}
  },
  {
    id: 'next-chat',
    key: 'Tab',
    meta: true,
    description: '下一个聊天',
    category: SHORTCUT_CATEGORIES.NAVIGATION,
    action: () => {}
  },
  {
    id: 'prev-chat',
    key: 'Tab',
    meta: true,
    shift: true,
    description: '上一个聊天',
    category: SHORTCUT_CATEGORIES.NAVIGATION,
    action: () => {}
  },

  // 聊天快捷键
  {
    id: 'send-message',
    key: 'Enter',
    description: '发送消息',
    category: SHORTCUT_CATEGORIES.CHAT,
    action: () => {}
  },
  {
    id: 'new-line',
    key: 'Enter',
    shift: true,
    description: '换行',
    category: SHORTCUT_CATEGORIES.CHAT,
    action: () => {}
  },
  {
    id: 'clear-chat',
    key: 'k',
    meta: true,
    description: '清空聊天',
    category: SHORTCUT_CATEGORIES.CHAT,
    action: () => {}
  },
  {
    id: 'regenerate',
    key: 'r',
    meta: true,
    description: '重新生成回复',
    category: SHORTCUT_CATEGORIES.CHAT,
    action: () => {}
  },

  // 搜索快捷键
  {
    id: 'global-search',
    key: 'k',
    meta: true,
    description: '全局搜索',
    category: SHORTCUT_CATEGORIES.SEARCH,
    action: () => {},
    global: true
  },
  {
    id: 'search-in-chat',
    key: 'f',
    meta: true,
    description: '在当前聊天中搜索',
    category: SHORTCUT_CATEGORIES.SEARCH,
    action: () => {}
  },

  // 编辑快捷键
  {
    id: 'copy-last-message',
    key: 'c',
    meta: true,
    shift: true,
    description: '复制最后一条消息',
    category: SHORTCUT_CATEGORIES.EDITING,
    action: () => {}
  },
  {
    id: 'paste',
    key: 'v',
    meta: true,
    description: '粘贴',
    category: SHORTCUT_CATEGORIES.EDITING,
    action: () => {}
  },
  {
    id: 'select-all',
    key: 'a',
    meta: true,
    description: '全选',
    category: SHORTCUT_CATEGORIES.EDITING,
    action: () => {}
  },
  {
    id: 'undo',
    key: 'z',
    meta: true,
    description: '撤销',
    category: SHORTCUT_CATEGORIES.EDITING,
    action: () => {}
  },

  // 窗口快捷键
  {
    id: 'minimize-window',
    key: 'm',
    meta: true,
    description: '最小化窗口',
    category: SHORTCUT_CATEGORIES.WINDOW,
    action: () => {},
    global: true
  },
  {
    id: 'close-window',
    key: 'w',
    meta: true,
    description: '关闭窗口',
    category: SHORTCUT_CATEGORIES.WINDOW,
    action: () => {},
    global: true
  },
  {
    id: 'toggle-fullscreen',
    key: 'f',
    meta: true,
    ctrl: true,
    description: '切换全屏',
    category: SHORTCUT_CATEGORIES.WINDOW,
    action: () => {},
    global: true
  }
]

export function useEnhancedShortcuts() {
  // 响应式状态
  const shortcuts = ref<ShortcutConfig[]>([...defaultShortcuts])
  const isRecording = ref(false)
  const recordedShortcut = reactive({
    key: '',
    ctrl: false,
    meta: false,
    shift: false,
    alt: false
  })

  // 快捷键映射表，用于快速查找
  const shortcutMap = new Map<string, ShortcutConfig>()

  // 冲突检测
  const conflicts = ref<string[]>([])

  // 监听器引用
  let keydownListener: ((event: KeyboardEvent) => void) | null = null
  let keyupListener: ((event: KeyboardEvent) => void) | null = null

  // 生成快捷键的唯一标识符
  const generateShortcutKey = (config: ShortcutConfig): string => {
    const modifiers: string[] = []
    if (config.ctrl) modifiers.push('ctrl')
    if (config.meta) modifiers.push('meta')
    if (config.shift) modifiers.push('shift')
    if (config.alt) modifiers.push('alt')
    modifiers.push(config.key.toLowerCase())
    return modifiers.join('+')
  }

  // 格式化快捷键显示
  const formatShortcut = (config: ShortcutConfig): string => {
    const parts: string[] = []
    if (config.ctrl) parts.push('Ctrl')
    if (config.meta) parts.push('⌘')
    if (config.shift) parts.push('⇧')
    if (config.alt) parts.push('⌥')
    parts.push(config.key.toUpperCase())
    return parts.join('')
  }

  // 检查快捷键冲突
  const checkConflicts = () => {
    const map = new Map<string, ShortcutConfig[]>()
    conflicts.value = []

    shortcuts.value.forEach(shortcut => {
      if (!shortcut.enabled) return

      const key = generateShortcutKey(shortcut)
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(shortcut)
    })

    map.forEach((configs, key) => {
      if (configs.length > 1) {
        conflicts.value.push(key)
        logger.warn(`Shortcut conflict detected: ${key} - ${configs.map(c => c.id).join(', ')}`)
      }
    })
  }

  // 更新快捷键映射
  const updateShortcutMap = () => {
    shortcutMap.clear()
    shortcuts.value.forEach(shortcut => {
      if (shortcut.enabled !== false) {
        const key = generateShortcutKey(shortcut)
        shortcutMap.set(key, shortcut)
      }
    })
  }

  // 处理键盘事件
  const handleKeydown = (event: KeyboardEvent) => {
    // 如果正在录制快捷键，记录按键
    if (isRecording.value) {
      event.preventDefault()
      recordedShortcut.key = event.key
      recordedShortcut.ctrl = event.ctrlKey
      recordedShortcut.meta = event.metaKey
      recordedShortcut.shift = event.shiftKey
      recordedShortcut.alt = event.altKey
      return
    }

    // 生成当前按键组合的标识符
    const modifiers: string[] = []
    if (event.ctrlKey) modifiers.push('ctrl')
    if (event.metaKey) modifiers.push('meta')
    if (event.shiftKey) modifiers.push('shift')
    if (event.altKey) modifiers.push('alt')
    modifiers.push(event.key.toLowerCase())
    const shortcutKey = modifiers.join('+')

    // 查找匹配的快捷键
    const shortcut = shortcutMap.get(shortcutKey)
    if (shortcut && shortcut.action) {
      // 检查是否是全局快捷键或当前元素允许快捷键
      if (shortcut.global || shouldHandleShortcut(event.target as HTMLElement)) {
        event.preventDefault()
        event.stopPropagation()
        logger.info(`Shortcut triggered: ${shortcut.id} (${shortcutKey})`)

        try {
          shortcut.action()
        } catch (error) {
          logger.error(`Shortcut action failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }
  }

  // 判断是否应该处理快捷键
  const shouldHandleShortcut = (target: HTMLElement): boolean => {
    // 在输入框、文本区域等可编辑元素中，只处理特定的快捷键
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // 在输入框中只允许特定的快捷键
      return ['global-search', 'send-message', 'new-line'].some(id =>
        shortcutMap.get(generateShortcutKey({ key: '', ctrl: false, meta: false, shift: false, alt: false, ...target } as any))?.id === id
      )
    }

    // 在其他元素中允许所有快捷键
    return true
  }

  // 开始录制快捷键
  const startRecording = () => {
    isRecording.value = true
    recordedShortcut.key = ''
    recordedShortcut.ctrl = false
    recordedShortcut.meta = false
    recordedShortcut.shift = false
    recordedShortcut.alt = false
  }

  // 停止录制快捷键
  const stopRecording = () => {
    isRecording.value = false
  }

  // 保存录制的快捷键
  const saveRecordedShortcut = (shortcutId: string) => {
    const shortcut = shortcuts.value.find(s => s.id === shortcutId)
    if (shortcut && recordedShortcut.key) {
      shortcut.key = recordedShortcut.key
      shortcut.ctrl = recordedShortcut.ctrl
      shortcut.meta = recordedShortcut.meta
      shortcut.shift = recordedShortcut.shift
      shortcut.alt = recordedShortcut.alt

      updateShortcutMap()
      checkConflicts()
      saveToStorage()
    }
    stopRecording()
  }

  // 注册快捷键动作
  const registerShortcut = (config: ShortcutConfig) => {
    const existingIndex = shortcuts.value.findIndex(s => s.id === config.id)
    if (existingIndex >= 0) {
      shortcuts.value[existingIndex] = { ...config, enabled: config.enabled ?? true }
    } else {
      shortcuts.value.push({ ...config, enabled: config.enabled ?? true })
    }

    updateShortcutMap()
    checkConflicts()
    saveToStorage()
  }

  // 注销快捷键
  const unregisterShortcut = (shortcutId: string) => {
    const index = shortcuts.value.findIndex(s => s.id === shortcutId)
    if (index >= 0) {
      shortcuts.value.splice(index, 1)
      updateShortcutMap()
      checkConflicts()
      saveToStorage()
    }
  }

  // 启用/禁用快捷键
  const toggleShortcut = (shortcutId: string, enabled: boolean) => {
    const shortcut = shortcuts.value.find(s => s.id === shortcutId)
    if (shortcut) {
      shortcut.enabled = enabled
      updateShortcutMap()
      checkConflicts()
      saveToStorage()
    }
  }

  // 重置为默认快捷键
  const resetToDefaults = () => {
    shortcuts.value = [...defaultShortcuts]
    updateShortcutMap()
    checkConflicts()
    saveToStorage()
  }

  // 从本地存储加载快捷键配置
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('miaoda-shortcuts')
      if (saved) {
        const parsed = JSON.parse(saved)
        shortcuts.value = parsed.map((config: any) => ({
          ...config,
          action: () => {} // 动作需要在组件中重新注册
        }))
      }
    } catch (error) {
      logger.error(`Failed to load shortcuts from storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 保存到本地存储
  const saveToStorage = () => {
    try {
      const toSave = shortcuts.value.map(config => ({
        ...config,
        action: undefined // 不保存函数
      }))
      localStorage.setItem('miaoda-shortcuts', JSON.stringify(toSave))
    } catch (error) {
      logger.error(`Failed to save shortcuts to storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 获取快捷键提示文本
  const getShortcutHint = (shortcutId: string): string => {
    const shortcut = shortcuts.value.find(s => s.id === shortcutId)
    return shortcut ? formatShortcut(shortcut) : ''
  }

  // 获取类别分组的快捷键
  const getShortcutsByCategory = () => {
    const grouped: Record<string, ShortcutConfig[]> = {}
    shortcuts.value.forEach(shortcut => {
      if (!grouped[shortcut.category]) {
        grouped[shortcut.category] = []
      }
      grouped[shortcut.category].push(shortcut)
    })
    return grouped
  }

  // 初始化
  const initialize = () => {
    loadFromStorage()
    updateShortcutMap()
    checkConflicts()

    // 注册全局键盘监听器
    keydownListener = handleKeydown
    document.addEventListener('keydown', keydownListener)

    logger.info('Enhanced shortcuts system initialized')
  }

  // 清理
  const cleanup = () => {
    if (keydownListener) {
      document.removeEventListener('keydown', keydownListener)
      keydownListener = null
    }
    if (keyupListener) {
      document.removeEventListener('keyup', keyupListener)
      keyupListener = null
    }
  }

  // 生命周期
  onMounted(() => {
    initialize()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态
    shortcuts,
    isRecording,
    recordedShortcut,
    conflicts,

    // 方法
    registerShortcut,
    unregisterShortcut,
    toggleShortcut,
    resetToDefaults,
    startRecording,
    stopRecording,
    saveRecordedShortcut,
    getShortcutHint,
    getShortcutsByCategory,
    formatShortcut,
    generateShortcutKey,

    // 工具方法
    checkConflicts: () => checkConflicts(),
    updateShortcutMap: () => updateShortcutMap()
  }
}
