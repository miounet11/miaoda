import type { PluginModule, PluginContext } from '../PluginManager'

/**
 * Built-in Welcome Plugin
 * Demonstrates basic plugin functionality and provides a welcome experience
 */
export class WelcomePlugin implements PluginModule {
  private context: PluginContext | null = null
  private welcomeShown = false

  async activate(context: PluginContext): Promise<void> {
    this.context = context
    console.log('Welcome Plugin activated!')

    // Show welcome notification on first activation
    if (!this.welcomeShown) {
      await this.showWelcomeMessage()
      this.welcomeShown = true
    }

    // Listen for app initialization
    this.context.chatStore?.on?.('initialized', this.onAppInitialized.bind(this))
  }

  async deactivate(_context: PluginContext): Promise<void> {
    console.log('Welcome Plugin deactivated!')

    // Clean up listeners
    this.context?.chatStore?.off?.('initialized', this.onAppInitialized.bind(this))
    this.context = null
  }

  // Hook: Called when app initializes
  async onAppInit(data: any, _context: PluginContext): Promise<any> {
    console.log('Welcome Plugin: App initialized', data)

    // Show tips for new users
    const isNewUser = await this.checkIfNewUser()
    if (isNewUser) {
      await this.showNewUserTips()
    }

    return data
  }

  // Hook: Called before message send
  async beforeMessageSend(data: any, context: PluginContext): Promise<any> {
    console.log('Welcome Plugin: Before message send', data)

    // Add welcome enhancement for first message
    const messageCount = await context.storage.get('messageCount', 0)
    if (messageCount === 0) {
      context.showNotification('Welcome to MiaoDa Chat! 🎉', 'success')
    }

    await context.storage.set('messageCount', messageCount + 1)
    return data
  }

  // Hook: Called when chat is created
  async onChatCreate(data: any, context: PluginContext): Promise<any> {
    console.log('Welcome Plugin: Chat created', data)

    // Show helpful tips for new chats
    const chatCount = await context.storage.get('chatCount', 0)
    if (chatCount < 3) {
      setTimeout(() => {
        context.showToast('Tip: You can search through your messages using Ctrl+F', 5000)
      }, 2000)
    }

    await context.storage.set('chatCount', chatCount + 1)
    return data
  }

  // Private methods
  private async showWelcomeMessage(): Promise<void> {
    if (!this.context) return

    const message = `
      Welcome to MiaoDa Chat! 🚀
      
      This is your intelligent chat assistant with powerful features:
      
      • 🔍 Smart message search and filtering
      • 🎤 Voice input and text-to-speech
      • 🔌 Extensible plugin system
      • 📱 Multi-window support
      • 🌐 MCP tool integration
      
      Get started by creating your first chat or exploring the features!
    `

    const result = await this.context.showDialog({
      title: 'Welcome to MiaoDa Chat',
      message: message.trim(),
      type: 'info',
      buttons: [
        { text: 'Get Started', value: 'start', primary: true },
        { text: 'Show Tips', value: 'tips' },
        { text: 'Close', value: 'close' }
      ]
    })

    if (result === 'tips') {
      await this.showNewUserTips()
    }

    // Mark welcome as shown
    await this.context.storage.set('welcomeShown', true)
  }

  private async showNewUserTips(): Promise<void> {
    if (!this.context) return

    const tips = [
      {
        title: 'Quick Search',
        message:
          'Press Ctrl+F to search within the current chat, or Ctrl+K for global search across all your conversations.',
        icon: '🔍'
      },
      {
        title: 'Voice Features',
        message:
          'Click the microphone icon to use voice input, or enable text-to-speech in settings to hear responses.',
        icon: '🎤'
      },
      {
        title: 'Plugin System',
        message:
          'Extend MiaoDa Chat with plugins! Visit the Plugin Manager to discover and install new features.',
        icon: '🔌'
      },
      {
        title: 'Keyboard Shortcuts',
        message:
          'Use Ctrl+N for new chat, Ctrl+T for new tab, and many more shortcuts to boost your productivity.',
        icon: '⌨️'
      }
    ]

    for (const tip of tips) {
      const result = await this.context.showDialog({
        title: `${tip.icon} ${tip.title}`,
        message: tip.message,
        type: 'info',
        buttons: [
          { text: 'Next', value: 'next', primary: true },
          { text: 'Skip Tips', value: 'skip' }
        ]
      })

      if (result === 'skip') {
        break
      }
    }

    // Show completion message
    this.context.showNotification(
      'Tips completed! You can access help anytime from the menu.',
      'success'
    )
  }

  private async checkIfNewUser(): Promise<boolean> {
    if (!this.context) return false

    const welcomeShown = await this.context.storage.get('welcomeShown', false)
    const messageCount = await this.context.storage.get('messageCount', 0)

    return !welcomeShown && messageCount === 0
  }

  private onAppInitialized(): void {
    console.log('Welcome Plugin: App initialization complete')

    // Show periodic tips
    this.scheduleTips()
  }

  private scheduleTips(): void {
    if (!this.context) return

    // Show a helpful tip every 10 minutes for new users
    const tipInterval = setInterval(
      async () => {
        const messageCount = await this.context!.storage.get('messageCount', 0)
        const tipsShown = await this.context!.storage.get('tipsShown', 0)

        // Stop showing tips after user has sent 20 messages or seen 5 tips
        if (messageCount > 20 || tipsShown >= 5) {
          clearInterval(tipInterval)
          return
        }

        const tips = [
          'Tip: Right-click on messages to access additional options like copy, edit, or delete.',
          'Tip: You can drag and drop files directly into the chat to share them.',
          'Tip: Use markdown formatting in your messages - **bold**, *italic*, `code`, etc.',
          'Tip: Press Ctrl+/ to see all available keyboard shortcuts.',
          'Tip: Enable dark mode in settings if you prefer a darker interface.'
        ]

        const randomTip = tips[Math.floor(Math.random() * tips.length)]
        this.context!.showToast(randomTip, 8000)

        await this.context!.storage.set('tipsShown', tipsShown + 1)
      },
      10 * 60 * 1000
    ) // 10 minutes
  }
}

// Plugin manifest
export const manifest = {
  id: 'builtin-welcome',
  name: 'Welcome Assistant',
  version: '1.0.0',
  description: 'Provides a welcoming experience for new users with helpful tips and guidance.',
  author: 'MiaoDa Team',
  category: 'utility' as const,
  minAppVersion: '1.0.0',
  requiredPermissions: ['storage', 'notifications'] as const,
  settings: [
    {
      key: 'showTips',
      type: 'boolean' as const,
      title: 'Show helpful tips',
      description: 'Display periodic tips to help you learn MiaoDa Chat features',
      default: true,
      required: false
    },
    {
      key: 'tipFrequency',
      type: 'select' as const,
      title: 'Tip frequency',
      description: 'How often to show helpful tips',
      default: 'normal',
      required: false,
      options: [
        { label: 'Frequent (5 minutes)', value: 'frequent' },
        { label: 'Normal (10 minutes)', value: 'normal' },
        { label: 'Occasional (30 minutes)', value: 'occasional' },
        { label: 'Rarely (1 hour)', value: 'rare' }
      ]
    },
    {
      key: 'welcomeMessage',
      type: 'textarea' as const,
      title: 'Custom welcome message',
      description: 'Customize the welcome message shown to new users',
      default: '',
      required: false
    }
  ]
}

// Export plugin instance
export default new WelcomePlugin()
