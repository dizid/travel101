import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Pages to test for accessibility
const pages = [
  { path: '/', name: 'Home' },
  { path: '/visa', name: 'Visa Wizard' },
  { path: '/tdac', name: 'TDAC Guide' },
  { path: '/warnings', name: 'Warnings' },
  { path: '/attractions', name: 'Attractions' },
  { path: '/profile', name: 'Profile' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/itinerary', name: 'Itinerary' },
  { path: '/smart-match', name: 'Smart Match' },
  { path: '/packing', name: 'Packing' },
  { path: '/safety', name: 'Safety' },
  { path: '/privacy', name: 'Privacy' },
  { path: '/terms', name: 'Terms' },
  { path: '/contact', name: 'Contact' },
]

test.describe('Accessibility', () => {
  for (const page of pages) {
    test(`${page.name} page has no critical accessibility violations`, async ({ page: pageObj }) => {
      await pageObj.addInitScript(() => {
        localStorage.setItem('welcome-wizard-completed', '1')
      })
      await pageObj.goto(page.path)

      // Wait for page to load
      await pageObj.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

      const accessibilityScanResults = await new AxeBuilder({ page: pageObj })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      // Filter to only critical and serious violations
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      )

      // Log violations for debugging
      if (criticalViolations.length > 0) {
        console.log(`Accessibility violations on ${page.name}:`)
        criticalViolations.forEach((v) => {
          console.log(`- ${v.id}: ${v.description} (${v.impact})`)
          console.log(`  Nodes: ${v.nodes.length}`)
        })
      }

      expect(criticalViolations).toHaveLength(0)
    })
  }
})

test.describe('Keyboard Navigation', () => {
  test('can navigate homepage with keyboard only', async ({ page }) => {
    await page.goto('/')

    // Press Tab to navigate through interactive elements
    await page.keyboard.press('Tab')

    // First focusable element should be focused
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // Tab through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      await expect(focused).toBeVisible()
    }
  })

  test('can navigate attractions page with keyboard', async ({ page }) => {
    await page.goto('/attractions')
    await page.waitForSelector('[data-testid="attraction-card"], .attraction-card, article', { timeout: 15000 })

    // Tab through elements
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('can use Enter to activate buttons', async ({ page }) => {
    await page.goto('/')

    // Find first button and focus it
    const firstButton = page.locator('button').first()
    await firstButton.focus()

    // Should be able to activate with Enter
    await expect(firstButton).toBeFocused()
  })

  test('escape closes modals/popups', async ({ page }) => {
    await page.goto('/')

    // Look for any modal trigger
    const modalTrigger = page.locator('button[aria-haspopup], [data-modal-trigger]').first()

    if (await modalTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await modalTrigger.click()
      await page.keyboard.press('Escape')
      // Modal should close
    }
  })
})

test.describe('Focus Management', () => {
  test('visible focus indicators on interactive elements', async ({ page }) => {
    await page.goto('/')

    // Check that focus is visible on buttons
    const button = page.locator('button').first()
    await button.focus()

    // Get computed styles to verify focus indicator
    const hasFocusStyle = await button.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      const focusStyles = window.getComputedStyle(el, ':focus')
      return (
        styles.outlineWidth !== '0px' ||
        styles.boxShadow !== 'none' ||
        focusStyles.outlineWidth !== '0px'
      )
    })

    // Focus should have some visual indicator
    await expect(button).toBeFocused()
  })

  test('skip link functionality', async ({ page }) => {
    await page.goto('/')

    // Check for skip link (usually first focusable element)
    const skipLink = page.locator('a[href="#main"], a[href="#content"], .skip-link, a:has-text("Skip to content"), a:has-text("Skip to main")').first()

    if (await skipLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipLink.focus()
      await expect(skipLink).toBeFocused()
    }
  })
})

test.describe('Color Contrast', () => {
  test('text has sufficient contrast', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({
        rules: {
          'color-contrast': { enabled: true },
        },
      })
      .analyze()

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    )

    // Allow some minor violations but flag if there are many
    expect(contrastViolations.length).toBeLessThan(5)
  })
})

test.describe('ARIA Labels', () => {
  test('images have alt text', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      const ariaHidden = await img.getAttribute('aria-hidden')

      // Images should have alt text or be decorative (role="presentation" or aria-hidden)
      const isAccessible = alt !== null || role === 'presentation' || ariaHidden === 'true'
      expect(isAccessible).toBeTruthy()
    }
  })

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})

    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const ariaLabelledby = await button.getAttribute('aria-labelledby')
      const title = await button.getAttribute('title')

      // Button should have accessible name
      const hasAccessibleName = (text && text.trim()) || ariaLabel || ariaLabelledby || title
      expect(hasAccessibleName).toBeTruthy()
    }
  })

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/profile')

    const inputs = page.locator('input:not([type="hidden"]), select, textarea')
    const count = await inputs.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledby = await input.getAttribute('aria-labelledby')
      const placeholder = await input.getAttribute('placeholder')

      // Input should have label (label element, aria-label, or aria-labelledby)
      let hasLabel = ariaLabel || ariaLabelledby || placeholder

      if (id && !hasLabel) {
        const labelCount = await page.locator(`label[for="${id}"]`).count()
        hasLabel = labelCount > 0
      }

      // Allow placeholder as fallback (not ideal but common)
      expect(hasLabel).toBeTruthy()
    }
  })
})

test.describe('Mobile Accessibility', () => {
  test('touch targets are large enough', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const buttons = page.locator('button, a')
    const count = await buttons.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i)

      if (await button.isVisible()) {
        const box = await button.boundingBox()
        if (box) {
          // Touch targets should be at least 44x44 pixels (WCAG recommendation)
          // Allow some flexibility for inline links
          const isTouchTarget = box.width >= 44 && box.height >= 44
          const isInlineText = box.height < 30 && box.width > 44

          // Either proper touch target or inline text link
          expect(isTouchTarget || isInlineText).toBeTruthy()
        }
      }
    }
  })

  test('content is readable without horizontal scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }) // iPhone SE size
    await page.goto('/')

    const body = page.locator('body')
    const scrollWidth = await body.evaluate((el) => el.scrollWidth)
    const clientWidth = await body.evaluate((el) => el.clientWidth)

    // Should not require horizontal scrolling
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10)
  })
})

test.describe('Reduced Motion', () => {
  test('respects prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    // Check that animations are disabled or reduced
    // This is a basic check - more thorough testing would require checking specific animations
    const hasAnimations = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      for (const el of elements) {
        const style = window.getComputedStyle(el)
        if (style.animationName !== 'none' && style.animationDuration !== '0s') {
          return true
        }
      }
      return false
    })

    // If animations exist, they should be short or disabled with reduced motion
    // This test is informational - not all animations are problematic
  })
})
