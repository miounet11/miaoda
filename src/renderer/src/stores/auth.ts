import { defineStore } from 'pinia'
import { ref } from 'vue'

// 简化的用户偏好设置接口
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  fontSize: 'small' | 'medium' | 'large'
}

// 简化的认证存储 - 只保留用户偏好设置
export const useAuthStore = defineStore(
  'auth',
  () => {
    // 简化的状态 - 只保留用户偏好设置
    const preferences = ref<UserPreferences>({
      theme: 'light',
      language: 'zh-CN',
      fontSize: 'medium',
    })

    const isLoading = ref(false)

    // Actions - 只保留偏好设置相关功能
    const updatePreferences = async (updates: Partial<UserPreferences>) => {
      try {
        isLoading.value = true
        preferences.value = { ...preferences.value, ...updates }

        // 保存到本地存储
        localStorage.setItem('miaoda-preferences', JSON.stringify(preferences.value))

        return preferences.value
      } catch (error: any) {
        console.error('更新偏好设置失败:', error)
        throw error
      } finally {
        isLoading.value = false
      }
    }

    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem('miaoda-preferences')
        if (saved) {
          preferences.value = { ...preferences.value, ...JSON.parse(saved) }
        }
      } catch (error) {
        console.error('加载偏好设置失败:', error)
      }
    }

    const resetPreferences = () => {
      preferences.value = {
        theme: 'light',
        language: 'zh-CN',
        fontSize: 'medium',
      }
      localStorage.removeItem('miaoda-preferences')
    }

    // 初始化时加载偏好设置
    loadPreferences()

    return {
      // State
      preferences,
      isLoading,

      // Actions
      updatePreferences,
      loadPreferences,
      resetPreferences,
    }
  },
  {
    persist: {
      key: 'miaoda-preferences-store',
      paths: ['preferences'],
      storage: localStorage,
    },
  } as any,
)
