// Thai airports available as departure points for onward tickets
export const THAI_AIRPORTS = [
  { code: 'BKK', name: 'Bangkok Suvarnabhumi', city: 'Bangkok' },
  { code: 'DMK', name: 'Bangkok Don Mueang', city: 'Bangkok' },
  { code: 'CNX', name: 'Chiang Mai', city: 'Chiang Mai' },
  { code: 'HKT', name: 'Phuket', city: 'Phuket' },
  { code: 'USM', name: 'Koh Samui', city: 'Koh Samui' },
  { code: 'KBV', name: 'Krabi', city: 'Krabi' },
]

// Popular nearby destinations with average one-way prices (USD)
export const POPULAR_DESTINATIONS = [
  { code: 'KUL', name: 'Kuala Lumpur', country: 'Malaysia', avgPrice: 35 },
  { code: 'SIN', name: 'Singapore', country: 'Singapore', avgPrice: 65 },
  { code: 'PNH', name: 'Phnom Penh', country: 'Cambodia', avgPrice: 55 },
  { code: 'SGN', name: 'Ho Chi Minh City', country: 'Vietnam', avgPrice: 50 },
  { code: 'VTE', name: 'Vientiane', country: 'Laos', avgPrice: 60 },
  { code: 'RGN', name: 'Yangon', country: 'Myanmar', avgPrice: 80 },
  { code: 'HKG', name: 'Hong Kong', country: 'Hong Kong', avgPrice: 120 },
  { code: 'NRT', name: 'Tokyo Narita', country: 'Japan', avgPrice: 180 },
]

// Service fee charged on top of flight cost
export const SERVICE_FEE_CENTS = 1200 // $12.00
