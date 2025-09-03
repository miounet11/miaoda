// @ts-nocheck
/**
 * Input Validation Utility for IPC Handlers
 * Provides comprehensive validation to prevent injection attacks and ensure data integrity
 */

import { z } from 'zod'

// Common validation schemas
// Allow most Unicode characters including Chinese, emojis, etc.
const SafeString = z.string().min(1).max(10000)
const SafeID = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9\-_]+$/)
const SafeFileName = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[^<>:"|?*\\/]+$/)
const SafeUrl = z.string().url().max(2048)
const SafeNumber = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)

// Chat validation schemas
export const CreateChatSchema = z.object({
  id: SafeID,
  title: SafeString.max(200),
  created_at: z.number().int().positive(),
  updated_at: z.number().int().positive(),
})

export const UpdateChatSchema = z.object({
  id: SafeID,
  title: SafeString.max(200),
  updated_at: z.number().int().positive(),
})

export const MessageSchema = z.object({
  id: SafeID,
  chat_id: SafeID,
  role: z.enum(['user', 'assistant', 'system']),
  content: SafeString,
  created_at: z.number().int().positive(),
  attachments: z
    .array(
      z.object({
        name: SafeFileName,
        type: z.string().max(50),
        url: SafeString.max(1000),
        size: SafeNumber.optional(),
      }),
    )
    .optional(),
})

export const CreateMessageSchema = MessageSchema
export const UpdateMessageSchema = z.object({
  messageId: SafeID,
  content: SafeString,
})

// Search validation schemas
export const SearchQuerySchema = z.object({
  query: SafeString.max(500),
  limit: SafeNumber.max(1000).optional(),
  offset: SafeNumber.optional(),
})

// Plugin validation schemas
export const PluginIdSchema = SafeID
export const ServerNameSchema = SafeID

// MCP tool validation
export const MCPToolCallSchema = z.object({
  toolName: SafeString.max(100).regex(/^[a-zA-Z0-9\-_]+$/),
  args: z.record(z.unknown()).optional(),
})

// LLM validation schemas
export const LLMPromptSchema = SafeString.max(50000)

// File validation schemas
export const FilePathSchema = z
  .string()
  .max(1000)
  .refine(
    path => {
      // Prevent path traversal attacks
      const normalizedPath = path.replace(/\\/g, '/')
      return !normalizedPath.includes('../') && !normalizedPath.includes('..')
    },
    {
      message: 'Path contains invalid characters or path traversal attempts',
    },
  )

/**
 * Input validation decorator for IPC handlers
 */
export function validateInput<T extends z.ZodSchema>(schema: T) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      try {
        // Skip the first argument (event) and validate the rest
        const [event, ...inputArgs] = args

        // For single parameter validation
        if (inputArgs.length === 1) {
          const validatedInput = schema.parse(inputArgs[0])
          return originalMethod.call(this, event, validatedInput)
        }

        // For multiple parameters, create an object and validate
        const inputObject = inputArgs.length > 1 ? inputArgs : inputArgs[0]
        const validatedInput = schema.parse(inputObject)

        if (Array.isArray(validatedInput)) {
          return originalMethod.call(this, event, ...validatedInput)
        } else if (typeof validatedInput === 'object' && validatedInput !== null) {
          return originalMethod.call(this, event, ...Object.values(validatedInput))
        } else {
          return originalMethod.call(this, event, validatedInput)
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const message = `Input validation failed: ${error.errors.map(e => e.message).join(', ')}`
          throw new Error(message)
        }
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .trim()
}

/**
 * Validate and sanitize file paths
 */
export function validateFilePath(filePath: string): string {
  const sanitized = sanitizeString(filePath)

  // Check for path traversal
  if (sanitized.includes('../') || sanitized.includes('..\\')) {
    throw new Error('Path traversal detected')
  }

  // Check for null bytes
  if (sanitized.includes('\0')) {
    throw new Error('Null byte detected in path')
  }

  return sanitized
}

/**
 * Rate limiting for IPC handlers
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(maxRequests: number, windowMs: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const [event] = args
      const clientId = `${event.sender.id}-${propertyKey}`
      const now = Date.now()

      let rateLimitInfo = rateLimitMap.get(clientId)

      if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
        rateLimitInfo = {
          count: 1,
          resetTime: now + windowMs,
        }
      } else {
        rateLimitInfo.count++
      }

      rateLimitMap.set(clientId, rateLimitInfo)

      if (rateLimitInfo.count > maxRequests) {
        throw new Error(`Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs}ms`)
      }

      return originalMethod.call(this, ...args)
    }

    return descriptor
  }
}

/**
 * Security audit logger for sensitive operations
 */
export function auditLog(operation: string, sensitive = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const [event, ...inputArgs] = args
      const timestamp = new Date().toISOString()
      const processId = event.sender.id

      const logData = {
        timestamp,
        operation,
        processId,
        method: propertyKey,
        inputSize: JSON.stringify(inputArgs).length,
        // Don't log sensitive data in production
        ...(sensitive ? {} : { input: inputArgs }),
      }

      console.log(`[AUDIT] ${operation}:`, logData)

      try {
        const result = originalMethod.call(this, ...args)
        console.log(`[AUDIT] ${operation} completed successfully`)
        return result
      } catch (error: unknown) {
        console.error(
          `[AUDIT] ${operation} failed:`,
          error instanceof Error ? error.message : String(error),
        )
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Content Security Policy validator for dynamic content
 */
export function validateContent(content: string): boolean {
  // Block potentially dangerous content
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
  ]

  return !dangerousPatterns.some(pattern => pattern.test(content))
}

/**
 * Comprehensive input validator for mixed content
 */
export class InputValidator {
  static validateChatInput(input: unknown): ReturnType<typeof CreateChatSchema.parse> {
    return CreateChatSchema.parse(input)
  }

  static validateMessageInput(input: unknown): ReturnType<typeof MessageSchema.parse> {
    return MessageSchema.parse(input)
  }

  static validateSearchInput(input: unknown): ReturnType<typeof SearchQuerySchema.parse> {
    return SearchQuerySchema.parse(input)
  }

  static validatePluginId(input: unknown): string {
    return PluginIdSchema.parse(input)
  }

  static validateServerName(input: unknown): string {
    return ServerNameSchema.parse(input)
  }

  static validateMCPToolCall(input: unknown): ReturnType<typeof MCPToolCallSchema.parse> {
    return MCPToolCallSchema.parse(input)
  }

  static validateLLMPrompt(input: unknown): string {
    const prompt = LLMPromptSchema.parse(input)
    if (!validateContent(prompt)) {
      throw new Error('Prompt contains potentially dangerous content')
    }
    return sanitizeString(prompt)
  }

  static validateFilePath(input: unknown): string {
    const path = FilePathSchema.parse(input)
    return validateFilePath(path)
  }
}
