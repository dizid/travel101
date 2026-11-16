// Live end-to-end check of HappyRoam's onward-ticket (flight) booking flow
// and the signed-in pages, against the real site (board T-0597, Marc Nov 16).
//
// What it does, on a 390 px phone screen (one Chromium, one page):
//   1. signs in with the shared test account, or signs up a fresh one
//      (--signup), from ~/.config/dizid-keys/happyroam-test.env
//   2. /onward-ticket: picks a route and a date, searches, selects the first
//      flight, fills the passenger form and continues to payment
//   3. STOPS at the payment step: it never types a card or pays
//   4. opens the other main pages signed in
// Every console error, page crash, failed request and 4xx/5xx response is
// logged with the page it happened on; screenshots per step.
//
// Usage: node tests/e2e-live/booking-flow.live.mjs [--signup | --account=e2e] [--base=https://happyroam.travel] [--out=<dir>]
// Writes <out>/report.json, <out>/report.md and <out>/*.png. No secrets are
// written to <out>: the account's email is shown, its password never.
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { randomBytes } from 'node:crypto'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=')
    return [key, value ?? true]
  })
)
const BASE = String(args.base || 'https://happyroam.travel').replace(/\/$/, '')
const OUT = resolve(String(args.out || 'e2e-live-results'))
const KEY_FILE = join(homedir(), '.config/dizid-keys/happyroam-test.env')
mkdirSync(OUT, { recursive: true })

// Pages a signed-in traveller opens; each is checked for errors after the flow.
const PAGES = [
  '/', '/dashboard', '/visa', '/tdac', '/warnings', '/attractions', '/heritage', '/festivals',
  '/guides', '/itinerary', '/alerts', '/smart-match', '/packing', '/safety', '/emergency',
  '/90-day', '/medical', '/cost-calculator', '/setup-guide', '/saved', '/profile', '/people',
  '/phrasebook', '/visa-countdown', '/about', '/contact', '/ai-trip-planner-app-thailand',
]

// Third-party noise that says nothing about HappyRoam itself (ad/analytics
// blockers, beacons cancelled by navigation). Kept in the report, marked.
const NOISE = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|clarity\.ms|facebook\.net|net::ERR_ABORTED/

function readKeys() {
  const keys = {}
  for (const line of readFileSync(KEY_FILE, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) keys[match[1]] = match[2].trim()
  }
  return keys
}

const findings = []
let currentStep = 'start'
function record(kind, detail, url) {
  const noise = NOISE.test(detail) || NOISE.test(url || '')
  findings.push({ step: currentStep, kind, detail: detail.slice(0, 500), url: url || '', noise })
}

async function shot(page, name) {
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false })
}

async function main() {
  const keys = readKeys()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 HappyRoamE2E',
  })
  const page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') record('console-error', msg.text(), page.url())
  })
  page.on('pageerror', (err) => record('page-crash', `${err.name}: ${err.message}`, page.url()))
  page.on('requestfailed', (req) => record('request-failed', `${req.method()} ${req.failure()?.errorText}`, req.url()))
  page.on('response', (res) => {
    if (res.status() >= 400) record(`http-${res.status()}`, `${res.request().method()} ${res.status()}`, res.url())
  })

  const flow = { account: '', signedIn: false, search: '', offers: 0, payment: '', stoppedBeforePaying: true }

  // 1. Account
  if (args.signup) {
    currentStep = 'sign-up'
    const [local, domain] = keys.HR_TEST_EMAIL.split('@')
    const email = `${local}+e2e${Date.now().toString(36)}@${domain}`
    const password = randomBytes(12).toString('base64url')
    await page.goto(`${BASE}/auth/sign-up`, { waitUntil: 'networkidle' })
    await shot(page, '01-sign-up-form')
    await page.fill('input[autocomplete="name"]', 'Claude E2E')
    await page.fill('input[autocomplete="email"]', email)
    await page.fill('input[autocomplete="new-password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 30000 }).catch(() => {})
    await page.waitForLoadState('networkidle').catch(() => {})
    await shot(page, '02-after-sign-up')
    flow.account = email
    flow.signedIn = /\/dashboard/.test(page.url())
    // Keep the new account's login next to the shared one (never in the output folder).
    appendFileSync(KEY_FILE, `HR_E2E_EMAIL=${email}\nHR_E2E_PASSWORD=${password}\n`)
  } else {
    // --account=e2e: the account the last --signup run made; default: the shared test account.
    const email = args.account === 'e2e' ? keys.HR_E2E_EMAIL : keys.HR_TEST_EMAIL
    const password = args.account === 'e2e' ? keys.HR_E2E_PASSWORD : keys.HR_TEST_PASSWORD
    currentStep = 'sign-in'
    await page.goto(`${BASE}/auth/sign-in`, { waitUntil: 'networkidle' })
    await page.fill('input[autocomplete="email"]', email)
    await page.fill('input[autocomplete="current-password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 30000 }).catch(() => {})
    await page.waitForLoadState('networkidle').catch(() => {})
    await shot(page, '02-after-sign-in')
    flow.account = email
    flow.signedIn = /\/dashboard/.test(page.url())
  }

  // 2. Onward ticket: search
  currentStep = 'onward-search'
  await page.goto(`${BASE}/onward-ticket`, { waitUntil: 'networkidle' })
  await shot(page, '03-onward-ticket')
  const searchCard = page.locator('text=Find Your Onward Flight')
  if (!(await searchCard.isVisible().catch(() => false))) {
    // Free users first see a landing block with a button that scrolls to the form.
    await page.locator('button', { hasText: /search|find|book/i }).first().click().catch(() => {})
  }
  const selects = page.locator('select')
  const destinationValue = await selects.nth(1).locator('option').first().getAttribute('value')
  await selects.nth(0).selectOption('BKK').catch(() => {})
  await selects.nth(1).selectOption(destinationValue)
  // Ant Design date picker: open it and click a day 21 days out (allowed: tomorrow..+90).
  const target = new Date(Date.now() + 21 * 86400000)
  const iso = target.toISOString().slice(0, 10)
  await page.locator('.onward-datepicker input').click()
  let cell = page.locator(`.ant-picker-cell[title="${iso}"]:not(.ant-picker-cell-disabled)`)
  if (!(await cell.count())) {
    await page.locator('.ant-picker-header-next-btn').first().click()
    cell = page.locator(`.ant-picker-cell[title="${iso}"]:not(.ant-picker-cell-disabled)`)
  }
  await cell.first().click()
  await shot(page, '04-search-filled')
  await page.locator('button', { hasText: 'Search Flights' }).click()
  await page
    .waitForSelector('text=/flights found|No flights|not available|error|went wrong/i', { timeout: 60000 })
    .catch(() => {})
  await shot(page, '05-search-results')
  const offers = page.locator('.card-thai.cursor-pointer')
  flow.offers = await offers.count()
  flow.search = flow.offers
    ? `${flow.offers} flights BKK -> ${destinationValue} on ${iso}`
    : `no flights; page says: ${((await page.locator('.text-red-700').first().textContent().catch(() => '')) || '(nothing)').trim()}`

  // 3. Select + passenger details + continue to payment (never pay)
  if (flow.offers) {
    currentStep = 'onward-passenger'
    await offers.first().click()
    await page.waitForSelector('text=Passenger Details', { timeout: 15000 })
    // The footer has its own (newsletter) form with an email field: use the passenger form only.
    const form = page.locator('form').filter({ hasText: 'Date of Birth' })
    const textInputs = form.locator('input:not([type]), input[type="text"]')
    await textInputs.nth(0).fill('Test')
    await textInputs.nth(1).fill('Claude')
    await page.fill('#dob-input', '1985-05-05')
    await form.locator('select').selectOption('m')
    await form.locator('input[type="email"]').fill(flow.account)
    await form.locator('input[type="tel"]').fill('+66812345678')
    await shot(page, '06-passenger-filled')

    currentStep = 'onward-payment'
    await form.locator('button[type="submit"]').click()
    // Step 3: the card form (Stripe) or a message. Give Stripe time to load.
    await page.waitForTimeout(8000)
    await shot(page, '07-payment-step')
    const stepText = (await page.locator('main').innerText().catch(() => '')).replace(/\s+/g, ' ')
    const stripeFrame = await page.locator('#stripe-payment-element iframe').count()
    flow.payment = stripeFrame
      ? 'card form shown (Stripe); stopped here, nothing typed or paid'
      : `no card form; page says: ${stepText.match(/[^.]*(not available|payment|error|wrong)[^.]*\./i)?.[0]?.trim() || stepText.slice(0, 200)}`
  }

  // 4. The other pages, signed in
  const pages = []
  for (const path of PAGES) {
    currentStep = `page ${path}`
    const before = findings.length
    const res = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 45000 }).catch((err) => {
      record('navigation', err.message, `${BASE}${path}`)
      return null
    })
    await page.waitForTimeout(1500)
    const title = await page.title().catch(() => '')
    const issues = findings.slice(before).filter((f) => !f.noise).length
    pages.push({ path, status: res?.status() ?? 0, title, issues, finalUrl: page.url().replace(BASE, '') })
    if (issues) await shot(page, `page-${path.replace(/\W+/g, '_') || 'home'}`)
  }

  await browser.close()

  const real = findings.filter((f) => !f.noise)
  const report = { base: BASE, ranAt: new Date().toISOString(), flow, pages, findings }
  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  const lines = [
    `# HappyRoam live e2e, ${report.ranAt}`,
    '',
    `Account: ${flow.account} (signed in: ${flow.signedIn})`,
    `Search: ${flow.search}`,
    `Payment step: ${flow.payment || 'not reached'}`,
    '',
    `## Problems (${real.length}; ${findings.length - real.length} third-party noise left out)`,
    ...real.map((f) => `- [${f.step}] ${f.kind}: ${f.detail} ${f.url}`),
    '',
    '## Pages',
    ...pages.map((p) => `- ${p.path}: HTTP ${p.status}, "${p.title}", ${p.issues} problem(s)${p.finalUrl !== p.path ? `, ended on ${p.finalUrl}` : ''}`),
  ]
  writeFileSync(join(OUT, 'report.md'), `${lines.join('\n')}\n`)
  process.stdout.write(`${lines.join('\n')}\n`)
}

main().catch((err) => {
  writeFileSync(join(OUT, 'crash.txt'), `${currentStep}: ${err.stack}`)
  process.stderr.write(`E2E crashed at ${currentStep}: ${err.message}\n`)
  process.exit(1)
})
