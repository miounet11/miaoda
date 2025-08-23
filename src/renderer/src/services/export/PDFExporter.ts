import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { ExportChatData, ExportOptions, ExportResult } from './ExportService'

export class PDFExporter {
  private static instance: PDFExporter

  private constructor() {}

  static getInstance(): PDFExporter {
    if (!PDFExporter.instance) {
      PDFExporter.instance = new PDFExporter()
    }
    return PDFExporter.instance
  }

  /**
   * Export chats to PDF format
   */
  async exportToPDF(chats: ExportChatData[], options: ExportOptions): Promise<ExportResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const title = options.title || 'Chat Export'
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)

    // Create a temporary container for PDF generation
    const container = this.createPDFContainer(chats, options)
    document.body.appendChild(container)

    try {
      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(container, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: container.scrollWidth,
        height: container.scrollHeight
      })

      // Calculate PDF dimensions
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      const pdf = new jsPDF('p', 'mm', 'a4')
      let position = 0

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Get PDF as string
      const pdfContent = pdf.output('datauristring')

      return {
        content: pdfContent,
        filename: `chat-export-${timestamp}.pdf`,
        mimeType: 'application/pdf',
        size: pdfContent.length,
        messageCount,
        chatCount: chats.length,
        processingTime: 0 // Will be set by the main export method
      }
    } finally {
      // Clean up temporary container
      document.body.removeChild(container)
    }
  }

  /**
   * Alternative PDF export using direct jsPDF text generation
   */
  async exportToPDFDirect(chats: ExportChatData[], options: ExportOptions): Promise<ExportResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const title = options.title || 'Chat Export'
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const lineHeight = 6
    const maxLineWidth = pageWidth - 2 * margin

    let yPosition = margin

    // Add title
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, margin, yPosition)
    yPosition += lineHeight * 2

    // Add metadata
    if (options.includeTimestamps) {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Export Time: ${new Date().toLocaleString()}`, margin, yPosition)
      yPosition += lineHeight
      pdf.text(`Chat Count: ${chats.length}`, margin, yPosition)
      yPosition += lineHeight
      pdf.text(`Total Messages: ${messageCount}`, margin, yPosition)
      yPosition += lineHeight * 2
    }

    if (options.author) {
      pdf.text(`Author: ${options.author}`, margin, yPosition)
      yPosition += lineHeight * 2
    }

    // Process each chat
    for (const [index, chat] of chats.entries()) {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = margin
      }

      // Chat title
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      const chatTitle = `${index + 1}. ${chat.title}`
      pdf.text(chatTitle, margin, yPosition)
      yPosition += lineHeight * 1.5

      // Chat metadata
      if (options.includeTimestamps) {
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'italic')
        pdf.text(`Created: ${new Date(chat.createdAt).toLocaleString()}`, margin, yPosition)
        yPosition += lineHeight
        pdf.text(`Updated: ${new Date(chat.updatedAt).toLocaleString()}`, margin, yPosition)
        yPosition += lineHeight
        pdf.text(`Messages: ${chat.messages.length}`, margin, yPosition)
        yPosition += lineHeight * 1.5
      }

      // Process messages
      for (const message of chat.messages) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage()
          yPosition = margin
        }

        // Message role
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        const roleText =
          message.role === 'user'
            ? '👤 User'
            : message.role === 'assistant'
              ? '🤖 Assistant'
              : '⚙️ System'

        // Note: jsPDF doesn't handle emojis well, so we'll use text alternatives
        const roleTextAlt =
          message.role === 'user'
            ? '[User]'
            : message.role === 'assistant'
              ? '[Assistant]'
              : '[System]'
        pdf.text(roleTextAlt, margin, yPosition)

        if (options.includeTimestamps) {
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'normal')
          const timeText = new Date(message.created_at).toLocaleString()
          pdf.text(timeText, pageWidth - margin - pdf.getTextWidth(timeText), yPosition)
        }

        yPosition += lineHeight

        // Message content
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')

        // Split long text into multiple lines
        const textLines = pdf.splitTextToSize(message.content, maxLineWidth)

        for (const line of textLines) {
          // Check if we need a new page
          if (yPosition > pageHeight - 20) {
            pdf.addPage()
            yPosition = margin
          }

          pdf.text(line, margin, yPosition)
          yPosition += lineHeight
        }

        yPosition += lineHeight * 0.5 // Add spacing after message
      }

      yPosition += lineHeight // Add spacing after chat
    }

    const pdfOutput = pdf.output('datauristring')

    return {
      content: pdfOutput,
      filename: `chat-export-${timestamp}.pdf`,
      mimeType: 'application/pdf',
      size: pdfOutput.length,
      messageCount,
      chatCount: chats.length,
      processingTime: 0 // Will be set by the main export method
    }
  }

  /**
   * Create a temporary HTML container for PDF generation
   */
  private createPDFContainer(chats: ExportChatData[], options: ExportOptions): HTMLElement {
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '800px'
    container.style.backgroundColor = '#ffffff'
    container.style.padding = '40px'
    container.style.fontFamily = 'Arial, sans-serif'
    container.style.fontSize = '14px'
    container.style.lineHeight = '1.6'
    container.style.color = '#333333'

    const title = options.title || 'Chat Export'
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)

    // Create HTML content
    let html = `
      <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee;">
        <h1 style="font-size: 24px; margin: 0 0 10px 0; color: #333;">${this.escapeHtml(title)}</h1>
        <div style="font-size: 12px; color: #666;">
          <p>Export Time: ${new Date().toLocaleString()}</p>
          <p>Chat Count: ${chats.length}</p>
          <p>Total Messages: ${messageCount}</p>
          ${options.author ? `<p>Author: ${this.escapeHtml(options.author)}</p>` : ''}
        </div>
      </div>
    `

    // Process each chat
    for (const [index, chat] of chats.entries()) {
      html += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="font-size: 18px; margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            ${index + 1}. ${this.escapeHtml(chat.title)}
          </h2>
      `

      if (options.includeTimestamps) {
        html += `
          <div style="font-size: 11px; color: #666; margin-bottom: 15px;">
            Created: ${new Date(chat.createdAt).toLocaleString()} |
            Updated: ${new Date(chat.updatedAt).toLocaleString()} |
            Messages: ${chat.messages.length}
          </div>
        `
      }

      // Process messages
      for (const message of chat.messages) {
        const roleColor =
          message.role === 'user' ? '#2563eb' : message.role === 'assistant' ? '#7c3aed' : '#f59e0b'
        const roleName =
          message.role === 'user' ? 'User' : message.role === 'assistant' ? 'Assistant' : 'System'

        html += `
          <div style="margin-bottom: 15px; padding: 12px; border-left: 3px solid ${roleColor}; background-color: #f9f9f9;">
            <div style="font-weight: bold; margin-bottom: 5px; color: ${roleColor}; display: flex; justify-content: space-between; align-items: center;">
              <span>${roleName}</span>
              ${options.includeTimestamps ? `<span style="font-size: 10px; font-weight: normal; color: #666;">${new Date(message.created_at).toLocaleString()}</span>` : ''}
            </div>
            <div style="white-space: pre-wrap; word-wrap: break-word;">
              ${this.escapeHtml(message.content)}
            </div>
          </div>
        `
      }

      html += '</div>'
    }

    container.innerHTML = html
    return container
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
   * Download PDF file from data URI
   */
  downloadPDF(result: ExportResult): void {
    // Convert data URI to blob
    const arr = result.content.split(',')
    const mimeMatch = arr[0].match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
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
