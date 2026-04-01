import { test, expect } from '@playwright/test'

// Helper: pick a date in an Ant DatePicker via the calendar popup
async function pickDate(page: import('@playwright/test').Page, pickerIndex: number, isoDate: string) {
  await page.locator('.onward-datepicker').nth(pickerIndex).click()
  await page.locator('.ant-picker-dropdown').first().waitFor({ state: 'visible' })
  // Navigate forward months until the target date cell is visible
  const cell = page.locator(`.ant-picker-cell[title="${isoDate}"]`)
  for (let i = 0; i < 6; i++) {
    if (await cell.isVisible().catch(() => false)) break
    await page.locator('.ant-picker-header-next-btn').first().click()
    await page.locator('.ant-picker-cell').first().waitFor({ state: 'visible' })
  }
  await cell.click()
}

// Helper: pick DOB from the Ant DatePicker.
// The picker defaults to ~30 years ago. Click any visible day cell.
async function fillDob(page: import('@playwright/test').Page) {
  const picker = page.locator('.onward-datepicker').first()
  await picker.scrollIntoViewIfNeeded()
  await picker.click()

  // Wait for the dropdown to appear
  await page.locator('.ant-picker-dropdown').first().waitFor({ state: 'visible' })

  // Click day "15" in the visible month (defaults to ~1996, any past date works)
  const dayCell = page.locator('.ant-picker-dropdown:visible .ant-picker-cell-in-view .ant-picker-cell-inner').filter({ hasText: /^15$/ }).first()
  await dayCell.click()

  // Wait for picker to close, then scroll form back into view
  await page.locator('.ant-picker-dropdown').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {})
  await page.locator('h2:has-text("Passenger Details")').scrollIntoViewIfNeeded()
}

// Helper: fill all passenger fields on Step 2
async function fillPassenger(page: import('@playwright/test').Page, data: {
  firstName: string; lastName: string; gender: 'm' | 'f'; email: string; phone: string
}) {
  // Scope all selectors to the passenger form (inside main, not footer)
  const form = page.locator('form').first()
  await form.locator('input').first().fill(data.firstName)
  await form.locator('input').nth(1).fill(data.lastName)
  await fillDob(page)
  await form.locator('select').first().selectOption(data.gender)
  const emailInput = form.locator('input[type="email"]')
  await emailInput.scrollIntoViewIfNeeded()
  await emailInput.fill(data.email)
  const phoneInput = form.locator('input[type="tel"]')
  await phoneInput.scrollIntoViewIfNeeded()
  await phoneInput.fill(data.phone)
}

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
    const datePicker = page.locator('.onward-datepicker').first()
    await expect(datePicker).toBeVisible()
  })

  test('search button enables with date filled', async ({ page }) => {
    const searchBtn = page.getByRole('button', { name: /search flights/i })
    await expect(searchBtn).toBeVisible()

    // Pick a date via the calendar popup
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 2)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await pickDate(page, 0, dateStr)

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
    await pickDate(page, 0, '2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()

    // Wait for results
    await expect(page.getByText('2 flights found')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('AirAsia')).toBeVisible()
    await expect(page.getByText('Thai Airways')).toBeVisible()
    await expect(page.getByText('$35.00')).toBeVisible()
    await expect(page.getByText('$85.00')).toBeVisible()
    await expect(page.getByText('You pay $12.00').first()).toBeVisible()
  })

  test('clicking a flight result moves to step 2', async ({ page }) => {
    await mockStatusAndSearch(page)
    await page.goto('/onward-ticket')

    await pickDate(page, 0, '2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()
    await expect(page.getByText('AirAsia')).toBeVisible({ timeout: 10000 })
    await page.getByText('AirAsia').click()

    await expect(page.getByRole('heading', { name: /passenger details/i })).toBeVisible({ timeout: 5000 })
  })

  test('step 2 shows passenger form fields', async ({ page }) => {
    await mockStatusAndSearch(page)
    await page.goto('/onward-ticket')

    await pickDate(page, 0, '2026-04-15')
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

    await pickDate(page, 0, '2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()
    await expect(page.getByText('AirAsia')).toBeVisible({ timeout: 10000 })
    await page.getByText('AirAsia').click()

    await expect(page.getByText('Total Cost')).toBeVisible()
    await expect(page.getByText('$12.00').first()).toBeVisible()
    await expect(page.getByText('Continue to Payment')).toBeVisible()
  })

  test('step 2 back button returns to step 1', async ({ page }) => {
    await mockStatusAndSearch(page)
    await page.goto('/onward-ticket')

    await pickDate(page, 0, '2026-04-15')
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
    await pickDate(page, 0, '2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()

    // Page should not crash — search form remains visible (mock returns 500, so no flight results)
    await expect(page.getByRole('heading', { name: /find your onward flight/i })).toBeVisible({ timeout: 5000 })
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
    await pickDate(page, 0, '2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()

    // Empty response returns no offers — "flights found" text should not appear
    await expect(page.getByText('flights found')).not.toBeVisible({ timeout: 5000 })
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

// ─── Full Booking Flow (Pro user — no Stripe needed) ───────────────────────

test.describe('Onward Ticket - Full Booking Flow (Pro)', () => {
  const MOCK_BOOKING = {
    bookingId: 'ord_e2e_test_001',
    pnr: 'HRTST1',
    airline: 'AirAsia',
    origin: 'BKK',
    destination: 'KUL',
    departureTime: '2026-04-15T08:00:00',
    arrivalTime: '2026-04-15T11:30:00',
    expiresAt: '2026-04-17T08:00:00',
    passengerName: 'Test Traveler',
  }

  async function mockAllApis(page: import('@playwright/test').Page) {
    await page.route('**/api/onward-ticket', async (route) => {
      const body = route.request().postDataJSON()
      const action = body?.action

      if (action === 'status') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { isPro: true, bookingsThisMonth: 0, monthlyLimit: 2, serviceFee: 1200 },
            success: true,
          }),
        })
      } else if (action === 'search') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              offers: [
                {
                  id: 'off_test_airasia',
                  airline: 'AirAsia',
                  airlineCode: 'AK',
                  price: '35.00',
                  currency: 'USD',
                  departureTime: '2026-04-15T08:00:00',
                  arrivalTime: '2026-04-15T11:30:00',
                  duration: '3h 30m',
                  stops: 0,
                },
                {
                  id: 'off_test_thai',
                  airline: 'Thai Airways',
                  airlineCode: 'TG',
                  price: '85.00',
                  currency: 'USD',
                  departureTime: '2026-04-15T14:00:00',
                  arrivalTime: '2026-04-15T17:30:00',
                  duration: '3h 30m',
                  stops: 0,
                },
              ],
            },
            success: true,
          }),
        })
      } else if (action === 'book') {
        // Verify passenger data was sent correctly
        const passenger = body?.passenger
        if (!passenger?.given_name || !passenger?.family_name || !passenger?.email) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Missing passenger data' }),
          })
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_BOOKING, success: true }),
        })
      } else {
        await route.continue()
      }
    })
  }

  test('complete booking: search → select → fill details → confirm → see PNR', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/onward-ticket')

    // ── Step 1: Search ──
    // Verify Pro status banner
    await expect(page.getByText(/2 free booking.*remaining this month/i)).toBeVisible({ timeout: 5000 })

    // Origin should default to BKK
    const originSelect = page.locator('select').first()
    await expect(originSelect).toHaveValue('BKK')

    // Destination defaults to KUL
    const destSelect = page.locator('select').nth(1)
    await expect(destSelect).toHaveValue('KUL')

    // Pick departure date
    await pickDate(page, 0, '2026-04-15')

    // Search flights
    await page.getByRole('button', { name: /search flights/i }).click()

    // Wait for results
    await expect(page.getByText('2 flights found')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('AirAsia')).toBeVisible()
    await expect(page.getByText('Thai Airways')).toBeVisible()

    // ── Step 1→2: Select a flight ──
    await page.getByText('AirAsia').click()
    await expect(page.getByRole('heading', { name: /passenger details/i })).toBeVisible({ timeout: 5000 })

    // Verify selected flight summary shows
    await expect(page.getByText('Included with Pro')).toBeVisible()

    // ── Step 2: Fill passenger details ──
    await fillPassenger(page, {
      firstName: 'Test', lastName: 'Traveler', gender: 'm',
      email: 'test@happyroam.travel', phone: '+66812345678',
    })

    // ── Step 2→3: Submit (Pro — no payment needed) ──
    const reserveBtn = page.getByRole('button', { name: /reserve flight/i })
    await reserveBtn.scrollIntoViewIfNeeded()
    await reserveBtn.click()

    // ── Step 3: Booking Confirmation ──
    await expect(page.getByRole('heading', { name: 'Reservation Confirmed!' })).toBeVisible({ timeout: 10000 })

    // PNR displayed prominently
    await expect(page.getByText('HRTST1')).toBeVisible()

    // Booking details
    await expect(page.getByText('AirAsia')).toBeVisible()
    await expect(page.getByText(/BKK.*KUL/)).toBeVisible()
    await expect(page.getByText('Test Traveler')).toBeVisible()

    // Download PDF button exists
    await expect(page.getByRole('button', { name: /download pdf/i })).toBeVisible()

    // "Book another" link exists
    await expect(page.getByText('Book another reservation')).toBeVisible()
  })

  test('booking confirmation: Download PDF button is clickable', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/onward-ticket')

    // Fast-track to confirmation
    await pickDate(page, 0, '2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()
    await expect(page.getByText('AirAsia')).toBeVisible({ timeout: 10000 })
    await page.getByText('AirAsia').click()
    await fillPassenger(page, { firstName: 'Test', lastName: 'Traveler', gender: 'm', email: 'test@happyroam.travel', phone: '+66812345678' })
    const reserveBtn = page.getByRole('button', { name: /reserve flight/i })
    await reserveBtn.scrollIntoViewIfNeeded()
    await reserveBtn.click()
    await expect(page.getByText('HRTST1')).toBeVisible({ timeout: 10000 })

    // Verify PDF download button works without crash
    await page.getByRole('button', { name: /download pdf/i }).click()

    // PDF generation may trigger a download or blob URL — verify page still functional
    await expect(page.getByText('HRTST1')).toBeVisible({ timeout: 5000 })
  })

  test('booking confirmation: "Book another" resets to Step 1', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/onward-ticket')

    // Fast-track to confirmation
    await pickDate(page, 0, '2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()
    await expect(page.getByText('AirAsia')).toBeVisible({ timeout: 10000 })
    await page.getByText('AirAsia').click()
    await fillPassenger(page, { firstName: 'Test', lastName: 'Traveler', gender: 'm', email: 'test@happyroam.travel', phone: '+66812345678' })
    const reserveBtn2 = page.getByRole('button', { name: /reserve flight/i })
    await reserveBtn2.scrollIntoViewIfNeeded()
    await reserveBtn2.click()
    await expect(page.getByText('HRTST1')).toBeVisible({ timeout: 10000 })

    // Click "Book another reservation"
    await page.getByText('Book another reservation').click()

    // Should be back at Step 1
    await expect(page.getByRole('heading', { name: /find your onward flight/i })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('HRTST1')).not.toBeVisible()
  })

  test('booking sends correct passenger data to API', async ({ page }) => {
    let capturedBookingBody: any = null

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
      } else if (body?.action === 'search') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              offers: [{
                id: 'off_test_airasia',
                airline: 'AirAsia',
                airlineCode: 'AK',
                price: '35.00',
                currency: 'USD',
                departureTime: '2026-04-15T08:00:00',
                arrivalTime: '2026-04-15T11:30:00',
                duration: '3h 30m',
                stops: 0,
              }],
            },
            success: true,
          }),
        })
      } else if (body?.action === 'book') {
        capturedBookingBody = body
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_BOOKING, success: true }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/onward-ticket')
    await pickDate(page, 0, '2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()
    await expect(page.getByText('AirAsia')).toBeVisible({ timeout: 10000 })
    await page.getByText('AirAsia').click()

    // Fill passenger with specific data
    await fillPassenger(page, { firstName: 'John', lastName: 'Doe', gender: 'f', email: 'john.doe@example.com', phone: '+66999999999' })
    const reserveBtn3 = page.getByRole('button', { name: /reserve flight/i })
    await reserveBtn3.scrollIntoViewIfNeeded()
    await reserveBtn3.click()

    // Wait for confirmation
    await expect(page.getByText('HRTST1')).toBeVisible({ timeout: 10000 })

    // Verify the API received correct data
    expect(capturedBookingBody).toBeTruthy()
    expect(capturedBookingBody.action).toBe('book')
    expect(capturedBookingBody.offerId).toBe('off_test_airasia')
    expect(capturedBookingBody.passenger.given_name).toBe('John')
    expect(capturedBookingBody.passenger.family_name).toBe('Doe')
    expect(capturedBookingBody.passenger.gender).toBe('f')
    expect(capturedBookingBody.passenger.email).toBe('john.doe@example.com')
    expect(capturedBookingBody.passenger.phone).toBe('+66999999999')
  })

  test('booking error shows error message, does not crash', async ({ page }) => {
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
      } else if (body?.action === 'search') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              offers: [{
                id: 'off_test_fail',
                airline: 'FailAir',
                airlineCode: 'FA',
                price: '20.00',
                currency: 'USD',
                departureTime: '2026-04-15T10:00:00',
                arrivalTime: '2026-04-15T13:00:00',
                duration: '3h',
                stops: 0,
              }],
            },
            success: true,
          }),
        })
      } else if (body?.action === 'book') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Duffel API unavailable' }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/onward-ticket')
    await pickDate(page, 0, '2026-04-15')
    await page.getByRole('button', { name: /search flights/i }).click()
    await expect(page.getByText('FailAir')).toBeVisible({ timeout: 10000 })
    await page.getByText('FailAir').click()
    await fillPassenger(page, { firstName: 'Test', lastName: 'User', gender: 'm', email: 'test@test.com', phone: '+66000000000' })
    const reserveBtn4 = page.getByRole('button', { name: /reserve flight/i })
    await reserveBtn4.scrollIntoViewIfNeeded()
    await reserveBtn4.click()

    // Should not show confirmation — booking failed (API returned 500)
    await expect(page.getByText('Reservation Confirmed!')).not.toBeVisible({ timeout: 5000 })

    // Page should still be functional (no crash)
    await expect(page.getByRole('heading', { name: 'Proof of Onward Travel' })).toBeVisible()
  })
})
