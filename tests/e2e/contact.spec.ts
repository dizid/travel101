import { test, expect } from '@playwright/test'

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact')
  })

  test('displays page heading', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('Contact Us')
  })

  test('shows Get in Touch pill', async ({ page }) => {
    await expect(page.getByText('Get in Touch')).toBeVisible()
  })

  test('shows subtitle description', async ({ page }) => {
    await expect(page.getByText(/questions about Thailand travel/i)).toBeVisible()
  })

  test('shows X/Twitter social link', async ({ page }) => {
    await expect(page.getByText('X (Twitter)')).toBeVisible()
    await expect(page.getByText('@dizid')).toBeVisible()
  })

  test('shows LinkedIn social link', async ({ page }) => {
    await expect(page.getByText('LinkedIn')).toBeVisible()
  })

  test('shows Website link', async ({ page }) => {
    await expect(page.getByText('dizid.com')).toBeVisible()
  })

  test('social links open in new tab', async ({ page }) => {
    const twitterLink = page.getByRole('link', { name: /twitter/i }).first()
    await expect(twitterLink).toHaveAttribute('target', '_blank')
    await expect(twitterLink).toHaveAttribute('rel', /noopener/)
  })

  test('shows social link descriptions', async ({ page }) => {
    await expect(page.getByText('Follow for updates and travel tips')).toBeVisible()
    await expect(page.getByText('Connect professionally')).toBeVisible()
    await expect(page.getByText('Visit the main website')).toBeVisible()
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/contact')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    // Social links should be visible
    await expect(page.getByText('X (Twitter)')).toBeVisible()

    // No horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })
})
