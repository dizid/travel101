<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useOnwardTicket } from '@/composables/useOnwardTicket'
import { generateBookingPdf } from '@/utils/booking-pdf'
import { THAI_AIRPORTS, POPULAR_DESTINATIONS, SERVICE_FEE_CENTS } from '@/data/exit-routes'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe, StripeElements } from '@stripe/stripe-js'
import UpgradeModal from '@/components/ui/UpgradeModal.vue'
import {
  SearchOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  DownloadOutlined,
  CrownFilled,
} from '@ant-design/icons-vue'

const {
  step,
  searchResults,
  selectedOffer,
  passengerDetails: passenger,
  booking,
  searching,
  paying,
  error,
  proStatus,
  searchFlights,
  selectOffer,
  createPayment,
  confirmBooking,
  fetchStatus,
  reset,
} = useOnwardTicket()

// Search form state
const origin = ref('BKK')
const destination = ref('KUL')
const customDestination = ref('')
const departureDate = ref('')

// Stripe state (for non-Pro payment)
let stripe: Stripe | null = null
let elements: StripeElements | null = null
const stripeReady = ref(false)
const stripeError = ref('')

// Upgrade modal state
const showUpgradeModal = ref(false)

// Ref for scroll-to-search
const searchCard = ref<HTMLElement | null>(null)

function scrollToSearch() {
  searchCard.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// Computed helpers
const isPro = computed(() => proStatus.value?.isPro === true)
const proBookingsRemaining = computed(() => {
  if (!proStatus.value?.isPro) return 0
  return Math.max(0, proStatus.value.monthlyLimit - proStatus.value.bookingsThisMonth)
})
const proLimitReached = computed(() => isPro.value && proBookingsRemaining.value === 0)

const minDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
})

const maxDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 90)
  return d.toISOString().split('T')[0]
})

const effectiveDestination = computed(() =>
  destination.value === 'other' ? customDestination.value.toUpperCase() : destination.value
)

const canSearch = computed(() =>
  origin.value && effectiveDestination.value.length === 3 && departureDate.value
)

// Fetch status on mount to know Pro status + booking count
onMounted(() => {
  fetchStatus()
})

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

async function handleSearch() {
  if (!canSearch.value) return
  await searchFlights(origin.value, effectiveDestination.value, departureDate.value)
}

// Step 3: Initialize Stripe for non-Pro users, or book directly for Pro
watch(step, async (newStep) => {
  if (newStep === 3 && !booking.value) {
    if (isPro.value && !proLimitReached.value) {
      // Pro user with remaining bookings: book immediately
      await confirmBooking()
    } else {
      // Non-Pro or limit reached: show Stripe payment
      await initStripe()
    }
  }
})

async function initStripe() {
  stripeError.value = ''
  stripeReady.value = false

  if (!stripe) {
    stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  }

  if (!stripe) {
    stripeError.value = 'Failed to load payment processor. Please refresh and try again.'
    return
  }

  const clientSecret = await createPayment()
  if (!clientSecret) {
    stripeError.value = error.value || 'Failed to initialize payment. Please try again.'
    return
  }

  elements = stripe.elements({
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#b8860b',
        borderRadius: '12px',
      },
    },
  })

  await nextTick()

  const paymentElement = elements.create('payment')
  paymentElement.mount('#stripe-payment-element')

  paymentElement.on('ready', () => {
    stripeReady.value = true
  })
}

onUnmounted(() => {
  if (elements) {
    elements.getElement('payment')?.destroy()
    elements = null
  }
  stripe = null
})

function goToStep3() {
  step.value = 3
}

async function handlePayAndBook() {
  if (!stripe || !elements) return

  paying.value = true
  stripeError.value = ''

  const { error: stripeErr, paymentIntent } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: window.location.href,
    },
    redirect: 'if_required',
  })

  if (stripeErr) {
    stripeError.value = stripeErr.message || 'Payment failed. Please try again.'
    paying.value = false
    return
  }

  if (paymentIntent && paymentIntent.status === 'succeeded') {
    await confirmBooking(paymentIntent.id)
  } else {
    stripeError.value = 'Payment was not completed. Please try again.'
    paying.value = false
  }
}

function downloadPdf() {
  if (!booking.value) return
  generateBookingPdf({
    pnr: booking.value.pnr,
    passengerName: booking.value.passengerName,
    airline: booking.value.airline,
    origin: booking.value.origin,
    destination: booking.value.destination,
    departureTime: booking.value.departureTime,
    arrivalTime: booking.value.arrivalTime,
    expiresAt: booking.value.expiresAt,
  })
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
            <SearchOutlined />
            Onward Ticket
          </div>
          <h1 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            Proof of Onward Travel
          </h1>
          <p class="text-gray-600">
            Get a verified flight reservation for Thai immigration in minutes.
          </p>
        </div>
      </div>
    </div>

    <!-- Landing section for non-Pro users (before they start searching) -->
    <div v-if="!isPro && step === 1 && searchResults.length === 0" class="bg-gradient-to-br from-primary-50 to-amber-50 border-b border-primary-100">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <!-- Benefits grid -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
            <CheckCircleFilled class="text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-medium text-gray-900 text-sm">Real PNR Code</p>
              <p class="text-xs text-gray-500">Verifiable on airline websites</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
            <CheckCircleFilled class="text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-medium text-gray-900 text-sm">Instant PDF</p>
              <p class="text-xs text-gray-500">Download immediately</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
            <CheckCircleFilled class="text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-medium text-gray-900 text-sm">Valid 48+ Hours</p>
              <p class="text-xs text-gray-500">Time to clear immigration</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
            <CheckCircleFilled class="text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-medium text-gray-900 text-sm">Accepted Worldwide</p>
              <p class="text-xs text-gray-500">Airlines & immigration</p>
            </div>
          </div>
        </div>

        <!-- Pricing comparison -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div
            @click="showUpgradeModal = true"
            class="flex-1 bg-white rounded-xl p-4 border-2 border-primary-300 relative cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary-500 text-white text-xs font-bold rounded-full">
              Best Value
            </div>
            <div class="flex items-center gap-2 mb-1">
              <CrownFilled class="text-primary-500" />
              <span class="font-bold text-gray-900">Pro Members</span>
            </div>
            <p class="text-2xl font-bold text-primary-600">Free</p>
            <p class="text-xs text-gray-500">2 bookings/month included with $10/mo Pro</p>
          </div>
          <div
            @click="scrollToSearch"
            class="flex-1 bg-white rounded-xl p-4 border-2 border-primary-400 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <span class="font-bold text-gray-900">One-Time</span>
            <p class="text-2xl font-bold text-gray-700">$12<span class="text-sm font-normal text-gray-500">/ticket</span></p>
            <p class="text-xs text-gray-500">Pay per booking, no subscription</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pro status banner -->
    <div v-if="isPro && step === 1" class="bg-gradient-to-r from-primary-50 to-amber-50 border-b border-primary-100">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <CrownFilled class="text-primary-500" />
          <span class="text-sm font-medium text-primary-700">
            {{ proBookingsRemaining }} free booking{{ proBookingsRemaining !== 1 ? 's' : '' }} remaining this month
          </span>
        </div>
        <span class="text-xs text-primary-500 bg-primary-100 px-2 py-0.5 rounded-full font-medium">Pro</span>
      </div>
    </div>

    <!-- Stepper -->
    <div class="bg-white border-b border-gray-100 sticky top-16 md:top-20 z-10">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <div class="flex items-center justify-between">
          <div
            v-for="s in 3"
            :key="s"
            class="flex items-center"
            :class="{ 'flex-1': s < 3 }"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              :class="step >= s
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-500'"
            >
              <CheckCircleFilled v-if="step > s" class="text-sm" />
              <span v-else>{{ s }}</span>
            </div>
            <span
              class="ml-2 text-sm font-medium hidden sm:inline"
              :class="step >= s ? 'text-primary-700' : 'text-gray-400'"
            >
              {{ s === 1 ? 'Search' : s === 2 ? 'Details' : 'Confirm' }}
            </span>
            <div
              v-if="s < 3"
              class="flex-1 h-0.5 mx-3"
              :class="step > s ? 'bg-primary-500' : 'bg-gray-200'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">

      <!-- Step 1: Search -->
      <div v-if="step === 1" class="animate-fade-in">
        <div ref="searchCard" class="card-thai p-6 md:p-8 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Find Your Onward Flight</h2>
          <p class="text-gray-500 mb-6">Search for one-way flights from Thailand for your proof of onward travel.</p>

          <div class="space-y-4">
            <!-- Origin -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Departing from</label>
              <select
                v-model="origin"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option v-for="apt in THAI_AIRPORTS" :key="apt.code" :value="apt.code">
                  {{ apt.city }} ({{ apt.code }})
                </option>
              </select>
            </div>

            <!-- Destination -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Flying to</label>
              <select
                v-model="destination"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option v-for="dest in POPULAR_DESTINATIONS" :key="dest.code" :value="dest.code">
                  {{ dest.name }} ({{ dest.code }}) — ~${{ dest.avgPrice }}
                </option>
                <option value="other">Other destination...</option>
              </select>
              <input
                v-if="destination === 'other'"
                v-model="customDestination"
                placeholder="Airport code (e.g. NRT)"
                maxlength="3"
                class="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 uppercase focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <!-- Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Departure date</label>
              <input
                type="date"
                v-model="departureDate"
                :min="minDate"
                :max="maxDate"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <!-- Search button -->
            <button
              @click="handleSearch"
              :disabled="!canSearch || searching"
              class="btn-thai w-full flex items-center justify-center gap-2"
              :class="{ 'opacity-50 cursor-not-allowed': !canSearch }"
            >
              <LoadingOutlined v-if="searching" class="animate-spin" />
              <SearchOutlined v-else />
              {{ searching ? 'Searching flights...' : 'Search Flights' }}
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="card-thai p-4 bg-red-50 border-red-200 mb-6">
          <p class="text-red-700 text-sm">{{ error }}</p>
        </div>

        <!-- Results -->
        <div v-if="searchResults.length > 0" class="space-y-3">
          <h3 class="font-semibold text-gray-900">{{ searchResults.length }} flights found</h3>
          <div
            v-for="offer in searchResults"
            :key="offer.id"
            class="card-thai p-4 cursor-pointer hover:shadow-thai-lg transition-shadow"
            @click="selectOffer(offer)"
          >
            <div class="flex justify-between items-center">
              <div>
                <span class="font-bold text-gray-900">{{ offer.airline }}</span>
                <span class="text-sm text-gray-500 ml-2">{{ offer.airlineCode }}</span>
              </div>
              <div class="text-lg font-bold text-primary-600">${{ offer.price }}</div>
            </div>
            <div class="text-sm mt-1 text-gray-600">
              {{ formatTime(offer.departureTime) }} &rarr; {{ formatTime(offer.arrivalTime) }}
              <span class="text-gray-400 mx-2">|</span>
              {{ offer.duration }}
              <span v-if="offer.stops > 0" class="text-amber-500 ml-2">{{ offer.stops }} stop{{ offer.stops > 1 ? 's' : '' }}</span>
              <span v-else class="text-green-500 ml-2">Direct</span>
            </div>
          </div>
        </div>

        <!-- Info section (shown for Pro users who see no landing) -->
        <div v-if="isPro && searchResults.length === 0" class="mt-4 card-thai p-5 bg-gradient-to-br from-gray-50 to-gray-100">
          <h3 class="font-semibold text-gray-900 mb-2">Why do you need an onward ticket?</h3>
          <p class="text-sm text-gray-600">
            Thai immigration may ask for proof of onward travel when you enter Thailand.
            Airlines can also deny boarding if you don't have one. Our service provides a
            <strong>real airline reservation</strong> with a verifiable PNR code valid for 48+ hours.
          </p>
        </div>
      </div>

      <!-- Step 2: Passenger Details -->
      <div v-if="step === 2" class="animate-fade-in">
        <!-- Selected flight summary -->
        <div v-if="selectedOffer" class="card-thai p-4 bg-primary-50 border-primary-200 mb-6">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-bold text-gray-900">{{ selectedOffer.airline }}</h3>
              <p class="text-sm text-gray-600">
                {{ formatTime(selectedOffer.departureTime) }} &rarr; {{ formatTime(selectedOffer.arrivalTime) }}
                <span class="text-gray-400 mx-1">|</span>
                {{ selectedOffer.duration }}
              </p>
            </div>
            <div class="text-xl font-bold text-primary-600">${{ selectedOffer.price }}</div>
          </div>
        </div>

        <!-- Pro hint for non-Pro users -->
        <div v-if="!isPro" class="card-thai p-3 bg-gradient-to-r from-primary-50 to-amber-50 border-primary-200 mb-4">
          <div class="flex items-center gap-2 text-sm">
            <CrownFilled class="text-primary-500" />
            <span class="text-primary-700">
              <strong>Pro members</strong> book free (2/month).
              <button @click="showUpgradeModal = true" class="underline hover:text-primary-900">Upgrade to Pro</button>
            </span>
          </div>
        </div>

        <!-- Passenger form -->
        <div class="card-thai p-6 md:p-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Passenger Details</h2>
          <form @submit.prevent="goToStep3" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">First Name (as on passport)</label>
                <input
                  v-model="passenger.given_name"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  v-model="passenger.family_name"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  v-model="passenger.born_on"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  v-model="passenger.gender"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="m">Male</option>
                  <option value="f">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                v-model="passenger.email"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                v-model="passenger.phone"
                required
                placeholder="+66..."
                class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <!-- Pricing info: context-aware -->
            <div v-if="isPro && !proLimitReached" class="card-thai p-4 bg-green-50 border-green-200">
              <div class="flex items-center gap-2 mb-1">
                <CrownFilled class="text-primary-500" />
                <h4 class="font-bold text-gray-900">Included with Pro</h4>
              </div>
              <p class="text-sm text-gray-600">
                {{ proBookingsRemaining }} of {{ proStatus?.monthlyLimit }} free booking{{ proBookingsRemaining !== 1 ? 's' : '' }} remaining this month.
                Real airline reservation with verifiable PNR, valid 48+ hours.
              </p>
            </div>
            <div v-else-if="proLimitReached" class="card-thai p-4 bg-amber-50 border-amber-200">
              <h4 class="font-bold text-gray-900">Monthly Pro limit reached</h4>
              <p class="text-sm text-gray-600 mt-1">
                You've used your {{ proStatus?.monthlyLimit }} free bookings this month.
                You can still book for ${{ (SERVICE_FEE_CENTS / 100).toFixed(2) }} per ticket.
              </p>
            </div>
            <div v-else class="card-thai p-4 bg-amber-50 border-amber-200">
              <h4 class="font-bold text-gray-900">Service Fee: ${{ (SERVICE_FEE_CENTS / 100).toFixed(2) }}</h4>
              <p class="text-sm text-gray-600 mt-1">
                Includes a real airline reservation with verifiable PNR code, valid for 48+ hours.
                Perfect for Thai immigration and airline check-in.
              </p>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="step = 1"
                class="btn-thai-outline"
              >
                Back
              </button>
              <button type="submit" class="btn-thai flex-1">
                {{ isPro && !proLimitReached ? 'Reserve Flight' : 'Continue to Payment' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Step 3: Payment (non-Pro) / Booking (Pro) & Confirmation -->
      <div v-if="step === 3" class="animate-fade-in">
        <!-- Pro user: auto-booking in progress -->
        <div v-if="isPro && !proLimitReached && !booking && paying" class="card-thai p-6 md:p-8 text-center">
          <LoadingOutlined class="animate-spin text-4xl text-primary-500 mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Reserving Your Flight</h2>
          <p class="text-gray-500">Creating your airline reservation...</p>
        </div>

        <!-- Pro booking error -->
        <div v-if="isPro && !proLimitReached && !booking && !paying && error" class="card-thai p-6 md:p-8 text-center">
          <div class="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
            <p class="text-red-700 text-sm">{{ error }}</p>
          </div>
          <button @click="step = 2" class="btn-thai-outline">Back to Details</button>
        </div>

        <!-- Non-Pro / limit reached: Stripe payment -->
        <div v-if="(!isPro || proLimitReached) && !booking" class="card-thai p-6 md:p-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Complete Payment</h2>
          <p class="text-gray-500 mb-6">
            Pay ${{ (SERVICE_FEE_CENTS / 100).toFixed(2) }} service fee to reserve your flight.
          </p>

          <!-- Selected flight summary -->
          <div v-if="selectedOffer" class="p-4 bg-gray-50 rounded-xl mb-6">
            <div class="flex justify-between items-center">
              <div>
                <span class="font-bold text-gray-900">{{ selectedOffer.airline }}</span>
                <p class="text-sm text-gray-600 mt-0.5">
                  {{ formatTime(selectedOffer.departureTime) }} &rarr; {{ formatTime(selectedOffer.arrivalTime) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500">Service Fee</p>
                <p class="text-lg font-bold text-primary-600">${{ (SERVICE_FEE_CENTS / 100).toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <!-- Stripe Payment Element -->
          <div id="stripe-payment-element" class="mb-6 min-h-[100px]">
            <div v-if="!stripeReady && !stripeError" class="flex items-center justify-center py-8">
              <LoadingOutlined class="animate-spin text-2xl text-primary-500" />
              <span class="ml-3 text-gray-500">Loading payment form...</span>
            </div>
          </div>

          <!-- Stripe error -->
          <div v-if="stripeError" class="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
            <p class="text-red-700 text-sm">{{ stripeError }}</p>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              @click="step = 2"
              class="btn-thai-outline"
            >
              Back
            </button>
            <button
              @click="handlePayAndBook"
              :disabled="paying || !stripeReady"
              class="btn-thai flex-1 flex items-center justify-center gap-2"
              :class="{ 'opacity-50 cursor-not-allowed': !stripeReady }"
            >
              <LoadingOutlined v-if="paying" class="animate-spin" />
              {{ paying ? 'Processing...' : `Pay $${(SERVICE_FEE_CENTS / 100).toFixed(2)} & Reserve Flight` }}
            </button>
          </div>
        </div>

        <!-- Booking confirmation (shown for both Pro and paid) -->
        <div v-if="booking" class="text-center">
          <div class="card-thai p-6 md:p-8">
            <CheckCircleFilled class="text-5xl text-green-500 mb-4" />
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Reservation Confirmed!</h2>
            <p class="text-gray-500 mb-6">Your flight reservation is ready. Show this to immigration.</p>

            <div class="card-thai p-6 bg-green-50 border-green-200 mb-6">
              <p class="text-sm text-gray-500 mb-1">Your Booking Reference (PNR)</p>
              <p class="text-4xl font-mono font-bold tracking-widest text-primary-700">{{ booking.pnr }}</p>
            </div>

            <div class="text-left space-y-2 mb-6">
              <p class="text-gray-700"><strong>Airline:</strong> {{ booking.airline }}</p>
              <p class="text-gray-700"><strong>Route:</strong> {{ booking.origin }} &rarr; {{ booking.destination }}</p>
              <p class="text-gray-700"><strong>Departure:</strong> {{ formatDateTime(booking.departureTime) }}</p>
              <p class="text-gray-700"><strong>Valid Until:</strong> {{ formatDateTime(booking.expiresAt) }}</p>
              <p class="text-gray-700"><strong>Passenger:</strong> {{ booking.passengerName }}</p>
            </div>

            <button
              @click="downloadPdf"
              class="btn-thai w-full flex items-center justify-center gap-2 mb-3"
            >
              <DownloadOutlined />
              Download PDF Confirmation
            </button>

            <p class="text-sm text-gray-500">Save your PNR code and download the PDF for your records.</p>

            <button
              @click="reset"
              class="mt-6 text-sm text-primary-600 hover:text-primary-700 underline"
            >
              Book another reservation
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upgrade Modal -->
    <UpgradeModal
      :is-open="showUpgradeModal"
      feature-name="Onward Ticket"
      trigger-reason="pro_feature"
      @close="showUpgradeModal = false"
    />
  </div>
</template>
