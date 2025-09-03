import { ref, computed } from 'vue'
import { useChatStore } from '@renderer/src/stores/chat'
import { useErrorHandler } from './useErrorHandler'
import type { Attachment } from '@renderer/src/types'

export function useChat() {
  const chatStore = useChatStore()
  const { handleError, showError, withRetry } = useErrorHandler()

  // Reactive state
  const isLoading = ref(false)
  const selectedMessages = ref<Set<string>>(new Set())

  // Computed properties
  const chats = computed(() => chatStore.chats)
  const currentChat = computed(() => chatStore.currentChat)
  const currentChatId = computed(() => chatStore.currentChatId)
  const messages = computed(() => currentChat.value?.messages || [])
  const hasMessages = computed(() => messages.value.length > 0)
  const isGenerating = computed(() => chatStore.isCurrentChatGenerating)
  const canSendMessage = computed(() => !isLoading.value && !isGenerating.value)

  // Chat management
  const createChat = async (title?: string) => {
    try {
      const chatId = await chatStore.createChat(title)
      return chatId
    } catch (error) {
      handleError(error, 'Create Chat')
      return null
    }
  }

  const selectChat = async (chatId: string) => {
    try {
      await chatStore.selectChat(chatId)
      selectedMessages.value.clear()
    } catch (error) {
      handleError(error, 'Select Chat')
    }
  }

  const deleteChat = async (chatId: string) => {
    try {
      await chatStore.deleteChat(chatId)
      selectedMessages.value.clear()
    } catch (error) {
      handleError(error, 'Delete Chat')
    }
  }

  const updateChatTitle = async (chatId: string, title: string) => {
    try {
      await chatStore.updateChatTitle(chatId, title)
    } catch (error) {
      handleError(error, 'Update Chat Title')
    }
  }

  const clearChat = async (chatId?: string) => {
    const targetChatId = chatId || currentChatId.value
    if (!targetChatId) return

    try {
      await chatStore.clearChat(targetChatId)
      selectedMessages.value.clear()
    } catch (error) {
      handleError(error, 'Clear Chat')
    }
  }

  const archiveChat = async (chatId: string, archived: boolean = true) => {
    try {
      await chatStore.archiveChat(chatId, archived)
    } catch (error) {
      handleError(error, 'Archive Chat')
    }
  }

  // Message management
  const sendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (!currentChatId.value || !canSendMessage.value) return null

    isLoading.value = true

    try {
      const messageId = await withRetry(
        () => chatStore.sendMessage(currentChatId.value!, content, attachments),
        {
          maxAttempts: 3,
          context: 'Send Message',
        },
      )

      return messageId
    } finally {
      isLoading.value = false
    }
  }

  const editMessage = async (messageId: string, newContent: string) => {
    if (!currentChatId.value) return

    try {
      await chatStore.editMessage(currentChatId.value, messageId, newContent)
    } catch (error) {
      handleError(error, 'Edit Message')
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!currentChatId.value) return

    try {
      await chatStore.deleteMessage(currentChatId.value, messageId)
      selectedMessages.value.delete(messageId)
    } catch (error) {
      handleError(error, 'Delete Message')
    }
  }

  const retryMessage = async (messageId: string) => {
    if (!currentChatId.value) return

    try {
      await withRetry(() => chatStore.retryMessage(messageId), {
        maxAttempts: 2,
        context: 'Retry Message',
      })
    } catch (error) {
      handleError(error, 'Retry Message')
    }
  }

  const copyMessage = async (messageId: string) => {
    const message = messages.value.find(m => m.id === messageId)
    if (!message) return

    try {
      await navigator.clipboard.writeText(message.content)
      showError({
        title: 'Success',
        message: 'Message copied to clipboard',
        severity: 'info',
        duration: 2000,
      })
    } catch (error) {
      handleError(error, 'Copy Message')
    }
  }

  // Message selection
  const toggleMessageSelection = (messageId: string) => {
    if (selectedMessages.value.has(messageId)) {
      selectedMessages.value.delete(messageId)
    } else {
      selectedMessages.value.add(messageId)
    }
  }

  const selectAllMessages = () => {
    messages.value.forEach(message => {
      selectedMessages.value.add(message.id)
    })
  }

  const clearSelection = () => {
    selectedMessages.value.clear()
  }

  const deleteSelectedMessages = async () => {
    if (!currentChatId.value || selectedMessages.value.size === 0) return

    const messageIds = Array.from(selectedMessages.value)

    try {
      await Promise.all(messageIds.map(id => chatStore.deleteMessage(currentChatId.value!, id)))
      clearSelection()
    } catch (error) {
      handleError(error, 'Delete Selected Messages')
    }
  }

  // Search functionality
  const searchMessages = (query: string, chatId?: string) => {
    if (!query.trim()) return []

    const targetMessages = chatId ? chatStore.getChatMessages(chatId) : messages.value

    const lowercaseQuery = query.toLowerCase()

    return targetMessages.filter(
      message =>
        message.content.toLowerCase().includes(lowercaseQuery) ||
        message.attachments?.some(att => att.name.toLowerCase().includes(lowercaseQuery)),
    )
  }

  // Export functionality
  const exportChat = async (chatId: string, format: 'json' | 'markdown' | 'text' = 'markdown') => {
    try {
      const chat = chatStore.getChat(chatId)
      if (!chat) {
        showError({
          title: 'Error',
          message: 'Chat not found',
          severity: 'error',
        })
        return
      }

      const exportData = await chatStore.exportChat(chatId, format)

      // Create and download file
      const blob = new Blob([exportData], {
        type: format === 'json' ? 'application/json' : 'text/plain',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${chat.title}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showError({
        title: 'Success',
        message: 'Chat exported successfully',
        severity: 'info',
        duration: 3000,
      })
    } catch (error) {
      handleError(error, 'Export Chat')
    }
  }

  // Utility functions
  const getMessageById = (messageId: string) => {
    return messages.value.find(m => m.id === messageId)
  }

  const getMessageIndex = (messageId: string) => {
    return messages.value.findIndex(m => m.id === messageId)
  }

  const getNextMessage = (messageId: string) => {
    const index = getMessageIndex(messageId)
    return index >= 0 && index < messages.value.length - 1 ? messages.value[index + 1] : null
  }

  const getPreviousMessage = (messageId: string) => {
    const index = getMessageIndex(messageId)
    return index > 0 ? messages.value[index - 1] : null
  }

  // Keyboard navigation
  const navigateToChat = (direction: 'next' | 'prev') => {
    const currentIndex = chats.value.findIndex(c => c.id === currentChatId.value)
    if (currentIndex === -1) return

    const newIndex =
      direction === 'next'
        ? Math.min(currentIndex + 1, chats.value.length - 1)
        : Math.max(currentIndex - 1, 0)

    if (newIndex !== currentIndex) {
      selectChat(chats.value[newIndex].id)
    }
  }

  // Auto-save draft
  const saveDraft = async (content: string, attachments: Attachment[] = []) => {
    if (!currentChatId.value) return

    try {
      await chatStore.saveDraft(currentChatId.value, content, attachments)
    } catch (error) {
      // Silently fail for drafts to avoid annoying users
      console.warn('Failed to save draft:', error)
    }
  }

  const loadDraft = () => {
    if (!currentChatId.value) return null
    return chatStore.getDraft(currentChatId.value)
  }

  const clearDraft = async () => {
    if (!currentChatId.value) return

    try {
      await chatStore.clearDraft(currentChatId.value)
    } catch (error) {
      console.warn('Failed to clear draft:', error)
    }
  }

  return {
    // State
    isLoading,
    isGenerating,
    selectedMessages,

    // Computed
    chats,
    currentChat,
    currentChatId,
    messages,
    hasMessages,
    canSendMessage,

    // Chat management
    createChat,
    selectChat,
    deleteChat,
    updateChatTitle,
    clearChat,
    archiveChat,

    // Message management
    sendMessage,
    editMessage,
    deleteMessage,
    retryMessage,
    copyMessage,

    // Message selection
    toggleMessageSelection,
    selectAllMessages,
    clearSelection,
    deleteSelectedMessages,

    // Search
    searchMessages,

    // Export
    exportChat,

    // Utilities
    getMessageById,
    getMessageIndex,
    getNextMessage,
    getPreviousMessage,
    navigateToChat,

    // Drafts
    saveDraft,
    loadDraft,
    clearDraft,
  }
}
