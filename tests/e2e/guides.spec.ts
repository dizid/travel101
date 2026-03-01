import { test, expect } from '@playwright/test'

test.describe('Travel Guides', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guides')
  })

  test('displays guides page with hero', async ({ page }) => {
    await expect(page).toHaveTitle(/Travel Guides/i)

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('Travel Guides')
  })

  test('shows category filter pills', async ({ page }) => {
    await expect(page.getByRole('button', { name: /all guides/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /practical/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /destinations/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /budget/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /food/i })).toBeVisible()
  })

  test('has search input', async ({ page }) => {
    const search = page.getByPlaceholder(/search guides/i)
    await expect(search).toBeVisible()

    await search.fill('Bangkok')
    await page.waitForTimeout(500)
  })

  test('loads guide cards or shows empty state', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 15000 }
    )

    const grid = page.locator('.grid')
    const emptyState = page.getByText(/no guides found/i)

    const hasGrid = await grid.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasGrid || hasEmpty).toBeTruthy()
  })

  test('can filter by category', async ({ page }) => {
    const foodBtn = page.getByRole('button', { name: /food/i })
    await foodBtn.click()
    await page.waitForTimeout(1000)

    // Button should be active (has primary styling)
    await expect(foodBtn).toHaveClass(/bg-primary/)
  })

  test('can switch between categories', async ({ page }) => {
    // Click Food
    await page.getByRole('button', { name: /food/i }).click()
    await page.waitForTimeout(500)

    // Click All Guides
    await page.getByRole('button', { name: /all guides/i }).click()
    await page.waitForTimeout(500)

    // All Guides should be active
    await expect(page.getByRole('button', { name: /all guides/i })).toHaveClass(/bg-primary/)
  })

  test('can navigate to guide detail', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 15000 }
    )

    const guideLink = page.locator('a[href^="/guides/"]').first()
    const isVisible = await guideLink.isVisible().catch(() => false)

    if (isVisible) {
      await guideLink.click()
      await expect(page).toHaveURL(/\/guides\//)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    }
  })

  test('shows breadcrumb navigation', async ({ page }) => {
    await expect(page.getByText('Home')).toBeVisible()
    await expect(page.getByText('Travel Guides')).toBeVisible()
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/guides')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    // Category pills should wrap
    await expect(page.getByRole('button', { name: /all guides/i })).toBeVisible()
  })
})
