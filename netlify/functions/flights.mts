import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'

interface FlightSearchRequest {
  origin: string // IATA code (e.g., "LHR", "JFK")
  destination: string // IATA code (e.g., "BKK", "CNX")
  departureDate: string // YYYY-MM-DD
  returnDate?: string // YYYY-MM-DD (optional for one-way)
  adults?: number
  children?: number
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
  directOnly?: boolean
}

interface Flight {
  id: string
  price: number
  currency: string
  airlines: string[]
  departureTime: string
  arrivalTime: string
  duration: number // minutes
  stops: number
  origin: {
    code: string
    city: string
    airport: string
  }
  destination: {
    code: string
    city: string
    airport: string
  }
  bookingUrl: string
  legs: {
    departure: string
    arrival: string
    airline: string
    flightNumber: string
    duration: number
    origin: string
    destination: string
  }[]
}

interface FlightSearchResponse {
  flights: Flight[]
  searchId: string
  currency: string
  cheapest: number
  fastest: number
  searchParams: FlightSearchRequest
}

// Thai airports mapping
const THAI_AIRPORTS: Record<string, { city: string; airport: string }> = {
  BKK: { city: 'Bangkok', airport: 'Suvarnabhumi Airport' },
  DMK: { city: 'Bangkok', airport: 'Don Mueang Airport' },
  CNX: { city: 'Chiang Mai', airport: 'Chiang Mai International' },
  HKT: { city: 'Phuket', airport: 'Phuket International' },
  USM: { city: 'Koh Samui', airport: 'Samui Airport' },
  KBV: { city: 'Krabi', airport: 'Krabi International' },
  CEI: { city: 'Chiang Rai', airport: 'Mae Fah Luang-Chiang Rai' },
  HDY: { city: 'Hat Yai', airport: 'Hat Yai International' },
  UTP: { city: 'Pattaya', airport: 'U-Tapao International' },
}

// Common international airports
const INTERNATIONAL_AIRPORTS: Record<string, { city: string; airport: string }> = {
  LHR: { city: 'London', airport: 'Heathrow' },
  JFK: { city: 'New York', airport: 'JFK International' },
  LAX: { city: 'Los Angeles', airport: 'LAX International' },
  SFO: { city: 'San Francisco', airport: 'SFO International' },
  SIN: { city: 'Singapore', airport: 'Changi Airport' },
  HKG: { city: 'Hong Kong', airport: 'Hong Kong International' },
  NRT: { city: 'Tokyo', airport: 'Narita International' },
  ICN: { city: 'Seoul', airport: 'Incheon International' },
  SYD: { city: 'Sydney', airport: 'Kingsford Smith' },
  DXB: { city: 'Dubai', airport: 'Dubai International' },
  CDG: { city: 'Paris', airport: 'Charles de Gaulle' },
  FRA: { city: 'Frankfurt', airport: 'Frankfurt Airport' },
  AMS: { city: 'Amsterdam', airport: 'Schiphol' },
  KUL: { city: 'Kuala Lumpur', airport: 'KLIA' },
  PEK: { city: 'Beijing', airport: 'Capital International' },
  PVG: { city: 'Shanghai', airport: 'Pudong International' },
}

const ALL_AIRPORTS = { ...THAI_AIRPORTS, ...INTERNATIONAL_AIRPORTS }

// Generate realistic mock flight data
function generateMockFlights(params: FlightSearchRequest): Flight[] {
  const airlines = [
    'Thai Airways', 'Singapore Airlines', 'Emirates', 'Qatar Airways',
    'Cathay Pacific', 'EVA Air', 'ANA', 'Korean Air', 'Japan Airlines',
    'British Airways', 'Lufthansa', 'Air France', 'Bangkok Airways'
  ]

  const flights: Flight[] = []
  const numFlights = Math.floor(Math.random() * 8) + 5 // 5-12 flights

  const originInfo = ALL_AIRPORTS[params.origin] || { city: params.origin, airport: params.origin }
  const destInfo = ALL_AIRPORTS[params.destination] || { city: params.destination, airport: params.destination }

  // Base price varies by route
  const isLongHaul = !THAI_AIRPORTS[params.origin] && !THAI_AIRPORTS[params.destination]
  const basePrice = isLongHaul ? 400 + Math.random() * 600 : 80 + Math.random() * 200

  for (let i = 0; i < numFlights; i++) {
    const stops = Math.random() < 0.3 ? 0 : Math.random() < 0.7 ? 1 : 2
    const airline = airlines[Math.floor(Math.random() * airlines.length)]
    const priceMultiplier = stops === 0 ? 1.3 : stops === 1 ? 1 : 0.85
    const price = Math.round((basePrice * priceMultiplier + Math.random() * 100) * 100) / 100

    // Duration based on stops
    const baseDuration = isLongHaul ? 600 + Math.random() * 300 : 60 + Math.random() * 120
    const duration = Math.round(baseDuration + stops * 180)

    // Departure time
    const hour = 6 + Math.floor(Math.random() * 16) // 6am to 10pm
    const minute = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, 45
    const departureTime = `${params.departureDate}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`

    // Arrival time
    const arrivalDate = new Date(departureTime)
    arrivalDate.setMinutes(arrivalDate.getMinutes() + duration)
    const arrivalTime = arrivalDate.toISOString()

    flights.push({
      id: `FL${Date.now()}${i}`,
      price,
      currency: 'USD',
      airlines: [airline],
      departureTime,
      arrivalTime,
      duration,
      stops,
      origin: {
        code: params.origin,
        ...originInfo,
      },
      destination: {
        code: params.destination,
        ...destInfo,
      },
      bookingUrl: `https://www.kiwi.com/deep?from=${params.origin}&to=${params.destination}&departure=${params.departureDate}`,
      legs: [{
        departure: departureTime,
        arrival: arrivalTime,
        airline,
        flightNumber: `${airline.substring(0, 2).toUpperCase()}${100 + Math.floor(Math.random() * 900)}`,
        duration,
        origin: params.origin,
        destination: params.destination,
      }],
    })
  }

  // Sort by price
  return flights.sort((a, b) => a.price - b.price)
}

const IATA_CODE = /^[A-Z]{3}$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** YYYY-MM-DD that is also a real calendar day (2026-13-45 or 2026-02-30 fail; T-0571). */
function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
const CABIN_CLASSES = ['economy', 'premium_economy', 'business', 'first'] as const

/** A clean, bounded search request, or null when anything is malformed (T-0561). */
export function parseFlightSearch(input: unknown): FlightSearchRequest | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  const origin = typeof raw.origin === 'string' ? raw.origin.trim().toUpperCase() : ''
  const destination = typeof raw.destination === 'string' ? raw.destination.trim().toUpperCase() : ''
  const departureDate = typeof raw.departureDate === 'string' ? raw.departureDate : ''
  const returnDate = raw.returnDate == null || raw.returnDate === '' ? undefined : raw.returnDate
  const adults = raw.adults == null ? 1 : raw.adults
  const cabinClass = raw.cabinClass == null ? 'economy' : raw.cabinClass
  if (!IATA_CODE.test(origin) || !IATA_CODE.test(destination) || !isRealDate(departureDate)) return null
  if (returnDate !== undefined && (typeof returnDate !== 'string' || !isRealDate(returnDate))) return null
  if (typeof adults !== 'number' || !Number.isInteger(adults) || adults < 1 || adults > 9) return null
  if (typeof cabinClass !== 'string' || !(CABIN_CLASSES as readonly string[]).includes(cabinClass)) return null
  return {
    origin,
    destination,
    departureDate,
    ...(returnDate ? { returnDate } : {}),
    adults,
    cabinClass: cabinClass as FlightSearchRequest['cabinClass'],
  }
}

export default async (req: Request, context: Context) => {
  const db = await getDb()

  if (req.method !== 'POST') {
    // GET request - return available airports
    return new Response(JSON.stringify({
      thaiAirports: Object.entries(THAI_AIRPORTS).map(([code, info]) => ({
        code,
        ...info,
      })),
      internationalAirports: Object.entries(INTERNATIONAL_AIRPORTS).map(([code, info]) => ({
        code,
        ...info,
      })),
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const rawBody = await req.json()
    if (!rawBody?.origin || !rawBody?.destination || !rawBody?.departureDate) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: origin, destination, departureDate'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    // Strict input (T-0561): this public endpoint used to cache whatever it was sent
    // (any key, any size, never deleted), so a script could fill the database.
    const body = parseFlightSearch(rawBody)
    if (!body) {
      return new Response(JSON.stringify({
        error: 'Invalid search: use 3-letter airport codes, dates as YYYY-MM-DD, 1-9 adults'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const { origin, destination, departureDate, returnDate, adults = 1, cabinClass = 'economy' } = body

    if (!origin || !destination || !departureDate) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: origin, destination, departureDate'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check cache (1 hour TTL for flight searches)
    const cacheKey = `flights_${origin}_${destination}_${departureDate}_${returnDate || 'oneway'}_${adults}_${cabinClass}`
    const cached = await db`
      SELECT data FROM ai_cache
      WHERE cache_key = ${cacheKey}
      AND created_at > NOW() - INTERVAL '1 hour'
      LIMIT 1
    `

    if (cached.length > 0) {
      return new Response(JSON.stringify(cached[0].data), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if Kiwi API key is available
    const kiwiApiKey = Netlify.env.get('KIWI_API_KEY')

    let flights: Flight[]
    // Only real API results are cached; generated sample flights are not stored.
    let fromRealApi = false
    if (kiwiApiKey) {
      // Use real Kiwi API (Tequila)
      try {
        const searchParams = new URLSearchParams({
          fly_from: origin,
          fly_to: destination,
          date_from: departureDate.split('-').reverse().join('/'), // DD/MM/YYYY
          date_to: departureDate.split('-').reverse().join('/'),
          return_from: returnDate ? returnDate.split('-').reverse().join('/') : '',
          return_to: returnDate ? returnDate.split('-').reverse().join('/') : '',
          adults: adults.toString(),
          selected_cabins: cabinClass === 'economy' ? 'M' : cabinClass === 'business' ? 'C' : 'F',
          curr: 'USD',
          limit: '20',
          sort: 'price',
        })

        const response = await fetch(`https://api.tequila.kiwi.com/v2/search?${searchParams}`, {
          headers: {
            'apikey': kiwiApiKey,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          flights = data.data?.map((f: any) => ({
            id: f.id,
            price: f.price,
            currency: f.currency || 'USD',
            airlines: [...new Set(f.route.map((r: any) => r.airline))],
            departureTime: f.local_departure,
            arrivalTime: f.local_arrival,
            duration: f.duration?.total || f.fly_duration,
            stops: f.route.length - 1,
            origin: {
              code: f.flyFrom,
              city: f.cityFrom,
              airport: f.flyFrom,
            },
            destination: {
              code: f.flyTo,
              city: f.cityTo,
              airport: f.flyTo,
            },
            bookingUrl: f.deep_link,
            legs: f.route.map((r: any) => ({
              departure: r.local_departure,
              arrival: r.local_arrival,
              airline: r.airline,
              flightNumber: r.flight_no,
              duration: r.fly_duration,
              origin: r.flyFrom,
              destination: r.flyTo,
            })),
          })) || []
          // Only after the mapping worked: if it throws, the catch below falls back to
          // sample flights, which must never be cached as real results (T-0571).
          fromRealApi = true
        } else {
          console.error('Kiwi API error:', await response.text())
          flights = generateMockFlights(body)
        }
      } catch (apiError) {
        console.error('Kiwi API request failed:', apiError)
        flights = generateMockFlights(body)
      }
    } else {
      // Use mock data when no API key
      flights = generateMockFlights(body)
    }

    const response: FlightSearchResponse = {
      flights,
      searchId: `search_${Date.now()}`,
      currency: 'USD',
      cheapest: flights.length > 0 ? Math.min(...flights.map(f => f.price)) : 0,
      fastest: flights.length > 0 ? Math.min(...flights.map(f => f.duration)) : 0,
      searchParams: body,
    }

    // Cache real results only (validated params make the key bounded)
    if (fromRealApi) {
      await db`
        INSERT INTO ai_cache (cache_key, data)
        VALUES (${cacheKey}, ${JSON.stringify(response)})
        ON CONFLICT (cache_key) DO UPDATE SET
          data = EXCLUDED.data,
          created_at = NOW()
      `
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Flights function error:', error)
    return new Response(JSON.stringify({ error: 'Failed to search flights' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

