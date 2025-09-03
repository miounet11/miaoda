// Voice-related type definitions for MiaoDa Chat

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  timestamp: number
}

export interface VoiceRecognitionOptions {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

export interface VoiceSynthesisOptions {
  text: string
  voice?: SpeechSynthesisVoice
  rate: number
  pitch: number
  volume: number
  language: string
}

export interface VoiceSettings {
  enabled: boolean
  language: string
  rate: number
  pitch: number
  volume: number
  autoPlay: boolean
  continuousRecording: boolean
  showWaveform: boolean
  noiseSupression: boolean
  echoCancellation: boolean
}

export interface VoiceRecordingState {
  isRecording: boolean
  isPaused: boolean
  isProcessing: boolean
  duration: number
  volume: number
  error?: string
}

export interface VoiceSynthesisState {
  isSpeaking: boolean
  isPaused: boolean
  currentText?: string
  progress: number
  error?: string
}

export interface AudioWaveformData {
  frequencies: Float32Array
  timeDomain: Uint8Array
  volume: number
  peak: number
}

export type VoiceEventType =
  | 'recognition-start'
  | 'recognition-end'
  | 'recognition-result'
  | 'recognition-error'
  | 'synthesis-start'
  | 'synthesis-end'
  | 'synthesis-pause'
  | 'synthesis-resume'
  | 'synthesis-error'
  | 'recording-start'
  | 'recording-stop'
  | 'recording-pause'
  | 'recording-resume'
  | 'recording-data'
  | 'recording-error'

export interface VoiceEvent {
  type: VoiceEventType
  data?: any
  timestamp: number
  error?: Error
}

export type VoiceEventHandler = (event: VoiceEvent) => void

export interface VoiceServiceCapabilities {
  speechRecognition: boolean
  speechSynthesis: boolean
  mediaRecorder: boolean
  audioContext: boolean
  getUserMedia: boolean
}

export interface VoiceLanguage {
  code: string
  name: string
  nativeName: string
  region?: string
  quality: 'high' | 'medium' | 'low'
}

export interface VoiceProvider {
  name: string
  voices: SpeechSynthesisVoice[]
  defaultVoice?: SpeechSynthesisVoice
  supportedLanguages: string[]
}

export interface VoicePermissions {
  microphone: 'granted' | 'denied' | 'prompt'
  speechRecognition: 'granted' | 'denied' | 'prompt'
}

export interface VoiceQualityMetrics {
  recognitionAccuracy: number
  synthesisQuality: number
  audioLatency: number
  processingTime: number
  errorRate: number
}

// Error types
export class VoiceError extends Error {
  constructor(
    message: string,
    public code: VoiceErrorCode,
    public details?: any,
  ) {
    super(message)
    this.name = 'VoiceError'
  }
}

export enum VoiceErrorCode {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  MICROPHONE_NOT_FOUND = 'MICROPHONE_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RECOGNITION_FAILED = 'RECOGNITION_FAILED',
  SYNTHESIS_FAILED = 'SYNTHESIS_FAILED',
  AUDIO_CONTEXT_ERROR = 'AUDIO_CONTEXT_ERROR',
  RECORDING_ERROR = 'RECORDING_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

// Constants
export const SUPPORTED_LANGUAGES: VoiceLanguage[] = [
  {
    code: 'en-US',
    name: 'English',
    nativeName: 'English (US)',
    region: 'United States',
    quality: 'high',
  },
  {
    code: 'en-GB',
    name: 'English',
    nativeName: 'English (UK)',
    region: 'United Kingdom',
    quality: 'high',
  },
  { code: 'zh-CN', name: 'Chinese', nativeName: '中文 (简体)', region: 'China', quality: 'high' },
  { code: 'zh-TW', name: 'Chinese', nativeName: '中文 (繁體)', region: 'Taiwan', quality: 'high' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', region: 'Japan', quality: 'high' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', region: 'South Korea', quality: 'high' },
  {
    code: 'es-ES',
    name: 'Spanish',
    nativeName: 'Español (España)',
    region: 'Spain',
    quality: 'high',
  },
  {
    code: 'es-MX',
    name: 'Spanish',
    nativeName: 'Español (México)',
    region: 'Mexico',
    quality: 'high',
  },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', region: 'France', quality: 'high' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', region: 'Germany', quality: 'high' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', region: 'Italy', quality: 'high' },
  {
    code: 'pt-BR',
    name: 'Portuguese',
    nativeName: 'Português (Brasil)',
    region: 'Brazil',
    quality: 'high',
  },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', region: 'Russia', quality: 'medium' },
  {
    code: 'ar-SA',
    name: 'Arabic',
    nativeName: 'العربية',
    region: 'Saudi Arabia',
    quality: 'medium',
  },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', region: 'India', quality: 'medium' },
]

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: false,
  language: 'en-US',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  autoPlay: false,
  continuousRecording: false,
  showWaveform: true,
  noiseSupression: true,
  echoCancellation: true,
}

export const VOICE_RECORDING_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 16000,
    channelCount: 1,
  },
}

export const AUDIO_ANALYSIS_CONFIG = {
  fftSize: 256,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
}
