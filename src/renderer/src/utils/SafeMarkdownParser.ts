// @ts-nocheck
/**
 * SafeMarkdownParser - A bulletproof markdown parser that handles all edge cases
 * and prevents the "TypeError: value.replace is not a function" error
 */

import { marked } from 'marked'

interface MarkdownResult {
  success: boolean
  content: string
  error?: string
}

/**
 * Ultra-safe content sanitization that handles ANY input type
 */
function ultraSafeContentSanitization(input: any): string {
  try {
    // Handle primitives
    if (input === null || input === undefined) {
      return ''
    }

    if (typeof input === 'string') {
      return input.trim()
    }

    if (typeof input === 'number' || typeof input === 'boolean') {
      return String(input)
    }

    // Handle arrays
    if (Array.isArray(input)) {
      return input
        .filter(item => item !== null && item !== undefined)
        .map(item => ultraSafeContentSanitization(item))
        .join('\n')
        .trim()
    }

    // Handle objects
    if (typeof input === 'object' && input !== null) {
      // Check for common object types that might have meaningful string representations
      if (typeof input.toString === 'function' && input.toString !== Object.prototype.toString) {
        const stringResult = input.toString()
        if (typeof stringResult === 'string' && stringResult !== '[object Object]') {
          return stringResult.trim()
        }
      }

      // Try JSON stringify for complex objects
      try {
        return JSON.stringify(input, null, 2).trim()
      } catch {
        return '[Complex Object - Cannot Display]'
      }
    }

    // Final fallback - force string conversion
    return String(input || '').trim()
  } catch (error) {
    console.error('Content sanitization failed completely:', error)
    return String(input || '[Error: Cannot Process Content]').trim()
  }
}

/**
 * Bulletproof markdown parser with multiple fallback strategies
 */
export function parseMarkdownSafely(input: any): MarkdownResult {
  try {
    // Step 1: Ultra-safe content sanitization
    const sanitizedContent = ultraSafeContentSanitization(input)

    // Early return for empty content
    if (!sanitizedContent) {
      return { success: true, content: '' }
    }

    // Step 2: Pre-process content for marked.js compatibility
    let processedContent = sanitizedContent
      .replace(/\r\n/g, '\n') // Normalize Windows line endings
      .replace(/\r/g, '\n') // Normalize old Mac line endings
      .replace(/\u0000/g, '') // Remove null characters
      .trim()

    // Final validation before marked processing
    if (!processedContent || typeof processedContent !== 'string') {
      return { success: true, content: escapeHtml(sanitizedContent) }
    }

    // Step 3: Try marked.js parsing with comprehensive error handling
    try {
      // Ensure marked is available and properly configured
      if (typeof marked === 'undefined') {
        throw new Error('Marked library is not available')
      }

      if (typeof marked.parse !== 'function') {
        throw new Error('Marked.parse is not a function')
      }

      // Additional safety: clone the content to prevent mutations
      const contentClone = String(processedContent)

      // Parse with marked
      const result = marked.parse(contentClone)

      // Validate the result
      if (typeof result !== 'string') {
        throw new Error(`Marked returned non-string result: ${typeof result}`)
      }

      return { success: true, content: result }
    } catch (markedError) {
      const errorMessage = String(markedError)

      // Handle the specific "value.replace is not a function" error
      if (errorMessage.includes('value.replace is not a function')) {
        console.error('Detected value.replace error - implementing emergency fallback:', {
          originalInput: input,
          sanitizedContent,
          processedContent,
          contentType: typeof processedContent,
          error: markedError
        })

        // Emergency fallback: return as escaped HTML
        return {
          success: false,
          content: escapeHtml(processedContent),
          error: 'Markdown parsing failed: ' + errorMessage
        }
      }

      // For other marked.js errors, try a simple fallback
      console.warn('Marked.js parsing failed, using fallback:', markedError)
      return {
        success: false,
        content: escapeHtml(processedContent),
        error: 'Markdown parsing failed: ' + errorMessage
      }
    }
  } catch (criticalError) {
    // Ultimate fallback for any unexpected errors
    console.error('Critical markdown parsing error:', criticalError)
    const emergencyContent = String(input || '[Critical Error: Cannot Process Content]')

    return {
      success: false,
      content: escapeHtml(emergencyContent),
      error: 'Critical parsing error: ' + String(criticalError)
    }
  }
}

/**
 * Simple and safe HTML escaping
 */
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    unsafe = String(unsafe)
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Create enhanced error display with working expansion
 */
export function createErrorDisplay(error: string, originalContent: any): string {
  const safeOriginalContent = ultraSafeContentSanitization(originalContent)
  const errorId = 'error-' + Math.random().toString(36).substr(2, 9)

  return `<div class="markdown-error-container p-4 bg-subtle border border-strong rounded-lg" style="contain: layout;">
    <div class="flex items-start gap-2 mb-2">
      <svg class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>
      <div class="flex-1">
        <p class="text-primary font-medium text-sm">Markdown 渲染错误</p>
        <p class="text-xs text-secondary mt-1">TypeError: value.replace is not a function</p>
        <p class="text-xs text-muted mt-1">Please report this to https://github.com/markedjs/marked.</p>
      </div>
    </div>
    <details class="mt-3 cursor-pointer group" style="contain: layout;" id="${errorId}">
      <summary class="text-sm text-secondary hover:text-primary transition-colors cursor-pointer select-none font-medium outline-none focus:ring-2 focus:ring-mono-black focus:ring-opacity-50 rounded px-1 py-0.5 hover:bg-subtle inline-flex items-center gap-1">
        <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
        </svg>
        显示原始内容
      </summary>
      <div class="mt-2 p-3 bg-muted rounded border border-default" style="contain: layout;">
        <pre class="text-xs text-muted overflow-auto max-h-40 whitespace-pre-wrap select-text break-all font-mono leading-relaxed">${escapeHtml(safeOriginalContent)}</pre>
      </div>
    </details>
  </div>`
}

/**
 * Main export function that combines parsing and error handling
 */
export function renderMarkdownSafely(input: any): string {
  const result = parseMarkdownSafely(input)

  if (result.success) {
    return result.content
  } else {
    return createErrorDisplay(result.error || 'Unknown error', input)
  }
}
