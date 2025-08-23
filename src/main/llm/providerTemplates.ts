import { CustomProviderConfig } from './provider'

/**
 * Provider configuration templates for common services
 * Generated with MCP Integration Agent assistance
 */

export interface ProviderTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'cloud' | 'enterprise' | 'local' | 'custom'
  config: Partial<Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>>
  documentation?: string
  supportedFeatures: {
    streaming: boolean
    toolCalling: boolean
    multimodal: boolean
  }
}

/**
 * Pre-defined templates for popular AI services
 */
export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  {
    id: 'azure-openai',
    name: 'Azure OpenAI Service',
    description: 'Microsoft Azure OpenAI Service with enterprise features',
    icon: '🔷',
    category: 'enterprise',
    config: {
      name: 'azure-openai',
      displayName: 'Azure OpenAI',
      baseURL: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment',
      model: 'gpt-4',
      type: 'openai-compatible',
      headers: {
        'api-version': '2024-02-15-preview'
      },
      parameters: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1.0
      }
    },
    documentation: 'https://docs.microsoft.com/en-us/azure/cognitive-services/openai/',
    supportedFeatures: {
      streaming: true,
      toolCalling: true,
      multimodal: true
    }
  },
  {
    id: 'huggingface-endpoints',
    name: 'Hugging Face Inference Endpoints',
    description: 'Hugging Face hosted model endpoints',
    icon: '🤗',
    category: 'cloud',
    config: {
      name: 'huggingface',
      displayName: 'Hugging Face',
      baseURL: 'https://api-inference.huggingface.co/models',
      model: 'microsoft/DialoGPT-medium',
      type: 'openai-compatible',
      headers: {
        'Content-Type': 'application/json'
      },
      parameters: {
        temperature: 0.9,
        maxTokens: 1024
      }
    },
    documentation: 'https://huggingface.co/docs/api-inference/',
    supportedFeatures: {
      streaming: false,
      toolCalling: false,
      multimodal: false
    }
  },
  {
    id: 'cohere-command',
    name: 'Cohere Command',
    description: 'Cohere Command models for text generation',
    icon: '🎯',
    category: 'cloud',
    config: {
      name: 'cohere',
      displayName: 'Cohere Command',
      baseURL: 'https://api.cohere.ai/v1',
      model: 'command',
      type: 'openai-compatible',
      parameters: {
        temperature: 0.9,
        maxTokens: 4000
      }
    },
    documentation: 'https://docs.cohere.com/reference/generate',
    supportedFeatures: {
      streaming: true,
      toolCalling: false,
      multimodal: false
    }
  },
  {
    id: 'aws-bedrock',
    name: 'AWS Bedrock',
    description: 'Amazon Bedrock foundation models',
    icon: '🏗️',
    category: 'enterprise',
    config: {
      name: 'aws-bedrock',
      displayName: 'AWS Bedrock',
      baseURL: 'https://bedrock-runtime.us-east-1.amazonaws.com',
      model: 'anthropic.claude-v2',
      type: 'custom',
      headers: {
        'Content-Type': 'application/json'
      },
      parameters: {
        temperature: 0.7,
        maxTokens: 4096
      }
    },
    documentation: 'https://docs.aws.amazon.com/bedrock/',
    supportedFeatures: {
      streaming: true,
      toolCalling: false,
      multimodal: true
    }
  },
  {
    id: 'local-llama',
    name: 'Local LLaMA Server',
    description: 'Self-hosted LLaMA model server',
    icon: '🦙',
    category: 'local',
    config: {
      name: 'local-llama',
      displayName: 'Local LLaMA',
      baseURL: 'http://localhost:8080/v1',
      model: 'llama-2-7b-chat',
      type: 'openai-compatible',
      parameters: {
        temperature: 0.8,
        maxTokens: 2048,
        topP: 0.95
      }
    },
    documentation: 'https://github.com/ggerganov/llama.cpp',
    supportedFeatures: {
      streaming: true,
      toolCalling: false,
      multimodal: false
    }
  },
  {
    id: 'text-generation-webui',
    name: 'Text Generation WebUI',
    description: 'oobabooga text-generation-webui API',
    icon: '🌐',
    category: 'local',
    config: {
      name: 'textgen-webui',
      displayName: 'Text Generation WebUI',
      baseURL: 'http://localhost:5000/v1',
      model: 'model-name',
      type: 'openai-compatible',
      parameters: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      }
    },
    documentation: 'https://github.com/oobabooga/text-generation-webui',
    supportedFeatures: {
      streaming: true,
      toolCalling: false,
      multimodal: false
    }
  },
  {
    id: 'llamacpp-server',
    name: 'llama.cpp Server',
    description: 'llama.cpp HTTP server for local inference',
    icon: '🔧',
    category: 'local',
    config: {
      name: 'llamacpp-server',
      displayName: 'llama.cpp Server',
      baseURL: 'http://localhost:8080',
      model: 'gpt-3.5-turbo', // placeholder for llama.cpp
      type: 'openai-compatible',
      parameters: {
        temperature: 0.8,
        maxTokens: 1024,
        topP: 0.95
      }
    },
    documentation: 'https://github.com/ggerganov/llama.cpp/blob/master/examples/server/README.md',
    supportedFeatures: {
      streaming: true,
      toolCalling: false,
      multimodal: false
    }
  },
  {
    id: 'generic-openai',
    name: 'Generic OpenAI Compatible',
    description: 'Generic OpenAI-compatible API endpoint',
    icon: '🔗',
    category: 'custom',
    config: {
      name: 'generic-openai',
      displayName: 'Custom OpenAI API',
      baseURL: 'https://api.example.com/v1',
      model: 'gpt-3.5-turbo',
      type: 'openai-compatible',
      parameters: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      }
    },
    supportedFeatures: {
      streaming: true,
      toolCalling: true,
      multimodal: false
    }
  }
]

/**
 * Get template by ID
 */
export function getTemplate(id: string): ProviderTemplate | undefined {
  return PROVIDER_TEMPLATES.find(template => template.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: ProviderTemplate['category']): ProviderTemplate[] {
  return PROVIDER_TEMPLATES.filter(template => template.category === category)
}

/**
 * Create a custom provider config from template
 */
export function createConfigFromTemplate(
  templateId: string,
  overrides: Partial<CustomProviderConfig> = {}
): Partial<CustomProviderConfig> | null {
  const template = getTemplate(templateId)
  if (!template) return null

  return {
    ...template.config,
    ...overrides
  }
}

/**
 * Validation rules for different provider types
 */
export const VALIDATION_RULES = {
  'openai-compatible': {
    requiredFields: ['name', 'displayName', 'apiKey', 'baseURL', 'model'],
    urlPattern: /^https?:\/\/.+/,
    modelPattern: /^[a-zA-Z0-9_-]+$/
  },
  'anthropic-compatible': {
    requiredFields: ['name', 'displayName', 'apiKey', 'model'],
    urlPattern: /^https?:\/\/.+/,
    modelPattern: /^claude-.+/
  },
  custom: {
    requiredFields: ['name', 'displayName', 'baseURL'],
    urlPattern: /^https?:\/\/.+/,
    modelPattern: /.+/
  }
}

/**
 * Test data for provider validation
 */
export const TEST_MESSAGES = {
  basic: 'Hello, can you respond with a simple greeting?',
  streaming:
    'Please provide a longer response to test streaming functionality. Tell me about the weather in a few sentences.',
  tools: 'Can you help me read a file from the filesystem? This tests tool calling capabilities.',
  multimodal: 'Describe what you see in this image (if multimodal is supported).'
}

/**
 * Common error messages and solutions
 */
export const ERROR_SOLUTIONS = {
  ECONNREFUSED: 'Connection refused. Please check if the server is running and the URL is correct.',
  ENOTFOUND: 'Server not found. Please verify the hostname in your Base URL.',
  UNAUTHORIZED: 'Invalid API key. Please check your authentication credentials.',
  FORBIDDEN: 'Access denied. Your API key may not have the required permissions.',
  TIMEOUT: 'Request timeout. The server may be overloaded or your network connection is slow.',
  INVALID_MODEL: 'The specified model is not available. Please check the model name.',
  RATE_LIMITED: 'Too many requests. Please wait before trying again.'
}
