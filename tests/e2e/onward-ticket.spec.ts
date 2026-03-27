import { test, expect } from '@playwright/test'

// Helper: mock the onward-ticket status API for non-Pro user
async function mockStatusNonPro(page: import('@playwright/test').Page) {
  await page.route('**/api/onward-ticket', async (route) => {
    const body = route.request().postDataJSON()
    if (body?.action === 'status') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { isPro: false, bookingsThisMonth: 0, monthlyLimit: 2, serviceFee: 1200 },
          success: true,
        }),
      })
    } else {
      await route.continue()
    }
  })
}

// Helper: mock status + search APIs
async function mockStatusAndSearch(page: import('@playwright/test').Page) {
  await page.route('**/api/onward-ticket', async (route) => {
    const body = route.request().postDataJSON()
    if (body?.action === 'status') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { isPro: false, bookingsThisMonth: 0, monthlyLimit: 2, serviceFee: 1200 },
          success: true,
        }),
      })
    } else if (body?.action === 'search') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            offers: [
              {
                id: 'off_test123',
                airline: 'AirAsia',
                airlineCode: 'AK',
                price: '35.00',
                currency: 'USD',
                departureTime: '2026-04-15T08:00:00',
                arrivalTime: '2026-04-15T11:30:00',
                duration: 'PT3H30M',
                stops: 0,
              },
              {
                id: 'off_test456',
                airline: 'Thai Airways',
                airlineCode: 'TG',
                price: '85.00',
                currency: 'USD',
                departureTime: '2026-04-15T14:00:00',
                arrivalTime: '2026-04-15T17:30:00',
                duration: 'PT3H30M',
                stops: 0,
              },
            ],
          },
          success: true,
        }),
      })
    } else {
      await route.continue()
    }
  })
}

test.describe('Onward Ticket Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockStatusNonPro(page)
    await page.goto('/onward-ticket')
  })

  test('displays page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Proof of Onward Travel' })).toBeVisible()
  })

  test('shows subtitle description', async ({ page }) => {
    await expect(page.getByText('verified flight reservation for Thai immigration')).toBeVisible()
  })

  test('shows Onward Ticket pill badge', async ({ page }) => {
    await expect(page.getByText('Onward Ticket')).toBeVisible()
  })

  test('displays 4 benefits in grid', async ({ page }) => {
    await expect(page.getByText('Real PNR Code')).toBeVisible()
    await expect(page.getByText('Instant PDF')).toBeVisible()
    await expect(page.getByText('Valid 48+ Hours')).toBeVisible()
    await expect(page.getByText('Accepted Worldwide')).toBeVisible()
  })

  test('shows benefit descriptions', async ({ page }) => {
    await expect(page.getByText('Verifiable on airline websites')).toBeVisible()
    await expect(page.getByText('Download immediately')).toBeVisible()
    await expect(page.getByText('Time to clear immigration')).toBeVisible()
    await expect(page.getByText('Airlines & immigration')).toBeVisible()
  })

  test('shows Pro pricing card', async ({ page }) => {
    await expect(page.getByText('Pro Members')).toBeVisible()
    await expect(page.getByText('2 bookings/month included with $10/mo Pro')).toBeVisible()
  })

  test('shows One-Time pricing card', async ({ page }) => {
    await expect(page.getByText('One-Time')).toBeVisible()
    await expect(page.getByText('$12/ticket')).toBeVisible()
    await expect(page.getByText('Pay per booking, no subscription')).toBeVisible()
  })

  test('displays stepper with 3 steps', async ({ page }) => {
    await expect(page.getByText('Search', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Details', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Confirm', { exact: true }).first()).toBeVisible()
  })

  test('shows search form with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /find your onward flight/i })).toBeVisible()
  })

  test('has origin airport dropdown with Thai airports', async ({ page }) => {
    // Labels aren't linked via for/id, so use the select directly
    const originSelect = page.locator('select').first()
    await expect(originSelect).toBeVisible()
    await expect(originSelect).toHaveValue('BKK')

    // Verify dropdown has Thai airports
    const options = originSelect.locator('option')
    const count = await options.count()
    expect(count).toBeGreaterThanOrEqual(6)
  })

  test('has destination dropdown with popular destinations', async ({ page }) => {
    const destSelect = page.locator('select').nth(1)
    await expect(destSelect).toBeVisible()
    await expect(destSelect).toHaveValue('KUL')

    // Should include KUL, SIN, PNH, SGN, VTE, RGN, HKG, NRT, and "other"
    const options = destSelect.locator('option')
    const count = await options.count()
    expect(count).toBeGreaterThanOrEqual(9)
  })

  test('shows custom destination input when "other" selected', async ({ page }) => {
    const destSelect = page.locator('select').nth(1)
    await destSelect.selectOption('other')

    const customInput = page.getByPlaceholder(/airport code/i)
    await expect(customInput).toBeVisible()
  })

  test('has departure date picker', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]')
    await expect(dateInput).toBeVisible()
  })

  test('search button enables with date filled', async ({ page }) => {
    const searchBtn = page.getByRole('button', { name: /search flights/i })
    await expect(searchBtn).toBeVisible()

    // Fill in a date
    const dateInput = page.locator('input[type="date"]')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 2)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await dateInput.fill(dateStr)

    await expect(searchBtn).toBeEnabled()
  })

  test('shows Best Value badge on Pro card', async ({ page }) => {
    await expect(page.getByText('Best Value')).toBeVisible()
  })

  test('clicking Pro pricing card opens upgrade modal', async ({ page }) => {
    const proCard = page.locator('text=Pro Members').locator('..')
    await proCard.click()

    await expect(page.getByText(/upgrade to pro/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/onward-ticket')

    await expect(page.getByRole('heading', { name: 'Proof of Onward Travel' })).toBeVisible()
    await expect(page.getByText('Real PNR Code')).toBeVisible()

    // No horizontal overflow
    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth)
    const clientWidth = await page.locator('body').evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
  })
})

test.describe('Onward Ticket - Flight Search', () => {
  test('shows search results after successful search', async ({ page }) => {
    await mockStatusAndSearch(page)
    await page.goto('/onward-ticket')

    // Fill date and search
    const dateInput = page.locator('input[type="date"]')
    await dateInput.fill('2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()

    // Wait for results
    await expect(page.getByText('2 flights found')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('AirAsia')).toBeVisible()
    await expect(page.getByText('Thai Airways')).toBeVisible()
    await expect(page.getByText('$35.00')).toBeVisible()
    await expect(page.getByText('$85.00')).toBeVisible()
  })

  test('clicking a flight result moves to step 2', async ({ page }) => {
    await mockStatusAndSearch(page)
    await page.goto('/onward-ticket')

    await page.locator('input[type="date"]').fill('2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()
    await expect(page.getByText('AirAsia')).toBeVisible({ timeout: 10000 })
    await page.getByText('AirAsia').click()

    await expect(page.getByRole('heading', { name: /passenger details/i })).toBeVisible({ timeout: 5000 })
  })

  test('step 2 shows passenger form fields', async ({ page }) => {
    await mockStatusAndSearch(page)
    await page.goto('/onward-ticket')

    await page.locator('input[type="date"]').fill('2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()
    await expect(page.getByText('AirAsia')).toBeVisible({ timeout: 10000 })
    await page.getByText('AirAsia').click()

    // Verify passenger form fields via label text
    await expect(page.getByText('First Name (as on passport)')).toBeVisible()
    await expect(page.getByText('Last Name')).toBeVisible()
    await expect(page.getByText('Date of Birth')).toBeVisible()
    await expect(page.getByText('Gender')).toBeVisible()
    await expect(page.getByText('Email')).toBeVisible()
    await expect(page.getByText('Phone Number')).toBeVisible()
  })

  test('step 2 shows service fee for non-Pro users', async ({ page }) => {
    await mockStatusAndSearch(page)
    await page.goto('/onward-ticket')

    await page.locator('input[type="date"]').fill('2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()
    await expect(page.getByText('AirAsia')).toBeVisible({ timeout: 10000 })
    await page.getByText('AirAsia').click()

    await expect(page.getByText('Service Fee: $12.00')).toBeVisible()
    await expect(page.getByText('Continue to Payment')).toBeVisible()
  })

  test('step 2 back button returns to step 1', async ({ page }) => {
    await mockStatusAndSearch(page)
    await page.goto('/onward-ticket')

    await page.locator('input[type="date"]').fill('2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()
    await expect(page.getByText('AirAsia')).toBeVisible({ timeout: 10000 })
    await page.getByText('AirAsia').click()

    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.getByRole('heading', { name: /find your onward flight/i })).toBeVisible()
  })

  test('handles API error on search gracefully', async ({ page }) => {
    await page.route('**/api/onward-ticket', async (route) => {
      const body = route.request().postDataJSON()
      if (body?.action === 'status') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { isPro: false, bookingsThisMonth: 0, monthlyLimit: 2, serviceFee: 1200 },
            success: true,
          }),
        })
      } else if (body?.action === 'search') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to process onward ticket request' }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/onward-ticket')
    await page.locator('input[type="date"]').fill('2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()

    // Page should not crash — search form remains visible
    await page.waitForTimeout(2000)
    await expect(page.getByRole('heading', { name: /find your onward flight/i })).toBeVisible()
  })

  test('shows no results for empty search response', async ({ page }) => {
    await page.route('**/api/onward-ticket', async (route) => {
      const body = route.request().postDataJSON()
      if (body?.action === 'status') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { isPro: false, bookingsThisMonth: 0, monthlyLimit: 2, serviceFee: 1200 },
            success: true,
          }),
        })
      } else if (body?.action === 'search') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { offers: [] }, success: true }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/onward-ticket')
    await page.locator('input[type="date"]').fill('2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()

    await page.waitForTimeout(2000)
    await expect(page.getByText('flights found')).not.toBeVisible()
  })
})

test.describe('Onward Ticket - Pro User', () => {
  test('shows Pro status banner', async ({ page }) => {
    await page.route('**/api/onward-ticket', async (route) => {
      const body = route.request().postDataJSON()
      if (body?.action === 'status') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { isPro: true, bookingsThisMonth: 0, monthlyLimit: 2, serviceFee: 1200 },
            success: true,
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/onward-ticket')
    await expect(page.getByText(/2 free booking.*remaining this month/i)).toBeVisible({ timeout: 5000 })
  })

  test('shows info section instead of pricing cards', async ({ page }) => {
    await page.route('**/api/onward-ticket', async (route) => {
      const body = route.request().postDataJSON()
      if (body?.action === 'status') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { isPro: true, bookingsThisMonth: 0, monthlyLimit: 2, serviceFee: 1200 },
            success: true,
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/onward-ticket')
    await expect(page.getByText(/why do you need an onward ticket/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Best Value')).not.toBeVisible()
  })
})
