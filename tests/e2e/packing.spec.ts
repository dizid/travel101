import { test, expect } from '@playwright/test'

test.describe('Packing List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/packing')
  })

  test('displays page heading', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })
  })

  test('shows destination selection', async ({ page }) => {
    // Should show destination options like Bangkok, Chiang Mai, etc.
    await expect(page.getByText('Bangkok').first()).toBeVisible({ timeout: 10000 })
  })

  test('shows available destinations list', async ({ page }) => {
    await expect(page.getByText('Chiang Mai').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Phuket').first()).toBeVisible()
    await expect(page.getByText('Koh Samui').first()).toBeVisible()
  })

  test('shows duration input', async ({ page }) => {
    // Duration input should be visible
    const durationInput = page.locator('input[type="number"], input[type="range"]').first()
    await expect(durationInput).toBeVisible({ timeout: 10000 })
  })

  test('shows activity checkboxes', async ({ page }) => {
    await expect(page.getByText(/sightseeing/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/temple/i).first()).toBeVisible()
    await expect(page.getByText(/beach/i).first()).toBeVisible()
  })

  test('shows more activity options', async ({ page }) => {
    await expect(page.getByText(/hiking/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/nightlife/i).first()).toBeVisible()
    await expect(page.getByText(/shopping/i).first()).toBeVisible()
  })

  test('has generate packing list button', async ({ page }) => {
    const generateBtn = page.getByRole('button', { name: /generate|create|get.*packing/i }).first()
    await expect(generateBtn).toBeVisible({ timeout: 10000 })
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/packing')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })

    // No horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })
})
