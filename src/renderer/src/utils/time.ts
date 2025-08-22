export function formatDistanceToNow(date: Date | string | number | null | undefined): string {
  try {
    // Handle null/undefined gracefully
    if (date === null || date === undefined) {
      return 'just now'
    }
    
    // Handle different input types
    let dateObj: Date
    
    if (date instanceof Date) {
      dateObj = date
    } else if (typeof date === 'string') {
      // Handle empty strings
      if (date.trim() === '') {
        return 'just now'
      }
      dateObj = new Date(date)
    } else if (typeof date === 'number') {
      // Handle zero or negative numbers
      if (date <= 0) {
        return 'just now'
      }
      dateObj = new Date(date)
    } else {
      // Don't log warnings for invalid types as they're handled gracefully
      return 'just now'
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      // Don't log warnings for invalid dates as they're handled gracefully
      return 'just now'
    }
    
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()
    
    // Handle future dates gracefully
    if (diff < -86400000) { // More than 1 day in future
      return dateObj.toLocaleDateString()
    } else if (diff < 0) {
      return 'just now' // Treat near-future as "just now"
    }
    
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 30) {
      // Show actual date for old messages
      return dateObj.toLocaleDateString()
    } else if (days > 0) {
      return `${days}d ago`
    } else if (hours > 0) {
      return `${hours}h ago`
    } else if (minutes > 0) {
      return `${minutes}m ago`
    } else if (seconds > 30) {
      return 'moments ago'
    } else {
      return 'just now'
    }
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', date)
    return 'just now' // More user-friendly fallback
  }
}

// Additional helper function for more precise time formatting
export function formatTimeWithFallback(timestamp: any): string {
  // First try the main function
  const result = formatDistanceToNow(timestamp)
  
  // If we get an unexpected result, try additional fallbacks
  if (result === 'just now' && timestamp) {
    try {
      // Try to extract useful info from the timestamp object
      if (typeof timestamp === 'object' && timestamp !== null) {
        // Check for common timestamp properties
        if ('_seconds' in timestamp && '_nanoseconds' in timestamp) {
          // Firestore timestamp format
          const seconds = timestamp._seconds || timestamp.seconds
          const date = new Date(seconds * 1000)
          return formatDistanceToNow(date)
        } else if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
          // Firestore timestamp with toDate method
          return formatDistanceToNow(timestamp.toDate())
        } else if ('getTime' in timestamp && typeof timestamp.getTime === 'function') {
          // Date-like object
          return formatDistanceToNow(timestamp.getTime())
        }
      }
    } catch (e) {
      console.warn('Failed to extract time from object:', timestamp, e)
    }
  }
  
  return result
}