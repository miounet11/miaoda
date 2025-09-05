import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface BotTemplate {
  id: string
  name: string
  nameEn?: string
  icon: string
  description: string
  systemPrompt: string
  category: 'example' | 'custom' | 'official'
  order?: number
}

export const useBotTemplatesStore = defineStore('botTemplates', () => {
  // Predefined bot templates (matching Chatbox)
  const templates = ref<BotTemplate[]>([
    {
      id: 'image-creator',
      name: 'Image Creator',
      nameEn: 'Image Creator',
      icon: '🎨',
      description: 'Generate creative images from text descriptions',
      systemPrompt: 'You are an AI assistant specialized in creating detailed image descriptions and helping users generate images from text prompts.',
      category: 'example',
      order: 1
    },
    {
      id: 'just-chat',
      name: 'Just chat',
      nameEn: 'Just chat',
      icon: '💬',
      description: 'Simple conversation without any specific role',
      systemPrompt: 'You are a helpful AI assistant. Engage in natural conversation and help with any questions or tasks.',
      category: 'official',
      order: 2
    },
    {
      id: 'markdown-101',
      name: 'Markdown 101',
      nameEn: 'Markdown 101',
      icon: '📝',
      description: 'Learn and practice Markdown formatting',
      systemPrompt: 'You are a Markdown expert. Help users learn Markdown syntax, provide examples, and assist with formatting documents using Markdown.',
      category: 'example',
      order: 3
    },
    {
      id: 'software-developer',
      name: 'Software Developer',
      nameEn: 'Software Developer',
      icon: '👨‍💻',
      description: 'Professional software development assistant',
      systemPrompt: 'You are an experienced software developer. Help with coding problems, architecture decisions, debugging, and best practices across various programming languages and frameworks.',
      category: 'example',
      order: 4
    },
    {
      id: 'translator',
      name: 'Translator',
      nameEn: 'Translator',
      icon: '🌐',
      description: 'Translate between multiple languages',
      systemPrompt: 'You are a professional translator. Translate text accurately between languages while preserving meaning, context, and cultural nuances.',
      category: 'example',
      order: 5
    },
    {
      id: 'social-media-influencer',
      name: 'Social Media Influencer',
      nameEn: 'Social Media Influencer',
      icon: '📱',
      description: 'Create engaging social media content',
      systemPrompt: 'You are a social media expert. Help create engaging posts, captions, hashtags, and content strategies for various social media platforms.',
      category: 'example',
      order: 6
    },
    {
      id: 'travel-guide',
      name: 'Travel Guide',
      nameEn: 'Travel Guide',
      icon: '✈️',
      description: 'Your personal travel assistant',
      systemPrompt: 'You are an experienced travel guide. Provide travel recommendations, itineraries, local tips, and help plan amazing trips.',
      category: 'example',
      order: 7
    },
    {
      id: 'translator-cn',
      name: '翻译助手',
      nameEn: 'Translator Assistant',
      icon: '🈯',
      description: '专业的中英文翻译助手',
      systemPrompt: '你是一位专业的翻译助手，精通中英文互译。请准确翻译用户提供的内容，保持原意的同时使译文自然流畅。',
      category: 'example',
      order: 8
    },
    {
      id: 'compliment-bot',
      name: '夸夸机',
      nameEn: 'Compliment Bot',
      icon: '🌟',
      description: '给你正能量和鼓励',
      systemPrompt: '你是一个充满正能量的夸夸机器人。无论用户说什么，都要用积极、温暖、真诚的方式给予鼓励和赞美，让用户感到开心和被认可。',
      category: 'example',
      order: 9
    },
    {
      id: 'xiaohongshu-writer',
      name: '小红书文案生成器',
      nameEn: 'Xiaohongshu Writer',
      icon: '📖',
      description: '生成小红书风格的文案',
      systemPrompt: '你是一位专业的小红书文案创作者。请根据用户提供的主题，创作吸引人的小红书风格文案，包含合适的emoji、标签和互动话术。',
      category: 'example',
      order: 10
    },
    {
      id: 'chart-maker',
      name: '做图表',
      nameEn: 'Chart Maker',
      icon: '📊',
      description: '创建数据可视化图表',
      systemPrompt: '你是一个数据可视化专家。帮助用户创建各种图表，提供数据分析建议，并生成可视化代码。',
      category: 'example',
      order: 11
    },
    {
      id: 'snake-game',
      name: '贪吃蛇',
      nameEn: 'Snake Game',
      icon: '🐍',
      description: 'Play the classic Snake game',
      systemPrompt: 'You are a game assistant for the Snake game. Help users understand the rules, provide tips, and create an interactive gaming experience.',
      category: 'example',
      order: 12
    }
  ])
  
  // Custom templates (user-created)
  const customTemplates = ref<BotTemplate[]>([])
  
  // Get all templates
  const getAllTemplates = () => {
    return [...templates.value, ...customTemplates.value].sort((a, b) => 
      (a.order || 999) - (b.order || 999)
    )
  }
  
  // Get template by ID
  const getTemplateById = (id: string) => {
    return getAllTemplates().find(t => t.id === id)
  }
  
  // Add custom template
  const addCustomTemplate = (template: Omit<BotTemplate, 'id' | 'category'>) => {
    const newTemplate: BotTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      category: 'custom'
    }
    customTemplates.value.push(newTemplate)
    return newTemplate
  }
  
  // Remove custom template
  const removeCustomTemplate = (id: string) => {
    const index = customTemplates.value.findIndex(t => t.id === id)
    if (index > -1) {
      customTemplates.value.splice(index, 1)
    }
  }
  
  // Update custom template
  const updateCustomTemplate = (id: string, updates: Partial<BotTemplate>) => {
    const template = customTemplates.value.find(t => t.id === id)
    if (template) {
      Object.assign(template, updates)
    }
  }
  
  return {
    templates,
    customTemplates,
    getAllTemplates,
    getTemplateById,
    addCustomTemplate,
    removeCustomTemplate,
    updateCustomTemplate
  }
}, {
  persist: {
    paths: ['customTemplates']
  }
})