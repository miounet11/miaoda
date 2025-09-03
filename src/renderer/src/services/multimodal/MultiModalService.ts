/**
 * 多模态交互服务
 * 支持图片、语音、文件等多种输入方式
 */

import { ref } from 'vue'
import { userMemoryService } from '../memory/UserMemoryService'

// 多模态输入类型
export type ModalityType = 'text' | 'voice' | 'image' | 'video' | 'file'

// 多模态内容接口
export interface MultiModalContent {
  id: string
  type: ModalityType
  content: string | ArrayBuffer | Blob
  text?: string // 转换后的文本
  metadata?: {
    mimeType?: string
    size?: number
    duration?: number // 音频/视频时长
    dimensions?: { width: number; height: number } // 图片/视频尺寸
    originalName?: string
  }
  analysis?: ContentAnalysis
  timestamp: Date
}

// 内容分析结果
export interface ContentAnalysis {
  type: 'image' | 'audio' | 'document'
  description?: string
  objects?: Array<{ name: string; confidence: number; bbox?: number[] }>
  text?: string // OCR或语音识别结果
  sentiment?: 'positive' | 'neutral' | 'negative'
  language?: string
  keywords?: string[]
  summary?: string
}

// 处理选项
export interface ProcessingOptions {
  extractText?: boolean // 提取文本(OCR/语音识别)
  detectObjects?: boolean // 检测对象
  analyzeSentiment?: boolean // 情感分析
  generateSummary?: boolean // 生成摘要
  translateTo?: string // 翻译目标语言
}

// 语音配置
export interface VoiceConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  profanityFilter: boolean
}

// 图像配置
export interface ImageConfig {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

class MultiModalService {
  private static instance: MultiModalService
  private processing = ref(false)
  private currentRecognition: any = null
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []

  // 配置
  private voiceConfig: VoiceConfig = {
    language: 'zh-CN',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    profanityFilter: false,
  }

  private imageConfig: ImageConfig = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.9,
    format: 'jpeg',
  }

  private constructor() {
    this.initializeService()
  }

  static getInstance(): MultiModalService {
    if (!MultiModalService.instance) {
      MultiModalService.instance = new MultiModalService()
    }
    return MultiModalService.instance
  }

  // 初始化服务
  private initializeService() {
    // 检查浏览器支持
    this.checkBrowserSupport()
  }

  // 检查浏览器支持
  private checkBrowserSupport() {
    const support = {
      speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      mediaRecorder: 'MediaRecorder' in window,
      getUserMedia: navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices,
      fileAPI: 'File' in window && 'FileReader' in window,
      canvas: 'HTMLCanvasElement' in window,
    }

    console.log('Browser multimodal support:', support)
    return support
  }

  // 处理多模态输入
  async processInput(
    input: File | Blob | string,
    type: ModalityType,
    options: ProcessingOptions = {},
  ): Promise<MultiModalContent> {
    this.processing.value = true

    try {
      const content: MultiModalContent = {
        id: this.generateId(),
        type,
        content: input,
        timestamp: new Date(),
      }

      // 根据类型处理
      switch (type) {
        case 'image':
          content.analysis = await this.processImage(input as File | Blob, options)
          break
        case 'voice':
          content.analysis = await this.processVoice(input as Blob, options)
          break
        case 'video':
          content.analysis = await this.processVideo(input as File | Blob, options)
          break
        case 'file':
          content.analysis = await this.processFile(input as File, options)
          break
        case 'text':
        default:
          content.text = input as string
          break
      }

      // 更新用户记忆
      this.updateUserMemory(content)

      return content
    } finally {
      this.processing.value = false
    }
  }

  // 处理图片
  private async processImage(
    image: File | Blob,
    options: ProcessingOptions,
  ): Promise<ContentAnalysis> {
    const analysis: ContentAnalysis = {
      type: 'image',
    }

    // 获取图片信息 (暂时未使用，保留以备将来功能扩展)
    await this.getImageMetadata(image)

    // 压缩图片
    const compressed = await this.compressImage(image)

    // OCR文字识别（模拟）
    if (options.extractText) {
      analysis.text = await this.performOCR(compressed)
    }

    // 物体检测（模拟）
    if (options.detectObjects) {
      analysis.objects = await this.detectObjects(compressed)
    }

    // 生成描述
    analysis.description = this.generateImageDescription(analysis)

    // 提取关键词
    if (analysis.text) {
      analysis.keywords = this.extractKeywords(analysis.text)
    }

    return analysis
  }

  // 获取图片元数据
  private async getImageMetadata(image: File | Blob): Promise<any> {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(image)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({
          width: img.width,
          height: img.height,
          size: image.size,
          type: image.type,
        })
      }

      img.src = url
    })
  }

  // 压缩图片
  private async compressImage(image: File | Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      img.onload = () => {
        // 计算压缩尺寸
        let { width, height } = img
        const maxWidth = this.imageConfig.maxWidth || 1920
        const maxHeight = this.imageConfig.maxHeight || 1080

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        // 绘制并压缩
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          `image/${this.imageConfig.format}`,
          this.imageConfig.quality,
        )
      }

      img.src = URL.createObjectURL(image)
    })
  }

  // OCR文字识别（模拟实现）
  private async performOCR(_image: Blob): Promise<string> {
    // 这里应该调用实际的OCR服务
    // 暂时返回模拟结果
    await new Promise(resolve => setTimeout(resolve, 1000))
    return '这是从图片中识别出的文字内容示例'
  }

  // 物体检测（模拟实现）
  private async detectObjects(_image: Blob): Promise<Array<{ name: string; confidence: number }>> {
    // 这里应该调用实际的物体检测服务
    // 暂时返回模拟结果
    await new Promise(resolve => setTimeout(resolve, 500))
    return [
      { name: '人物', confidence: 0.95 },
      { name: '背景', confidence: 0.88 },
      { name: '文字', confidence: 0.72 },
    ]
  }

  // 生成图片描述
  private generateImageDescription(analysis: ContentAnalysis): string {
    const parts: string[] = []

    if (analysis.objects && analysis.objects.length > 0) {
      const objects = analysis.objects.map(obj => obj.name).join('、')
      parts.push(`图片中包含: ${objects}`)
    }

    if (analysis.text) {
      parts.push(`识别到文字: "${analysis.text.substring(0, 50)}..."`)
    }

    return parts.join('。') || '这是一张图片'
  }

  // 处理语音
  private async processVoice(
    audio: Blob,
    options: ProcessingOptions,
  ): Promise<ContentAnalysis> {
    const analysis: ContentAnalysis = {
      type: 'audio',
    }

    // 语音识别（模拟）
    if (options.extractText !== false) {
      analysis.text = await this.performSpeechRecognition(audio)
    }

    // 情感分析
    if (options.analyzeSentiment && analysis.text) {
      analysis.sentiment = this.analyzeSentiment(analysis.text)
    }

    // 语言检测
    if (analysis.text) {
      analysis.language = this.detectLanguage(analysis.text)
      analysis.keywords = this.extractKeywords(analysis.text)
    }

    // 生成摘要
    if (options.generateSummary && analysis.text) {
      analysis.summary = this.generateSummary(analysis.text)
    }

    return analysis
  }

  // 语音识别（模拟实现）
  private async performSpeechRecognition(_audio: Blob): Promise<string> {
    // 这里应该调用实际的语音识别服务
    await new Promise(resolve => setTimeout(resolve, 1500))
    return '这是语音识别的结果示例'
  }

  // 处理视频
  private async processVideo(
    _video: File | Blob,
    _options: ProcessingOptions,
  ): Promise<ContentAnalysis> {
    // 提取关键帧并分析
    const analysis: ContentAnalysis = {
      type: 'image', // 视频作为图像序列处理
      description: '视频内容分析',
    }

    // 这里可以提取视频关键帧进行分析
    // 暂时返回基础分析
    return analysis
  }

  // 处理文件
  private async processFile(
    file: File,
    options: ProcessingOptions,
  ): Promise<ContentAnalysis> {
    const analysis: ContentAnalysis = {
      type: 'document',
    }

    // 根据文件类型处理
    const fileType = file.type

    if (fileType.startsWith('text/')) {
      // 文本文件
      analysis.text = await this.readTextFile(file)
      analysis.keywords = this.extractKeywords(analysis.text)

      if (options.generateSummary) {
        analysis.summary = this.generateSummary(analysis.text)
      }
    } else if (fileType.includes('pdf')) {
      // PDF文件（需要专门的库处理）
      analysis.description = 'PDF文档'
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      // 表格文件
      analysis.description = '表格文档'
    }

    return analysis
  }

  // 读取文本文件
  private readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // 开始语音输入
  async startVoiceInput(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: any) => void,
  ): Promise<void> {
    // 检查浏览器支持
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition

    if (!SpeechRecognition) {
      throw new Error('浏览器不支持语音识别')
    }

    // 停止之前的识别
    if (this.currentRecognition) {
      this.currentRecognition.stop()
    }

    // 创建新的识别实例
    const recognition = new SpeechRecognition()
    this.currentRecognition = recognition

    // 配置
    recognition.lang = this.voiceConfig.language
    recognition.continuous = this.voiceConfig.continuous
    recognition.interimResults = this.voiceConfig.interimResults
    recognition.maxAlternatives = this.voiceConfig.maxAlternatives

    // 事件处理
    recognition.onresult = (event: any) => {
      const last = event.results.length - 1
      const result = event.results[last]
      const text = result[0].transcript
      const isFinal = result.isFinal

      onResult(text, isFinal)

      // 记录到用户习惯
      if (isFinal) {
        userMemoryService.recordHabit('voice_input', text)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      if (onError) {
        onError(event.error)
      }
    }

    recognition.onend = () => {
      this.currentRecognition = null
    }

    // 开始识别
    recognition.start()
  }

  // 停止语音输入
  stopVoiceInput() {
    if (this.currentRecognition) {
      this.currentRecognition.stop()
      this.currentRecognition = null
    }
  }

  // 开始录音
  async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    this.mediaRecorder = new MediaRecorder(stream)
    this.audioChunks = []

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data)
      }
    }

    this.mediaRecorder.start()
  }

  // 停止录音
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        this.audioChunks = []
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
      this.mediaRecorder = null
    })
  }

  // 拍照
  async capturePhoto(): Promise<Blob> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })

    const video = document.createElement('video')
    video.srcObject = stream
    video.play()

    // 等待视频加载
    await new Promise(resolve => {
      video.onloadedmetadata = resolve
    })

    // 创建画布并捕获
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas context not available')
    }

    ctx.drawImage(video, 0, 0)

    // 停止视频流
    stream.getTracks().forEach(track => track.stop())

    // 转换为Blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to capture photo'))
        }
      }, 'image/jpeg', 0.9)
    })
  }

  // 分析情感
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // 简单的情感分析
    const positive = ['好', '棒', '优秀', '喜欢', '开心', '感谢']
    const negative = ['差', '糟糕', '失望', '生气', '难过', '问题']

    let score = 0
    positive.forEach(word => {
      if (text.includes(word)) score++
    })
    negative.forEach(word => {
      if (text.includes(word)) score--
    })

    if (score > 0) return 'positive'
    if (score < 0) return 'negative'
    return 'neutral'
  }

  // 检测语言
  private detectLanguage(text: string): string {
    // 简单的语言检测
    const chinesePattern = /[\u4e00-\u9fa5]/
    const englishPattern = /[a-zA-Z]/

    const chineseCount = (text.match(chinesePattern) || []).length
    const englishCount = (text.match(englishPattern) || []).length

    if (chineseCount > englishCount) return 'zh-CN'
    if (englishCount > chineseCount) return 'en-US'
    return 'unknown'
  }

  // 提取关键词
  private extractKeywords(text: string): string[] {
    // 简单的关键词提取
    const stopWords = new Set([
      '的', '了', '在', '是', '我', '你', '他', '她', '它',
      '这', '那', '有', '和', '与', '或', '但',
    ])

    const words = text.split(/[\s,，。.!！?？;；]+/)
      .filter(word => word.length > 1 && !stopWords.has(word))

    return [...new Set(words)].slice(0, 10)
  }

  // 生成摘要
  private generateSummary(text: string, maxLength: number = 100): string {
    // 简单的摘要生成
    if (text.length <= maxLength) return text

    const sentences = text.split(/[。.!！?？]/)
    let summary = ''

    for (const sentence of sentences) {
      if ((summary + sentence).length <= maxLength) {
        summary += sentence + '。'
      } else {
        break
      }
    }

    return summary || text.substring(0, maxLength) + '...'
  }

  // 更新用户记忆
  private updateUserMemory(content: MultiModalContent) {
    // 记录使用习惯
    userMemoryService.recordHabit('multimodal_use', content.type)

    // 如果有文本内容，添加到记忆
    if (content.text || content.analysis?.text) {
      const text = content.text || content.analysis?.text || ''
      userMemoryService.addMemory({
        type: 'context',
        content: `使用${content.type}输入: ${text.substring(0, 100)}`,
        importance: 2,
        tags: ['multimodal', content.type],
        source: 'explicit',
      })
    }
  }

  // 生成ID
  private generateId(): string {
    return `multimodal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 获取配置
  getVoiceConfig(): VoiceConfig {
    return this.voiceConfig
  }

  // 更新语音配置
  updateVoiceConfig(config: Partial<VoiceConfig>) {
    this.voiceConfig = { ...this.voiceConfig, ...config }
  }

  // 获取图像配置
  getImageConfig(): ImageConfig {
    return this.imageConfig
  }

  // 更新图像配置
  updateImageConfig(config: Partial<ImageConfig>) {
    this.imageConfig = { ...this.imageConfig, ...config }
  }

  // 检查是否正在处理
  isProcessing(): boolean {
    return this.processing.value
  }
}

// 导出单例
export const multiModalService = MultiModalService.getInstance()

// 导出Vue组合式API hook
export function useMultiModal() {
  const service = multiModalService

  return {
    processInput: (input: File | Blob | string, type: ModalityType, options?: ProcessingOptions) =>
      service.processInput(input, type, options),
    startVoiceInput: (onResult: (text: string, isFinal: boolean) => void, onError?: (error: any) => void) =>
      service.startVoiceInput(onResult, onError),
    stopVoiceInput: () => service.stopVoiceInput(),
    startRecording: () => service.startRecording(),
    stopRecording: () => service.stopRecording(),
    capturePhoto: () => service.capturePhoto(),
    isProcessing: () => service.isProcessing(),
    updateVoiceConfig: (config: Partial<VoiceConfig>) => service.updateVoiceConfig(config),
    updateImageConfig: (config: Partial<ImageConfig>) => service.updateImageConfig(config),
  }
}
