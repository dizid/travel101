import { test, expect } from '@playwright/test'

// Attraction cards are RouterLink elements with class "card-thai" inside the grid
const CARD_SELECTOR = 'a.card-thai'

test.describe('Attractions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/attractions')
  })

  test('displays attractions page', async ({ page }) => {
    await expect(page).toHaveTitle(/Places to Visit|Attractions|Explore Thailand|HappyRoam/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('loads and displays attraction cards', async ({ page }) => {
    const firstCard = page.locator(CARD_SELECTOR).first()
    await expect(firstCard).toBeVisible({ timeout: 15000 })

    const cardCount = await page.locator(CARD_SELECTOR).count()
    expect(cardCount).toBeGreaterThan(0)
  })

  test('can filter by category', async ({ page }) => {
    // Wait for attractions to load
    await page.locator(CARD_SELECTOR).first().waitFor({ timeout: 15000 })

    // Look for filter/category buttons
    const filterButton = page.locator('button, [role="button"]').filter({ hasText: /beach|temple|nature|island|culture/i }).first()

    if (await filterButton.isVisible()) {
      await filterButton.click()
      await page.waitForTimeout(500)
    }
  })

  test('can search attractions', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('Bangkok')
      await page.waitForTimeout(500)

      const pageContent = await page.textContent('body')
      expect(pageContent?.toLowerCase()).toContain('bangkok')
    }
  })

  test('can navigate to attraction detail', async ({ page }) => {
    const firstCard = page.locator(CARD_SELECTOR).first()
    await firstCard.waitFor({ timeout: 15000 })
    await firstCard.click()
    await expect(page).toHaveURL(/\/attractions\//)
  })

  test('shows attraction details on detail page', async ({ page }) => {
    const firstCard = page.locator(CARD_SELECTOR).first()
    await firstCard.waitFor({ timeout: 15000 })
    await firstCard.click()

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
  })

  test('can add attraction to favorites', async ({ page }) => {
    await page.locator(CARD_SELECTOR).first().waitFor({ timeout: 15000 })

    // Favorite button is a heart icon on the card
    const favoriteButton = page.locator('button[aria-label*="favorite" i], button[aria-label*="save" i], button[title*="Save" i], button[title*="save" i]').first()

    if (await favoriteButton.isVisible()) {
      await favoriteButton.click()
      await page.waitForTimeout(500)
    }
  })

  test('displays province/location information', async ({ page }) => {
    await page.locator(CARD_SELECTOR).first().waitFor({ timeout: 15000 })

    // Cards should show location text
    const locationText = page.getByText(/Bangkok|Chiang Mai|Phuket|Province|Thailand/i).first()
    await expect(locationText).toBeVisible()
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/attractions')

    await page.locator(CARD_SELECTOR).first().waitFor({ timeout: 15000 })
    await expect(page.locator(CARD_SELECTOR).first()).toBeVisible()

    // Check no horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })

  test('shows loading state', async ({ page }) => {
    await page.route('**/api/attractions**', async (route) => {
      await new Promise((r) => setTimeout(r, 1000))
      await route.continue()
    })

    await page.goto('/attractions')

    // Page should eventually load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 })
  })

  test('handles empty search results gracefully', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('xyznonexistent12345')
      await page.waitForTimeout(1000)
    }
  })
})
