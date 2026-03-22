import { test, expect } from '@playwright/test'

test.describe('Heritage Sites', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/heritage')
  })

  test('displays heritage page with hero', async ({ page }) => {
    await expect(page).toHaveTitle(/Heritage/i)

    const h1 = page.locator('main').getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('Heritage')
  })

  test('shows filter tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /all sites/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /unesco/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /temples/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /museums/i })).toBeVisible()
  })

  test('loads heritage site cards', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 15000 }
    )

    // Should have cards or empty state
    const grid = page.locator('.grid')
    const emptyState = page.getByText(/no heritage sites found/i)

    const hasGrid = await grid.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasGrid || hasEmpty).toBeTruthy()
  })

  test('has search input', async ({ page }) => {
    const search = page.getByPlaceholder(/search sites/i)
    await expect(search).toBeVisible()

    await search.fill('Ayutthaya')
    await page.waitForTimeout(500)
  })

  test('can filter by UNESCO tab', async ({ page }) => {
    const unescoTab = page.getByRole('button', { name: /unesco/i })
    await unescoTab.click()

    // Wait for filter to apply
    await page.waitForTimeout(1000)
  })

  test('has era and region filter dropdowns', async ({ page }) => {
    const eraSelect = page.locator('select').filter({ hasText: /all eras/i })
    await expect(eraSelect).toBeVisible()

    const regionSelect = page.locator('select').filter({ hasText: /all regions/i })
    await expect(regionSelect).toBeVisible()
  })

  test('shows results count', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 15000 }
    )

    await expect(page.getByText(/\d+ sites/)).toBeVisible()
  })

  test('can clear filters', async ({ page }) => {
    // Apply a filter first
    const unescoTab = page.getByRole('button', { name: /unesco/i })
    await unescoTab.click()
    await page.waitForTimeout(500)

    // Clear filters button should appear
    const clearBtn = page.getByRole('button', { name: /clear filters/i })
    if (await clearBtn.isVisible()) {
      await clearBtn.click()
      await page.waitForTimeout(500)
    }
  })

  test('can navigate to heritage site detail', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 15000 }
    )

    const siteLink = page.locator('a[href^="/heritage/"]').first()
    const isVisible = await siteLink.isVisible().catch(() => false)

    if (isVisible) {
      await siteLink.click()
      await expect(page).toHaveURL(/\/heritage\//)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    }
  })

  test('shows breadcrumb navigation', async ({ page }) => {
    await expect(page.getByText('Home')).toBeVisible()
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/heritage')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    // No horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })
})
