<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" v-if="isVisible">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {{ isRegistering ? 'Create Account' : 'Welcome Back' }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ isRegistering ? 'Join MiaoDa Chat' : 'Sign in to continue' }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Name field (registration only) -->
        <div v-if="isRegistering">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter your full name"
          />
        </div>

        <!-- Email field -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter your email"
          />
        </div>

        <!-- Password field -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              :placeholder="isRegistering ? 'Create a strong password' : 'Enter your password'"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <EyeIcon v-if="!showPassword" class="h-5 w-5" />
              <EyeSlashIcon v-else class="h-5 w-5" />
            </button>
          </div>
          
          <!-- Password strength indicator (registration only) -->
          <div v-if="isRegistering && form.password" class="mt-2">
            <div class="flex space-x-1">
              <div
                v-for="i in 4"
                :key="i"
                class="flex-1 h-1 rounded-full"
                :class="getPasswordStrengthColor(i)"
              />
            </div>
            <p class="text-xs mt-1" :class="getPasswordStrengthTextColor()">
              {{ passwordStrengthText }}
            </p>
          </div>
        </div>

        <!-- Remember me (login only) -->
        <div v-if="!isRegistering" class="flex items-center justify-between">
          <label class="flex items-center">
            <input
              v-model="form.rememberMe"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
          </label>
          
          <button
            type="button"
            @click="showForgotPassword = true"
            class="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot password?
          </button>
        </div>

        <!-- Terms acceptance (registration only) -->
        <div v-if="isRegistering">
          <label class="flex items-start">
            <input
              v-model="form.acceptTerms"
              type="checkbox"
              required
              class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              I agree to the 
              <a href="#" class="text-blue-600 hover:text-blue-500">Terms of Service</a>
              and 
              <a href="#" class="text-blue-600 hover:text-blue-500">Privacy Policy</a>
            </span>
          </label>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        </div>

        <!-- Account lockout warning -->
        <div v-if="lockoutMessage" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p class="text-sm text-yellow-600 dark:text-yellow-400">{{ lockoutMessage }}</p>
        </div>

        <!-- Submit button -->
        <button
          type="submit"
          :disabled="isLoading || (isRegistering && !form.acceptTerms)"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <div v-if="isLoading" class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            {{ isRegistering ? 'Creating Account...' : 'Signing In...' }}
          </div>
          <span v-else>
            {{ isRegistering ? 'Create Account' : 'Sign In' }}
          </span>
        </button>
      </form>

      <!-- Switch between login/register -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ isRegistering ? 'Already have an account?' : "Don't have an account?" }}
          <button
            @click="toggleMode"
            class="text-blue-600 hover:text-blue-500 font-medium ml-1"
          >
            {{ isRegistering ? 'Sign In' : 'Sign Up' }}
          </button>
        </p>
      </div>

      <!-- Close button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <XMarkIcon class="h-6 w-6" />
      </button>
    </div>

    <!-- Forgot Password Modal -->
    <ForgotPasswordModal 
      v-if="showForgotPassword" 
      @close="showForgotPassword = false"
      @success="handleForgotPasswordSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../../stores/auth'
import ForgotPasswordModal from './ForgotPasswordModal.vue'

interface Props {
  isVisible: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()

const isRegistering = ref(false)
const isLoading = ref(false)
const showPassword = ref(false)
const showForgotPassword = ref(false)
const errorMessage = ref('')
const lockoutMessage = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  rememberMe: false,
  acceptTerms: false
})

// Password strength calculation
const passwordStrength = computed(() => {
  const password = form.password
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  
  return Math.min(strength, 4)
})

const passwordStrengthText = computed(() => {
  const texts = ['', 'Weak', 'Fair', 'Good', 'Strong']
  return texts[passwordStrength.value]
})

const getPasswordStrengthColor = (index: number) => {
  if (passwordStrength.value >= index) {
    if (passwordStrength.value <= 1) return 'bg-red-500'
    if (passwordStrength.value <= 2) return 'bg-yellow-500'
    if (passwordStrength.value <= 3) return 'bg-blue-500'
    return 'bg-green-500'
  }
  return 'bg-gray-200 dark:bg-gray-600'
}

const getPasswordStrengthTextColor = () => {
  if (passwordStrength.value <= 1) return 'text-red-500'
  if (passwordStrength.value <= 2) return 'text-yellow-500'
  if (passwordStrength.value <= 3) return 'text-blue-500'
  return 'text-green-500'
}

const toggleMode = () => {
  isRegistering.value = !isRegistering.value
  errorMessage.value = ''
  lockoutMessage.value = ''
  
  // Reset form
  Object.assign(form, {
    name: '',
    email: '',
    password: '',
    rememberMe: false,
    acceptTerms: false
  })
}

const handleSubmit = async () => {
  if (isLoading.value) return
  
  errorMessage.value = ''
  lockoutMessage.value = ''
  isLoading.value = true
  
  try {
    if (isRegistering.value) {
      await authStore.register({
        email: form.email,
        password: form.password,
        name: form.name,
        acceptTerms: form.acceptTerms
      })
    } else {
      await authStore.login(form.email, form.password, form.rememberMe)
    }
    
    emit('success')
    emit('close')
  } catch (error: any) {
    console.error('Authentication error:', error)
    
    if (error.message.includes('locked')) {
      lockoutMessage.value = error.message
    } else {
      errorMessage.value = error.message || 'An error occurred. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

const handleForgotPasswordSuccess = () => {
  showForgotPassword.value = false
  // Show success message or redirect
}

// Initialize device ID when component mounts
watch(() => props.isVisible, (visible) => {
  if (visible) {
    authStore.initialize()
  }
})
</script>

<style scoped>
/* Custom animations for modal */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>