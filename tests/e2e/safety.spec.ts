import { test, expect } from '@playwright/test'

test.describe('Safety Guide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/safety')
  })

  test('displays safety page with heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Safety/i)

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('Safety')
  })

  test('shows emergency numbers banner', async ({ page }) => {
    await expect(page.getByText('Emergency Numbers')).toBeVisible()
    await expect(page.getByText('1155')).toBeVisible() // Tourist Police
    await expect(page.getByText('191')).toBeVisible() // Police
    await expect(page.getByText('1669')).toBeVisible() // Ambulance
    await expect(page.getByText('199')).toBeVisible() // Fire
  })

  test('has province and type filter dropdowns', async ({ page }) => {
    const provinceSelect = page.locator('select').filter({ hasText: /all provinces/i })
    await expect(provinceSelect).toBeVisible()

    const typeSelect = page.locator('select').filter({ hasText: /all types/i })
    await expect(typeSelect).toBeVisible()
  })

  test('can filter by province', async ({ page }) => {
    const provinceSelect = page.locator('select').filter({ hasText: /all provinces/i })
    await provinceSelect.selectOption('Bangkok')
    await page.waitForTimeout(1000)
  })

  test('has Report a Scam button', async ({ page }) => {
    const reportBtn = page.getByRole('button', { name: /report a scam/i })
    await expect(reportBtn).toBeVisible()
  })

  test('opens report modal on click', async ({ page }) => {
    const reportBtn = page.getByRole('button', { name: /report a scam/i })
    await reportBtn.click()

    // Modal should appear
    await expect(page.getByRole('heading', { name: /report a scam/i })).toBeVisible()
    await expect(page.getByText('Help other travelers')).toBeVisible()
  })

  test('report modal has required fields', async ({ page }) => {
    await page.getByRole('button', { name: /report a scam/i }).click()

    await expect(page.getByLabel(/scam type/i)).toBeVisible()
    await expect(page.getByLabel(/title/i)).toBeVisible()
    await expect(page.getByLabel(/province/i)).toBeVisible()
    await expect(page.getByLabel(/description/i)).toBeVisible()
  })

  test('can close report modal', async ({ page }) => {
    await page.getByRole('button', { name: /report a scam/i }).click()
    await expect(page.getByRole('heading', { name: /report a scam/i })).toBeVisible()

    // Click X button to close
    const closeBtn = page.locator('.fixed button').filter({ has: page.locator('.anticon-close') }).first()
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
    } else {
      // Click outside the modal
      await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } })
    }

    // Modal should disappear
    await expect(page.getByRole('heading', { name: /report a scam/i })).not.toBeVisible({ timeout: 3000 })
  })

  test('shows safety guide accordion sections', async ({ page }) => {
    // Scroll to safety guide
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))

    await expect(page.getByText('Transportation Safety')).toBeVisible()
    await expect(page.getByText('Food & Water Safety')).toBeVisible()
    await expect(page.getByText('Health & Medical')).toBeVisible()
    await expect(page.getByText('Common Scams to Avoid')).toBeVisible()
  })

  test('can expand accordion section', async ({ page }) => {
    // Scroll to see accordion
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))

    const transportBtn = page.getByRole('button', { name: /transportation safety/i })
    await transportBtn.click()

    // Content should expand
    await expect(page.getByText(/taxis.*tuk-tuks/i)).toBeVisible()
  })

  test('shows quick safety tips', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    await expect(page.getByText('Quick Safety Tips')).toBeVisible()
    await expect(page.getByText(/metered taxis/i)).toBeVisible()
  })

  test('shows breadcrumb navigation', async ({ page }) => {
    await expect(page.getByText('Home')).toBeVisible()
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/safety')

    await expect(page.getByText('Emergency Numbers')).toBeVisible()
    await expect(page.getByText('1155')).toBeVisible()
  })
})
