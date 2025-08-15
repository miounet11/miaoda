<template>
  <div v-if="shouldShowOnboarding" class="onboarding-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <!-- Onboarding Modal -->
    <div class="onboarding-modal bg-background/95 backdrop-blur-md rounded-2xl border border-border/60 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <!-- Progress indicator -->
      <div class="progress-bar h-1 bg-secondary/40 relative overflow-hidden">
        <div 
          class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
          :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
        />
      </div>
      
      <!-- Content -->
      <div class="p-8">
        <!-- Step 1: Welcome -->
        <div v-if="currentStep === 1" class="text-center space-y-6">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl mb-4">
            <Sparkles :size="32" class="text-primary" />
          </div>
          <h1 class="text-3xl font-bold text-foreground">Welcome to MiaoDa Chat</h1>
          <p class="text-lg text-muted-foreground max-w-lg mx-auto">
            Your intelligent AI assistant is ready to help you with coding, writing, analysis, and creative tasks.
          </p>
          
          <!-- Quick feature preview -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div class="feature-card p-4 bg-secondary/20 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
              <Code2 :size="24" class="text-primary mb-2" />
              <h3 class="font-semibold text-sm">Code Assistant</h3>
              <p class="text-xs text-muted-foreground mt-1">Write, debug, and explain code</p>
            </div>
            <div class="feature-card p-4 bg-secondary/20 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
              <FileText :size="24" class="text-primary mb-2" />
              <h3 class="font-semibold text-sm">Content Creation</h3>
              <p class="text-xs text-muted-foreground mt-1">Write articles, emails, and stories</p>
            </div>
            <div class="feature-card p-4 bg-secondary/20 rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
              <Brain :size="24" class="text-primary mb-2" />
              <h3 class="font-semibold text-sm">Analysis & Research</h3>
              <p class="text-xs text-muted-foreground mt-1">Analyze data and research topics</p>
            </div>
          </div>
        </div>
        
        <!-- Step 2: Quick Start -->
        <div v-else-if="currentStep === 2" class="space-y-6">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl mb-4">
              <Play :size="28" class="text-green-600" />
            </div>
            <h2 class="text-2xl font-bold text-foreground">Try it now!</h2>
            <p class="text-muted-foreground mt-2">
              No setup required. Start chatting immediately with a sample conversation.
            </p>
          </div>
          
          <!-- Sample conversation options -->
          <div class="space-y-3">
            <div class="text-sm font-medium text-muted-foreground mb-3">Choose a sample to get started:</div>
            <button
              v-for="(sample, index) in sampleConversations"
              :key="index"
              @click="startSampleConversation(sample)"
              class="w-full text-left p-4 bg-secondary/20 hover:bg-secondary/30 rounded-xl border border-border/30 hover:border-primary/30 transition-all group"
            >
              <div class="flex items-start gap-3">
                <div class="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <component :is="sample.icon" :size="20" class="text-primary" />
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-sm mb-1">{{ sample.title }}</h3>
                  <p class="text-xs text-muted-foreground leading-relaxed">{{ sample.description }}</p>
                  <div class="text-xs text-primary/70 mt-2 font-mono bg-primary/5 px-2 py-1 rounded border">
                    "{{ sample.prompt }}"
                  </div>
                </div>
                <ArrowRight :size="16" class="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          </div>
        </div>
        
        <!-- Step 3: Configuration (Optional) -->
        <div v-else-if="currentStep === 3" class="space-y-6">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl mb-4">
              <Settings :size="28" class="text-blue-600" />
            </div>
            <h2 class="text-2xl font-bold text-foreground">Customize Your Experience</h2>
            <p class="text-muted-foreground mt-2">
              Configure AI providers for the best experience (optional).
            </p>
          </div>
          
          <!-- Configuration options -->
          <div class="space-y-4">
            <div class="config-option p-4 bg-secondary/20 rounded-xl border border-border/30">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <h3 class="font-semibold text-sm">AI Providers</h3>
                  <p class="text-xs text-muted-foreground">Connect your preferred AI services</p>
                </div>
                <button
                  @click="openSettings"
                  class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Configure
                </button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="provider-card flex items-center gap-2 p-2 bg-background/50 rounded-lg border border-border/20">
                  <div class="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                    <span class="text-xs">🤖</span>
                  </div>
                  <span class="text-xs font-medium">OpenAI</span>
                </div>
                <div class="provider-card flex items-center gap-2 p-2 bg-background/50 rounded-lg border border-border/20">
                  <div class="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                    <span class="text-xs">🧠</span>
                  </div>
                  <span class="text-xs font-medium">Anthropic</span>
                </div>
              </div>
            </div>
            
            <div class="config-option p-4 bg-secondary/20 rounded-xl border border-border/30">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-sm">Interface Settings</h3>
                  <p class="text-xs text-muted-foreground">Theme, language, and preferences</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="toggleTheme"
                    class="p-2 hover:bg-background/50 rounded-lg transition-colors"
                    title="Toggle theme"
                  >
                    <Sun v-if="isDarkMode" :size="16" class="text-amber-500" />
                    <Moon v-else :size="16" class="text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Skip option -->
          <div class="text-center">
            <button
              @click="skipConfiguration"
              class="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 font-medium hover:no-underline px-2 py-1 rounded focus:ring-2 focus:ring-secondary"
            >
              Skip for now - I'll configure later
            </button>
          </div>
        </div>
      </div>
      
      <!-- Navigation -->
      <div class="border-t border-border/30 p-6">
        <div class="flex items-center justify-between">
          <button
            v-if="currentStep > 1"
            @click="previousStep"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg hover:bg-secondary focus:ring-2 focus:ring-secondary"
          >
            <ArrowLeft :size="16" />
            Back
          </button>
          <div v-else />
          
          <div class="flex items-center gap-3">
            <!-- Step indicators -->
            <div class="flex items-center gap-1">
              <div
                v-for="step in totalSteps"
                :key="step"
                :class="[
                  'w-2 h-2 rounded-full transition-all duration-300',
                  step === currentStep ? 'bg-primary w-6' : 
                  step < currentStep ? 'bg-primary/60' : 'bg-secondary'
                ]"
              />
            </div>
            
            <button
              v-if="currentStep < totalSteps"
              @click="nextStep"
              class="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-lg border-2 border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
            >
              {{ currentStep === 2 ? 'Continue' : 'Next' }}
              <ArrowRight :size="16" />
            </button>
            
            <button
              v-else
              @click="completeOnboarding"
              class="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all hover:scale-105 active:scale-95 shadow-lg border-2 border-transparent focus:border-green-300 focus:ring-2 focus:ring-green-200"
            >
              Get Started
              <Check :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Sparkles, Code2, FileText, Brain, Play, Settings, ArrowRight, ArrowLeft, 
  Check, Sun, Moon, Zap, BookOpen, PenTool
} from 'lucide-vue-next'

const emit = defineEmits<{
  'start-sample-conversation': [conversation: SampleConversation]
  'open-settings': []
  'complete': []
  'toggle-theme': []
}>()

interface SampleConversation {
  id: string
  title: string
  description: string
  prompt: string
  icon: any
  followUp?: string[]
}

// Reactive state
const currentStep = ref(1)
const totalSteps = 3
const isDarkMode = ref(false)
const isOnboardingVisible = ref(true)

const shouldShowOnboarding = computed(() => {
  // Check if user has seen onboarding before
  const hasSeenOnboarding = localStorage.getItem('onboarding-completed')
  return !hasSeenOnboarding && isOnboardingVisible.value
})

const sampleConversations: SampleConversation[] = [
  {
    id: 'code-review',
    title: 'Code Review & Debugging',
    description: 'Get help reviewing and improving your code with best practices',
    prompt: 'Can you help me review this JavaScript function and suggest improvements?',
    icon: Code2,
    followUp: [
      'Here\'s a sample function that could use some optimization...',
      'What are some common security issues I should watch for?'
    ]
  },
  {
    id: 'content-writing',
    title: 'Content Creation',
    description: 'Write compelling articles, emails, and creative content',
    prompt: 'Help me write an engaging blog post about sustainable technology',
    icon: PenTool,
    followUp: [
      'I want to focus on renewable energy innovations',
      'Can you suggest some compelling headlines?'
    ]
  },
  {
    id: 'data-analysis',
    title: 'Data Analysis & Research',
    description: 'Analyze information, create summaries, and research topics',
    prompt: 'Analyze the key trends in AI development over the past year',
    icon: Brain,
    followUp: [
      'What are the most significant breakthroughs?',
      'How might these trends affect businesses?'
    ]
  },
  {
    id: 'learning',
    title: 'Learning & Education',
    description: 'Explain complex topics, create study materials, and learn new skills',
    prompt: 'Explain quantum computing concepts in simple terms',
    icon: BookOpen,
    followUp: [
      'Can you give me some practical examples?',
      'What are the current real-world applications?'
    ]
  }
]

// Methods
const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const startSampleConversation = (sample: SampleConversation) => {
  emit('start-sample-conversation', sample)
  completeOnboarding()
}

const openSettings = () => {
  emit('open-settings')
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  emit('toggle-theme')
}

const skipConfiguration = () => {
  completeOnboarding()
}

const completeOnboarding = () => {
  localStorage.setItem('onboarding-completed', 'true')
  localStorage.setItem('onboarding-completed-at', new Date().toISOString())
  isOnboardingVisible.value = false
  emit('complete')
}

// Check theme and onboarding status on mount
onMounted(() => {
  isDarkMode.value = document.documentElement.classList.contains('dark')
  
  // Check if user has already completed onboarding
  const hasSeenOnboarding = localStorage.getItem('onboarding-completed')
  if (hasSeenOnboarding) {
    isOnboardingVisible.value = false
  }
})
</script>

<style scoped>
/* === ONBOARDING ANIMATIONS === */

.onboarding-overlay {
  animation: overlay-fade-in 0.4s ease-out;
}

.onboarding-modal {
  animation: modal-slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}

@keyframes overlay-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* === FEATURE CARDS === */

.feature-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* === SAMPLE CONVERSATION BUTTONS === */

.w-full.text-left.p-4 {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.w-full.text-left.p-4:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.w-full.text-left.p-4:active {
  transform: translateX(2px) scale(0.98);
}

/* === CONFIGURATION OPTIONS === */

.config-option {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.config-option:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.provider-card {
  transition: all 0.2s ease;
}

.provider-card:hover {
  transform: scale(1.05);
}

/* === STEP TRANSITIONS === */

.onboarding-modal > div {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* === PROGRESS BAR === */

.progress-bar > div {
  background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
  box-shadow: 0 2px 8px hsla(var(--primary) / 0.3);
}

/* === RESPONSIVE DESIGN === */

@media (max-width: 768px) {
  .onboarding-modal {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
  
  .onboarding-modal .p-8 {
    padding: 1.5rem;
  }
  
  .grid.grid-cols-1.md\\:grid-cols-3 {
    grid-template-columns: 1fr;
  }
  
  .grid.grid-cols-2 {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

/* === ACCESSIBILITY === */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .feature-card:hover,
  .w-full.text-left.p-4:hover,
  .config-option:hover {
    transform: none;
  }
}

/* === CUSTOM SCROLLBAR === */

.onboarding-modal::-webkit-scrollbar {
  width: 6px;
}

.onboarding-modal::-webkit-scrollbar-track {
  background: transparent;
}

.onboarding-modal::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 6px;
}

.onboarding-modal::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
</style>