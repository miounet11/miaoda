import { EventEmitter } from '@renderer/src/utils/performance'

// Voice recognition types
export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives?: Array<{
    transcript: string
    confidence: number
  }>
}

export interface VoiceRecognitionOptions {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

// Voice synthesis types
export interface VoiceSynthesisOptions {
  voice?: SpeechSynthesisVoice
  rate: number
  pitch: number
  volume: number
  language: string
}

export interface VoiceConfig {
  recognition: {
    language: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    noiseSuppressionLevel: number
  }
  synthesis: {
    voice: string | null
    rate: number
    pitch: number
    volume: number
    language: string
  }
  permissions: {
    microphone: boolean
    autoStart: boolean
  }
  ui: {
    showWaveform: boolean
    showConfidence: boolean
    highlightKeywords: boolean
  }
}

export class VoiceService extends EventEmitter<{
  'recognition-start': []
  'recognition-end': []
  'recognition-result': [VoiceRecognitionResult]
  'recognition-error': [Error]
  'synthesis-start': [string]
  'synthesis-end': [string]
  'synthesis-error': [Error]
  'config-changed': [VoiceConfig]
  'permissions-changed': [{ microphone: boolean }]
}> {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis | null = null
  private isRecognitionActive = false
  private isSynthesisActive = false
  private currentUtterance: SpeechSynthesisUtterance | null = null
  
  private config: VoiceConfig = {
    recognition: {
      language: 'zh-CN',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      noiseSuppressionLevel: 0.8
    },
    synthesis: {
      voice: null,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      language: 'zh-CN'
    },
    permissions: {
      microphone: false,
      autoStart: false
    },
    ui: {
      showWaveform: true,
      showConfidence: true,
      highlightKeywords: true
    }
  }

  constructor() {
    super()
    this.initialize()
  }

  private async initialize() {
    // Check browser support
    if (!this.checkSupport()) {
      console.warn('Voice features not supported in this browser')
      return
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      this.setupRecognition()
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
      this.setupSynthesis()
    }

    // Load saved configuration
    await this.loadConfig()
    
    // Check permissions
    await this.checkPermissions()
  }

  private checkSupport(): boolean {
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    const hasSynthesis = 'speechSynthesis' in window
    return hasRecognition || hasSynthesis
  }

  private setupRecognition() {
    if (!this.recognition) return

    const recognition = this.recognition

    // Configure recognition
    recognition.continuous = this.config.recognition.continuous
    recognition.interimResults = this.config.recognition.interimResults
    recognition.maxAlternatives = this.config.recognition.maxAlternatives
    recognition.lang = this.config.recognition.language

    // Event handlers
    recognition.onstart = () => {
      this.isRecognitionActive = true
      this.emit('recognition-start')
    }

    recognition.onend = () => {
      this.isRecognitionActive = false
      this.emit('recognition-end')
    }

    recognition.onresult = (event) => {
      const results = Array.from(event.results)
      const lastResult = results[results.length - 1]
      
      if (lastResult) {
        const result: VoiceRecognitionResult = {
          transcript: lastResult[0].transcript,
          confidence: lastResult[0].confidence,
          isFinal: lastResult.isFinal,
          alternatives: Array.from(lastResult).slice(1).map(alt => ({
            transcript: alt.transcript,
            confidence: alt.confidence
          }))
        }

        this.emit('recognition-result', result)
      }
    }

    recognition.onerror = (event) => {
      const error = new Error(`Speech recognition error: ${event.error}`)
      this.emit('recognition-error', error)
    }

    recognition.onnomatch = () => {
      const error = new Error('No speech was recognized')
      this.emit('recognition-error', error)
    }
  }

  private setupSynthesis() {
    if (!this.synthesis) return

    // Load available voices
    this.synthesis.onvoiceschanged = () => {
      this.updateAvailableVoices()
    }
  }

  private updateAvailableVoices() {
    if (!this.synthesis) return

    const voices = this.synthesis.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(this.config.synthesis.language)
    )

    if (preferredVoice && !this.config.synthesis.voice) {
      this.config.synthesis.voice = preferredVoice.name
      this.saveConfig()
    }
  }

  async startRecognition(options?: Partial<VoiceRecognitionOptions>): Promise<boolean> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported')
    }

    if (this.isRecognitionActive) {
      console.warn('Recognition already active')
      return false
    }

    // Check microphone permission
    if (!this.config.permissions.microphone) {
      const hasPermission = await this.requestMicrophonePermission()
      if (!hasPermission) {
        throw new Error('Microphone permission denied')
      }
    }

    // Apply options
    if (options) {
      if (options.language) this.recognition.lang = options.language
      if (options.continuous !== undefined) this.recognition.continuous = options.continuous
      if (options.interimResults !== undefined) this.recognition.interimResults = options.interimResults
      if (options.maxAlternatives !== undefined) this.recognition.maxAlternatives = options.maxAlternatives
    }

    try {
      this.recognition.start()
      return true
    } catch (error) {
      this.emit('recognition-error', error as Error)
      return false
    }
  }

  stopRecognition(): boolean {
    if (!this.recognition || !this.isRecognitionActive) {
      return false
    }

    try {
      this.recognition.stop()
      return true
    } catch (error) {
      this.emit('recognition-error', error as Error)
      return false
    }
  }

  async synthesizeSpeech(text: string, options?: Partial<VoiceSynthesisOptions>): Promise<boolean> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported')
    }

    // Stop current synthesis if active
    if (this.isSynthesisActive) {
      this.stopSynthesis()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Apply configuration
    const config = { ...this.config.synthesis, ...options }
    
    utterance.rate = config.rate
    utterance.pitch = config.pitch
    utterance.volume = config.volume
    utterance.lang = config.language

    // Set voice
    if (config.voice) {
      const voices = this.synthesis.getVoices()
      const selectedVoice = voices.find(voice => voice.name === config.voice)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
    }

    // Event handlers
    utterance.onstart = () => {
      this.isSynthesisActive = true
      this.currentUtterance = utterance
      this.emit('synthesis-start', text)
    }

    utterance.onend = () => {
      this.isSynthesisActive = false
      this.currentUtterance = null
      this.emit('synthesis-end', text)
    }

    utterance.onerror = (event) => {
      this.isSynthesisActive = false
      this.currentUtterance = null
      this.emit('synthesis-error', new Error(`Synthesis error: ${event.error}`))
    }

    try {
      this.synthesis.speak(utterance)
      return true
    } catch (error) {
      this.emit('synthesis-error', error as Error)
      return false
    }
  }

  stopSynthesis(): boolean {
    if (!this.synthesis) return false

    try {
      this.synthesis.cancel()
      this.isSynthesisActive = false
      this.currentUtterance = null
      return true
    } catch (error) {
      this.emit('synthesis-error', error as Error)
      return false
    }
  }

  pauseSynthesis(): boolean {
    if (!this.synthesis || !this.isSynthesisActive) return false

    try {
      this.synthesis.pause()
      return true
    } catch (error) {
      this.emit('synthesis-error', error as Error)
      return false
    }
  }

  resumeSynthesis(): boolean {
    if (!this.synthesis) return false

    try {
      this.synthesis.resume()
      return true
    } catch (error) {
      this.emit('synthesis-error', error as Error)
      return false
    }
  }

  // Configuration management
  updateConfig(updates: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...updates }
    
    // Apply recognition config changes
    if (this.recognition && updates.recognition) {
      const recConfig = updates.recognition
      if (recConfig.language) this.recognition.lang = recConfig.language
      if (recConfig.continuous !== undefined) this.recognition.continuous = recConfig.continuous
      if (recConfig.interimResults !== undefined) this.recognition.interimResults = recConfig.interimResults
      if (recConfig.maxAlternatives !== undefined) this.recognition.maxAlternatives = recConfig.maxAlternatives
    }

    this.saveConfig()
    this.emit('config-changed', this.config)
  }

  getConfig(): VoiceConfig {
    return { ...this.config }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis ? this.synthesis.getVoices() : []
  }

  getSupportedLanguages(): string[] {
    const voices = this.getAvailableVoices()
    const languages = new Set(voices.map(voice => voice.lang))
    return Array.from(languages).sort()
  }

  // Permission management
  private async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      
      this.config.permissions.microphone = true
      this.saveConfig()
      this.emit('permissions-changed', { microphone: true })
      
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      this.config.permissions.microphone = false
      this.saveConfig()
      this.emit('permissions-changed', { microphone: false })
      
      return false
    }
  }

  private async checkPermissions(): Promise<void> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      this.config.permissions.microphone = result.state === 'granted'
      
      result.onchange = () => {
        this.config.permissions.microphone = result.state === 'granted'
        this.emit('permissions-changed', { microphone: this.config.permissions.microphone })
      }
    } catch (error) {
      console.warn('Could not check microphone permissions:', error)
    }
  }

  // State getters
  isRecognitionSupported(): boolean {
    return this.recognition !== null
  }

  isSynthesisSupported(): boolean {
    return this.synthesis !== null
  }

  isRecognitionRunning(): boolean {
    return this.isRecognitionActive
  }

  isSynthesisRunning(): boolean {
    return this.isSynthesisActive
  }

  hasMicrophonePermission(): boolean {
    return this.config.permissions.microphone
  }

  getCapabilities(): {
    speechRecognition: boolean
    speechSynthesis: boolean
    mediaDevices: boolean
    permissions: boolean
  } {
    return {
      speechRecognition: this.isRecognitionSupported(),
      speechSynthesis: this.isSynthesisSupported(),
      mediaDevices: ('navigator' in window && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices),
      permissions: ('navigator' in window && 'permissions' in navigator)
    }
  }

  getDetailedStatus(): {
    isSupported: boolean
    hasPermission: boolean
    isRecording: boolean
    isSpeaking: boolean
    currentLanguage: string
    errorMessage?: string
  } {
    const capabilities = this.getCapabilities()
    
    return {
      isSupported: capabilities.speechRecognition,
      hasPermission: this.config.permissions.microphone,
      isRecording: this.isRecognitionActive,
      isSpeaking: this.isSynthesisActive,
      currentLanguage: this.config.recognition.language,
      errorMessage: !capabilities.speechRecognition 
        ? 'Speech recognition not supported in this browser'
        : !capabilities.mediaDevices
        ? 'Microphone access not available'
        : undefined
    }
  }

  // Persistence
  private async loadConfig(): Promise<void> {
    try {
      const saved = localStorage.getItem('miaoda-voice-config')
      if (saved) {
        const savedConfig = JSON.parse(saved)
        this.config = { ...this.config, ...savedConfig }
      }
    } catch (error) {
      console.warn('Failed to load voice config:', error)
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('miaoda-voice-config', JSON.stringify(this.config))
    } catch (error) {
      console.warn('Failed to save voice config:', error)
    }
  }

  // Cleanup
  destroy(): void {
    this.stopRecognition()
    this.stopSynthesis()
    
    this.recognition = null
    this.synthesis = null
    this.currentUtterance = null
    
    this.clear()
  }
}

// Global voice service instance
export const voiceService = new VoiceService()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    voiceService.destroy()
  })
}