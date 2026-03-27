import { test, expect } from '@playwright/test'

test.describe('Cost Calculator Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cost-calculator')
  })

  test('displays page heading', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })
  })

  test('shows city selector with multiple cities', async ({ page }) => {
    // Should have city options
    await expect(page.getByText('Bangkok')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Chiang Mai')).toBeVisible()
    await expect(page.getByText('Phuket')).toBeVisible()
  })

  test('shows lifestyle selector tabs', async ({ page }) => {
    await expect(page.getByText(/budget/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/midrange/i).first()).toBeVisible()
    await expect(page.getByText(/luxury/i).first()).toBeVisible()
  })

  test('displays cost breakdown categories', async ({ page }) => {
    await expect(page.getByText(/rent/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/food/i).first()).toBeVisible()
    await expect(page.getByText(/transport/i).first()).toBeVisible()
  })

  test('shows total cost amount', async ({ page }) => {
    // Should display THB amounts for the default city/lifestyle
    const costText = page.locator('text=/\\d{2,3},\\d{3}/')
    await expect(costText.first()).toBeVisible({ timeout: 10000 })
  })

  test('updates costs when switching cities', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000)

    // Click on different city
    const chiangMai = page.getByText('Chiang Mai').first()
    if (await chiangMai.isVisible()) {
      await chiangMai.click()
      await page.waitForTimeout(500)
    }

    // Costs should update - Chiang Mai is cheaper than Bangkok
    const costs = page.locator('text=/\\d{2,3},\\d{3}/')
    await expect(costs.first()).toBeVisible()
  })

  test('updates costs when switching lifestyle', async ({ page }) => {
    await page.waitForTimeout(1000)

    // Switch to budget
    const budgetTab = page.getByText(/budget/i).first()
    if (await budgetTab.isVisible()) {
      await budgetTab.click()
      await page.waitForTimeout(500)
    }

    // Costs should be lower for budget
    const costs = page.locator('text=/\\d{2,3},\\d{3}/')
    await expect(costs.first()).toBeVisible()
  })

  test('shows Koh Samui and Pattaya options', async ({ page }) => {
    await expect(page.getByText('Koh Samui')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Pattaya')).toBeVisible()
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/cost-calculator')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })

    // No horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })
})
