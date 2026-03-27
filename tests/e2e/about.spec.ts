import { test, expect } from '@playwright/test'

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about')
  })

  test('displays page heading', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })
  })

  test('shows stats section', async ({ page }) => {
    await expect(page.getByText('400+')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Destinations')).toBeVisible()
    await expect(page.getByText('50+')).toBeVisible()
    await expect(page.getByText('Festivals')).toBeVisible()
  })

  test('shows UNESCO sites stat', async ({ page }) => {
    await expect(page.getByText('8')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('UNESCO Sites')).toBeVisible()
  })

  test('shows Smart Matching stat', async ({ page }) => {
    await expect(page.getByText('Smart')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Matching')).toBeVisible()
  })

  test('shows how it works steps', async ({ page }) => {
    await expect(page.getByText('Set Your Preferences')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Get Matched')).toBeVisible()
    await expect(page.getByText('Discover & Book')).toBeVisible()
  })

  test('shows editorial credibility points', async ({ page }) => {
    await expect(page.getByText(/hand-researched/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/festival dates are verified/i)).toBeVisible()
    await expect(page.getByText(/UNESCO and Thailand/i)).toBeVisible()
  })

  test('shows content update information', async ({ page }) => {
    await expect(page.getByText(/updated monthly/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows medical data verification note', async ({ page }) => {
    await expect(page.getByText(/JCI accreditation/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows affiliate disclosure', async ({ page }) => {
    await expect(page.getByText(/affiliate partnerships/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows Who We Are section', async ({ page }) => {
    await expect(page.getByText('Who We Are')).toBeVisible({ timeout: 10000 })
  })

  test('has navigation links', async ({ page }) => {
    // Should have links to explore the app
    const exploreLink = page.getByRole('link', { name: /explore|places|attractions/i }).first()
    await expect(exploreLink).toBeVisible({ timeout: 10000 })
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/about')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })

    // Stats should still be visible
    await expect(page.getByText('400+')).toBeVisible()

    // No horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })
})
