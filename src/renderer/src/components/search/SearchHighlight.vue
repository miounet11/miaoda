<template>
  <span v-html="highlightedText" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  text: string
  query?: string | string[]
  highlightClass?: string
  caseSensitive?: boolean
  wholeWords?: boolean
  maxLength?: number
  ellipsis?: string
  contextLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  highlightClass: 'bg-yellow-200 dark:bg-yellow-900 text-inherit font-medium',
  caseSensitive: false,
  wholeWords: false,
  maxLength: 300,
  ellipsis: '...',
  contextLength: 50
})

const highlightedText = computed(() => {
  if (!props.text || !props.query) {
    return escapeHtml(truncateText(props.text))
  }

  // Normalize query to array
  const queries = Array.isArray(props.query) ? props.query : [props.query]
  const validQueries = queries.filter(q => q && q.trim().length > 0)

  if (validQueries.length === 0) {
    return escapeHtml(truncateText(props.text))
  }

  let workingText = props.text

  // Find the best excerpt if text is too long
  if (props.text.length > props.maxLength) {
    workingText = findBestExcerpt(props.text, validQueries)
  }

  // Escape HTML first
  let highlighted = escapeHtml(workingText)

  // Apply highlighting
  validQueries.forEach(query => {
    const escapedQuery = escapeRegex(query)
    let pattern: string

    if (props.wholeWords) {
      pattern = `\\b(${escapedQuery})\\b`
    } else {
      pattern = `(${escapedQuery})`
    }

    const flags = props.caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(pattern, flags)

    highlighted = highlighted.replace(regex, `<mark class="${props.highlightClass}">$1</mark>`)
  })

  return highlighted
})

// Find the best excerpt containing search terms
const findBestExcerpt = (text: string, queries: string[]): string => {
  // Find first occurrence of any query
  let bestPosition = -1
  let matchedQuery = ''

  for (const query of queries) {
    const flags = props.caseSensitive ? '' : 'i'
    const regex = new RegExp(escapeRegex(query), flags)
    const match = text.match(regex)

    if (match && match.index !== undefined) {
      if (bestPosition === -1 || match.index < bestPosition) {
        bestPosition = match.index
        matchedQuery = query
      }
    }
  }

  if (bestPosition === -1) {
    // No match found, return beginning of text
    return text.substring(0, props.maxLength) + (text.length > props.maxLength ? props.ellipsis : '')
  }

  // Calculate excerpt boundaries
  const queryLength = matchedQuery.length
  const contextEachSide = Math.floor((props.maxLength - queryLength) / 2)
  let start = Math.max(0, bestPosition - contextEachSide)
  let end = Math.min(text.length, bestPosition + queryLength + contextEachSide)

  // Adjust to word boundaries if possible
  if (start > 0) {
    const wordBoundary = text.lastIndexOf(' ', start + 10)
    if (wordBoundary > 0 && wordBoundary > start - 20) {
      start = wordBoundary + 1
    }
  }

  if (end < text.length) {
    const wordBoundary = text.indexOf(' ', end - 10)
    if (wordBoundary > 0 && wordBoundary < end + 20) {
      end = wordBoundary
    }
  }

  // Build excerpt
  let excerpt = ''
  if (start > 0) excerpt += props.ellipsis
  excerpt += text.substring(start, end)
  if (end < text.length) excerpt += props.ellipsis

  return excerpt
}

// Truncate text if no query is provided
const truncateText = (text: string): string => {
  if (!text || text.length <= props.maxLength) {
    return text || ''
  }

  const truncated = text.substring(0, props.maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > props.maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + props.ellipsis
  }

  return truncated + props.ellipsis
}

// Escape HTML characters
const escapeHtml = (text: string): string => {
  if (!text) return ''

  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }

  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Escape regex special characters
const escapeRegex = (text: string): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
</script>

<style scoped>
/* Ensure mark elements inside don't break layout */
:deep(mark) {
  padding: 0.125rem 0.25rem;
  border-radius: 0.125rem;
  background-color: var(--highlight-bg, #fef3c7);
  color: var(--highlight-color, inherit);
}

.dark :deep(mark) {
  background-color: var(--highlight-bg-dark, #92400e);
}
</style>