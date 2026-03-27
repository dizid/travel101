import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock subscription API
    await page.route('**/api/subscription**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { status: 'inactive', isPro: false }, success: true }),
      })
    })

    // Mock usage API
    await page.route('**/api/usage**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chatUsage: { used: 3, limit: 5 },
            introUsage: { used: 1, limit: 10 },
            attractionChatUsage: { used: 0, limit: 5 },
            packingUsage: { used: 0, limit: 1 },
          },
          success: true,
        }),
      })
    })

    await page.goto('/dashboard')
  })

  test('displays dashboard heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /dashboard/i }).first()
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('shows quick links section', async ({ page }) => {
    await expect(page.getByText('Visa Guide')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('TDAC Form')).toBeVisible()
    await expect(page.getByText('Good to Know')).toBeVisible()
    await expect(page.getByText('Places')).toBeVisible()
    await expect(page.getByText('Onward Reservation')).toBeVisible()
  })

  test('quick links navigate correctly', async ({ page }) => {
    const visaLink = page.getByRole('link', { name: /visa guide/i }).first()
    await expect(visaLink).toBeVisible({ timeout: 10000 })
    await expect(visaLink).toHaveAttribute('href', '/visa')
  })

  test('shows Pro features section', async ({ page }) => {
    await expect(page.getByText('AI-Powered Itineraries')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Smart Matching')).toBeVisible()
  })

  test('shows extended Pro features', async ({ page }) => {
    await expect(page.getByText('90-Day Reporting')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Medical Tourism')).toBeVisible()
    await expect(page.getByText('Cost Calculator')).toBeVisible()
    await expect(page.getByText('Setup Guide')).toBeVisible()
  })

  test('shows profile completeness indicator', async ({ page }) => {
    // Profile completeness section should be visible
    const profileSection = page.getByText(/profile/i).first()
    await expect(profileSection).toBeVisible({ timeout: 10000 })
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')

    const heading = page.getByRole('heading', { name: /dashboard/i }).first()
    await expect(heading).toBeVisible({ timeout: 10000 })

    // No horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })
})
