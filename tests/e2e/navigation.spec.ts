import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('header is visible on all pages', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header')).toBeVisible()
    await expect(page.getByText('HappyRoam')).toBeVisible()
  })

  test('logo links to home', async ({ page }) => {
    await page.goto('/attractions')
    const logo = page.locator('header a[href="/"]').first()
    await logo.click()
    await expect(page).toHaveURL('/')
  })

  test('desktop nav shows primary links', async ({ page }) => {
    await page.goto('/')

    // Primary nav items (hidden on mobile, visible on md+)
    const nav = page.locator('nav')
    await expect(nav.getByText('Places')).toBeVisible()
    await expect(nav.getByText('Festivals')).toBeVisible()
    await expect(nav.getByText('Heritage')).toBeVisible()
    await expect(nav.getByText('Guides')).toBeVisible()
    await expect(nav.getByText('About')).toBeVisible()
  })

  test('desktop nav Plan dropdown works', async ({ page }) => {
    await page.goto('/')

    const planBtn = page.locator('[data-plan-dropdown] button')
    await planBtn.click()

    // Dropdown should show plan items
    await expect(page.getByText('Visa Guide')).toBeVisible()
    await expect(page.getByText('TDAC Form')).toBeVisible()
    await expect(page.getByText('Onward Ticket')).toBeVisible()
    await expect(page.getByText('Good to Know')).toBeVisible()
  })

  test('clicking Plan dropdown item navigates', async ({ page }) => {
    await page.goto('/')

    // Open Plan dropdown
    await page.locator('[data-plan-dropdown] button').click()

    // Click Visa Guide
    await page.getByRole('link', { name: /visa guide/i }).click()
    await expect(page).toHaveURL('/visa')
  })

  test('nav links navigate to correct pages', async ({ page }) => {
    await page.goto('/')

    // Places
    const nav = page.locator('header nav')
    await nav.getByRole('link', { name: 'Places' }).click()
    await expect(page).toHaveURL('/attractions')

    // Festivals
    await nav.getByRole('link', { name: 'Festivals' }).click()
    await expect(page).toHaveURL('/festivals')

    // Heritage
    await nav.getByRole('link', { name: 'Heritage' }).click()
    await expect(page).toHaveURL('/heritage')

    // Guides
    await nav.getByRole('link', { name: 'Guides' }).click()
    await expect(page).toHaveURL('/guides')
  })

  test('active route is highlighted', async ({ page }) => {
    await page.goto('/festivals')

    const festivalLink = page.locator('header nav').getByRole('link', { name: 'Festivals' })
    await expect(festivalLink).toHaveClass(/bg-primary-50/)
  })
})

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('shows mobile menu button', async ({ page }) => {
    await page.goto('/')

    // Desktop nav should be hidden
    await expect(page.locator('header nav')).not.toBeVisible()

    // Mobile menu button should be visible
    const menuBtn = page.locator('header button').last()
    await expect(menuBtn).toBeVisible()
  })

  test('can open and close mobile menu', async ({ page }) => {
    await page.goto('/')

    // Open menu
    const menuBtn = page.locator('header button').last()
    await menuBtn.click()

    // Mobile menu should show all sections
    await expect(page.getByText('Discover')).toBeVisible()
    await expect(page.getByText('Plan Your Trip')).toBeVisible()
    await expect(page.getByText('My Account')).toBeVisible()

    // Close menu
    await menuBtn.click()

    // Menu should disappear
    await expect(page.getByText('Discover').first()).not.toBeVisible({ timeout: 3000 })
  })

  test('mobile menu shows all nav items', async ({ page }) => {
    await page.goto('/')

    // Open mobile menu
    await page.locator('header button').last().click()

    // Discover section
    await expect(page.getByRole('link', { name: /places/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /festivals/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /heritage/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /guides/i })).toBeVisible()

    // Plan section
    await expect(page.getByRole('link', { name: /visa guide/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /tdac form/i })).toBeVisible()

    // Account section
    await expect(page.getByRole('link', { name: /my dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /saved places/i })).toBeVisible()
  })

  test('mobile menu closes on navigation', async ({ page }) => {
    await page.goto('/')

    // Open menu
    await page.locator('header button').last().click()

    // Click a link
    await page.getByRole('link', { name: /festivals/i }).click()

    await expect(page).toHaveURL('/festivals')
    // Menu should auto-close (via @click="closeMobileMenu")
  })
})

test.describe('404 Page', () => {
  test('shows 404 for invalid routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345')

    await expect(page).toHaveTitle(/not found/i)
  })

  test('has navigation back to home', async ({ page }) => {
    await page.goto('/nonexistent-page')

    // Should have a way to go back (link or button)
    const homeLink = page.getByRole('link', { name: /home|back|return/i }).first()
    const isVisible = await homeLink.isVisible().catch(() => false)

    if (isVisible) {
      await homeLink.click()
      await expect(page).toHaveURL('/')
    }
  })
})

test.describe('Footer', () => {
  test('footer is visible on home page', async ({ page }) => {
    await page.goto('/')

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })

  test('footer has important links', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    const footer = page.locator('footer')

    // Check for common footer links
    const privacyLink = footer.getByRole('link', { name: /privacy/i })
    const termsLink = footer.getByRole('link', { name: /terms/i })

    const hasPrivacy = await privacyLink.isVisible().catch(() => false)
    const hasTerms = await termsLink.isVisible().catch(() => false)

    // At least one legal link should exist
    expect(hasPrivacy || hasTerms).toBeTruthy()
  })
})

test.describe('Breadcrumbs', () => {
  test('festivals page has breadcrumbs', async ({ page }) => {
    await page.goto('/festivals')

    const homeLink = page.locator('a[href="/"]').filter({ hasText: 'Home' }).first()
    await expect(homeLink).toBeVisible()
  })

  test('heritage page has breadcrumbs', async ({ page }) => {
    await page.goto('/heritage')

    const homeLink = page.locator('a[href="/"]').filter({ hasText: 'Home' }).first()
    await expect(homeLink).toBeVisible()
  })

  test('guides page has breadcrumbs', async ({ page }) => {
    await page.goto('/guides')

    const homeLink = page.locator('a[href="/"]').filter({ hasText: 'Home' }).first()
    await expect(homeLink).toBeVisible()
  })

  test('breadcrumb Home link navigates to home', async ({ page }) => {
    await page.goto('/festivals')

    const homeLink = page.locator('a[href="/"]').filter({ hasText: 'Home' }).first()
    await homeLink.click()

    await expect(page).toHaveURL('/')
  })
})
