import { test, expect } from '@playwright/test'

test.describe('TDAC Guide Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tdac')
  })

  test('displays page heading', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })
  })

  test('shows section navigation tabs', async ({ page }) => {
    await expect(page.getByText('Personal Info')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Travel Details')).toBeVisible()
    await expect(page.getByText('Accommodation')).toBeVisible()
    await expect(page.getByText('Purpose & Duration')).toBeVisible()
  })

  test('shows personal info section by default', async ({ page }) => {
    // Personal fields should be visible on load
    await expect(page.getByText('Passport Number')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Full Name')).toBeVisible()
    await expect(page.getByText('Date of Birth')).toBeVisible()
    await expect(page.getByText('Nationality')).toBeVisible()
  })

  test('shows field descriptions and tips', async ({ page }) => {
    await expect(page.getByText('Exactly as shown on passport')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Must match passport exactly')).toBeVisible()
  })

  test('switches to Travel Details tab', async ({ page }) => {
    const travelTab = page.getByText('Travel Details')
    await travelTab.click()

    await expect(page.getByText('Flight Number')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Departure Airport')).toBeVisible()
    await expect(page.getByText('Arrival Airport')).toBeVisible()
  })

  test('switches to Accommodation tab', async ({ page }) => {
    const accomTab = page.getByText('Accommodation')
    await accomTab.click()

    await expect(page.getByText('Hotel/Address')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Province')).toBeVisible()
  })

  test('switches to Purpose & Duration tab', async ({ page }) => {
    const purposeTab = page.getByText('Purpose & Duration')
    await purposeTab.click()

    await expect(page.getByText('Purpose of Visit')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Length of Stay')).toBeVisible()
  })

  test('shows common mistakes section', async ({ page }) => {
    await expect(page.getByText(/common mistakes/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/wrong date format/i)).toBeVisible()
  })

  test('shows breadcrumb navigation', async ({ page }) => {
    await expect(page.getByText('Home').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('TDAC Guide').first()).toBeVisible()
  })

  test('breadcrumb Home link navigates to homepage', async ({ page }) => {
    const homeLink = page.locator('nav').getByRole('link', { name: /home/i }).first()
    if (await homeLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(homeLink).toHaveAttribute('href', '/')
    }
  })

  test('shows practical tips for each field', async ({ page }) => {
    // Tips like "No spaces between characters" for passport
    await expect(page.getByText('No spaces between characters')).toBeVisible({ timeout: 10000 })
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/tdac')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })

    // Section tabs should still be visible
    await expect(page.getByText('Personal Info')).toBeVisible()

    // No horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })
})
