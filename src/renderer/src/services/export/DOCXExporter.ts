import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  UnderlineType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
  TableOfContents,
  SectionType,
  Header,
  Footer
} from 'docx'
import type {
  ExportChatData,
  ExportOptions,
  ExportResult,
  DOCXExportOptions
} from './ExportService'

export class DOCXExporter {
  private static instance: DOCXExporter

  private constructor() {}

  static getInstance(): DOCXExporter {
    if (!DOCXExporter.instance) {
      DOCXExporter.instance = new DOCXExporter()
    }
    return DOCXExporter.instance
  }

  /**
   * Export chats to DOCX format
   */
  async exportToDOCX(chats: ExportChatData[], options: ExportOptions): Promise<ExportResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)
    const docxOptions = options.docxOptions || this.getDefaultDOCXOptions()

    // Create document sections
    const sections = this.createDocumentSections(chats, options, docxOptions)

    // Create document
    const doc = new Document({
      creator: options.author || 'MiaoDa Chat',
      title: options.title || 'Chat Export',
      description: `Export of ${chats.length} chat conversation(s) with ${messageCount} messages`,
      sections: sections,
      styles: this.createDocumentStyles(docxOptions),
      numbering: this.createNumberingConfig()
    })

    try {
      // Generate document buffer
      const buffer = await Packer.toBuffer(doc)

      // Convert to base64 for consistent handling
      const base64String = this.arrayBufferToBase64(buffer)
      const dataUri = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64String}`

      return {
        content: dataUri,
        filename: `chat-export-${timestamp}.docx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.byteLength,
        messageCount,
        chatCount: chats.length,
        processingTime: 0
      }
    } catch (error) {
      throw new Error(`Failed to generate DOCX document: ${error.message}`)
    }
  }

  /**
   * Create document sections
   */
  private createDocumentSections(
    chats: ExportChatData[],
    options: ExportOptions,
    docxOptions: DOCXExportOptions
  ): any[] {
    const sections: any[] = []

    // Create title page section
    const titleSection = {
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: options.title || 'Chat Export',
                  size: 20,
                  color: '666666'
                })
              ],
              alignment: AlignmentType.RIGHT
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Page `,
                  size: 18,
                  color: '666666'
                }),
                new TextRun({
                  children: ['PAGE_NUMBER'],
                  size: 18,
                  color: '666666'
                }),
                new TextRun({
                  text: ` of `,
                  size: 18,
                  color: '666666'
                }),
                new TextRun({
                  children: ['TOTAL_PAGES'],
                  size: 18,
                  color: '666666'
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ]
        })
      },
      children: this.createTitlePageContent(chats, options, docxOptions)
    }

    sections.push(titleSection)

    // Add table of contents if requested
    if (docxOptions.includeTableOfContents) {
      sections.push({
        properties: {
          type: SectionType.NEXT_PAGE
        },
        children: [
          new Paragraph({
            text: 'Table of Contents',
            heading: HeadingLevel.HEADING_1
          }),
          new TableOfContents('Table of Contents', {
            hyperlink: true,
            headingStyleRange: '1-3'
          })
        ]
      })
    }

    // Process each chat
    for (const [index, chat] of chats.entries()) {
      const chatSection = this.createChatSection(chat, index, options, docxOptions)

      if (docxOptions.pageBreakBetweenChats && index > 0) {
        chatSection.properties = {
          type: SectionType.NEXT_PAGE
        }
      }

      sections.push(chatSection)
    }

    return sections
  }

  /**
   * Create title page content
   */
  private createTitlePageContent(
    chats: ExportChatData[],
    options: ExportOptions,
    docxOptions: DOCXExportOptions
  ): any[] {
    const content: any[] = []
    const messageCount = chats.reduce((sum, chat) => sum + chat.messages.length, 0)

    // Title
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: options.title || 'Chat Export',
            bold: true,
            size: 48,
            color: '2F5233'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      })
    )

    // Subtitle
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'AI Conversation Archive',
            italic: true,
            size: 24,
            color: '666666'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 1200 }
      })
    )

    // Export info table
    const infoTable = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: 'Export Date:', alignment: AlignmentType.RIGHT })],
              width: { size: 30, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph(new Date().toLocaleString())],
              width: { size: 70, type: WidthType.PERCENTAGE }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ text: 'Total Conversations:', alignment: AlignmentType.RIGHT })
              ]
            }),
            new TableCell({
              children: [new Paragraph(chats.length.toString())]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: 'Total Messages:', alignment: AlignmentType.RIGHT })]
            }),
            new TableCell({
              children: [new Paragraph(messageCount.toString())]
            })
          ]
        })
      ]
    })

    if (options.author) {
      infoTable.root[0].push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: 'Author:', alignment: AlignmentType.RIGHT })]
            }),
            new TableCell({
              children: [new Paragraph(options.author)]
            })
          ]
        })
      )
    }

    content.push(infoTable)
    content.push(new Paragraph({ text: '', spacing: { after: 1200 } }))

    return content
  }

  /**
   * Create section for individual chat
   */
  private createChatSection(
    chat: ExportChatData,
    index: number,
    options: ExportOptions,
    docxOptions: DOCXExportOptions
  ): any {
    const children: any[] = []

    // Chat title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${chat.title}`,
            bold: true,
            size: 32,
            color: '2F5233'
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 240 }
      })
    )

    // Chat metadata
    if (options.includeTimestamps || options.includeMetadata) {
      const metadataChildren: TextRun[] = []

      if (options.includeTimestamps) {
        metadataChildren.push(
          new TextRun({
            text: `Created: ${new Date(chat.createdAt).toLocaleString()}  `,
            italic: true,
            size: 18,
            color: '666666'
          }),
          new TextRun({
            text: `Updated: ${new Date(chat.updatedAt).toLocaleString()}  `,
            italic: true,
            size: 18,
            color: '666666'
          })
        )
      }

      metadataChildren.push(
        new TextRun({
          text: `Messages: ${chat.messages.length}`,
          italic: true,
          size: 18,
          color: '666666'
        })
      )

      children.push(
        new Paragraph({
          children: metadataChildren,
          spacing: { after: 360 }
        })
      )
    }

    // Process messages
    for (const [messageIndex, message] of chat.messages.entries()) {
      // Skip system messages if not included
      if (!options.includeSystemMessages && message.role === 'system') {
        continue
      }

      children.push(...this.createMessageParagraphs(message, messageIndex, options, docxOptions))
    }

    return {
      children: children
    }
  }

  /**
   * Create paragraphs for a message
   */
  private createMessageParagraphs(
    message: any,
    messageIndex: number,
    options: ExportOptions,
    docxOptions: DOCXExportOptions
  ): any[] {
    const paragraphs: any[] = []

    // Message header
    const roleColor =
      message.role === 'user' ? '2563eb' : message.role === 'assistant' ? '7c3aed' : 'f59e0b'
    const roleIcon =
      message.role === 'user' ? '[User]' : message.role === 'assistant' ? '[Assistant]' : '[System]'

    const headerChildren: TextRun[] = [
      new TextRun({
        text: roleIcon,
        bold: true,
        color: roleColor,
        size: 22
      })
    ]

    if (options.includeTimestamps) {
      headerChildren.push(
        new TextRun({
          text: `  ${new Date(message.created_at).toLocaleString()}`,
          italic: true,
          size: 18,
          color: '666666'
        })
      )
    }

    paragraphs.push(
      new Paragraph({
        children: headerChildren,
        spacing: { before: 240, after: 120 }
      })
    )

    // Message content
    const content = message.content || ''
    const contentParagraphs = content.split(/\n\s*\n/).filter(p => p.trim())

    for (const [pIndex, paragraph] of contentParagraphs.entries()) {
      const lines = paragraph.split('\n')

      for (const [lIndex, line] of lines.entries()) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        // Check if line contains code (simplified detection)
        const isCode =
          trimmedLine.startsWith('```') ||
          trimmedLine.includes('`') ||
          /^[\s]*[{}\[\]();]/.test(trimmedLine)

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                font: isCode ? 'Consolas' : docxOptions.fontFamily,
                size: isCode ? docxOptions.fontSize - 2 : docxOptions.fontSize,
                color: isCode ? '333333' : '000000'
              })
            ],
            spacing: {
              before: lIndex === 0 && pIndex === 0 ? 0 : 120,
              after: 60
            },
            indent: isCode ? { left: 360 } : undefined
          })
        )
      }
    }

    // Add spacing after message
    paragraphs.push(
      new Paragraph({
        text: '',
        spacing: { after: 360 }
      })
    )

    return paragraphs
  }

  /**
   * Create document styles
   */
  private createDocumentStyles(docxOptions: DOCXExportOptions): any {
    return {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: docxOptions.fontFamily,
            size: docxOptions.fontSize
          },
          paragraph: {
            spacing: {
              line: 276,
              lineRule: 'auto'
            }
          }
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: docxOptions.fontFamily,
            size: docxOptions.fontSize + 8,
            bold: true,
            color: '2F5233'
          },
          paragraph: {
            spacing: {
              before: 480,
              after: 240
            }
          }
        }
      ]
    }
  }

  /**
   * Create numbering configuration
   */
  private createNumberingConfig(): any {
    return {
      config: [
        {
          reference: 'my-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 260 }
                }
              }
            }
          ]
        }
      ]
    }
  }

  /**
   * Get default DOCX options
   */
  private getDefaultDOCXOptions(): DOCXExportOptions {
    return {
      template: 'default',
      fontSize: 22,
      fontFamily: 'Calibri',
      includeTableOfContents: true,
      pageBreakBetweenChats: true,
      customStyles: {}
    }
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
   * Download DOCX file
   */
  downloadFile(result: ExportResult): void {
    // Handle DOCX files (base64 data URI)
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
