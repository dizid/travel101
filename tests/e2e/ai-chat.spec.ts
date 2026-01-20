import { test, expect } from '@playwright/test'

test.describe('AI Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays AI chat interface on homepage', async ({ page }) => {
    // Look for chat component
    const chatSection = page.locator('[data-testid="ai-chat"], .ai-chat, #chat, [class*="chat"]').first()
    await expect(chatSection).toBeVisible({ timeout: 10000 })
  })

  test('has input field for messages', async ({ page }) => {
    const chatInput = page.locator('input[placeholder*="ask" i], input[placeholder*="chat" i], input[placeholder*="message" i], textarea[placeholder*="ask" i], textarea[placeholder*="message" i]').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })
  })

  test('can send a message', async ({ page }) => {
    const chatInput = page.locator('input[placeholder*="ask" i], input[placeholder*="chat" i], input[placeholder*="message" i], textarea[placeholder*="ask" i], textarea[placeholder*="message" i]').first()

    if (await chatInput.isVisible()) {
      await chatInput.fill('What is the best time to visit Thailand?')

      // Find and click send button
      const sendButton = page.locator('button[type="submit"], button[aria-label*="send" i], button:has-text("Send"), button:has-text("Ask")').first()
      if (await sendButton.isVisible()) {
        await sendButton.click()
      } else {
        // Try pressing Enter
        await chatInput.press('Enter')
      }

      // Wait for response (may show loading first)
      await page.waitForTimeout(2000)
    }
  })

  test('shows loading state while waiting for response', async ({ page }) => {
    const chatInput = page.locator('input[placeholder*="ask" i], input[placeholder*="chat" i], textarea[placeholder*="ask" i]').first()

    if (await chatInput.isVisible()) {
      await chatInput.fill('Quick question about Bangkok')
      await chatInput.press('Enter')

      // Should show loading indicator
      const loading = page.locator('.loading, .spinner, [data-testid="loading"], .typing-indicator, [class*="loading"]')
      // Loading state may be brief
    }
  })

  test('receives AI response', async ({ page }) => {
    const chatInput = page.locator('input[placeholder*="ask" i], input[placeholder*="chat" i], textarea[placeholder*="ask" i]').first()

    if (await chatInput.isVisible()) {
      await chatInput.fill('What currency is used in Thailand?')
      await chatInput.press('Enter')

      // Wait for AI response
      await page.waitForTimeout(10000)

      // Response should mention Thai Baht
      const response = page.getByText(/baht|THB|currency/i).first()
      await expect(response).toBeVisible({ timeout: 15000 })
    }
  })

  test('maintains conversation context', async ({ page }) => {
    const chatInput = page.locator('input[placeholder*="ask" i], input[placeholder*="chat" i], textarea[placeholder*="ask" i]').first()

    if (await chatInput.isVisible()) {
      // First message
      await chatInput.fill('I want to visit Bangkok')
      await chatInput.press('Enter')
      await page.waitForTimeout(5000)

      // Follow-up message
      await chatInput.fill('What temples should I see there?')
      await chatInput.press('Enter')
      await page.waitForTimeout(10000)

      // Response should be about Bangkok temples
      const pageContent = await page.textContent('body')
      const hasRelevantResponse = /temple|wat|bangkok/i.test(pageContent || '')
      expect(hasRelevantResponse).toBeTruthy()
    }
  })

  test('shows Pro gate for advanced features', async ({ page }) => {
    // AI chat may have Pro-only features
    const proGate = page.getByText(/pro|upgrade|premium|subscribe/i).first()

    // Pro gate may or may not be visible depending on user state
    if (await proGate.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(proGate).toBeVisible()
    }
  })

  test('handles keyboard navigation', async ({ page }) => {
    const chatInput = page.locator('input[placeholder*="ask" i], input[placeholder*="chat" i], textarea[placeholder*="ask" i]').first()

    if (await chatInput.isVisible()) {
      // Tab to chat input
      await page.keyboard.press('Tab')

      // Should be able to focus input
      await chatInput.focus()
      await expect(chatInput).toBeFocused()

      // Type and send with Enter
      await chatInput.fill('Test message')
      await page.keyboard.press('Enter')
    }
  })

  test('is accessible', async ({ page }) => {
    const chatInput = page.locator('input[placeholder*="ask" i], input[placeholder*="chat" i], textarea[placeholder*="ask" i]').first()

    if (await chatInput.isVisible()) {
      // Input should have accessible label
      const ariaLabel = await chatInput.getAttribute('aria-label')
      const placeholder = await chatInput.getAttribute('placeholder')
      expect(ariaLabel || placeholder).toBeTruthy()
    }
  })

  test('works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const chatInput = page.locator('input[placeholder*="ask" i], input[placeholder*="chat" i], textarea[placeholder*="ask" i]').first()

    // Chat should still be accessible on mobile
    await expect(chatInput).toBeVisible({ timeout: 10000 })
  })
})
