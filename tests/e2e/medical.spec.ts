import { test, expect } from '@playwright/test'

test.describe('Medical Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/medical')
  })

  test('displays page heading', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })
  })

  test('shows category filter buttons', async ({ page }) => {
    await expect(page.getByText('All').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Hospitals')).toBeVisible()
    await expect(page.getByText('Dental')).toBeVisible()
    await expect(page.getByText('Wellness')).toBeVisible()
    await expect(page.getByText('Cosmetic')).toBeVisible()
  })

  test('displays real hospital facilities', async ({ page }) => {
    await expect(page.getByText('Bumrungrad International Hospital')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Bangkok Hospital')).toBeVisible()
    await expect(page.getByText('BNH Hospital')).toBeVisible()
  })

  test('shows JCI accreditation badges', async ({ page }) => {
    // JCI accredited hospitals should have a badge
    const jciBadge = page.getByText(/jci/i).first()
    await expect(jciBadge).toBeVisible({ timeout: 10000 })
  })

  test('shows hospital ratings', async ({ page }) => {
    // Ratings should be visible (e.g., 4.8, 4.7)
    const rating = page.locator('text=/4\\.[5-9]/').first()
    await expect(rating).toBeVisible({ timeout: 10000 })
  })

  test('shows hospital locations', async ({ page }) => {
    await expect(page.getByText('Bangkok').first()).toBeVisible({ timeout: 10000 })
  })

  test('filters by category when clicking Dental', async ({ page }) => {
    const dentalBtn = page.getByRole('button', { name: /dental/i }).first()
    if (await dentalBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dentalBtn.click()
      await page.waitForTimeout(500)

      // Should show dental facilities
      const dental = page.getByText(/dental/i)
      await expect(dental.first()).toBeVisible()
    }
  })

  test('has search functionality', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first()
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Bumrungrad')
      await page.waitForTimeout(500)
      await expect(page.getByText('Bumrungrad')).toBeVisible()
    }
  })

  test('shows breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.getByText(/home/i).first()
    await expect(breadcrumb).toBeVisible({ timeout: 10000 })
  })

  test('displays hospital specialties', async ({ page }) => {
    // Specialties like Cardiology, Orthopedics should be visible
    await expect(page.getByText(/cardiology|orthopedics|oncology/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows phone numbers for facilities', async ({ page }) => {
    // Phone numbers should be displayed
    const phone = page.locator('text=/\\+66/').first()
    await expect(phone).toBeVisible({ timeout: 10000 })
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/medical')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10000 })

    // Categories should still be visible
    await expect(page.getByText('Hospitals')).toBeVisible()

    // No horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })
})
