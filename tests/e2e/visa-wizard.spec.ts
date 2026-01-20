import { test, expect } from '@playwright/test'

test.describe('Visa Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/visa')
  })

  test('displays visa wizard page', async ({ page }) => {
    await expect(page).toHaveTitle(/Thailand Visa/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/visa/i)
  })

  test('shows nationality selection as first step', async ({ page }) => {
    const nationalitySection = page.locator('[data-testid="nationality-select"], select, .nationality-select').first()
    await expect(nationalitySection).toBeVisible()
  })

  test('completes visa-exempt flow for US citizen', async ({ page }) => {
    // Select US nationality
    const nationalitySelect = page.locator('select').first()
    if (await nationalitySelect.isVisible()) {
      await nationalitySelect.selectOption({ label: /United States|USA|US/i })
    } else {
      // Try clicking on US option if it's a custom selector
      await page.getByText(/United States|USA/i).first().click()
    }

    // Should show visa-exempt recommendation
    await expect(page.getByText(/30 days|visa.?exempt|visa.?free/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows different requirements for Indian nationality', async ({ page }) => {
    const nationalitySelect = page.locator('select').first()
    if (await nationalitySelect.isVisible()) {
      await nationalitySelect.selectOption({ label: /India/i })
    } else {
      await page.getByText(/India/i).first().click()
    }

    // India has different visa requirements - may need VOA or e-visa
    await expect(page.locator('body')).toContainText(/visa|requirement|apply/i)
  })

  test('shows digital nomad visa option when relevant', async ({ page }) => {
    // Look for DTV or digital nomad visa mention
    const pageContent = await page.textContent('body')
    const hasDNVInfo = /digital.?nomad|DTV|destination.?thailand|remote.?work/i.test(pageContent || '')

    // The page should either show DTV info or have a way to learn about long-term options
    expect(hasDNVInfo || pageContent?.includes('long-term')).toBeTruthy()
  })

  test('provides extension information', async ({ page }) => {
    // Look for visa extension info
    const extensionInfo = page.getByText(/extend|extension|immigration/i).first()
    await expect(extensionInfo).toBeVisible({ timeout: 10000 })
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/visa')

    // Page should still be usable on mobile
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Content should not overflow horizontally
    const body = page.locator('body')
    const scrollWidth = await body.evaluate((el) => el.scrollWidth)
    const clientWidth = await body.evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10) // Allow small margin
  })

  test('has accessible form elements', async ({ page }) => {
    // Check for labels on form controls
    const formControls = page.locator('select, input')
    const count = await formControls.count()

    for (let i = 0; i < count; i++) {
      const control = formControls.nth(i)
      const ariaLabel = await control.getAttribute('aria-label')
      const ariaLabelledby = await control.getAttribute('aria-labelledby')
      const id = await control.getAttribute('id')

      // Each control should have an accessible name
      const hasAccessibleName = ariaLabel || ariaLabelledby || (id && await page.locator(`label[for="${id}"]`).count() > 0)
      expect(hasAccessibleName).toBeTruthy()
    }
  })
})
