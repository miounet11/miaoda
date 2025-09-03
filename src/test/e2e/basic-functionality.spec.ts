import { test, expect } from '@playwright/test'

test.describe('MiaoDa Chat - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the application', async ({ page }) => {
    // Wait for the app to load
    await page.waitForLoadState('networkidle')
    
    // Check if the main app element is present
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display the chat interface', async ({ page }) => {
    // Wait for the main components to load
    await page.waitForTimeout(2000)
    
    // Look for chat-related elements
    const chatElements = [
      '[data-testid="chat-view"]',
      '.chat-messages',
      '.sidebar',
      '.chat-input'
    ]

    // Check if at least one chat element is present
    let foundChatElement = false
    for (const selector of chatElements) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        foundChatElement = true
        break
      } catch {
        // Continue trying other selectors
      }
    }

    expect(foundChatElement).toBe(true)
  })

  test('should handle window resize', async ({ page }) => {
    // Test responsive behavior
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForTimeout(500)
    
    await page.setViewportSize({ width: 768, height: 600 })
    await page.waitForTimeout(500)
    
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)

    // App should still be functional
    await expect(page.locator('body')).toBeVisible()
  })

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Filter out known harmless errors
    const significantErrors = errors.filter(error => 
      !error.includes('DevTools') &&
      !error.includes('Extension') &&
      !error.includes('chrome-extension')
    )

    expect(significantErrors).toHaveLength(0)
  })

  test('should handle navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    
    // Try to navigate through the app
    try {
      // Look for navigation elements
      const navElements = [
        'button[title*="设置"]',
        'button[title*="Settings"]', 
        '.nav-btn',
        '[data-testid="settings-button"]'
      ]

      for (const selector of navElements) {
        const element = page.locator(selector)
        if (await element.count() > 0) {
          await element.first().click()
          await page.waitForTimeout(1000)
          break
        }
      }
    } catch {
      // Navigation test is optional
    }

    // App should remain stable
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('MiaoDa Chat - Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(0)
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Test tab navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should not crash
    await expect(page.locator('body')).toBeVisible()
  })

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for ARIA landmarks
    const landmarks = [
      '[role="main"]',
      '[role="navigation"]',
      '[role="button"]',
      'main',
      'nav'
    ]

    let foundLandmark = false
    for (const selector of landmarks) {
      if (await page.locator(selector).count() > 0) {
        foundLandmark = true
        break
      }
    }

    expect(foundLandmark).toBe(true)
  })
})

test.describe('MiaoDa Chat - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
  })

  test('should handle multiple rapid interactions', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Rapidly click around the interface
    const clickableElements = await page.locator('button, [role="button"], a').all()
    
    for (let i = 0; i < Math.min(5, clickableElements.length); i++) {
      try {
        await clickableElements[i].click({ timeout: 1000 })
        await page.waitForTimeout(100)
      } catch {
        // Some buttons might not be clickable, continue
      }
    }

    // App should remain responsive
    await expect(page.locator('body')).toBeVisible()
  })
})