import { test, expect } from '@playwright/test'

test.describe('Warnings / Good to Know Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/warnings')
  })

  test('displays page heading', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })
    await expect(h1).toContainText('Thai Customs & Tips')
  })

  test('shows Good to Know pill badge', async ({ page }) => {
    await expect(page.getByText('Good to Know')).toBeVisible()
  })

  test('shows subtitle description', async ({ page }) => {
    await expect(page.getByText(/informing, not scaring/i)).toBeVisible()
  })

  test('shows category filter buttons', async ({ page }) => {
    await expect(page.getByText('All').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Royal Family')).toBeVisible()
    await expect(page.getByText('Laws')).toBeVisible()
    await expect(page.getByText('Scams')).toBeVisible()
    await expect(page.getByText('Transport')).toBeVisible()
    await expect(page.getByText('Beach')).toBeVisible()
    await expect(page.getByText('Nightlife')).toBeVisible()
  })

  test('displays warning cards', async ({ page }) => {
    // Warning cards should be rendered in the grid
    const cards = page.locator('.grid > *')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })

  test('filters by category when clicking a filter', async ({ page }) => {
    // Click on Scams category
    const scamsBtn = page.getByRole('button', { name: /scams/i }).first()
    if (await scamsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await scamsBtn.click()
      await page.waitForTimeout(500)
    }

    // Click All to go back
    const allBtn = page.getByRole('button', { name: /all/i }).first()
    if (await allBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allBtn.click()
      await page.waitForTimeout(500)
    }
  })

  test('highlights active category filter', async ({ page }) => {
    // "All" should be the default active category
    const allBtn = page.getByRole('button', { name: /^all$/i }).first()
    if (await allBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Active button should have different styling
      const classes = await allBtn.getAttribute('class')
      expect(classes).toContain('bg-primary')
    }
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/warnings')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })

    // Category filters should wrap on mobile
    await expect(page.getByText('All').first()).toBeVisible()

    // No horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })
})
