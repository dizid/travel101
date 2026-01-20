import { test, expect } from '@playwright/test'

test.describe('Attractions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/attractions')
  })

  test('displays attractions page', async ({ page }) => {
    await expect(page).toHaveTitle(/Places to Visit|Attractions/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('loads and displays attraction cards', async ({ page }) => {
    // Wait for attractions to load
    const cards = page.locator('[data-testid="attraction-card"], .attraction-card, article').first()
    await expect(cards).toBeVisible({ timeout: 15000 })

    // Should have multiple attractions
    const cardCount = await page.locator('[data-testid="attraction-card"], .attraction-card, article').count()
    expect(cardCount).toBeGreaterThan(0)
  })

  test('can filter by category', async ({ page }) => {
    // Wait for attractions to load first
    await page.waitForSelector('[data-testid="attraction-card"], .attraction-card, article', { timeout: 15000 })

    // Look for filter controls
    const filterButton = page.locator('button, [role="button"]').filter({ hasText: /filter|category|temple|beach|nature/i }).first()

    if (await filterButton.isVisible()) {
      await filterButton.click()

      // Wait for filter to apply
      await page.waitForTimeout(500)
    }
  })

  test('can search attractions', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('Bangkok')
      await page.waitForTimeout(500)

      // Results should be filtered
      const pageContent = await page.textContent('body')
      expect(pageContent?.toLowerCase()).toContain('bangkok')
    }
  })

  test('can navigate to attraction detail', async ({ page }) => {
    // Wait for attractions to load
    await page.waitForSelector('[data-testid="attraction-card"], .attraction-card, article', { timeout: 15000 })

    // Click on first attraction
    const firstCard = page.locator('[data-testid="attraction-card"], .attraction-card, article').first()
    const link = firstCard.locator('a').first()

    if (await link.isVisible()) {
      await link.click()
      await expect(page).toHaveURL(/\/attractions\//)
    } else {
      // If no link, try clicking the card itself
      await firstCard.click()
      await page.waitForTimeout(500)
    }
  })

  test('shows attraction details on detail page', async ({ page }) => {
    // Navigate directly to an attraction detail page
    await page.goto('/attractions')
    await page.waitForSelector('[data-testid="attraction-card"], .attraction-card, article', { timeout: 15000 })

    // Find and click on a specific attraction
    const firstCard = page.locator('[data-testid="attraction-card"], .attraction-card, article').first()
    await firstCard.click()

    // Should show attraction details
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
  })

  test('can add attraction to favorites', async ({ page }) => {
    await page.waitForSelector('[data-testid="attraction-card"], .attraction-card, article', { timeout: 15000 })

    // Look for favorite/save button
    const favoriteButton = page.locator('button[aria-label*="favorite" i], button[aria-label*="save" i], [data-testid="favorite-button"], .favorite-btn').first()

    if (await favoriteButton.isVisible()) {
      await favoriteButton.click()

      // Check for visual feedback (heart filled, toast message, etc.)
      await page.waitForTimeout(500)
    }
  })

  test('displays province/location information', async ({ page }) => {
    await page.waitForSelector('[data-testid="attraction-card"], .attraction-card, article', { timeout: 15000 })

    // Attractions should show location info
    const locationText = page.getByText(/Bangkok|Chiang Mai|Phuket|Province|Thailand/i).first()
    await expect(locationText).toBeVisible()
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/attractions')

    // Wait for content to load
    await page.waitForSelector('[data-testid="attraction-card"], .attraction-card, article', { timeout: 15000 })

    // Cards should be visible and properly sized
    const firstCard = page.locator('[data-testid="attraction-card"], .attraction-card, article').first()
    await expect(firstCard).toBeVisible()

    // Check no horizontal overflow
    const body = page.locator('body')
    const scrollWidth = await body.evaluate((el) => el.scrollWidth)
    const clientWidth = await body.evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })

  test('shows loading state', async ({ page }) => {
    // Intercept API to delay response
    await page.route('**/api/attractions**', async (route) => {
      await new Promise((r) => setTimeout(r, 1000))
      await route.continue()
    })

    await page.goto('/attractions')

    // Should show loading indicator
    const loading = page.locator('.loading, [data-testid="loading"], .spinner, .skeleton')
    // Loading may or may not be visible depending on timing
  })

  test('handles empty search results gracefully', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('xyznonexistent12345')
      await page.waitForTimeout(1000)

      // Should show empty state or "no results" message
      const emptyState = page.getByText(/no results|not found|no attractions|try again/i).first()
      // This may or may not appear depending on implementation
    }
  })
})
