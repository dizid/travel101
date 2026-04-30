import { test, expect } from '@playwright/test'

// All home tests run as a returning visitor — wizard suppressed.
// The wizard's own behavior is covered in welcome-wizard.spec.ts.
test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('welcome-wizard-completed', '1')
    })
    await page.goto('/')
  })

  test('displays hero section with headline', async ({ page }) => {
    await expect(page).toHaveTitle(/HappyRoam|Thailand|Travel Guide/i)
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('Land of Smiles')
  })

  test('shows Thai greeting pill', async ({ page }) => {
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

  test('hero "See everything you get" anchors to capabilities', async ({ page }) => {
    const anchor = page.getByRole('link', { name: /see everything you get/i })
    await expect(anchor).toBeVisible()
    await expect(anchor).toHaveAttribute('href', '#capabilities')

    await anchor.click()
    // Section should be in viewport after click
    await expect(page.locator('#capabilities')).toBeInViewport({ ratio: 0.1 })
  })

  test('displays 5-stat hero bar', async ({ page }) => {
    const hero = page.locator('section').first()
    await expect(hero.getByText('400+').first()).toBeVisible()
    await expect(hero.getByText('50+').first()).toBeVisible()
    await expect(hero.getByText('UNESCO Sites').first()).toBeVisible()
    await expect(hero.getByText('Guides').first()).toBeVisible()
    await expect(hero.getByText('Phrases').first()).toBeVisible()
    await expect(hero.getByText('46').first()).toBeVisible()
    await expect(hero.getByText('211').first()).toBeVisible()
  })

  test('shows Capabilities grid with 8 cards', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /everything you need for thailand/i })
    await expect(heading).toBeVisible()

    const grid = page.locator('#capabilities')
    await expect(grid.getByText('Discover Places')).toBeVisible()
    await expect(grid.getByText('Festivals & Heritage')).toBeVisible()
    await expect(grid.getByText('Visa & Entry')).toBeVisible()
    await expect(grid.getByText('AI Itinerary Planner')).toBeVisible()
    await expect(grid.getByText('Smart Match')).toBeVisible()
    await expect(grid.getByText('Packing & Phrases')).toBeVisible()
    await expect(grid.getByText('Cost & Safety')).toBeVisible()
    await expect(grid.getByText('Medical & Emergency')).toBeVisible()
  })

  test('Pro badges appear on AI Itinerary and Packing capability cards', async ({ page }) => {
    const itineraryCard = page.locator('#capabilities a[href="/itinerary"]')
    await expect(itineraryCard.getByText('PRO')).toBeVisible()

    const packingCard = page.locator('#capabilities a[href="/packing"]')
    await expect(packingCard.getByText('PRO')).toBeVisible()

    // Discover Places (free) should NOT have a PRO badge
    const placesCard = page.locator('#capabilities a[href="/attractions"]')
    await expect(placesCard.getByText('PRO')).toHaveCount(0)
  })

  test('navigates to attractions via Explore Places CTA', async ({ page }) => {
    await page.getByRole('link', { name: /explore places/i }).first().click()
    await expect(page).toHaveURL('/attractions')
  })

  test('navigates via capability card', async ({ page }) => {
    await page.locator('#capabilities a[href="/itinerary"]').click()
    await expect(page).toHaveURL('/itinerary')
  })

  test('shows Free vs Pro pricing section', async ({ page }) => {
    const pricing = page.locator('#pricing')
    await expect(pricing.getByRole('heading', { name: /free vs pro/i })).toBeVisible()
    await expect(pricing.getByText('$0').first()).toBeVisible()
    await expect(pricing.getByText('$10').first()).toBeVisible()
    await expect(pricing.getByText(/7-day free trial/i).first()).toBeVisible()
  })

  test('Free plan lists honest free features', async ({ page }) => {
    const pricing = page.locator('#pricing')
    await expect(pricing.getByText(/400\+ Places.*UNESCO/i)).toBeVisible()
    await expect(pricing.getByText(/Visa Wizard.*TDAC/i)).toBeVisible()
    await expect(pricing.getByText(/1 use\/day per feature/i)).toBeVisible()
  })

  test('Pro plan lists only enforced Pro features', async ({ page }) => {
    const pricing = page.locator('#pricing')
    await expect(pricing.getByText(/AI Itinerary Planner/i)).toBeVisible()
    await expect(pricing.getByText(/AI Packing Lists/i)).toBeVisible()
    await expect(pricing.getByText(/Unlimited AI usage/i)).toBeVisible()
    await expect(pricing.getByText(/Smart Match favorites/i)).toBeVisible()
    await expect(pricing.getByText(/Onward Tickets — 2 free/i)).toBeVisible()
    await expect(pricing.getByText(/Travel Alerts dashboard/i)).toBeVisible()
  })

  test('Pro section trial CTA is visible and enabled', async ({ page }) => {
    const cta = page.getByRole('button', { name: /start 7-day free trial/i })
    await expect(cta).toBeVisible()
    await expect(cta).toBeEnabled()
  })

  test('bottom CTA Pro trial button anchors to pricing', async ({ page }) => {
    const trialAnchor = page.getByRole('link', { name: /start 7-day pro trial/i })
    await expect(trialAnchor).toBeVisible()
    await expect(trialAnchor).toHaveAttribute('href', '#pricing')

    await trialAnchor.click()
    await expect(page.locator('#pricing')).toBeInViewport({ ratio: 0.1 })
  })

  test('shows booking partners section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ready to book/i })).toBeVisible()
    await expect(page.getByText('Tours & Activities').first()).toBeVisible()
    await expect(page.getByText('Hotels & Stays').first()).toBeVisible()
  })

  test('shows bottom CTA section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ready for thailand/i })).toBeVisible()
  })

  test('is responsive on mobile (no horizontal overflow)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })

  test('Free vs Pro section stacks on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const pricing = page.locator('#pricing')
    await pricing.scrollIntoViewIfNeeded()
    await expect(pricing.getByText('$0').first()).toBeVisible()
    await expect(pricing.getByText('$10').first()).toBeVisible()
  })
})
