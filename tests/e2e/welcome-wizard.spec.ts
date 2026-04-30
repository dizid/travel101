import { test, expect, type Page } from '@playwright/test'

// Helper: clear all storage so the wizard appears as a first-visit user
async function asFirstVisit(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('welcome-wizard-completed')
      localStorage.removeItem('user-profile')
    } catch {}
  })
}

async function asReturningVisit(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('welcome-wizard-completed', '1')
  })
}

test.describe('WelcomeWizard — first-visit onboarding', () => {
  test('appears for a fresh visitor', async ({ page }) => {
    await asFirstVisit(page)
    await page.goto('/')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/welcome to happyroam/i)).toBeVisible()
    await expect(dialog.getByText(/step 1 of 3/i)).toBeVisible()
  })

  test('does NOT appear for a returning visitor', async ({ page }) => {
    await asReturningVisit(page)
    await page.goto('/')

    await expect(page.getByRole('dialog')).toHaveCount(0)
    // The hero CTA must be clickable — wizard backdrop is not blocking
    await expect(page.getByRole('link', { name: /explore places/i }).first()).toBeVisible()
  })

  test('Skip closes the wizard, sets the flag, leaves profile empty', async ({ page }) => {
    await asFirstVisit(page)
    await page.goto('/')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /skip onboarding/i }).click()
    await expect(dialog).not.toBeVisible()

    const flag = await page.evaluate(() => localStorage.getItem('welcome-wizard-completed'))
    expect(flag).toBe('1')

    const profile = await page.evaluate(() => localStorage.getItem('user-profile'))
    // No profile saved when skipping
    expect(profile).toBeNull()

    // Reload — wizard does NOT come back
    await page.reload()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('backdrop click skips the wizard', async ({ page }) => {
    await asFirstVisit(page)
    await page.goto('/')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Click outside the dialog (top-left corner of the backdrop)
    await page.mouse.click(5, 5)
    await expect(dialog).not.toBeVisible()

    const flag = await page.evaluate(() => localStorage.getItem('welcome-wizard-completed'))
    expect(flag).toBe('1')
  })

  test('Escape key skips the wizard', async ({ page }) => {
    await asFirstVisit(page)
    await page.goto('/')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()

    const flag = await page.evaluate(() => localStorage.getItem('welcome-wizard-completed'))
    expect(flag).toBe('1')
  })

  test('full happy path: 3 steps → Finish → profile populated', async ({ page }) => {
    await asFirstVisit(page)
    await page.goto('/')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Step 1 — pick "Digital nomad"
    await expect(dialog.getByText(/what brings you to thailand/i)).toBeVisible()
    await dialog.getByRole('button', { name: /digital nomad/i }).click()
    await dialog.getByRole('button', { name: /next/i }).click()

    // Step 2 — multi-select styles + group
    await expect(dialog.getByText(/your travel style/i)).toBeVisible()

    // Next is disabled until at least one style and a group are chosen
    const nextStep2 = dialog.getByRole('button', { name: /next/i })
    await expect(nextStep2).toBeDisabled()

    await dialog.getByRole('button', { name: /adventure/i }).click()
    await dialog.getByRole('button', { name: /culture/i }).click()
    // group defaults to 'solo' so it's already valid — but click to be explicit
    await dialog.getByRole('button', { name: /solo/i }).click()
    await expect(nextStep2).toBeEnabled()
    await nextStep2.click()

    // Step 3 — nationality
    await expect(dialog.getByText(/your nationality/i)).toBeVisible()
    const finish = dialog.getByRole('button', { name: /finish/i })
    await expect(finish).toBeDisabled()

    await dialog.getByRole('button', { name: /united states/i }).click()
    await expect(finish).toBeEnabled()
    await finish.click()

    // Wizard closes
    await expect(dialog).not.toBeVisible()

    // Flag set
    const flag = await page.evaluate(() => localStorage.getItem('welcome-wizard-completed'))
    expect(flag).toBe('1')

    // Profile saved with the chosen prefs
    const stored = await page.evaluate(() => localStorage.getItem('user-profile'))
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed.prefs.tripType).toBe('digital_nomad')
    expect(parsed.prefs.travelStyle).toEqual(expect.arrayContaining(['adventure', 'culture']))
    expect(parsed.prefs.groupType).toBe('solo')
    expect(parsed.prefs.nationality).toBe('United States')
  })

  test('Back button returns to the previous step', async ({ page }) => {
    await asFirstVisit(page)
    await page.goto('/')

    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: /holiday traveler/i }).click()
    await dialog.getByRole('button', { name: /next/i }).click()

    await expect(dialog.getByText(/your travel style/i)).toBeVisible()
    await dialog.getByRole('button', { name: /back/i }).click()

    await expect(dialog.getByText(/what brings you to thailand/i)).toBeVisible()
  })

  test('typed nationality works (not just chips)', async ({ page }) => {
    await asFirstVisit(page)
    await page.goto('/')

    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: /holiday traveler/i }).click()
    await dialog.getByRole('button', { name: /next/i }).click()
    await dialog.getByRole('button', { name: /relaxation/i }).click()
    await dialog.getByRole('button', { name: /next/i }).click()

    await dialog.getByPlaceholder(/united states/i).fill('Brazil')
    await dialog.getByRole('button', { name: /finish/i }).click()

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('user-profile')!))
    expect(stored.prefs.nationality).toBe('Brazil')
  })

  test('"Set My Preferences" button on home opens the wizard for users without a profile', async ({ page }) => {
    // Returning visitor BUT with no profile saved
    await page.addInitScript(() => {
      localStorage.setItem('welcome-wizard-completed', '1')
      localStorage.removeItem('user-profile')
    })
    await page.goto('/')

    // Auto-trigger should NOT fire (flag is set), but the button must still open the wizard
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.getByRole('button', { name: /set my preferences/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('renders full-screen on mobile', async ({ page }) => {
    await asFirstVisit(page)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/step 1 of 3/i)).toBeVisible()
    await expect(dialog.getByRole('button', { name: /digital nomad/i })).toBeVisible()
  })

  test('locks page scroll while open', async ({ page }) => {
    await asFirstVisit(page)
    await page.goto('/')

    await expect(page.getByRole('dialog')).toBeVisible()
    const overflow = await page.evaluate(() => document.body.style.overflow)
    expect(overflow).toBe('hidden')

    await page.getByRole('button', { name: /skip onboarding/i }).click()

    // After close, overflow is released
    const after = await page.evaluate(() => document.body.style.overflow)
    expect(after).toBe('')
  })
})
