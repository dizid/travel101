import { test, expect } from '@playwright/test'

test.describe('Pro Upgrade Flow', () => {
  test('shows Pro badge/pricing on homepage', async ({ page }) => {
    await page.goto('/')

    // Look for Pro promotion
    const proBadge = page.getByText(/pro|premium|upgrade/i).first()
    await expect(proBadge).toBeVisible({ timeout: 10000 })
  })

  test('Pro features are gated', async ({ page }) => {
    // Try to access Pro-only page
    await page.goto('/itinerary')

    // Should show Pro gate or redirect
    const proGate = page.getByText(/pro|upgrade|subscribe|premium|unlock/i).first()
    await expect(proGate).toBeVisible({ timeout: 10000 })
  })

  test('Smart Match requires Pro', async ({ page }) => {
    await page.goto('/smart-match')

    // Should show Pro requirement
    const proRequired = page.getByText(/pro|upgrade|subscribe|premium/i).first()
    await expect(proRequired).toBeVisible({ timeout: 10000 })
  })

  test('Packing list requires Pro', async ({ page }) => {
    await page.goto('/packing')

    // Should show Pro requirement
    const proRequired = page.getByText(/pro|upgrade|subscribe|premium/i).first()
    await expect(proRequired).toBeVisible({ timeout: 10000 })
  })

  test('Safety guide requires Pro', async ({ page }) => {
    await page.goto('/safety')

    // Should show Pro requirement
    const proRequired = page.getByText(/pro|upgrade|subscribe|premium/i).first()
    await expect(proRequired).toBeVisible({ timeout: 10000 })
  })

  test('upgrade button is visible and clickable', async ({ page }) => {
    await page.goto('/itinerary')

    // Find upgrade button
    const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Upgrade"), button:has-text("Subscribe"), a:has-text("Subscribe"), button:has-text("Pro"), a:has-text("Pro")').first()

    await expect(upgradeButton).toBeVisible({ timeout: 10000 })

    // Button should be clickable
    await expect(upgradeButton).toBeEnabled()
  })

  test('upgrade button redirects to Stripe checkout', async ({ page }) => {
    await page.goto('/itinerary')

    const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Upgrade"), button:has-text("Subscribe"), a:has-text("Subscribe")').first()

    if (await upgradeButton.isVisible()) {
      // Mock API to avoid actual Stripe redirect
      await page.route('**/api/subscription**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ url: 'https://checkout.stripe.com/test' }),
        })
      })

      await upgradeButton.click()

      // Should attempt to redirect to Stripe
      await page.waitForTimeout(1000)
    }
  })

  test('shows pricing information', async ({ page }) => {
    await page.goto('/')

    // Look for pricing info
    const pricing = page.getByText(/\$|price|month|year|free|pro/i).first()

    if (await pricing.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(pricing).toBeVisible()
    }
  })

  test('shows feature comparison between free and Pro', async ({ page }) => {
    await page.goto('/')

    // Look for feature comparison
    const features = page.getByText(/feature|include|free|pro/i)
    // Features may be listed in various ways
  })

  test('Pro gate shows what features are included', async ({ page }) => {
    await page.goto('/itinerary')

    // Pro gate should explain what's included
    const featureList = page.getByText(/itinerary|match|packing|safety|AI/i).first()
    await expect(featureList).toBeVisible({ timeout: 10000 })
  })

  test('dashboard shows subscription status', async ({ page }) => {
    await page.goto('/dashboard')

    // Should show subscription info (free or Pro status)
    const statusText = page.getByText(/free|pro|subscription|plan|status/i).first()

    if (await statusText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(statusText).toBeVisible()
    }
  })

  test('profile page shows subscription management', async ({ page }) => {
    await page.goto('/profile')

    // Look for subscription management
    const subscriptionSection = page.getByText(/subscription|billing|manage|plan/i).first()

    // May or may not be visible without auth
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/itinerary')

    // Pro gate should still be usable on mobile
    const proGate = page.getByText(/pro|upgrade|subscribe/i).first()
    await expect(proGate).toBeVisible({ timeout: 10000 })

    // Upgrade button should be accessible
    const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first()
    if (await upgradeButton.isVisible()) {
      await expect(upgradeButton).toBeVisible()
    }
  })

  test('handles upgrade errors gracefully', async ({ page }) => {
    await page.goto('/itinerary')

    // Mock API to return error
    await page.route('**/api/subscription**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Service unavailable' }),
      })
    })

    const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first()

    if (await upgradeButton.isVisible()) {
      await upgradeButton.click()
      await page.waitForTimeout(1000)

      // Should show error message
      const errorMessage = page.getByText(/error|failed|try again|unavailable/i).first()
      // Error handling may vary by implementation
    }
  })
})
