/**
 * Public intro copy for the tool pages (/90-day, /visa, /cost-calculator,
 * /setup-guide, /safety, /packing).
 *
 * Why this exists: the tools themselves are Pro-gated or interactive, so crawlers and
 * signed-out guests used to see almost no text. This copy is static, visible to everyone
 * and prerendered. Static text only: no dates, no localStorage, so hydration stays safe.
 *
 * Every number, fee or rule links its source inline. Sources were checked 2026-11-11.
 * Immigration rules change often: if you edit a fact here, re-check the linked page.
 */

/** A piece of a paragraph: plain text, or a link to a source. */
export type IntroSegment = string | { text: string; href: string }

export interface ToolIntro {
  /** Small heading above the copy */
  heading: string
  /** Paragraphs, each made of text and source links */
  paragraphs: IntroSegment[][]
  /** Optional closing line about what Pro adds (kept as plain text, no link) */
  proNote?: string
}

const link = (text: string, href: string): IntroSegment => ({ text, href })

export type ToolIntroKey = 'ninetyDay' | 'visa' | 'costCalculator' | 'setupGuide' | 'safety' | 'packing'

const IMMIGRATION_90_DAY = 'https://www.immigration.go.th/?page_id=1666'
const LONDON_EMBASSY_EXEMPTION = 'https://london.thaiembassy.org/en/content/revision-of-thailand-s-visa-0926'
const TDAC_EMBASSY = 'https://mexico.thaiembassy.org/en/publicservice/thailand-digital-arrival-card'
const E_VISA = 'https://www.thaievisa.go.th'

export const toolIntros: Record<ToolIntroKey, ToolIntro> = {
  ninetyDay: {
    heading: 'What the 90-day report is',
    paragraphs: [
      [
        'If you stay in Thailand for more than 90 days in a row, you have to tell Immigration where you live. This is the 90-day report (also called the TM.47 notification) and it repeats every 90 days. Leaving the country and coming back restarts the count: the ',
        link('Immigration Bureau says', IMMIGRATION_90_DAY),
        ' the day count starts at 1 after every re-entry.',
      ],
      [
        'The window runs from 15 days before your due date to 7 days after it. You can report in person, send an authorised person, or post it by registered mail (the Immigration Bureau asks for mail to be sent at least 15 days before the due date). There is also an online option, but it does not work in every case: after a change of passport you first have to report in person or through an authorised person.',
      ],
      [
        'A late report must be made in person. The Immigration Bureau lists a ',
        link('2,000 baht fine', IMMIGRATION_90_DAY),
        ' for a late or missed notice, and 5,000 baht if you are caught without having reported. Official pages have not always matched on these details, so check the Immigration Bureau page before you go.',
      ],
    ],
    proNote: 'HappyRoam Pro helps you keep track of your due date and find immigration offices.',
  },

  visa: {
    heading: 'Visa options for a long stay: the short version',
    paragraphs: [
      [
        'Thailand changed its entry rules several times in 2024-2026, so use this as orientation and confirm the details for your passport on an official page. Since 15 September 2026, travellers from many countries can enter without a visa for ',
        link('up to 30 days, for tourism only', LONDON_EMBASSY_EXEMPTION),
        ', and the Royal Thai Embassy in London notes eligible passport holders can use this only twice per calendar year. The list of eligible nationalities is on the embassy pages, and some nationalities get different terms.',
      ],
      [
        'For a longer stay you generally need a visa before you travel. Examples are the tourist visa, the Destination Thailand Visa (DTV) for remote workers and freelancers, and a retirement or long-stay visa. The Royal Thai Embassy in New Delhi lists the ',
        link('DTV as multiple entry, valid 5 years, with up to 180 days per stay', 'https://newdelhi.thaiembassy.org/en/page/visa'),
        '. Document requirements for the DTV differ by embassy and were adjusted in 2026, so check the embassy that handles your application. Applications go through the ',
        link('official Thai e-Visa website', E_VISA),
        '.',
      ],
      [
        'Everyone who is not a Thai national also has to fill in the Thailand Digital Arrival Card (TDAC) online ',
        link('within 3 days before arrival', TDAC_EMBASSY),
        ', including visa-exempt travellers. The official form is at ',
        link('tdac.immigration.go.th', 'https://tdac.immigration.go.th/arrival-card/#/home'),
        '.',
      ],
      ['The wizard below asks a few questions about your trip and suggests which route fits you.'],
    ],
  },

  costCalculator: {
    heading: 'What drives your monthly cost in Thailand',
    paragraphs: [
      [
        'Most long-stay budgets come down to five things: rent, food, getting around, visa costs and health insurance. Rent depends most on the city and on how long you commit. Food can be cheap or expensive depending on whether you eat at local places or in tourist areas. Transport depends on whether you use a scooter, taxis or public transport. We do not quote prices here because they change and differ by city.',
      ],
      [
        'Visa and immigration fees are easy to forget: a long-stay visa is applied for through the ',
        link('official Thai e-Visa website', E_VISA),
        ' and the fees depend on the visa type and the embassy. Health insurance is another fixed cost to plan for, especially for stays of several months.',
      ],
    ],
    proNote: 'The Pro calculator lets you compare cities and build a budget for a short or long stay.',
  },

  setupGuide: {
    heading: 'Your first weeks: a checklist',
    paragraphs: [
      [
        'Most people sort out three things in the first weeks: a phone number, a way to pay, and a bank or cash plan. ',
        'For a SIM card, bring your passport. Thai rules require SIMs to be registered with ID, and under rules in force since May 2026 foreigners register in person and are limited to three SIMs per operator (',
        link('law firm summary of the NBTC notification', 'https://www.tilleke.com/insights/thailand-tightens-telecom-registration-data-and-ip-address-rules-to-combat-tech-crime'),
        '). Ask the operator what they currently need, as procedures differ by shop.',
      ],
      [
        'Money is in Thai baht. Many visitors start with an ATM withdrawal or a licensed exchange counter, compare the rate and any fee before you commit, and keep some cash for markets and small shops. Whether you can open a Thai bank account depends on the bank and on your visa, so ask the bank which documents it wants before you go.',
      ],
      [
        'Also put your arrival paperwork in order: the ',
        link('arrival card (TDAC)', TDAC_EMBASSY),
        ' before you travel, and the 90-day report once you stay longer (see our ',
        link('90-day report page', '/90-day'),
        ').',
      ],
    ],
    proNote: 'The Pro guide goes into SIM cards, banking and where to exchange money in more detail.',
  },

  safety: {
    heading: 'Staying safe: basics',
    paragraphs: [
      [
        'The Tourist Police run a ',
        link('24-hour hotline on 1155', 'https://www.tatnews.org/2024/11/tourist-police-thailand-your-first-friend-for-safe-and-secure-travels/'),
        ' with officers who can help in several languages. The other emergency numbers are listed above.',
      ],
      [
        'A few precautions from the UK government travel advice: do not hand over your passport as a guarantee to motorbike or jet-ski rental shops, keep your drink with you and do not accept drinks from strangers, be careful with bag snatchers when riding open transport, and be wary of job offers that look too good to be true. Read the ',
        link('UK FCDO safety and security page for Thailand', 'https://www.gov.uk/foreign-travel-advice/thailand/safety-and-security'),
        ' for the full list.',
      ],
    ],
    proNote: 'Pro unlocks verified scam alerts, province safety ratings and the full Thailand safety guide.',
  },

  packing: {
    heading: 'What the packing assistant does',
    paragraphs: [
      [
        'Tell the assistant where you are going, what you plan to do and for how long, and it builds a packing list around those details and the weather forecast. You can tick items off as you pack and print the list.',
      ],
      [
        'Two basics for any trip: Thailand is warm to hot most of the year with a rainy season, so pack light clothes and a rain layer. Home mains supply is 220 V, 50 cycles according to ',
        link('the Tourism Authority of Thailand', 'https://www.tourismthailand.org/Articles/plan-your-trip-electricity'),
        ', so check that your chargers are rated for it (most phone and laptop chargers are labelled 100-240 V) and bring a travel adapter that fits your devices; sockets vary between buildings.',
      ],
    ],
    proNote: 'AI packing lists are a Pro feature.',
  },
}
