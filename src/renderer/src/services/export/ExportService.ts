// @ts-nocheck
import type { ChatRecord, MessageRecord } from '@renderer/src/types'
import { searchService } from '../search/SearchService'
import { ExportValidator } from './ExportValidator'
import { PDFExporter } from './PDFExporter'
import { CSVExporter } from './CSVExporter'
import { DOCXExporter } from './DOCXExporter'
import { ZipExporter } from './ZipExporter'

export interface ExportOptions {
  format: 'markdown' | 'json' | 'html' | 'txt' | 'pdf' | 'csv' | 'docx' | 'zip'
  chatId?: string
  chatIds?: string[]
  includeSystemMessages?: boolean
  includeTimestamps?: boolean
  includeMetadata?: boolean
  includeAttachments?: boolean
  dateFrom?: Date
  dateTo?: Date
  title?: string
  author?: string
  tags?: string[] // Filter by tags
  preview?: boolean // Preview mode
  template?: ExportTemplate // Style template
  batchOptions?: BatchExportOptions
  pdfOptions?: PDFExportOptions
  csvOptions?: CSVExportOptions
  docxOptions?: DOCXExportOptions
  zipOptions?: ZipExportOptions
}

// Extended options for different formats
export interface PDFExportOptions {
  method: 'html2canvas' | 'direct'
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  pageOrientation: 'portrait' | 'landscape'
  margins: { top: number; right: number; bottom: number; left: number }
  includePageNumbers: boolean
  includeHeader: boolean
  includeFooter: boolean
  customCSS?: string
}

export interface CSVExportOptions {
  delimiter: ',' | ';' | '\t'
  includeHeaders: boolean
  encoding: 'utf-8' | 'utf-16' | 'ascii'
  flattenContent: boolean // Convert to single line
}

export interface DOCXExportOptions {
  template: 'default' | 'academic' | 'business' | 'minimal'
  fontSize: number
  fontFamily: string
  includeTableOfContents: boolean
  pageBreakBetweenChats: boolean
  customStyles?: Record<string, any>
}

export interface ZipExportOptions {
  compression: 'none' | 'fast' | 'best'
  includeFormats: ('markdown' | 'json' | 'html' | 'txt' | 'pdf' | 'csv' | 'docx')[]
  separateFilePerChat: boolean
  createFolderStructure: boolean
}

export interface BatchExportOptions {
  maxConcurrency: number
  chunkSize: number
  pauseBetweenChunks: number
  retryAttempts: number
}

export interface ExportTemplate {
  id: string
  name: string
  description: string
  css?: string
  htmlTemplate?: string
  variables?: Record<string, any>
  formats: string[]
}

export interface ExportResult {
  content: string
  filename: string
  mimeType: string
  size: number
  messageCount: number
  chatCount: number
  processingTime: number
}

export interface ExportProgress {
  chatId: string
  progress: number
  currentChat: string
  totalChats: number
  totalMessages: number
  processedMessages: number
  stage: 'fetching' | 'processing' | 'generating' | 'completed'
  error?: string
}

export type ProgressCallback = (progress: ExportProgress) => void

export interface ExportChatData {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: MessageRecord[]
}

export class ExportService {
  private static instance: ExportService
  private readonly BATCH_SIZE = 100 // Process messages in batches to avoid memory issues
  private readonly MAX_CONTENT_SIZE = 50 * 1024 * 1024 // 50MB limit for single export

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService()
    }
    return ExportService.instance
  }

  /**
   * 导出聊天记录
   */
  async exportChats(
    options: ExportOptions,
    progressCallback?: ProgressCallback
  ): Promise<ExportResult> {
    const startTime = performance.now()

    try {
      // Validate input
      this.validateExportOptions(options)

      const chatData = await this.getChatData(options, progressCallback)

      // Validate chat data and size
      const dataValidation = ExportValidator.validateChatData(chatData)
      if (!dataValidation.isValid) {
        throw new Error(`Invalid chat data: ${dataValidation.errors.join(', ')}`)
      }

      const sizeValidation = ExportValidator.validateExportSize(chatData, options.format)
      if (!sizeValidation.isValid) {
        throw new Error(`Export size validation failed: ${sizeValidation.errors.join(', ')}`)
      }

      progressCallback?.({
        chatId: '',
        progress: 80,
        currentChat: 'Generating file...',
        totalChats: chatData.length,
        totalMessages: chatData.reduce((sum, chat) => sum + chat.messages.length, 0),
        processedMessages: chatData.reduce((sum, chat) => sum + chat.messages.length, 0),
        stage: 'generating'
      })

      let result: ExportResult
      switch (options.format) {
        case 'markdown':
          result = this.exportToMarkdown(chatData, options)
          break
        case 'json':
          result = this.exportToJSON(chatData, options)
          break
        case 'html':
          result = this.exportToHTML(chatData, options)
          break
        case 'txt':
          result = this.exportToText(chatData, options)
          break
        case 'pdf':
          result = await this.exportToPDF(chatData, options)
          break
        case 'csv':
          result = await this.exportToCSV(chatData, options)
          break
        case 'docx':
          result = await this.exportToDOCX(chatData, options)
          break
        case 'zip':
          result = await this.exportToZip(chatData, options)
          break
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }

      result.processingTime = performance.now() - startTime

      progressCallback?.({
        chatId: '',
        progress: 100,
        currentChat: 'Export completed',
        totalChats: chatData.length,
        totalMessages: result.messageCount,
        processedMessages: result.messageCount,
        stage: 'completed'
      })

      return result
    } catch (error: any) {
      console.error('Export failed:', error)
      progressCallback?.({
        chatId: '',
        progress: 0,
        currentChat: '',
        totalChats: 0,
        totalMessages: 0,
        processedMessages: 0,
        stage: 'completed',
        error: error.message
      })
      throw new Error(`Export failed: ${error.message}`)
    }
  }

  /**
   * 验证导出选项
   */
  private validateExportOptions(options: ExportOptions): void {
    const validation = ExportValidator.validateOptions(options)

    if (!validation.isValid) {
      throw new Error(`Invalid export options: ${validation.errors.join(', ')}`)
    }
  }

  /**
   * 估算内容大小
   */
  private estimateContentSize(chats: ExportChatData[]): number {
    return (
      chats.reduce((total, chat) => {
        return total + chat.messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0)
      }, 0) * 2
    ) // Multiply by 2 for formatting overhead
  }

  /**
   * 获取聊天数据
   */
  private async getChatData(
    options: ExportOptions,
    progressCallback?: ProgressCallback
  ): Promise<ExportChatData[]> {
    const chatData: ExportChatData[] = []

    progressCallback?.({
      chatId: '',
      progress: 10,
      currentChat: 'Loading chat list...',
      totalChats: 0,
      totalMessages: 0,
      processedMessages: 0,
      stage: 'fetching'
    })

    // 根据选项获取聊天记录
    let chats: ChatRecord[] = []

    try {
      if (options.chatId) {
        // 单个聊天
        const chat = await this.getChatFromMain(options.chatId)
        if (chat) chats = [chat]
      } else if (options.chatIds && options.chatIds.length > 0) {
        // 多个指定聊天
        chats = await this.getChatsFromMain(options.chatIds)
      } else {
        // 所有聊天
        chats = await this.getAllChatsFromMain()
      }
    } catch (error: any) {
      throw new Error(`Failed to load chats: ${error.message}`)
    }

    // 应用时间过滤
    if (options.dateFrom || options.dateTo) {
      chats = chats.filter(chat => {
        const chatDate = new Date(chat.created_at)
        if (options.dateFrom && chatDate < options.dateFrom) return false
        if (options.dateTo && chatDate > options.dateTo) return false
        return true
      })
    }

    if (chats.length === 0) {
      throw new Error('No chats found matching the criteria')
    }

    progressCallback?.({
      chatId: '',
      progress: 20,
      currentChat: `Found ${chats.length} chats`,
      totalChats: chats.length,
      totalMessages: 0,
      processedMessages: 0,
      stage: 'fetching'
    })

    // 获取每个聊天的消息（分批处理）
    let totalMessages = 0
    let processedMessages = 0

    for (let i = 0; i < chats.length; i++) {
      const chat = chats[i]

      try {
        progressCallback?.({
          chatId: chat.id,
          progress: 20 + (i / chats.length) * 60,
          currentChat: `Processing: ${chat.title}`,
          totalChats: chats.length,
          totalMessages,
          processedMessages,
          stage: 'processing'
        })

        const messages = await this.getMessagesFromMain(chat.id, options)
        totalMessages += messages.length
        processedMessages += messages.length

        chatData.push({
          id: chat.id,
          title: chat.title,
          createdAt: chat.created_at,
          updatedAt: chat.updated_at,
          messages
        })

        // Add small delay to prevent UI blocking
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      } catch (error: any) {
        console.warn(`Failed to load messages for chat ${chat.id}:`, error)
        // Continue with other chats but add empty message array
        chatData.push({
          id: chat.id,
          title: chat.title,
          createdAt: chat.created_at,
          updatedAt: chat.updated_at,
          messages: []
        })
      }
    }

    return chatData
  }

  /**
   * 从主进程获取聊天记录
   */
  private async getChatFromMain(chatId: string): Promise<ChatRecord | null> {
    try {
      return await window.api.export.getChat(chatId)
    } catch (error) {
      console.error('Failed to get chat:', error)
      return null
    }
  }

  private async getChatsFromMain(chatIds: string[]): Promise<ChatRecord[]> {
    try {
      return await window.api.export.getChats(chatIds)
    } catch (error) {
      console.error('Failed to get chats:', error)
      return []
    }
  }

  private async getAllChatsFromMain(): Promise<ChatRecord[]> {
    try {
      return await window.api.export.getAllChats()
    } catch (error) {
      console.error('Failed to get all chats:', error)
      return []
    }
  }

  private async getMessagesFromMain(
    chatId: string,
    options: ExportOptions
  ): Promise<MessageRecord[]> {
    try {
      let messages = await window.api.export.getMessages(chatId)

      // 过滤系统消息
      if (!options.includeSystemMessages) {
        messages = messages.filter(msg => msg.role !== 'system')
      }

      return messages
    } catch (error) {
      console.error('Failed to get messages:', error)
      return []
    }
  }

  /**
   * 导出为Markdown格式
   */
  private exportToMarkdown(chats: ExportChatData[], options: ExportOptions): ExportResult {
    let content = ''
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    // 添加标题和元信息
    const title = options.title || 'Chat Export'
    content += `# ${title}\n\n`

    if (options.includeTimestamps) {
      content += `**Export Time**: ${new Date().toLocaleString()}\n`
      content += `**Chat Count**: ${chats.length}\n`
      const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)
      content += `**Total Messages**: ${messageCount}\n\n`
    }

    if (options.author) {
      content += `**Author**: ${options.author}\n\n`
    }

    content += '---\n\n'

    // 处理每个聊天
    for (const [index, chat] of chats.entries()) {
      content += `## ${index + 1}. ${chat.title}\n\n`

      if (options.includeTimestamps) {
        content += `**Created**: ${new Date(chat.createdAt).toLocaleString()}\n`
        content += `**Updated**: ${new Date(chat.updatedAt).toLocaleString()}\n`
        content += `**Messages**: ${chat.messages.length}\n\n`
      }

      // 处理消息
      for (const message of chat.messages) {
        const roleIcon = message.role === 'user' ? '👤' : '🤖'
        const roleName = message.role === 'user' ? 'User' : 'Assistant'
        content += `### ${roleIcon} ${roleName}\n\n`

        if (options.includeTimestamps) {
          content += `*${new Date(message.created_at).toLocaleString()}*\n\n`
        }

        content += `${message.content}\n\n`
      }

      content += '---\n\n'
    }

    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)

    return {
      content,
      filename: `chat-export-${timestamp}.md`,
      mimeType: 'text/markdown',
      size: new Blob([content]).size,
      messageCount,
      chatCount: chats.length,
      processingTime: 0 // Will be set by the main export method
    }
  }

  /**
   * 导出为JSON格式
   */
  private exportToJSON(chats: ExportChatData[], options: ExportOptions): ExportResult {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)

    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        format: 'json',
        title: options.title || 'Chat Export',
        author: options.author || 'MiaoDa Chat',
        options: {
          includeSystemMessages: options.includeSystemMessages,
          includeTimestamps: options.includeTimestamps,
          includeMetadata: options.includeMetadata,
          dateFrom: options.dateFrom?.toISOString(),
          dateTo: options.dateTo?.toISOString()
        }
      },
      statistics: {
        chatCount: chats.length,
        messageCount
      },
      chats: chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messageCount: chat.messages.length,
        messages: chat.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.created_at
        }))
      }))
    }

    const content = JSON.stringify(exportData, null, 2)

    return {
      content,
      filename: `chat-export-${timestamp}.json`,
      mimeType: 'application/json',
      size: new Blob([content]).size,
      messageCount,
      chatCount: chats.length,
      processingTime: 0 // Will be set by the main export method
    }
  }

  /**
   * 导出为HTML格式
   */
  private exportToHTML(chats: ExportChatData[], options: ExportOptions): ExportResult {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const title = options.title || 'Chat Export'
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            color: #333;
            background: #fafafa;
        }
        .header { 
            border-bottom: 2px solid #eee; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .chat { 
            margin-bottom: 40px; 
            background: white;
            border-radius: 8px; 
            padding: 20px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .chat-title { 
            color: #333; 
            margin-bottom: 15px; 
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .chat-meta { 
            color: #666; 
            font-size: 0.9em; 
            margin-bottom: 20px; 
        }
        .message { 
            margin-bottom: 20px; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid;
        }
        .user-message { 
            background-color: #e3f2fd; 
            border-left-color: #2196f3; 
        }
        .assistant-message { 
            background-color: #f3e5f5; 
            border-left-color: #9c27b0; 
        }
        .system-message { 
            background-color: #fff3e0; 
            border-left-color: #ff9800; 
        }
        .message-role { 
            font-weight: bold; 
            margin-bottom: 8px; 
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .message-time { 
            color: #666; 
            font-size: 0.8em; 
            margin-left: auto;
        }
        .message-content { 
            white-space: pre-wrap; 
            word-wrap: break-word;
        }
        pre { 
            background: #f5f5f5; 
            padding: 12px; 
            border-radius: 4px; 
            overflow-x: auto; 
            border: 1px solid #ddd;
        }
        code { 
            background: #f5f5f5; 
            padding: 2px 6px; 
            border-radius: 3px; 
            font-family: 'Monaco', 'Consolas', monospace;
        }
        .export-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
        }
        .info-label {
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${this.escapeHtml(title)}</h1>
        <div class="export-info">
            <div class="info-item">
                <span class="info-label">Export Time:</span>
                <span>${new Date().toLocaleString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Chat Count:</span>
                <span>${chats.length}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Total Messages:</span>
                <span>${messageCount}</span>
            </div>
            ${
              options.author
                ? `
            <div class="info-item">
                <span class="info-label">Author:</span>
                <span>${this.escapeHtml(options.author)}</span>
            </div>
            `
                : ''
            }
        </div>
    </div>
`

    // 处理每个聊天
    for (const [index, chat] of chats.entries()) {
      html += `    <div class="chat">
        <h2 class="chat-title">${index + 1}. ${this.escapeHtml(chat.title)}</h2>
`

      if (options.includeTimestamps) {
        html += `        <div class="chat-meta">
            Created: ${new Date(chat.createdAt).toLocaleString()} | 
            Updated: ${new Date(chat.updatedAt).toLocaleString()} | 
            Messages: ${chat.messages.length}
        </div>
`
      }

      // 处理消息
      for (const message of chat.messages) {
        const messageClass = `${message.role}-message`
        const roleIcon = message.role === 'user' ? '👤' : message.role === 'assistant' ? '🤖' : '⚙️'
        const roleName = message.role.charAt(0).toUpperCase() + message.role.slice(1)

        html += `        <div class="message ${messageClass}">
            <div class="message-role">
                <span>${roleIcon} ${roleName}</span>
                ${options.includeTimestamps ? `<span class="message-time">${new Date(message.created_at).toLocaleString()}</span>` : ''}
            </div>
            <div class="message-content">${this.escapeHtml(message.content)}</div>
        </div>
`
      }

      html += `    </div>
`
    }

    html += `</body>
</html>`

    return {
      content: html,
      filename: `chat-export-${timestamp}.html`,
      mimeType: 'text/html',
      size: new Blob([html]).size,
      messageCount,
      chatCount: chats.length,
      processingTime: 0 // Will be set by the main export method
    }
  }

  /**
   * 导出为纯文本格式
   */
  private exportToText(chats: ExportChatData[], options: ExportOptions): ExportResult {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    let content = ''
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)

    // 添加标题
    const title = options.title || 'Chat Export'
    content += `${title}\n${'='.repeat(title.length)}\n\n`

    content += `Export Time: ${new Date().toLocaleString()}\n`
    content += `Chat Count: ${chats.length}\n`
    content += `Total Messages: ${messageCount}\n\n`

    if (options.author) {
      content += `Author: ${options.author}\n\n`
    }

    content += `${'-'.repeat(50)}\n\n`

    // 处理每个聊天
    for (const [index, chat] of chats.entries()) {
      content += `${index + 1}. ${chat.title}\n`

      if (options.includeTimestamps) {
        content += `   Created: ${new Date(chat.createdAt).toLocaleString()}\n`
        content += `   Updated: ${new Date(chat.updatedAt).toLocaleString()}\n`
      }

      content += `\n`

      // 处理消息
      for (const message of chat.messages) {
        const roleLabel =
          message.role === 'user'
            ? '[User]'
            : message.role === 'assistant'
              ? '[Assistant]'
              : '[System]'
        content += `${roleLabel} `

        if (options.includeTimestamps) {
          content += `(${new Date(message.created_at).toLocaleString()}) `
        }

        content += `\n${message.content}\n\n`
      }

      content += `${'-'.repeat(50)}\n\n`
    }

    return {
      content,
      filename: `chat-export-${timestamp}.txt`,
      mimeType: 'text/plain',
      size: new Blob([content]).size,
      messageCount,
      chatCount: chats.length,
      processingTime: 0 // Will be set by the main export method
    }
  }

  /**
   * 导出为PDF格式
   */
  private async exportToPDF(
    chats: ExportChatData[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const pdfExporter = PDFExporter.getInstance()

    if (options.pdfOptions?.method === 'html2canvas') {
      return await pdfExporter.exportToPDF(chats, options)
    } else {
      // Use direct method by default for better performance
      return await pdfExporter.exportToPDFDirect(chats, options)
    }
  }

  /**
   * 导出为CSV格式
   */
  private async exportToCSV(
    chats: ExportChatData[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const csvExporter = CSVExporter.getInstance()
    return await csvExporter.exportToCSV(chats, options)
  }

  /**
   * 导出为Excel格式
   */
  private async exportToExcel(
    chats: ExportChatData[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const csvExporter = CSVExporter.getInstance()
    return await csvExporter.exportToExcel(chats, options)
  }

  /**
   * 导出为DOCX格式
   */
  private async exportToDOCX(
    chats: ExportChatData[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const docxExporter = DOCXExporter.getInstance()
    return await docxExporter.exportToDOCX(chats, options)
  }

  /**
   * 导出为ZIP格式
   */
  private async exportToZip(
    chats: ExportChatData[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const zipExporter = ZipExporter.getInstance()
    return await zipExporter.exportToZip(chats, options)
  }

  /**
   * HTML转义
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  /**
   * 下载文件
   */
  downloadFile(result: ExportResult): void {
    // Handle different file types with specialized downloaders
    const format = result.filename.split('.').pop()?.toLowerCase() || ''

    // Special handling for binary formats with data URI
    if (result.content.startsWith('data:')) {
      switch (format) {
        case 'pdf':
          const pdfExporter = PDFExporter.getInstance()
          pdfExporter.downloadPDF(result)
          return
        case 'xlsx':
        case 'csv':
          const csvExporter = CSVExporter.getInstance()
          csvExporter.downloadFile(result)
          return
        case 'docx':
          const docxExporter = DOCXExporter.getInstance()
          docxExporter.downloadFile(result)
          return
        case 'zip':
          const zipExporter = ZipExporter.getInstance()
          zipExporter.downloadFile(result)
          return
      }
    }

    // Validate MIME type matches format
    if (!ExportValidator.validateMimeType(format, result.mimeType)) {
      console.warn(`MIME type ${result.mimeType} doesn't match file format ${format}`)
    }

    // Sanitize filename for security
    const sanitizedFilename = ExportValidator.sanitizeFilename(result.filename)

    // Default handling for text-based formats
    const blob = new Blob([result.content], { type: result.mimeType })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = sanitizedFilename
    a.style.display = 'none'

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  }
}

// 导出单例实例
export const exportService = ExportService.getInstance()
