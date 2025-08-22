<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Change Password
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          Update your account password
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Current Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Password
          </label>
          <div class="relative">
            <input
              v-model="form.currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              required
              class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter your current password"
            />
            <button
              type="button"
              @click="showCurrentPassword = !showCurrentPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <EyeIcon v-if="!showCurrentPassword" class="h-5 w-5" />
              <EyeSlashIcon v-else class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- New Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Password
          </label>
          <div class="relative">
            <input
              v-model="form.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              required
              class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter your new password"
            />
            <button
              type="button"
              @click="showNewPassword = !showNewPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <EyeIcon v-if="!showNewPassword" class="h-5 w-5" />
              <EyeSlashIcon v-else class="h-5 w-5" />
            </button>
          </div>
          
          <!-- Password strength indicator -->
          <div v-if="form.newPassword" class="mt-2">
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

        <!-- Confirm New Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm New Password
          </label>
          <div class="relative">
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <EyeIcon v-if="!showConfirmPassword" class="h-5 w-5" />
              <EyeSlashIcon v-else class="h-5 w-5" />
            </button>
          </div>
          
          <!-- Password match indicator -->
          <div v-if="form.confirmPassword" class="mt-1">
            <p v-if="passwordsMatch" class="text-xs text-green-500">
              ✓ Passwords match
            </p>
            <p v-else class="text-xs text-red-500">
              ✗ Passwords do not match
            </p>
          </div>
        </div>

        <!-- Password Requirements -->
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password Requirements:
          </h4>
          <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li :class="hasMinLength ? 'text-green-500' : ''">
              {{ hasMinLength ? '✓' : '•' }} At least 8 characters
            </li>
            <li :class="hasLowerCase ? 'text-green-500' : ''">
              {{ hasLowerCase ? '✓' : '•' }} One lowercase letter
            </li>
            <li :class="hasUpperCase ? 'text-green-500' : ''">
              {{ hasUpperCase ? '✓' : '•' }} One uppercase letter
            </li>
            <li :class="hasNumber ? 'text-green-500' : ''">
              {{ hasNumber ? '✓' : '•' }} One number
            </li>
            <li :class="hasSpecialChar ? 'text-green-500' : ''">
              {{ hasSpecialChar ? '✓' : '•' }} One special character
            </li>
          </ul>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        </div>

        <!-- Action buttons -->
        <div class="flex space-x-3 pt-4">
          <button
            type="submit"
            :disabled="!canSubmit || isLoading"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <div v-if="isLoading" class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Changing...
            </div>
            <span v-else>Change Password</span>
          </button>
          
          <button
            type="button"
            @click="$emit('close')"
            :disabled="isLoading"
            class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      <!-- Close button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <XMarkIcon class="h-6 w-6" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../../stores/auth'

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const emit = defineEmits<Emits>()

const authStore = useAuthStore()

const isLoading = ref(false)
const errorMessage = ref('')

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Password validation
const hasMinLength = computed(() => form.newPassword.length >= 8)
const hasLowerCase = computed(() => /[a-z]/.test(form.newPassword))
const hasUpperCase = computed(() => /[A-Z]/.test(form.newPassword))
const hasNumber = computed(() => /[0-9]/.test(form.newPassword))
const hasSpecialChar = computed(() => /[^A-Za-z0-9]/.test(form.newPassword))

const passwordsMatch = computed(() => 
  form.newPassword === form.confirmPassword && form.confirmPassword.length > 0
)

const isPasswordValid = computed(() => 
  hasMinLength.value && hasLowerCase.value && hasUpperCase.value && hasNumber.value
)

const canSubmit = computed(() => 
  form.currentPassword && 
  form.newPassword && 
  form.confirmPassword && 
  passwordsMatch.value && 
  isPasswordValid.value &&
  form.currentPassword !== form.newPassword
)

// Password strength calculation
const passwordStrength = computed(() => {
  let strength = 0
  if (hasMinLength.value) strength++
  if (hasLowerCase.value) strength++
  if (hasUpperCase.value) strength++
  if (hasNumber.value) strength++
  if (hasSpecialChar.value) strength++
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

const handleSubmit = async () => {
  if (!canSubmit.value || isLoading.value) return
  
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    await authStore.changePassword(form.currentPassword, form.newPassword)
    
    emit('success')
    emit('close')
  } catch (error: any) {
    console.error('Password change error:', error)
    errorMessage.value = error.message || 'Failed to change password. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>