// @ts-nocheck
// Lazy-loaded export service to reduce initial bundle size
import type { ExportOptions } from './ExportService'
import type { ChatRecord } from '@renderer/src/types'

export interface LazyExporter {
  exportToPDF?: (chats: any[], options: ExportOptions) => Promise<any>
  exportToCSV?: (chats: any[], options: ExportOptions) => Promise<any>
  exportToDOCX?: (chats: any[], options: ExportOptions) => Promise<any>
  exportToZip?: (chats: any[], options: ExportOptions) => Promise<any>
}

export class LazyExportService {
  private static instance: LazyExportService
  private loadedExporters = new Map<string, LazyExporter>()

  private constructor() {}

  static getInstance(): LazyExportService {
    if (!LazyExportService.instance) {
      LazyExportService.instance = new LazyExportService()
    }
    return LazyExportService.instance
  }

  // Lazy load PDF exporter
  async getPDFExporter(): Promise<LazyExporter> {
    if (!this.loadedExporters.has('pdf')) {
      const { PDFExporter } = await import('./PDFExporter')
      this.loadedExporters.set('pdf', PDFExporter.getInstance())
    }
    return this.loadedExporters.get('pdf')!
  }

  // Lazy load CSV exporter
  async getCSVExporter(): Promise<LazyExporter> {
    if (!this.loadedExporters.has('csv')) {
      const { CSVExporter } = await import('./CSVExporter')
      this.loadedExporters.set('csv', CSVExporter.getInstance())
    }
    return this.loadedExporters.get('csv')!
  }

  // Lazy load DOCX exporter
  async getDOCXExporter(): Promise<LazyExporter> {
    if (!this.loadedExporters.has('docx')) {
      const { DOCXExporter } = await import('./DOCXExporter')
      this.loadedExporters.set('docx', DOCXExporter.getInstance())
    }
    return this.loadedExporters.get('docx')!
  }

  // Lazy load ZIP exporter
  async getZipExporter(): Promise<LazyExporter> {
    if (!this.loadedExporters.has('zip')) {
      const { ZipExporter } = await import('./ZipExporter')
      this.loadedExporters.set('zip', ZipExporter.getInstance())
    }
    return this.loadedExporters.get('zip')!
  }

  // Main export method with dynamic loading
  async exportChat(chats: ChatRecord[], options: ExportOptions): Promise<any> {
    try {
      switch (options.format) {
        case 'pdf': {
          const exporter = await this.getPDFExporter()
          return await exporter.exportToPDF!(chats, options)
        }
        case 'csv': {
          const exporter = await this.getCSVExporter()
          return await exporter.exportToCSV!(chats, options)
        }
        case 'docx': {
          const exporter = await this.getDOCXExporter()
          return await exporter.exportToDOCX!(chats, options)
        }
        case 'zip': {
          const exporter = await this.getZipExporter()
          return await exporter.exportToZip!(chats, options)
        }
        default:
          // Handle lightweight formats (markdown, json, html, txt) directly
          return this.exportLightweight(chats, options)
      }
    } catch (error) {
      console.error('Export failed:', error)
      throw new Error(`Failed to export as ${options.format}: ${error.message}`)
    }
  }

  // Handle lightweight exports without external dependencies
  private async exportLightweight(chats: ChatRecord[], options: ExportOptions): Promise<any> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `chat-export-${timestamp}`

    switch (options.format) {
      case 'json':
        return {
          filename: `${filename}.json`,
          content: JSON.stringify(chats, null, 2),
          mimeType: 'application/json'
        }

      case 'markdown':
        return {
          filename: `${filename}.md`,
          content: this.chatToMarkdown(chats, options),
          mimeType: 'text/markdown'
        }

      case 'html':
        return {
          filename: `${filename}.html`,
          content: this.chatToHTML(chats, options),
          mimeType: 'text/html'
        }

      case 'txt':
        return {
          filename: `${filename}.txt`,
          content: this.chatToText(chats, options),
          mimeType: 'text/plain'
        }

      default:
        throw new Error(`Unsupported format: ${options.format}`)
    }
  }

  private chatToMarkdown(chats: ChatRecord[], options: ExportOptions): string {
    let content = '# Chat Export\n\n'

    if (options.title) {
      content += `**Title:** ${options.title}\n`
    }

    content += `**Exported:** ${new Date().toLocaleString()}\n\n`

    for (const chat of chats) {
      content += `## ${chat.title}\n\n`

      for (const message of chat.messages || []) {
        const timestamp = options.includeTimestamps
          ? ` _(${new Date(message.timestamp).toLocaleString()})_`
          : ''

        content += `**${message.role === 'user' ? 'User' : 'Assistant'}${timestamp}:**\n\n`
        content += `${message.content}\n\n`
      }
    }

    return content
  }

  private chatToHTML(chats: ChatRecord[], options: ExportOptions): string {
    let content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${options.title || 'Chat Export'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 2rem; line-height: 1.6; }
    .chat { margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
    .message { margin-bottom: 1rem; }
    .user { color: #2563eb; font-weight: 600; }
    .assistant { color: #059669; font-weight: 600; }
    .timestamp { color: #6b7280; font-size: 0.875rem; }
    .content { margin-top: 0.5rem; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${options.title || 'Chat Export'}</h1>
  <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
`

    for (const chat of chats) {
      content += `  <div class="chat">\n    <h2>${chat.title}</h2>\n`

      for (const message of chat.messages || []) {
        const timestamp = options.includeTimestamps
          ? `<span class="timestamp">${new Date(message.timestamp).toLocaleString()}</span>`
          : ''

        content += `    <div class="message">
      <div class="${message.role}">${message.role === 'user' ? 'User' : 'Assistant'} ${timestamp}</div>
      <div class="content">${message.content}</div>
    </div>\n`
      }
      content += '  </div>\n'
    }

    content += '</body>\n</html>'
    return content
  }

  private chatToText(chats: ChatRecord[], options: ExportOptions): string {
    let content = `Chat Export\n${'='.repeat(50)}\n\n`

    if (options.title) {
      content += `Title: ${options.title}\n`
    }

    content += `Exported: ${new Date().toLocaleString()}\n\n`

    for (const chat of chats) {
      content += `${chat.title}\n${'-'.repeat(30)}\n\n`

      for (const message of chat.messages || []) {
        const timestamp = options.includeTimestamps
          ? ` (${new Date(message.timestamp).toLocaleString()})`
          : ''

        content += `${message.role === 'user' ? 'User' : 'Assistant'}${timestamp}:\n${message.content}\n\n`
      }
    }

    return content
  }
}

export const lazyExportService = LazyExportService.getInstance()
