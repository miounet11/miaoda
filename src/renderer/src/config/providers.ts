export interface Provider {
  id: string
  name: string
  emoji?: string
  icon?: string
  apiKeyRequired: boolean
  baseURL?: string
  customizable?: boolean
  models: Model[]
  description?: string
  configured?: boolean
}

export interface Model {
  id: string
  name: string
  description?: string
  capabilities?: ModelCapability[]
  type?: 'chat' | 'embedding' | 'image' | 'reasoning'
  contextWindow?: number
  maxTokens?: number
  vision?: boolean
  tools?: boolean
  reasoning?: boolean
  version?: string
}

export type ModelCapability = 'vision' | 'tools' | 'reasoning' | 'embedding' | 'realtime'

// 默认提供商
export const defaultProvider = 'miaochat'

export const providers: Provider[] = [
  {
    id: 'miaochat',
    name: 'MiaoChat',
    emoji: '🐱',
    apiKeyRequired: false,
    baseURL: 'https://ttkk.inping.com/v1',
    customizable: false,
    configured: true,
    description: '内置智能AI助手',
    models: [
      { 
        id: 'miaochat', 
        name: 'MiaoChat',
        version: 'Latest',
        description: '预配置的AI模型，无需设置即可使用',
        vision: true,
        tools: true,
        reasoning: true,
        type: 'chat',
        contextWindow: 200000
      }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    emoji: '🤖',
    apiKeyRequired: true,
    baseURL: 'https://api.openai.com/v1',
    customizable: true,
    description: 'GPT系列模型',
    models: [
      { 
        id: 'gpt-4o', 
        name: 'GPT-4o',
        version: 'Latest',
        vision: true,
        tools: true,
        reasoning: false,
        type: 'chat',
        contextWindow: 128000
      },
      { 
        id: 'gpt-4o-mini', 
        name: 'GPT-4o Mini',
        version: 'Latest',
        vision: true,
        tools: true,
        type: 'chat',
        contextWindow: 128000
      },
      { 
        id: 'gpt-4-turbo', 
        name: 'GPT-4 Turbo',
        version: 'Preview',
        vision: true,
        tools: true,
        type: 'chat',
        contextWindow: 128000
      },
      { 
        id: 'gpt-4', 
        name: 'GPT-4',
        version: '0613',
        tools: true,
        type: 'chat',
        contextWindow: 8192
      },
      { 
        id: 'gpt-3.5-turbo', 
        name: 'GPT-3.5 Turbo',
        version: 'Latest',
        tools: true,
        type: 'chat',
        contextWindow: 16384
      },
      { 
        id: 'o1', 
        name: 'O1',
        version: 'Latest',
        reasoning: true,
        vision: false,
        tools: false,
        type: 'reasoning',
        contextWindow: 200000
      },
      { 
        id: 'o1-mini', 
        name: 'O1 Mini',
        version: 'Latest',
        reasoning: true,
        type: 'reasoning',
        contextWindow: 128000
      },
      { 
        id: 'o1-preview', 
        name: 'O1 Preview',
        version: 'Latest',
        reasoning: true,
        type: 'reasoning',
        contextWindow: 128000
      }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    emoji: '📚',
    apiKeyRequired: true,
    baseURL: 'https://api.anthropic.com',
    customizable: true,
    description: 'Claude系列模型',
    models: [
      { 
        id: 'claude-3-5-sonnet-20241022', 
        name: 'Claude 3.5 Sonnet',
        version: '20241022',
        vision: true,
        tools: true,
        reasoning: false,
        contextWindow: 200000
      },
      { 
        id: 'claude-3-5-haiku-20241022', 
        name: 'Claude 3.5 Haiku',
        version: '20241022',
        vision: true,
        tools: true,
        contextWindow: 200000
      },
      { 
        id: 'claude-3-opus-20240229', 
        name: 'Claude 3 Opus',
        version: '20240229',
        vision: true,
        tools: true,
        contextWindow: 200000
      },
      { 
        id: 'claude-3-sonnet-20240229', 
        name: 'Claude 3 Sonnet',
        version: '20240229',
        vision: true,
        tools: true,
        contextWindow: 200000
      },
      { 
        id: 'claude-3-haiku-20240307', 
        name: 'Claude 3 Haiku',
        version: '20240307',
        vision: true,
        tools: false,
        contextWindow: 200000
      }
    ]
  },
  {
    id: 'google',
    name: 'Google',
    emoji: '🔷',
    apiKeyRequired: true,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    customizable: true,
    description: 'Gemini系列模型',
    models: [
      { 
        id: 'gemini-2.0-flash-exp', 
        name: 'Gemini 2.0 Flash',
        version: 'Experimental',
        vision: true,
        tools: true,
        contextWindow: 1000000
      },
      { 
        id: 'gemini-1.5-pro', 
        name: 'Gemini 1.5 Pro',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 2000000
      },
      { 
        id: 'gemini-1.5-flash', 
        name: 'Gemini 1.5 Flash',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 1000000
      },
      { 
        id: 'gemini-1.5-flash-8b', 
        name: 'Gemini 1.5 Flash 8B',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 1000000
      }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    emoji: '🌊',
    apiKeyRequired: true,
    baseURL: 'https://api.deepseek.com',
    customizable: true,
    description: 'DeepSeek系列模型',
    models: [
      { 
        id: 'deepseek-reasoner', 
        name: 'DeepSeek Reasoner',
        version: 'Latest',
        reasoning: true,
        tools: true,
        type: 'reasoning',
        contextWindow: 64000
      },
      { 
        id: 'deepseek-chat', 
        name: 'DeepSeek Chat',
        version: 'Latest',
        tools: true,
        contextWindow: 64000
      },
      { 
        id: 'deepseek-coder', 
        name: 'DeepSeek Coder',
        version: 'Latest',
        tools: true,
        contextWindow: 64000
      }
    ]
  },
  {
    id: 'xai',
    name: 'xAI',
    emoji: '✨',
    apiKeyRequired: true,
    baseURL: 'https://api.x.ai/v1',
    customizable: true,
    description: 'Grok系列模型',
    models: [
      { 
        id: 'grok-2-1212', 
        name: 'Grok 2',
        version: '1212',
        vision: true,
        tools: true,
        contextWindow: 131072
      },
      { 
        id: 'grok-2-vision-1212', 
        name: 'Grok 2 Vision',
        version: '1212',
        vision: true,
        tools: true,
        contextWindow: 131072
      },
      { 
        id: 'grok-beta', 
        name: 'Grok Beta',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 131072
      }
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    emoji: '🌪️',
    apiKeyRequired: true,
    baseURL: 'https://api.mistral.ai/v1',
    customizable: true,
    description: 'Mistral系列模型',
    models: [
      { 
        id: 'mistral-large-latest', 
        name: 'Mistral Large',
        version: 'Latest',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'mistral-medium-latest', 
        name: 'Mistral Medium',
        version: 'Latest',
        tools: true,
        contextWindow: 32768
      },
      { 
        id: 'mistral-small-latest', 
        name: 'Mistral Small',
        version: 'Latest',
        contextWindow: 32768
      },
      { 
        id: 'codestral-latest', 
        name: 'Codestral',
        version: 'Latest',
        tools: true,
        contextWindow: 32768
      },
      { 
        id: 'pixtral-large-latest', 
        name: 'Pixtral Large',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 128000
      }
    ]
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    emoji: '🔍',
    apiKeyRequired: true,
    baseURL: 'https://api.perplexity.ai',
    customizable: true,
    description: '搜索增强模型',
    models: [
      { 
        id: 'llama-3.1-sonar-large-128k-online', 
        name: 'Sonar Large',
        version: 'Online',
        tools: true,
        contextWindow: 127072
      },
      { 
        id: 'llama-3.1-sonar-small-128k-online', 
        name: 'Sonar Small',
        version: 'Online',
        tools: true,
        contextWindow: 127072
      },
      { 
        id: 'llama-3.1-sonar-huge-128k-online', 
        name: 'Sonar Huge',
        version: 'Online',
        tools: true,
        contextWindow: 127072
      }
    ]
  },
  {
    id: 'groq',
    name: 'Groq',
    emoji: '⚡',
    apiKeyRequired: true,
    baseURL: 'https://api.groq.com/openai/v1',
    customizable: true,
    description: '超快速推理',
    models: [
      { 
        id: 'llama-3.3-70b-versatile', 
        name: 'Llama 3.3 70B',
        version: 'Versatile',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'llama-3.2-90b-vision-preview', 
        name: 'Llama 3.2 90B Vision',
        version: 'Preview',
        vision: true,
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'mixtral-8x7b-32768', 
        name: 'Mixtral 8x7B',
        version: '32768',
        tools: true,
        contextWindow: 32768
      },
      { 
        id: 'gemma2-9b-it', 
        name: 'Gemma 2 9B',
        version: 'IT',
        tools: true,
        contextWindow: 8192
      }
    ]
  },
  {
    id: 'cohere',
    name: 'Cohere',
    emoji: '🔮',
    apiKeyRequired: true,
    baseURL: 'https://api.cohere.ai/v1',
    customizable: true,
    description: 'Command系列模型',
    models: [
      { 
        id: 'command-r-plus', 
        name: 'Command R+',
        version: 'Latest',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'command-r', 
        name: 'Command R',
        version: 'Latest',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'command', 
        name: 'Command',
        version: 'Latest',
        contextWindow: 4096
      }
    ]
  },
  {
    id: 'together',
    name: 'Together AI',
    emoji: '🤝',
    apiKeyRequired: true,
    baseURL: 'https://api.together.xyz/v1',
    customizable: true,
    description: '开源模型平台',
    models: [
      { 
        id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', 
        name: 'Llama 3.1 405B',
        version: 'Turbo',
        tools: true,
        contextWindow: 130816
      },
      { 
        id: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo', 
        name: 'Llama 3.2 90B Vision',
        version: 'Turbo',
        vision: true,
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', 
        name: 'Qwen 2.5 72B',
        version: 'Turbo',
        tools: true,
        contextWindow: 32768
      }
    ]
  },
  {
    id: 'ai21',
    name: 'AI21 Labs',
    emoji: '🔬',
    apiKeyRequired: true,
    baseURL: 'https://api.ai21.com/studio/v1',
    customizable: true,
    description: 'Jamba系列模型',
    models: [
      { 
        id: 'jamba-1.5-large', 
        name: 'Jamba 1.5 Large',
        version: 'Latest',
        contextWindow: 256000
      },
      { 
        id: 'jamba-1.5-mini', 
        name: 'Jamba 1.5 Mini',
        version: 'Latest',
        contextWindow: 256000
      }
    ]
  },
  {
    id: 'zhipu',
    name: '智谱清言',
    emoji: '🧠',
    apiKeyRequired: true,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    customizable: true,
    description: 'GLM系列模型',
    models: [
      { 
        id: 'glm-4-plus', 
        name: 'GLM-4 Plus',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'glm-4-0520', 
        name: 'GLM-4',
        version: '0520',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'glm-4v-plus', 
        name: 'GLM-4V Plus',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 128000
      }
    ]
  },
  {
    id: 'moonshot',
    name: '月之暗面',
    emoji: '🌙',
    apiKeyRequired: true,
    baseURL: 'https://api.moonshot.cn/v1',
    customizable: true,
    description: 'Kimi系列模型',
    models: [
      { 
        id: 'moonshot-v1-128k', 
        name: 'Moonshot 128K',
        version: 'v1',
        contextWindow: 128000
      },
      { 
        id: 'moonshot-v1-32k', 
        name: 'Moonshot 32K',
        version: 'v1',
        contextWindow: 32000
      },
      { 
        id: 'moonshot-v1-8k', 
        name: 'Moonshot 8K',
        version: 'v1',
        contextWindow: 8000
      }
    ]
  },
  {
    id: 'baichuan',
    name: '百川智能',
    emoji: '🌊',
    apiKeyRequired: true,
    baseURL: 'https://api.baichuan-ai.com/v1',
    customizable: true,
    description: 'Baichuan系列模型',
    models: [
      { 
        id: 'Baichuan4', 
        name: 'Baichuan 4',
        version: 'Latest',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'Baichuan3-Turbo', 
        name: 'Baichuan 3 Turbo',
        version: 'Latest',
        contextWindow: 32000
      },
      { 
        id: 'Baichuan2-Turbo', 
        name: 'Baichuan 2 Turbo',
        version: 'Latest',
        contextWindow: 32000
      }
    ]
  },
  {
    id: 'qwen',
    name: '通义千问',
    emoji: '🎯',
    apiKeyRequired: true,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    customizable: true,
    description: 'Qwen系列模型',
    models: [
      { 
        id: 'qwen-max', 
        name: 'Qwen Max',
        version: 'Latest',
        tools: true,
        contextWindow: 32000
      },
      { 
        id: 'qwen-plus', 
        name: 'Qwen Plus',
        version: 'Latest',
        tools: true,
        contextWindow: 130000
      },
      { 
        id: 'qwen-turbo', 
        name: 'Qwen Turbo',
        version: 'Latest',
        contextWindow: 130000
      },
      { 
        id: 'qwen-vl-max', 
        name: 'Qwen VL Max',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 32000
      }
    ]
  },
  {
    id: 'doubao',
    name: '豆包',
    emoji: '🌱',
    apiKeyRequired: true,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    customizable: true,
    description: '豆包系列模型',
    models: [
      { 
        id: 'doubao-pro-128k', 
        name: 'Doubao Pro 128K',
        version: 'Latest',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'doubao-pro-32k', 
        name: 'Doubao Pro 32K',
        version: 'Latest',
        tools: true,
        contextWindow: 32000
      },
      { 
        id: 'doubao-lite-128k', 
        name: 'Doubao Lite 128K',
        version: 'Latest',
        contextWindow: 128000
      }
    ]
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    emoji: '🎨',
    apiKeyRequired: true,
    baseURL: 'https://api.minimax.chat/v1',
    customizable: true,
    description: 'MiniMax系列模型',
    models: [
      { 
        id: 'abab6.5s-chat', 
        name: 'abab 6.5s',
        version: 'Chat',
        contextWindow: 245760
      },
      { 
        id: 'abab6.5t-chat', 
        name: 'abab 6.5t',
        version: 'Chat',
        contextWindow: 8192
      },
      { 
        id: 'abab6.5g-chat', 
        name: 'abab 6.5g',
        version: 'Chat',
        contextWindow: 8192
      }
    ]
  },
  {
    id: 'yi',
    name: '零一万物',
    emoji: '0️⃣',
    apiKeyRequired: true,
    baseURL: 'https://api.lingyiwanwu.com/v1',
    customizable: true,
    description: 'Yi系列模型',
    models: [
      { 
        id: 'yi-lightning', 
        name: 'Yi Lightning',
        version: 'Latest',
        tools: true,
        contextWindow: 16384
      },
      { 
        id: 'yi-large', 
        name: 'Yi Large',
        version: 'Latest',
        tools: true,
        contextWindow: 32768
      },
      { 
        id: 'yi-medium', 
        name: 'Yi Medium',
        version: 'Latest',
        contextWindow: 16384
      },
      { 
        id: 'yi-vision', 
        name: 'Yi Vision',
        version: 'Latest',
        vision: true,
        contextWindow: 4096
      }
    ]
  },
  {
    id: 'stepfun',
    name: '阶跃星辰',
    emoji: '⭐',
    apiKeyRequired: true,
    baseURL: 'https://api.stepfun.com/v1',
    customizable: true,
    description: 'Step系列模型',
    models: [
      { 
        id: 'step-2-16k', 
        name: 'Step 2 16K',
        version: 'Latest',
        tools: true,
        contextWindow: 16384
      },
      { 
        id: 'step-1-128k', 
        name: 'Step 1 128K',
        version: 'Latest',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'step-1-32k', 
        name: 'Step 1 32K',
        version: 'Latest',
        contextWindow: 32000
      }
    ]
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    emoji: '💫',
    apiKeyRequired: true,
    baseURL: 'https://api.siliconflow.cn/v1',
    customizable: true,
    description: '开源模型服务',
    models: [
      { 
        id: 'Qwen/Qwen2.5-72B-Instruct', 
        name: 'Qwen 2.5 72B',
        version: 'Instruct',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'deepseek-ai/DeepSeek-V2.5', 
        name: 'DeepSeek V2.5',
        version: 'Latest',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: '01-ai/Yi-Lightning', 
        name: 'Yi Lightning',
        version: 'Latest',
        contextWindow: 16384
      }
    ]
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    emoji: '☁️',
    apiKeyRequired: true,
    customizable: true,
    description: '微软Azure托管',
    models: [
      { 
        id: 'gpt-4o', 
        name: 'GPT-4o (Azure)',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'gpt-4', 
        name: 'GPT-4 (Azure)',
        version: 'Latest',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'gpt-35-turbo', 
        name: 'GPT-3.5 Turbo (Azure)',
        version: 'Latest',
        tools: true,
        contextWindow: 16384
      }
    ]
  },
  {
    id: 'bedrock',
    name: 'AWS Bedrock',
    emoji: '🪨',
    apiKeyRequired: true,
    customizable: true,
    description: 'AWS托管模型',
    models: [
      { 
        id: 'anthropic.claude-3-5-sonnet', 
        name: 'Claude 3.5 Sonnet (AWS)',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 200000
      },
      { 
        id: 'meta.llama3-1-405b-instruct', 
        name: 'Llama 3.1 405B (AWS)',
        version: 'Instruct',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'mistral.mistral-large', 
        name: 'Mistral Large (AWS)',
        version: 'Latest',
        tools: true,
        contextWindow: 128000
      }
    ]
  },
  {
    id: 'vertex',
    name: 'Google Vertex',
    emoji: '🔺',
    apiKeyRequired: true,
    customizable: true,
    description: 'Google Cloud托管',
    models: [
      { 
        id: 'gemini-1.5-pro', 
        name: 'Gemini 1.5 Pro (Vertex)',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 2000000
      },
      { 
        id: 'gemini-1.5-flash', 
        name: 'Gemini 1.5 Flash (Vertex)',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 1000000
      },
      { 
        id: 'claude-3-5-sonnet', 
        name: 'Claude 3.5 Sonnet (Vertex)',
        version: 'Latest',
        vision: true,
        tools: true,
        contextWindow: 200000
      }
    ]
  },
  {
    id: 'ollama',
    name: 'Ollama',
    emoji: '💻',
    apiKeyRequired: false,
    baseURL: 'http://localhost:11434',
    customizable: true,
    description: '本地运行模型',
    models: [
      { 
        id: 'llama3.3:latest', 
        name: 'Llama 3.3',
        version: 'Latest',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'qwen2.5:latest', 
        name: 'Qwen 2.5',
        version: 'Latest',
        tools: true,
        contextWindow: 128000
      },
      { 
        id: 'deepseek-r1:latest', 
        name: 'DeepSeek R1',
        version: 'Latest',
        reasoning: true,
        tools: true,
        contextWindow: 64000
      },
      { 
        id: 'mistral:latest', 
        name: 'Mistral',
        version: 'Latest',
        contextWindow: 32000
      },
      { 
        id: 'gemma2:latest', 
        name: 'Gemma 2',
        version: 'Latest',
        contextWindow: 8192
      },
      { 
        id: 'phi3:latest', 
        name: 'Phi 3',
        version: 'Latest',
        contextWindow: 128000
      }
    ]
  },
  {
    id: 'lm-studio',
    name: 'LM Studio',
    emoji: '🎛️',
    apiKeyRequired: false,
    baseURL: 'http://localhost:1234/v1',
    customizable: true,
    description: '本地模型工作室',
    models: []
  },
  {
    id: 'custom',
    name: '自定义',
    emoji: '⚙️',
    apiKeyRequired: true,
    customizable: true,
    description: '自定义API端点',
    models: []
  }
]