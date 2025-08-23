/**
 * Centralized Markdown Service with Bulletproof Error Handling
 *
 * This service provides a single, reliable interface for all markdown processing
 * in the application, preventing the "TypeError: value.replace is not a function"
 * error through comprehensive input validation and multiple fallback strategies.
 */

import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import { logger } from '../utils/Logger'

// Types for better TypeScript support
export interface MarkdownOptions {
  enableHighlight?: boolean
  enableMath?: boolean
  enableMermaid?: boolean
  sanitize?: boolean
  breaks?: boolean
  gfm?: boolean
  smartypants?: boolean
}

export interface ParseResult {
  html: string
  error?: string
  fallbackUsed: boolean
  processingTime: number
}

/**
 * Enhanced content sanitization with comprehensive type checking
 */
function sanitizeMarkdownInput(rawContent: any): string {
  try {
    // Handle null, undefined, or empty values
    if (rawContent === null || rawContent === undefined) {
      return ''
    }

    // Handle string content (most common case)
    if (typeof rawContent === 'string') {
      return rawContent.trim()
    }

    // Handle numbers and booleans
    if (typeof rawContent === 'number' || typeof rawContent === 'boolean') {
      return String(rawContent)
    }

    // Handle arrays
    if (Array.isArray(rawContent)) {
      return rawContent
        .filter(item => item !== null && item !== undefined)
        .map(item => {
          if (typeof item === 'string') return item
          if (typeof item === 'number' || typeof item === 'boolean') return String(item)
          return '[Object]'
        })
        .join('\n')
        .trim()
    }

    // Handle objects with toString method
    if (typeof rawContent === 'object' && rawContent !== null) {
      // Check for custom toString
      if (
        typeof rawContent.toString === 'function' &&
        rawContent.toString !== Object.prototype.toString
      ) {
        const toStringResult = rawContent.toString()
        return typeof toStringResult === 'string' ? toStringResult.trim() : '[Object]'
      }

      // Try JSON stringify
      try {
        return JSON.stringify(rawContent, null, 2).trim()
      } catch {
        return '[Complex Object - Cannot Serialize]'
      }
    }

    // Final fallback - force string conversion
    return String(rawContent || '').trim()
  } catch (error) {
    logger.error('Content sanitization failed', 'MarkdownService', {
      error: error instanceof Error ? error.message : String(error),
      contentType: typeof rawContent,
      contentConstructor: rawContent?.constructor?.name
    })

    // Emergency fallback
    try {
      return String(rawContent || '').trim()
    } catch {
      return '[Content Error - Cannot Process]'
    }
  }
}

/**
 * Advanced input validation for marked.js
 */
function validateMarkdownInput(content: string): {
  valid: boolean
  sanitized: string
  error?: string
} {
  try {
    // Check if content is actually a string
    if (typeof content !== 'string') {
      return {
        valid: false,
        sanitized: '',
        error: `Expected string, got ${typeof content}`
      }
    }

    // Check for empty content
    if (!content || content.trim().length === 0) {
      return {
        valid: true,
        sanitized: ''
      }
    }

    // Normalize line endings and remove potentially problematic characters
    const normalized = content
      .replace(/\r\n/g, '\n') // Windows to Unix
      .replace(/\r/g, '\n') // Old Mac to Unix
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/\uFFFD/g, '') // Remove replacement characters
      .trim()

    // Additional validation - check for extremely long content
    if (normalized.length > 1000000) {
      // 1MB limit
      return {
        valid: false,
        sanitized: normalized.substring(0, 1000000) + '\n\n[Content truncated - too large]',
        error: 'Content too large, truncated'
      }
    }

    return {
      valid: true,
      sanitized: normalized
    }
  } catch (error) {
    return {
      valid: false,
      sanitized: '',
      error: `Validation error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Safe HTML escaping with comprehensive error handling
 */
function safeHtmlEscape(unsafe: any): string {
  try {
    if (unsafe === null || unsafe === undefined) {
      return ''
    }

    const safeString = String(unsafe)

    return safeString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>')
  } catch (error) {
    logger.error('HTML escaping failed', 'MarkdownService', { error, unsafe })
    return '[Content could not be escaped safely]'
  }
}

/**
 * Create an isolated marked instance to prevent global conflicts
 */
function createIsolatedMarkedInstance(options: MarkdownOptions = {}): typeof marked {
  try {
    // Create a fresh marked instance
    const markedInstance = new marked.Marked()

    // Configure syntax highlighting if enabled
    if (options.enableHighlight !== false) {
      try {
        markedInstance.use(
          markedHighlight({
            langPrefix: 'hljs language-',
            highlight(code: string, language: string): string {
              try {
                // Validate inputs to highlight function
                if (typeof code !== 'string') {
                  logger.warn('Non-string code passed to highlighter', 'MarkdownService', {
                    codeType: typeof code
                  })
                  return String(code || '')
                }

                if (typeof language !== 'string') {
                  language = 'plaintext'
                }

                const validLanguage = hljs.getLanguage(language) ? language : 'plaintext'
                return hljs.highlight(code, { language: validLanguage }).value
              } catch (highlightError) {
                logger.warn('Syntax highlighting failed', 'MarkdownService', {
                  error:
                    highlightError instanceof Error
                      ? highlightError.message
                      : String(highlightError),
                  language
                })
                return safeHtmlEscape(code)
              }
            }
          })
        )
      } catch (highlightSetupError) {
        logger.error('Failed to setup syntax highlighting', 'MarkdownService', {
          error: highlightSetupError
        })
        // Continue without highlighting
      }
    }

    // Create enhanced renderer with bulletproof error handling
    const renderer = new marked.Renderer()

    // Override renderer methods with input validation
    const originalCode = renderer.code.bind(renderer)
    renderer.code = function (code: string, language?: string, escaped?: boolean): string {
      try {
        // Validate inputs
        if (typeof code !== 'string') {
          logger.warn('Non-string code in renderer', 'MarkdownService', { codeType: typeof code })
          code = String(code || '')
        }

        if (language !== undefined && typeof language !== 'string') {
          logger.warn('Non-string language in renderer', 'MarkdownService', {
            languageType: typeof language
          })
          language = String(language || 'plaintext')
        }

        return originalCode.call(this, code, language, escaped)
      } catch (error) {
        logger.error('Code renderer failed', 'MarkdownService', { error })
        return `<pre><code>${safeHtmlEscape(code)}</code></pre>`
      }
    }

    const originalCodespan = renderer.codespan.bind(renderer)
    renderer.codespan = function (code: string): string {
      try {
        if (typeof code !== 'string') {
          logger.warn('Non-string codespan in renderer', 'MarkdownService', {
            codeType: typeof code
          })
          code = String(code || '')
        }

        return originalCodespan.call(this, code)
      } catch (error) {
        logger.error('Codespan renderer failed', 'MarkdownService', { error })
        return `<code>${safeHtmlEscape(code)}</code>`
      }
    }

    const originalText = renderer.text.bind(renderer)
    renderer.text = function (text: string): string {
      try {
        if (typeof text !== 'string') {
          logger.warn('Non-string text in renderer', 'MarkdownService', { textType: typeof text })
          text = String(text || '')
        }

        return originalText.call(this, text)
      } catch (error) {
        logger.error('Text renderer failed', 'MarkdownService', { error })
        return safeHtmlEscape(text)
      }
    }

    // Configure the marked instance
    markedInstance.setOptions({
      renderer,
      gfm: options.gfm !== false,
      breaks: options.breaks !== false,
      pedantic: false,
      sanitize: false, // We handle sanitization ourselves
      smartLists: true,
      smartypants: options.smartypants !== false,
      xhtml: false
    })

    return markedInstance as any
  } catch (error) {
    logger.error('Failed to create isolated marked instance', 'MarkdownService', { error })
    // Return a basic fallback
    return marked
  }
}

/**
 * Central markdown service class
 */
class MarkdownService {
  private instances: Map<string, typeof marked> = new Map()
  private defaultOptions: MarkdownOptions = {
    enableHighlight: true,
    enableMath: false,
    enableMermaid: false,
    sanitize: true,
    breaks: true,
    gfm: true,
    smartypants: true
  }

  /**
   * Get or create a marked instance with specific options
   */
  private getMarkedInstance(options: MarkdownOptions = {}): typeof marked {
    const optionsKey = JSON.stringify({ ...this.defaultOptions, ...options })

    if (!this.instances.has(optionsKey)) {
      this.instances.set(
        optionsKey,
        createIsolatedMarkedInstance({ ...this.defaultOptions, ...options })
      )
    }

    return this.instances.get(optionsKey)!
  }

  /**
   * Parse markdown with comprehensive error handling and fallbacks
   */
  parse(rawContent: any, options: MarkdownOptions = {}): ParseResult {
    const startTime = performance.now()

    try {
      // Step 1: Sanitize input
      const sanitizedContent = sanitizeMarkdownInput(rawContent)

      // Step 2: Validate content
      const validation = validateMarkdownInput(sanitizedContent)

      if (!validation.valid) {
        logger.warn('Invalid markdown input', 'MarkdownService', {
          error: validation.error,
          contentPreview: String(rawContent).substring(0, 100)
        })

        return {
          html: safeHtmlEscape(validation.sanitized || sanitizedContent),
          error: validation.error,
          fallbackUsed: true,
          processingTime: performance.now() - startTime
        }
      }

      // Early return for empty content
      if (!validation.sanitized) {
        return {
          html: '',
          fallbackUsed: false,
          processingTime: performance.now() - startTime
        }
      }

      // Step 3: Get appropriate marked instance
      const markedInstance = this.getMarkedInstance(options)

      // Step 4: Parse with error handling
      try {
        let result: any

        // Use parse method with additional safety
        if (typeof markedInstance.parse === 'function') {
          result = markedInstance.parse(validation.sanitized)
        } else {
          throw new Error('Marked instance does not have parse method')
        }

        // Validate result
        if (typeof result !== 'string') {
          throw new Error(`Marked returned ${typeof result} instead of string`)
        }

        return {
          html: result,
          fallbackUsed: false,
          processingTime: performance.now() - startTime
        }
      } catch (parseError) {
        logger.error('Marked parsing failed', 'MarkdownService', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          contentLength: validation.sanitized.length,
          contentStart: validation.sanitized.substring(0, 100)
        })

        // Fallback to safe HTML escape
        return {
          html: safeHtmlEscape(validation.sanitized),
          error: `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          fallbackUsed: true,
          processingTime: performance.now() - startTime
        }
      }
    } catch (error) {
      logger.error('Critical markdown service error', 'MarkdownService', {
        error: error instanceof Error ? error.message : String(error),
        contentType: typeof rawContent
      })

      // Emergency fallback
      const emergencyContent = String(rawContent || 'Content processing failed')
      return {
        html: safeHtmlEscape(emergencyContent),
        error: `Service error: ${error instanceof Error ? error.message : String(error)}`,
        fallbackUsed: true,
        processingTime: performance.now() - startTime
      }
    }
  }

  /**
   * Parse with error display for UI components
   */
  parseWithErrorDisplay(rawContent: any, options: MarkdownOptions = {}): string {
    const result = this.parse(rawContent, options)

    if (result.error) {
      const originalContent = String(rawContent || 'Failed to process content')

      return `<div class="error-content p-4 bg-subtle border border-strong rounded-lg">
        <p class="text-primary font-medium">⚠️ Markdown 渲染错误</p>
        <p class="text-sm text-secondary mt-1">${safeHtmlEscape(result.error)}</p>
        <details class="mt-2 cursor-pointer group">
          <summary class="text-sm text-secondary hover:text-primary transition-colors cursor-pointer select-none group-hover:underline">
            显示原始内容 (Click to expand)
          </summary>
          <pre class="text-xs text-muted mt-2 p-2 bg-muted rounded border overflow-auto max-h-40 whitespace-pre-wrap select-text break-all">${safeHtmlEscape(originalContent)}</pre>
        </details>
      </div>`
    }

    return result.html
  }

  /**
   * Clear all cached instances (useful for testing)
   */
  clearCache(): void {
    this.instances.clear()
  }

  /**
   * Get service statistics
   */
  getStats(): { instanceCount: number; defaultOptions: MarkdownOptions } {
    return {
      instanceCount: this.instances.size,
      defaultOptions: { ...this.defaultOptions }
    }
  }
}

// Export singleton instance
export const markdownService = new MarkdownService()

// Export additional utilities
export { sanitizeMarkdownInput, validateMarkdownInput, safeHtmlEscape }
export type { MarkdownOptions, ParseResult }
