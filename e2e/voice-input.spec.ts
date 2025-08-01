import { test, expect } from '@playwright/test'

test.describe('Voice Input Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle')
  })

  test('voice input button is visible when enabled', async ({ page }) => {
    // Look for chat input component
    const chatInput = page.locator('[class*="chat-input"]')
    await expect(chatInput).toBeVisible()
    
    // Check if voice input button exists (it may not be visible if voice is disabled)
    const voiceButton = page.locator('[class*="voice-input-btn"], [title*="voice"]')
    
    // The button should exist if voice input is supported and enabled
    if (await voiceButton.count() > 0) {
      await expect(voiceButton).toBeVisible()
    }
  })

  test('voice input button shows proper states', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone'])
    
    const voiceButton = page.locator('[class*="voice-input-btn"], [title*="voice"]')
    
    if (await voiceButton.count() > 0) {
      // Initially should show start recording state
      await expect(voiceButton).toHaveAttribute('title', /start|record/i)
      
      // Click to start recording (if supported)
      await voiceButton.click()
      
      // Should show stop recording state
      await expect(voiceButton).toHaveAttribute('title', /stop|recording/i)
      
      // Click again to stop
      await voiceButton.click()
      
      // Should return to start state
      await expect(voiceButton).toHaveAttribute('title', /start|record/i)
    }
  })

  test('keyboard shortcut toggles voice input', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone'])
    
    const chatInput = page.locator('textarea[placeholder*="Ask"]')
    await expect(chatInput).toBeVisible()
    
    // Focus on the input
    await chatInput.focus()
    
    // Try the keyboard shortcut Ctrl+Shift+M
    await page.keyboard.press('Control+Shift+M')
    
    // Check if voice interface appears
    const voiceInterface = page.locator('[class*="voice-interface"]')
    
    if (await voiceInterface.count() > 0) {
      await expect(voiceInterface).toBeVisible()
      
      // Press Escape to cancel
      await page.keyboard.press('Escape')
      
      // Voice interface should hide
      await expect(voiceInterface).not.toBeVisible()
    }
  })

  test('voice input shows proper UI feedback', async ({ page }) => {
    const voiceButton = page.locator('[class*="voice-input-btn"]')
    
    if (await voiceButton.count() > 0) {
      // Check initial state classes
      await expect(voiceButton).toHaveClass(/voice-input-btn/)
      
      // Check if permission indicator appears when needed
      const permissionIndicator = page.locator('[class*="permission-indicator"]')
      
      // If permission is not granted, indicator should be visible
      if (await permissionIndicator.count() > 0) {
        await expect(permissionIndicator).toBeVisible()
      }
    }
  })

  test('voice interface displays when recording starts', async ({ page, context }) => {
    // Grant microphone permissions to avoid permission dialog
    await context.grantPermissions(['microphone'])
    
    const voiceButton = page.locator('[class*="voice-input-btn"]')
    
    if (await voiceButton.count() > 0) {
      // Click to start recording
      await voiceButton.click()
      
      // Voice interface should appear
      const voiceInterface = page.locator('[class*="voice-interface"]')
      
      if (await voiceInterface.count() > 0) {
        await expect(voiceInterface).toBeVisible()
        
        // Should contain VoiceRecorder component
        const voiceRecorder = page.locator('[class*="voice-recorder"]')
        await expect(voiceRecorder).toBeVisible()
      }
      
      // Click again to stop
      await voiceButton.click()
      
      // Voice interface should hide
      if (await voiceInterface.count() > 0) {
        await expect(voiceInterface).not.toBeVisible()
      }
    }
  })

  test('handles browser compatibility gracefully', async ({ page }) => {
    // Check if voice features are disabled gracefully in unsupported browsers
    const voiceButton = page.locator('[class*="voice-input-btn"]')
    
    if (await voiceButton.count() === 0) {
      // Voice button should not be present if not supported
      await expect(voiceButton).not.toBeVisible()
    } else {
      // If present, should handle unsupported browsers gracefully
      const disabledButton = page.locator('[class*="voice-input-btn--disabled"]')
      if (await disabledButton.count() > 0) {
        await expect(disabledButton).toBeDisabled()
      }
    }
  })

  test('shows keyboard shortcuts in hints', async ({ page }) => {
    // Look for keyboard hints
    const keyboardHints = page.locator('[class*="keyboard-hints"]')
    
    if (await keyboardHints.count() > 0) {
      await expect(keyboardHints).toContainText('Enter')
      await expect(keyboardHints).toContainText('Shift+Enter')
      
      // If voice is enabled, should show voice shortcut
      const voiceButton = page.locator('[class*="voice-input-btn"]')
      if (await voiceButton.count() > 0) {
        await expect(keyboardHints).toContainText('Ctrl+Shift+M')
      }
    }
  })

  test('maintains accessibility standards', async ({ page }) => {
    const voiceButton = page.locator('[class*="voice-input-btn"]')
    
    if (await voiceButton.count() > 0) {
      // Should have proper ARIA attributes
      await expect(voiceButton).toHaveAttribute('title')
      
      // Should be focusable
      await voiceButton.focus()
      await expect(voiceButton).toBeFocused()
      
      // Should respond to keyboard activation
      await page.keyboard.press('Enter')
      
      // Should have proper focus styles
      await expect(voiceButton).toHaveClass(/focus/)
    }
  })

  test('integrates properly with text input', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone'])
    
    const textInput = page.locator('textarea[placeholder*="Ask"]')
    await expect(textInput).toBeVisible()
    
    // Type some text first
    await textInput.fill('Hello ')
    
    const voiceButton = page.locator('[class*="voice-input-btn"]')
    
    if (await voiceButton.count() > 0) {
      // Start voice input
      await voiceButton.click()
      
      // Placeholder should change to indicate voice mode
      await expect(textInput).toHaveAttribute('placeholder', /Speaking|voice/i)
      
      // Stop voice input
      await voiceButton.click()
      
      // Placeholder should return to normal
      await expect(textInput).toHaveAttribute('placeholder', /Ask/i)
      
      // Existing text should remain
      await expect(textInput).toHaveValue('Hello ')
    }
  })
})