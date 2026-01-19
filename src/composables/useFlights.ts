import { ref, computed } from 'vue'
import { useApi } from './useApi'

export interface Airport {
  code: string
  city: string
  airport: string
}

export interface FlightLeg {
  departure: string
  arrival: string
  airline: string
  flightNumber: string
  duration: number
  origin: string
  destination: string
}

export interface Flight {
  id: string
  price: number
  currency: string
  airlines: string[]
  departureTime: string
  arrivalTime: string
  duration: number
  stops: number
  origin: Airport
  destination: Airport
  bookingUrl: string
  legs: FlightLeg[]
}

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults?: number
  children?: number
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
  directOnly?: boolean
}

export interface FlightSearchResponse {
  flights: Flight[]
  searchId: string
  currency: string
  cheapest: number
  fastest: number
  searchParams: FlightSearchParams
}

export interface AirportsData {
  thaiAirports: Airport[]
  internationalAirports: Airport[]
}

export function useFlights() {
  const { get, post, loading, error } = useApi()
  const flights = ref<Flight[]>([])
  const airports = ref<AirportsData | null>(null)
  const searchParams = ref<FlightSearchParams | null>(null)
  const searchId = ref<string | null>(null)

  async function fetchAirports() {
    const data = await get<AirportsData>('/flights', { requiresAuth: false })
    if (data) {
      airports.value = data
    }
    return data
  }

  async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse | null> {
    searchParams.value = params
    const data = await post<FlightSearchResponse>('/flights', params, { requiresAuth: false })
    if (data) {
      flights.value = data.flights
      searchId.value = data.searchId
    }
    return data
  }

  const thaiAirports = computed(() => airports.value?.thaiAirports ?? [])
  const internationalAirports = computed(() => airports.value?.internationalAirports ?? [])
  const allAirports = computed(() => [...thaiAirports.value, ...internationalAirports.value])

  const cheapestFlight = computed(() => {
    if (flights.value.length === 0) return null
    return flights.value.reduce((min, f) => f.price < min.price ? f : min, flights.value[0])
  })

  const fastestFlight = computed(() => {
    if (flights.value.length === 0) return null
    return flights.value.reduce((min, f) => f.duration < min.duration ? f : min, flights.value[0])
  })

  const directFlights = computed(() =>
    flights.value.filter(f => f.stops === 0)
  )

  const oneStopFlights = computed(() =>
    flights.value.filter(f => f.stops === 1)
  )

  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  function formatDate(isoString: string): string {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function getAirportByCode(code: string): Airport | undefined {
    return allAirports.value.find(a => a.code === code)
  }

  function sortByPrice(ascending = true) {
    flights.value = [...flights.value].sort((a, b) =>
      ascending ? a.price - b.price : b.price - a.price
    )
  }

  function sortByDuration(ascending = true) {
    flights.value = [...flights.value].sort((a, b) =>
      ascending ? a.duration - b.duration : b.duration - a.duration
    )
  }

  function sortByDeparture(ascending = true) {
    flights.value = [...flights.value].sort((a, b) => {
      const aTime = new Date(a.departureTime).getTime()
      const bTime = new Date(b.departureTime).getTime()
      return ascending ? aTime - bTime : bTime - aTime
    })
  }

  function filterByStops(maxStops: number) {
    return flights.value.filter(f => f.stops <= maxStops)
  }

  function filterByPrice(maxPrice: number) {
    return flights.value.filter(f => f.price <= maxPrice)
  }

  return {
    loading,
    error,
    flights,
    airports,
    searchParams,
    searchId,
    fetchAirports,
    searchFlights,
    thaiAirports,
    internationalAirports,
    allAirports,
    cheapestFlight,
    fastestFlight,
    directFlights,
    oneStopFlights,
    formatDuration,
    formatTime,
    formatDate,
    getAirportByCode,
    sortByPrice,
    sortByDuration,
    sortByDeparture,
    filterByStops,
    filterByPrice,
  }
}
