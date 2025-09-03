// @ts-nocheck
import * as XLSX from 'xlsx'
import type { ExportChatData, ExportOptions, ExportResult, CSVExportOptions } from './ExportService'

export class CSVExporter {
  private static instance: CSVExporter

  private constructor() {}

  static getInstance(): CSVExporter {
    if (!CSVExporter.instance) {
      CSVExporter.instance = new CSVExporter()
    }
    return CSVExporter.instance
  }

  /**
   * Export chats to CSV format
   */
  async exportToCSV(chats: ExportChatData[], options: ExportOptions): Promise<ExportResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)
    const csvOptions = options.csvOptions || this.getDefaultCSVOptions()

    // Prepare data for CSV export
    const csvData: any[] = []

    if (csvOptions.includeHeaders) {
      csvData.push(this.createHeaders(csvOptions))
    }

    // Process each chat
    for (const chat of chats) {
      for (const [messageIndex, message] of chat.messages.entries()) {
        const row = this.createMessageRow(chat, message, messageIndex, options, csvOptions)
        csvData.push(row)
      }

      // Add separator row between chats if needed
      if (chats.length > 1 && chat !== chats[chats.length - 1]) {
        csvData.push(this.createSeparatorRow())
      }
    }

    // Convert to CSV using xlsx library
    const worksheet = XLSX.utils.aoa_to_sheet(csvData)
    const csvContent = XLSX.utils.sheet_to_csv(worksheet, {
      FS: csvOptions.delimiter,
      RS: '\n',
    })

    return {
      content: csvContent,
      filename: `chat-export-${timestamp}.csv`,
      mimeType: 'text/csv',
      size: new Blob([csvContent]).size,
      messageCount,
      chatCount: chats.length,
      processingTime: 0,
    }
  }

  /**
   * Export chats to Excel format
   */
  async exportToExcel(chats: ExportChatData[], options: ExportOptions): Promise<ExportResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)
    const csvOptions = options.csvOptions || this.getDefaultCSVOptions()

    // Create workbook
    const workbook = XLSX.utils.book_new()

    if (chats.length === 1) {
      // Single chat - create one worksheet
      const chat = chats[0]
      const worksheetData = this.createWorksheetData(chat, options, csvOptions)
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Apply formatting
      this.applyWorksheetFormatting(worksheet, worksheetData)

      const sheetName = this.sanitizeSheetName(chat.title)
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    } else {
      // Multiple chats - create overview sheet and individual chat sheets
      this.createOverviewSheet(workbook, chats, options)

      // Create individual sheets for each chat (limit to 10 for performance)
      const maxSheets = 10
      for (const [index, chat] of chats.slice(0, maxSheets).entries()) {
        const worksheetData = this.createWorksheetData(chat, options, csvOptions)
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
        this.applyWorksheetFormatting(worksheet, worksheetData)

        const sheetName = this.sanitizeSheetName(`${index + 1}. ${chat.title}`)
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      }
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    // Convert to base64 for consistent handling
    const base64String = this.arrayBufferToBase64(excelBuffer)
    const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64String}`

    return {
      content: dataUri,
      filename: `chat-export-${timestamp}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: excelBuffer.byteLength,
      messageCount,
      chatCount: chats.length,
      processingTime: 0,
    }
  }

  /**
   * Create headers for CSV
   */
  private createHeaders(csvOptions: CSVExportOptions): string[] {
    const headers = [
      'Chat ID',
      'Chat Title',
      'Chat Created',
      'Chat Updated',
      'Message ID',
      'Message Index',
      'Role',
      'Content',
      'Message Created',
      'Content Length',
    ]

    return headers
  }

  /**
   * Create a message row for CSV
   */
  private createMessageRow(
    chat: ExportChatData,
    message: any,
    messageIndex: number,
    options: ExportOptions,
    csvOptions: CSVExportOptions,
  ): (string | number)[] {
    let content = message.content || ''

    // Flatten content if requested
    if (csvOptions.flattenContent) {
      content = content.replace(/[\r\n]+/g, ' ').trim()
    }

    const row: (string | number)[] = [
      chat.id,
      chat.title,
      options.includeTimestamps ? chat.createdAt : '',
      options.includeTimestamps ? chat.updatedAt : '',
      message.id,
      messageIndex + 1,
      message.role,
      content,
      options.includeTimestamps ? message.created_at : '',
      content.length,
    ]

    return row
  }

  /**
   * Create separator row
   */
  private createSeparatorRow(): string[] {
    return ['---', '---', '---', '---', '---', '---', '---', '---', '---', '---']
  }

  /**
   * Create worksheet data for Excel
   */
  private createWorksheetData(
    chat: ExportChatData,
    options: ExportOptions,
    csvOptions: CSVExportOptions,
  ): any[][] {
    const data: any[][] = []

    // Add chat header
    data.push(['Chat Information'])
    data.push(['Title:', chat.title])
    data.push(['ID:', chat.id])
    if (options.includeTimestamps) {
      data.push(['Created:', new Date(chat.createdAt).toLocaleString()])
      data.push(['Updated:', new Date(chat.updatedAt).toLocaleString()])
    }
    data.push(['Messages:', chat.messages.length])
    data.push([]) // Empty row

    // Add message headers
    if (csvOptions.includeHeaders) {
      data.push(['Message #', 'Role', 'Content', 'Timestamp', 'Length'])
    }

    // Add messages
    for (const [index, message] of chat.messages.entries()) {
      let content = message.content || ''
      if (csvOptions.flattenContent) {
        content = content.replace(/[\r\n]+/g, ' ').trim()
      }

      const row = [
        index + 1,
        message.role,
        content,
        options.includeTimestamps ? new Date(message.created_at).toLocaleString() : '',
        content.length,
      ]

      data.push(row)
    }

    return data
  }

  /**
   * Create overview sheet for multiple chats
   */
  private createOverviewSheet(
    workbook: XLSX.WorkBook,
    chats: ExportChatData[],
    options: ExportOptions,
  ): void {
    const overviewData: any[][] = []

    // Add summary
    overviewData.push(['Chat Export Overview'])
    overviewData.push(['Export Date:', new Date().toLocaleString()])
    overviewData.push(['Total Chats:', chats.length])
    overviewData.push([
      'Total Messages:',
      chats.reduce((sum, chat) => sum + chat.messages.length, 0),
    ])
    overviewData.push([]) // Empty row

    // Add chat list headers
    overviewData.push(['#', 'Chat Title', 'Messages', 'Created', 'Updated'])

    // Add chat list
    for (const [index, chat] of chats.entries()) {
      overviewData.push([
        index + 1,
        chat.title,
        chat.messages.length,
        options.includeTimestamps ? new Date(chat.createdAt).toLocaleString() : '',
        options.includeTimestamps ? new Date(chat.updatedAt).toLocaleString() : '',
      ])
    }

    const worksheet = XLSX.utils.aoa_to_sheet(overviewData)
    this.applyWorksheetFormatting(worksheet, overviewData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Overview')
  }

  /**
   * Apply formatting to worksheet
   */
  private applyWorksheetFormatting(worksheet: XLSX.WorkSheet, data: any[][]): void {
    // Auto-size columns
    const colWidths: number[] = []

    for (let col = 0; col < (data[0]?.length || 0); col++) {
      let maxWidth = 10
      for (let row = 0; row < data.length; row++) {
        const cellValue = data[row][col]
        if (cellValue) {
          const width = cellValue.toString().length
          maxWidth = Math.max(maxWidth, Math.min(width, 50)) // Cap at 50
        }
      }
      colWidths.push(maxWidth)
    }

    worksheet['!cols'] = colWidths.map(width => ({ width }))

    // Freeze first row if it contains headers
    if (data.length > 1) {
      worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }
    }
  }

  /**
   * Sanitize sheet name for Excel
   */
  private sanitizeSheetName(name: string): string {
    // Excel sheet names can't contain: / \ ? * : [ ]
    // And must be <= 31 characters
    return name
      .replace(/[/\\?*:\[\]]/g, '-')
      .substring(0, 31)
      .trim()
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Get default CSV options
   */
  private getDefaultCSVOptions(): CSVExportOptions {
    return {
      delimiter: ',',
      includeHeaders: true,
      encoding: 'utf-8',
      flattenContent: false,
    }
  }

  /**
   * Download CSV/Excel file
   */
  downloadFile(result: ExportResult): void {
    let blob: Blob

    if (result.content.startsWith('data:')) {
      // Handle Excel files (base64 data URI)
      const arr = result.content.split(',')
      const mimeMatch = arr[0].match(/:(.*?);/)
      const mime = mimeMatch ? mimeMatch[1] : result.mimeType
      const bstr = atob(arr[1])
      const n = bstr.length
      const u8arr = new Uint8Array(n)

      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i)
      }

      blob = new Blob([u8arr], { type: mime })
    } else {
      // Handle CSV files (text content)
      blob = new Blob([result.content], { type: result.mimeType })
    }

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
