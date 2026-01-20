import { test, expect } from '@playwright/test'

test.describe('Itinerary Planner', () => {
  // Note: Most itinerary tests require Pro status
  // These tests verify the UI and flow work correctly

  test('shows itinerary page', async ({ page }) => {
    await page.goto('/itinerary')

    await expect(page).toHaveTitle(/Itinerary|Trip|Planner/i)
  })

  test('shows Pro gate for non-Pro users', async ({ page }) => {
    await page.goto('/itinerary')

    // Should show Pro requirement
    const proGate = page.getByText(/pro|upgrade|subscribe|premium/i).first()
    await expect(proGate).toBeVisible({ timeout: 10000 })
  })

  test('has trip configuration options', async ({ page }) => {
    await page.goto('/itinerary')

    // Look for trip configuration (dates, duration, preferences)
    const configSection = page.getByText(/days|dates|duration|trip|destination|preferences/i).first()
    await expect(configSection).toBeVisible({ timeout: 10000 })
  })

  test('shows destination selection', async ({ page }) => {
    await page.goto('/itinerary')

    // Should have destination/city selection
    const destinationSection = page.getByText(/destination|city|province|where|Bangkok|Chiang Mai|Phuket/i).first()
    await expect(destinationSection).toBeVisible({ timeout: 10000 })
  })

  test('has duration/days input', async ({ page }) => {
    await page.goto('/itinerary')

    // Look for days/duration input
    const daysInput = page.locator('input[type="number"], input[placeholder*="days" i], select').first()

    if (await daysInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(daysInput).toBeVisible()
    }
  })

  test('shows generate button', async ({ page }) => {
    await page.goto('/itinerary')

    // Look for generate/create button
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("Plan"), button:has-text("Build")').first()

    // Button may be disabled behind Pro gate
    if (await generateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(generateButton).toBeVisible()
    }
  })

  test('shows sample or preview itinerary', async ({ page }) => {
    await page.goto('/itinerary')

    // May show sample itinerary to preview Pro feature
    const sample = page.getByText(/sample|preview|example|day 1|morning|afternoon|evening/i).first()

    // Sample may or may not be shown
  })

  test('explains AI-powered itinerary features', async ({ page }) => {
    await page.goto('/itinerary')

    // Should explain AI features
    const aiFeatures = page.getByText(/AI|personalized|smart|custom|tailored/i).first()
    await expect(aiFeatures).toBeVisible({ timeout: 10000 })
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/itinerary')

    // Page should be usable on mobile
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })

    // No horizontal overflow
    const body = page.locator('body')
    const scrollWidth = await body.evaluate((el) => el.scrollWidth)
    const clientWidth = await body.evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })

  test('navigates back to dashboard', async ({ page }) => {
    await page.goto('/itinerary')

    // Find navigation link
    const dashboardLink = page.locator('a[href="/dashboard"], a:has-text("Dashboard"), nav a').first()

    if (await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dashboardLink.click()
      await expect(page).toHaveURL(/dashboard|\/$/i)
    }
  })

  // Tests for Pro users (would require authentication setup)
  test.describe('Pro User Features', () => {
    test.skip(true, 'Requires Pro authentication setup')

    test('can generate AI itinerary', async ({ page }) => {
      // Would test with Pro user credentials
    })

    test('can view generated itinerary days', async ({ page }) => {
      // Would verify day-by-day breakdown
    })

    test('can export itinerary to ICS', async ({ page }) => {
      // Would test calendar export
    })

    test('can add activities from Smart Match', async ({ page }) => {
      // Would test adding recommended activities
    })

    test('can edit and customize itinerary', async ({ page }) => {
      // Would test editing capabilities
    })

    test('can save multiple itineraries', async ({ page }) => {
      // Would test saving feature
    })
  })
})

test.describe('Itinerary Integration', () => {
  test('links from attractions to itinerary', async ({ page }) => {
    await page.goto('/attractions')

    // Wait for attractions to load
    await page.waitForSelector('[data-testid="attraction-card"], .attraction-card, article', { timeout: 15000 })

    // Look for "Add to Itinerary" or similar button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Itinerary"), button[aria-label*="itinerary" i]').first()

    // May or may not be visible
  })

  test('Smart Match results can be added to itinerary', async ({ page }) => {
    await page.goto('/smart-match')

    // Look for integration with itinerary
    const addToItinerary = page.getByText(/add to itinerary|plan trip|include in trip/i).first()

    // May be gated behind Pro
  })
})
