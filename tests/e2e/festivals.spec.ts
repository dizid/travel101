import { test, expect } from '@playwright/test'

test.describe('Festivals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/festivals')
  })

  test('displays festivals page with hero', async ({ page }) => {
    await expect(page).toHaveTitle(/Festival/i)

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('Festivals')
  })

  test('shows filter tabs', async ({ page }) => {
    await expect(page.getByText('All Festivals')).toBeVisible()
    await expect(page.getByText('Upcoming')).toBeVisible()
    await expect(page.getByText('Hidden Gems')).toBeVisible()
    await expect(page.getByText('By Month')).toBeVisible()
  })

  test('loads festival cards', async ({ page }) => {
    // Wait for content to load (loading spinner disappears)
    await page.waitForSelector('.grid', { timeout: 15000 })

    // Should have festival cards or an empty state
    const cards = page.locator('.grid article, .grid > a, .grid > div > a').first()
    const emptyState = page.getByText(/no festivals found/i)

    // Either cards or empty state should show
    const hasCards = await cards.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasCards || hasEmpty).toBeTruthy()
  })

  test('has search input', async ({ page }) => {
    const search = page.getByPlaceholder(/search festivals/i)
    await expect(search).toBeVisible()

    await search.fill('Songkran')
    await page.waitForTimeout(500)
  })

  test('can switch to Upcoming tab', async ({ page }) => {
    const upcomingTab = page.getByRole('button', { name: /upcoming/i })
    await upcomingTab.click()

    // Should show upcoming-specific heading
    await expect(page.getByText(/upcoming festivals/i)).toBeVisible({ timeout: 10000 })
  })

  test('can switch to Hidden Gems tab', async ({ page }) => {
    const hiddenTab = page.getByRole('button', { name: /hidden gems/i })
    await hiddenTab.click()

    await expect(page.getByText(/hidden gem festivals/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows type and region filters', async ({ page }) => {
    // Type dropdown
    const typeSelect = page.locator('select').filter({ hasText: /all types/i })
    await expect(typeSelect).toBeVisible()

    // Region dropdown
    const regionSelect = page.locator('select').filter({ hasText: /all regions/i })
    await expect(regionSelect).toBeVisible()
  })

  test('shows festival types legend', async ({ page }) => {
    // Scroll to bottom where legend is
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    await expect(page.getByText('Festival Types')).toBeVisible()
    await expect(page.getByText('Religious')).toBeVisible()
    await expect(page.getByText('Cultural')).toBeVisible()
  })

  test('can navigate to festival detail', async ({ page }) => {
    // Wait for festivals to load
    await page.waitForSelector('.grid', { timeout: 15000 })

    // Find a festival card link
    const festivalLink = page.locator('a[href^="/festivals/"]').first()
    const isVisible = await festivalLink.isVisible().catch(() => false)

    if (isVisible) {
      await festivalLink.click()
      await expect(page).toHaveURL(/\/festivals\//)
      // Detail page should have a heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    }
  })

  test('shows breadcrumb navigation', async ({ page }) => {
    await expect(page.getByText('Home')).toBeVisible()
    await expect(page.getByText('Festivals').first()).toBeVisible()
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/festivals')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    // Filter tabs should be scrollable
    await expect(page.getByText('All Festivals')).toBeVisible()
  })
})
