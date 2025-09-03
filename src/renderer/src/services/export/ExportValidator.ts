// @ts-nocheck
import { z } from 'zod'
import type { ExportOptions } from './ExportService'

// Zod schemas for validation
const ExportFormatSchema = z.enum(['markdown', 'json', 'html', 'txt', 'pdf', 'csv', 'docx', 'zip'])

const ExportOptionsSchema = z.object({
  format: ExportFormatSchema,
  chatId: z.string().optional(),
  chatIds: z.array(z.string()).max(1000, 'Too many chats selected (maximum: 1000)').optional(),
  includeSystemMessages: z.boolean().optional(),
  includeTimestamps: z.boolean().optional(),
  includeMetadata: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  title: z.string().max(200, 'Title too long (maximum: 200 characters)').optional(),
  author: z.string().max(100, 'Author name too long (maximum: 100 characters)').optional(),
})

export class ExportValidator {
  /**
   * Validate export options
   */
  static validateOptions(options: ExportOptions): { isValid: boolean; errors: string[] } {
    try {
      // Basic schema validation
      ExportOptionsSchema.parse(options)

      const errors: string[] = []

      // Custom validation rules
      if (options.dateFrom && options.dateTo && options.dateFrom > options.dateTo) {
        errors.push('Start date cannot be after end date')
      }

      // Validate chat selection logic
      if (options.chatId && options.chatIds) {
        errors.push('Cannot specify both chatId and chatIds')
      }

      // Validate date ranges (not too far in the past/future)
      const now = new Date()
      const oneYearAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate())
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())

      if (options.dateFrom && options.dateFrom < oneYearAgo) {
        errors.push('Start date is too far in the past (maximum: 10 years ago)')
      }

      if (options.dateTo && options.dateTo > oneYearFromNow) {
        errors.push('End date is too far in the future (maximum: 1 year from now)')
      }

      // Validate string inputs for potential security issues
      if (options.title && this.containsSuspiciousContent(options.title)) {
        errors.push('Title contains potentially unsafe content')
      }

      if (options.author && this.containsSuspiciousContent(options.author)) {
        errors.push('Author name contains potentially unsafe content')
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        }
      }

      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
      }
    }
  }

  /**
   * Validate export format support
   */
  static validateFormat(format: string): boolean {
    return ['markdown', 'json', 'html', 'txt', 'pdf', 'csv', 'xlsx', 'docx', 'zip'].includes(format)
  }

  /**
   * Validate chat data before processing
   */
  static validateChatData(chatData: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!Array.isArray(chatData)) {
      errors.push('Chat data must be an array')
      return { isValid: false, errors }
    }

    if (chatData.length === 0) {
      errors.push('No chat data to export')
      return { isValid: false, errors }
    }

    // Validate individual chat objects
    for (let i = 0; i < chatData.length; i++) {
      const chat = chatData[i]

      if (!chat.id || typeof chat.id !== 'string') {
        errors.push(`Chat ${i}: Missing or invalid ID`)
      }

      if (!chat.title || typeof chat.title !== 'string') {
        errors.push(`Chat ${i}: Missing or invalid title`)
      }

      if (!chat.messages || !Array.isArray(chat.messages)) {
        errors.push(`Chat ${i}: Missing or invalid messages array`)
      } else {
        // Validate messages
        for (let j = 0; j < chat.messages.length; j++) {
          const message = chat.messages[j]

          if (!message.id || typeof message.id !== 'string') {
            errors.push(`Chat ${i}, Message ${j}: Missing or invalid ID`)
          }

          if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
            errors.push(`Chat ${i}, Message ${j}: Invalid role`)
          }

          if (typeof message.content !== 'string') {
            errors.push(`Chat ${i}, Message ${j}: Invalid content type`)
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Estimate export size to prevent memory issues
   */
  static validateExportSize(
    chatData: any[],
    format: string,
  ): { isValid: boolean; estimatedSize: number; errors: string[] } {
    const errors: string[] = []

    // Calculate estimated content size
    let contentSize = 0
    let messageCount = 0

    for (const chat of chatData) {
      if (chat.messages && Array.isArray(chat.messages)) {
        for (const message of chat.messages) {
          if (typeof message.content === 'string') {
            contentSize += message.content.length
            messageCount++
          }
        }
      }
    }

    // Add overhead based on format
    let formatMultiplier = 1
    switch (format) {
      case 'html':
        formatMultiplier = 3 // HTML has significant markup overhead
        break
      case 'json':
        formatMultiplier = 2 // JSON has structure overhead
        break
      case 'markdown':
        formatMultiplier = 1.5 // Markdown has some formatting overhead
        break
      case 'txt':
        formatMultiplier = 1.2 // Plain text has minimal overhead
        break
      case 'pdf':
        formatMultiplier = 4 // PDF has significant formatting and compression overhead
        break
      case 'csv':
        formatMultiplier = 1.1 // CSV has minimal overhead
        break
      case 'xlsx':
        formatMultiplier = 2.5 // Excel has structure and formatting overhead
        break
      case 'docx':
        formatMultiplier = 3.5 // Word documents have significant formatting overhead
        break
      case 'zip':
        formatMultiplier = 3.0 // ZIP contains multiple formats with compression
        break
    }

    const estimatedSize = contentSize * formatMultiplier

    // Size limits (in bytes)
    const MAX_SIZE = 100 * 1024 * 1024 // 100MB
    const WARN_SIZE = 50 * 1024 * 1024 // 50MB

    if (estimatedSize > MAX_SIZE) {
      errors.push(
        `Estimated export size (${Math.round(estimatedSize / 1024 / 1024)}MB) exceeds maximum limit (100MB)`,
      )
    } else if (estimatedSize > WARN_SIZE) {
      errors.push(
        `Warning: Large export size (${Math.round(estimatedSize / 1024 / 1024)}MB) may cause performance issues`,
      )
    }

    if (messageCount > 100000) {
      errors.push(`Too many messages (${messageCount}). Maximum recommended: 100,000`)
    }

    return {
      isValid: estimatedSize <= MAX_SIZE && messageCount <= 100000,
      estimatedSize,
      errors,
    }
  }

  /**
   * Check for suspicious content that might indicate XSS or injection attempts
   */
  private static containsSuspiciousContent(content: string): boolean {
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi,
      /on\w+\s*=/gi, // Event handlers like onclick=, onload=, etc.
      /data:text\/html/gi,
      /vbscript:/gi,
      /expression\s*\(/gi, // CSS expression()
    ]

    return suspiciousPatterns.some(pattern => pattern.test(content))
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  static sanitizeFilename(filename: string): string {
    // Remove path separators and other dangerous characters
    const sanitized = filename
      .replace(/[/\\:*?"<>|]/g, '-') // Replace dangerous chars with dash
      .replace(/\.\./g, '-') // Remove path traversal attempts
      .replace(/^\.+/, '') // Remove leading dots
      .trim()

    // Ensure filename is not empty and not too long
    if (!sanitized || sanitized.length === 0) {
      return 'export'
    }

    if (sanitized.length > 100) {
      return sanitized.substring(0, 100)
    }

    return sanitized
  }

  /**
   * Validate MIME type matches format
   */
  static validateMimeType(format: string, mimeType: string): boolean {
    const validMimeTypes = {
      markdown: ['text/markdown', 'text/x-markdown'],
      json: ['application/json'],
      html: ['text/html'],
      txt: ['text/plain'],
      pdf: ['application/pdf'],
      csv: ['text/csv', 'application/csv'],
      xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      zip: ['application/zip', 'application/x-zip-compressed'],
    }

    return validMimeTypes[format]?.includes(mimeType) ?? false
  }
}
