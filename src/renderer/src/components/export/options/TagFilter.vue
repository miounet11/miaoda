<template>
  <div class="space-y-4 mt-6">
    <h4 class="text-md font-semibold text-gray-900 dark:text-white">Tag Filter</h4>
    
    <div class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by Tags (leave empty to include all)
        </label>
        <div class="flex items-center space-x-2">
          <input
            type="text"
            v-model="newTag"
            @keydown.enter="addTag"
            placeholder="Enter tag name..."
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
          <button
            @click="addTag"
            :disabled="!newTag.trim()"
            class="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
      
      <div v-if="tags.length > 0" class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Tags:</span>
          <button
            @click="clearTags"
            class="text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Clear All
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(tag, index) in tags"
            :key="index"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
          >
            {{ tag }}
            <button
              @click="removeTag(index)"
              class="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              ×
            </button>
          </span>
        </div>
      </div>
      
      <div class="text-xs text-gray-500 dark:text-gray-400">
        Only conversations with these tags will be included in the export.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  tags: string[]
}

interface Emits {
  (e: 'update:tags', value: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const newTag = ref('')

const tags = computed({
  get: () => props.tags || [],
  set: (value) => emit('update:tags', value)
})

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !tags.value.includes(tag)) {
    emit('update:tags', [...tags.value, tag])
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  const updatedTags = [...tags.value]
  updatedTags.splice(index, 1)
  emit('update:tags', updatedTags)
}

const clearTags = () => {
  emit('update:tags', [])
}
</script>