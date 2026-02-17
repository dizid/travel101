import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export interface FlightOffer {
  id: string
  airline: string
  airlineCode: string
  price: string
  currency: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
}

export interface PassengerDetails {
  given_name: string
  family_name: string
  born_on: string // YYYY-MM-DD
  gender: 'm' | 'f'
  email: string
  phone: string
}

export interface BookingConfirmation {
  bookingId: string
  pnr: string
  airline: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  expiresAt: string
  passengerName: string
}

export interface OnwardTicketStatus {
  isPro: boolean
  bookingsThisMonth: number
  monthlyLimit: number
  serviceFee: number
}

interface SearchResponse {
  data: { offers: FlightOffer[] }
  success: boolean
}

interface StatusResponse {
  data: OnwardTicketStatus
  success: boolean
}

interface PaymentResponse {
  data: { clientSecret: string }
  success: boolean
}

interface BookingResponse {
  data: BookingConfirmation
  success: boolean
}

export function useOnwardTicket() {
  const { post, loading, error } = useApi()

  const step = ref(1)
  const searchResults = ref<FlightOffer[]>([])
  const selectedOffer = ref<FlightOffer | null>(null)
  const passengerDetails = ref<PassengerDetails>({
    given_name: '',
    family_name: '',
    born_on: '',
    gender: 'm',
    email: '',
    phone: '',
  })
  const booking = ref<BookingConfirmation | null>(null)
  const searching = ref(false)
  const paying = ref(false)
  const proStatus = ref<OnwardTicketStatus | null>(null)

  // Fetch Pro status and booking count for this month
  async function fetchStatus() {
    const result = await post<StatusResponse>('/onward-ticket', {
      action: 'status',
    })

    if (result?.data) {
      proStatus.value = result.data
    }

    return result
  }

  async function searchFlights(origin: string, destination: string, date: string) {
    searching.value = true
    searchResults.value = []

    const result = await post<SearchResponse>('/onward-ticket', {
      action: 'search',
      origin,
      destination,
      date,
    })

    searching.value = false

    if (result?.data?.offers) {
      searchResults.value = result.data.offers
    }

    return result
  }

  function selectOffer(offer: FlightOffer) {
    selectedOffer.value = offer
    step.value = 2
  }

  // Create Stripe PaymentIntent for non-Pro users ($12 service fee)
  async function createPayment(): Promise<string | null> {
    if (!selectedOffer.value) return null

    const result = await post<PaymentResponse>('/onward-ticket', {
      action: 'create-payment',
      offerId: selectedOffer.value.id,
    })

    if (result?.data?.clientSecret) {
      return result.data.clientSecret
    }

    return null
  }

  // Book the flight. paymentIntentId is required for non-Pro, omitted for Pro.
  async function confirmBooking(paymentIntentId?: string): Promise<BookingConfirmation | null> {
    if (!selectedOffer.value) return null

    paying.value = true

    const result = await post<BookingResponse>('/onward-ticket', {
      action: 'book',
      offerId: selectedOffer.value.id,
      passenger: passengerDetails.value,
      ...(paymentIntentId ? { paymentIntentId } : {}),
    })

    paying.value = false

    if (result?.data) {
      booking.value = result.data
      // Update proStatus to reflect new booking count
      if (proStatus.value?.isPro) {
        proStatus.value.bookingsThisMonth++
      }
      return result.data
    }

    return null
  }

  function reset() {
    step.value = 1
    searchResults.value = []
    selectedOffer.value = null
    passengerDetails.value = {
      given_name: '',
      family_name: '',
      born_on: '',
      gender: 'm',
      email: '',
      phone: '',
    }
    booking.value = null
    searching.value = false
    paying.value = false
  }

  return {
    // State
    step,
    searchResults,
    selectedOffer,
    passengerDetails,
    booking,
    searching,
    paying,
    loading,
    error,
    proStatus,
    // Methods
    searchFlights,
    selectOffer,
    createPayment,
    confirmBooking,
    fetchStatus,
    reset,
  }
}
