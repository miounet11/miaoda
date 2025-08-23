import archiver from 'archiver'
import type { ExportChatData, ExportOptions, ExportResult, ZipExportOptions } from './ExportService'
import { CSVExporter } from './CSVExporter'
import { DOCXExporter } from './DOCXExporter'
import { PDFExporter } from './PDFExporter'

export class ZipExporter {
  private static instance: ZipExporter

  private constructor() {}

  static getInstance(): ZipExporter {
    if (!ZipExporter.instance) {
      ZipExporter.instance = new ZipExporter()
    }
    return ZipExporter.instance
  }

  /**
   * Export chats to ZIP format with multiple file formats
   */
  async exportToZip(chats: ExportChatData[], options: ExportOptions): Promise<ExportResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)
    const zipOptions = options.zipOptions || this.getDefaultZipOptions()

    try {
      // Create archive
      const archive = archiver('zip', {
        zlib: { level: this.getCompressionLevel(zipOptions.compression) }
      })

      // Track archive size
      let totalSize = 0

      // Collect data for streaming
      const chunks: Buffer[] = []

      // Set up archive events
      archive.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
        totalSize += chunk.length
      })

      archive.on('error', err => {
        throw new Error(`Archive creation failed: ${err.message}`)
      })

      // Add files to archive
      await this.addFilesToArchive(archive, chats, options, zipOptions)

      // Finalize archive
      await archive.finalize()

      // Wait for all data to be collected
      await new Promise<void>(resolve => {
        archive.on('end', () => resolve())
      })

      // Combine all chunks
      const zipBuffer = Buffer.concat(chunks)

      // Convert to base64 for consistent handling
      const base64String = zipBuffer.toString('base64')
      const dataUri = `data:application/zip;base64,${base64String}`

      return {
        content: dataUri,
        filename: `chat-export-${timestamp}.zip`,
        mimeType: 'application/zip',
        size: totalSize,
        messageCount,
        chatCount: chats.length,
        processingTime: 0
      }
    } catch (error) {
      throw new Error(`ZIP export failed: ${error.message}`)
    }
  }

  /**
   * Add files to archive based on options
   */
  private async addFilesToArchive(
    archive: archiver.Archiver,
    chats: ExportChatData[],
    options: ExportOptions,
    zipOptions: ZipExportOptions
  ): Promise<void> {
    const baseOptions = { ...options }

    // Create folder structure if requested
    const getPath = (format: string, chatId?: string, chatTitle?: string): string => {
      if (!zipOptions.createFolderStructure) {
        return ''
      }

      if (zipOptions.separateFilePerChat && chatId) {
        const safeChatTitle = this.sanitizeFileName(chatTitle || chatId)
        return `chats/${safeChatTitle}/`
      }

      return `formats/${format}/`
    }

    // Process each requested format
    for (const format of zipOptions.includeFormats) {
      if (zipOptions.separateFilePerChat) {
        // Create separate file for each chat
        for (const chat of chats) {
          const chatOptions = {
            ...baseOptions,
            format: format as any,
            chatId: chat.id,
            chatIds: undefined
          }

          await this.addFormatToArchive(
            archive,
            [chat],
            chatOptions,
            getPath(format, chat.id, chat.title)
          )
        }
      } else {
        // Create single file with all chats
        const formatOptions = {
          ...baseOptions,
          format: format as any
        }

        await this.addFormatToArchive(archive, chats, formatOptions, getPath(format))
      }
    }

    // Add metadata file
    const metadata = this.createMetadata(chats, options, zipOptions)
    archive.append(JSON.stringify(metadata, null, 2), {
      name: `${getPath('metadata')}export-metadata.json`
    })

    // Add README file
    const readme = this.createReadme(chats, options, zipOptions)
    archive.append(readme, {
      name: `${getPath('documentation')}README.txt`
    })
  }

  /**
   * Add specific format to archive
   */
  private async addFormatToArchive(
    archive: archiver.Archiver,
    chats: ExportChatData[],
    options: ExportOptions,
    folderPath: string
  ): Promise<void> {
    try {
      let result: ExportResult

      switch (options.format) {
        case 'markdown':
          result = this.exportToMarkdown(chats, options)
          break
        case 'json':
          result = this.exportToJSON(chats, options)
          break
        case 'html':
          result = this.exportToHTML(chats, options)
          break
        case 'txt':
          result = this.exportToText(chats, options)
          break
        case 'csv':
          const csvExporter = CSVExporter.getInstance()
          result = await csvExporter.exportToCSV(chats, options)
          break
        case 'pdf':
          const pdfExporter = PDFExporter.getInstance()
          result = await pdfExporter.exportToPDFDirect(chats, options)
          break
        case 'docx':
          const docxExporter = DOCXExporter.getInstance()
          result = await docxExporter.exportToDOCX(chats, options)
          break
        default:
          throw new Error(`Unsupported format: ${options.format}`)
      }

      // Handle data URI content (PDF, DOCX, Excel)
      if (result.content.startsWith('data:')) {
        const base64Data = result.content.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        archive.append(buffer, { name: `${folderPath}${result.filename}` })
      } else {
        // Handle text content
        archive.append(result.content, { name: `${folderPath}${result.filename}` })
      }
    } catch (error) {
      console.warn(`Failed to add ${options.format} format:`, error)
      // Add error file instead
      archive.append(`Error generating ${options.format} export: ${error.message}`, {
        name: `${folderPath}ERROR-${options.format}.txt`
      })
    }
  }

  /**
   * Export to markdown (copied from main service for consistency)
   */
  private exportToMarkdown(chats: ExportChatData[], options: ExportOptions): ExportResult {
    let content = ''
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    const title = options.title || 'Chat Export'
    content += `# ${title}\n\n`

    if (options.includeTimestamps) {
      content += `**Export Time**: ${new Date().toLocaleString()}\n`
      content += `**Chat Count**: ${chats.length}\n`
      const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)
      content += `**Total Messages**: ${messageCount}\n\n`
    }

    content += '---\n\n'

    for (const [index, chat] of chats.entries()) {
      content += `## ${index + 1}. ${chat.title}\n\n`

      if (options.includeTimestamps) {
        content += `**Created**: ${new Date(chat.createdAt).toLocaleString()}\n`
        content += `**Updated**: ${new Date(chat.updatedAt).toLocaleString()}\n`
        content += `**Messages**: ${chat.messages.length}\n\n`
      }

      for (const message of chat.messages) {
        if (!options.includeSystemMessages && message.role === 'system') continue

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
      filename:
        chats.length === 1
          ? `${this.sanitizeFileName(chats[0].title)}-${timestamp}.md`
          : `chat-export-${timestamp}.md`,
      mimeType: 'text/markdown',
      size: new Blob([content]).size,
      messageCount,
      chatCount: chats.length,
      processingTime: 0
    }
  }

  /**
   * Export to JSON (copied from main service for consistency)
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
          includeMetadata: options.includeMetadata
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
        messages: chat.messages
          .filter(msg => options.includeSystemMessages || msg.role !== 'system')
          .map(msg => ({
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
      filename:
        chats.length === 1
          ? `${this.sanitizeFileName(chats[0].title)}-${timestamp}.json`
          : `chat-export-${timestamp}.json`,
      mimeType: 'application/json',
      size: new Blob([content]).size,
      messageCount,
      chatCount: chats.length,
      processingTime: 0
    }
  }

  /**
   * Export to HTML (simplified version)
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .chat { margin-bottom: 40px; }
        .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; border-left: 4px solid; }
        .user-message { background-color: #e3f2fd; border-left-color: #2196f3; }
        .assistant-message { background-color: #f3e5f5; border-left-color: #9c27b0; }
        .message-role { font-weight: bold; margin-bottom: 8px; }
        .message-content { white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${this.escapeHtml(title)}</h1>
        <p>Export Time: ${new Date().toLocaleString()}</p>
        <p>Chat Count: ${chats.length} | Total Messages: ${messageCount}</p>
    </div>`

    for (const [index, chat] of chats.entries()) {
      html += `<div class="chat"><h2>${index + 1}. ${this.escapeHtml(chat.title)}</h2>`

      for (const message of chat.messages) {
        if (!options.includeSystemMessages && message.role === 'system') continue

        const messageClass = `${message.role}-message`
        const roleName = message.role.charAt(0).toUpperCase() + message.role.slice(1)

        html += `<div class="message ${messageClass}">
            <div class="message-role">${roleName}</div>
            <div class="message-content">${this.escapeHtml(message.content)}</div>
        </div>`
      }

      html += '</div>'
    }

    html += '</body></html>'

    return {
      content: html,
      filename:
        chats.length === 1
          ? `${this.sanitizeFileName(chats[0].title)}-${timestamp}.html`
          : `chat-export-${timestamp}.html`,
      mimeType: 'text/html',
      size: new Blob([html]).size,
      messageCount,
      chatCount: chats.length,
      processingTime: 0
    }
  }

  /**
   * Export to plain text (simplified version)
   */
  private exportToText(chats: ExportChatData[], options: ExportOptions): ExportResult {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    let content = ''
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)

    const title = options.title || 'Chat Export'
    content += `${title}\n${'='.repeat(title.length)}\n\n`

    for (const [index, chat] of chats.entries()) {
      content += `${index + 1}. ${chat.title}\n\n`

      for (const message of chat.messages) {
        if (!options.includeSystemMessages && message.role === 'system') continue

        const roleLabel = `[${message.role.charAt(0).toUpperCase() + message.role.slice(1)}]`
        content += `${roleLabel} ${message.content}\n\n`
      }

      content += `${'-'.repeat(50)}\n\n`
    }

    return {
      content,
      filename:
        chats.length === 1
          ? `${this.sanitizeFileName(chats[0].title)}-${timestamp}.txt`
          : `chat-export-${timestamp}.txt`,
      mimeType: 'text/plain',
      size: new Blob([content]).size,
      messageCount,
      chatCount: chats.length,
      processingTime: 0
    }
  }

  /**
   * Create metadata file content
   */
  private createMetadata(
    chats: ExportChatData[],
    options: ExportOptions,
    zipOptions: ZipExportOptions
  ): any {
    return {
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        title: options.title || 'Chat Export',
        author: options.author || 'MiaoDa Chat',
        exportType: 'zip-archive'
      },
      options: {
        formats: zipOptions.includeFormats,
        compression: zipOptions.compression,
        separateFilePerChat: zipOptions.separateFilePerChat,
        createFolderStructure: zipOptions.createFolderStructure,
        includeSystemMessages: options.includeSystemMessages,
        includeTimestamps: options.includeTimestamps,
        includeMetadata: options.includeMetadata
      },
      statistics: {
        totalChats: chats.length,
        totalMessages: chats.reduce((sum, chat) => sum + chat.messages.length, 0),
        chatTitles: chats.map(chat => chat.title),
        dateRange: {
          earliest: chats.reduce(
            (earliest, chat) =>
              !earliest || new Date(chat.createdAt) < new Date(earliest)
                ? chat.createdAt
                : earliest,
            null as string | null
          ),
          latest: chats.reduce(
            (latest, chat) =>
              !latest || new Date(chat.updatedAt) > new Date(latest) ? chat.updatedAt : latest,
            null as string | null
          )
        }
      }
    }
  }

  /**
   * Create README file content
   */
  private createReadme(
    chats: ExportChatData[],
    options: ExportOptions,
    zipOptions: ZipExportOptions
  ): string {
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)

    return `MiaoDa Chat Export Archive
========================

This archive contains exported chat conversations from MiaoDa Chat.

Export Information:
- Export Date: ${new Date().toLocaleString()}
- Total Conversations: ${chats.length}
- Total Messages: ${messageCount}
- Export Formats: ${zipOptions.includeFormats.join(', ')}

Archive Structure:
${
  zipOptions.createFolderStructure
    ? zipOptions.separateFilePerChat
      ? '- chats/[chat-name]/[files] - Individual chat files organized by conversation'
      : '- formats/[format-name]/[files] - Files organized by export format'
    : '- All files in root directory'
}

File Formats:
${zipOptions.includeFormats
  .map(format => {
    switch (format) {
      case 'markdown':
        return '- .md files: Markdown format with formatting preserved'
      case 'json':
        return '- .json files: Structured data format for programmatic access'
      case 'html':
        return '- .html files: Web format viewable in browsers'
      case 'txt':
        return '- .txt files: Plain text format'
      case 'pdf':
        return '- .pdf files: Portable Document Format for printing'
      case 'csv':
        return '- .csv files: Comma-separated values for spreadsheet applications'
      case 'docx':
        return '- .docx files: Microsoft Word format'
      default:
        return `- ${format} files: ${format.toUpperCase()} format`
    }
  })
  .join('\n')}

Additional Files:
- export-metadata.json: Detailed information about the export
- README.txt: This file

Options Used:
- Include System Messages: ${options.includeSystemMessages ? 'Yes' : 'No'}
- Include Timestamps: ${options.includeTimestamps ? 'Yes' : 'No'}
- Include Metadata: ${options.includeMetadata ? 'Yes' : 'No'}
- Compression Level: ${zipOptions.compression}

Generated by MiaoDa Chat Export System
Version: 2.0.0
`
  }

  /**
   * Get compression level number
   */
  private getCompressionLevel(level: string): number {
    switch (level) {
      case 'none':
        return 0
      case 'fast':
        return 1
      case 'best':
        return 9
      default:
        return 6
    }
  }

  /**
   * Get default ZIP options
   */
  private getDefaultZipOptions(): ZipExportOptions {
    return {
      compression: 'best',
      includeFormats: ['markdown', 'json', 'html'],
      separateFilePerChat: false,
      createFolderStructure: true
    }
  }

  /**
   * Sanitize filename for filesystem
   */
  private sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)
      .toLowerCase()
  }

  /**
   * HTML escape function
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
   * Download ZIP file
   */
  downloadFile(result: ExportResult): void {
    const arr = result.content.split(',')
    const mimeMatch = arr[0].match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : result.mimeType
    const bstr = atob(arr[1])
    const n = bstr.length
    const u8arr = new Uint8Array(n)

    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i)
    }

    const blob = new Blob([u8arr], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    a.style.display = 'none'

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  }
}
