import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays hero section with headline', async ({ page }) => {
    await expect(page).toHaveTitle(/HappyRoam|Thailand|Travel Guide/i)

    // Hero headline — only the page h1 (header logo is now a span)
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('Land of Smiles')
  })

  test('shows Thai greeting pill', async ({ page }) => {
    // Use .first() since text may appear in multiple places
    await expect(page.getByText('สวัสดี').first()).toBeVisible()
    await expect(page.getByText('Welcome to Thailand').first()).toBeVisible()
  })

  test('has primary CTA links', async ({ page }) => {
    const explorePlaces = page.getByRole('link', { name: /explore places/i }).first()
    await expect(explorePlaces).toBeVisible()
    await expect(explorePlaces).toHaveAttribute('href', '/attractions')

    const planTrip = page.getByRole('link', { name: /plan your trip/i }).first()
    await expect(planTrip).toBeVisible()
    await expect(planTrip).toHaveAttribute('href', '/visa')
  })

  test('displays stats bar', async ({ page }) => {
    // Stats may appear more than once (hero + elsewhere), use .first()
    await expect(page.getByText('400+').first()).toBeVisible()
    await expect(page.getByText('50+').first()).toBeVisible()
    await expect(page.getByText('UNESCO Sites').first()).toBeVisible()
  })

  test('shows Discover Thailand section with content pillars', async ({ page }) => {
    const discoverHeading = page.getByRole('heading', { name: /discover thailand/i })
    await expect(discoverHeading).toBeVisible()

    // Three pillar cards — use .first() in case of duplicates
    await expect(page.getByRole('link', { name: /places to visit/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /festivals.*events/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /heritage sites/i }).first()).toBeVisible()
  })

  test('shows Plan Your Trip section', async ({ page }) => {
    const planHeading = page.getByRole('heading', { name: /plan your trip/i })
    await expect(planHeading).toBeVisible()

    // Tool cards — use .first() since labels may appear in multiple contexts
    await expect(page.getByText('Visa Guide').first()).toBeVisible()
    await expect(page.getByText('TDAC Form').first()).toBeVisible()
    await expect(page.getByText('Onward Ticket').first()).toBeVisible()
  })

  test('navigates to attractions via Explore Places CTA', async ({ page }) => {
    const cta = page.getByRole('link', { name: /explore places/i }).first()
    await cta.click()

    await expect(page).toHaveURL('/attractions')
  })

  test('navigates to festivals via pillar card', async ({ page }) => {
    const festivalCard = page.getByRole('link', { name: /festivals.*events/i }).first()
    await festivalCard.click()

    await expect(page).toHaveURL('/festivals')
  })

  test('shows booking partners section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ready to book/i })).toBeVisible()
    await expect(page.getByText('Tours & Activities').first()).toBeVisible()
    await expect(page.getByText('Hotels & Stays').first()).toBeVisible()
  })

  test('shows bottom CTA section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ready for thailand/i })).toBeVisible()
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Hero should still be visible
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    // No horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })
})
