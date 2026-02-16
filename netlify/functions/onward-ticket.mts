import type { Context } from '@netlify/functions'
import { Duffel } from '@duffel/api'
import Stripe from 'stripe'
import { requireAuth } from './lib/auth.mts'
import { getDb } from './lib/db.mts'
import { jsonResponse, errorResponse, badRequest, serverError, methodNotAllowed } from './lib/responses.mts'

// Service fee for onward ticket reservation ($12.00)
const SERVICE_FEE_CENTS = 1200

// Lazy-initialized clients
function getDuffel() {
  const token = Netlify.env.get('DUFFEL_API_TOKEN')
  if (!token) {
    throw new Error('DUFFEL_API_TOKEN not configured')
  }
  return new Duffel({ token })
}

function getStripe() {
  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY')
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured')
  }
  return new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' })
}

// Simplified offer shape returned to the client
interface SimplifiedOffer {
  id: string
  airline: string
  airlineCode: string | null
  price: string
  currency: string
  departureTime: string
  arrivalTime: string
  duration: string | null
  stops: number
  segments: {
    origin: string
    destination: string
    departureTime: string
    arrivalTime: string
    airline: string
    flightNumber: string
    duration: string | null
  }[]
}

interface SearchBody {
  action: 'search'
  origin: string
  destination: string
  date: string
}

interface CreatePaymentBody {
  action: 'create-payment'
}

interface BookBody {
  action: 'book'
  offerId: string
  passenger: {
    given_name: string
    family_name: string
    born_on: string
    gender: 'm' | 'f'
    email: string
    phone: string
  }
  paymentIntentId: string
}

type RequestBody = SearchBody | CreatePaymentBody | BookBody

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') return methodNotAllowed()

  let userId: string
  try {
    userId = await requireAuth(req)
  } catch (authError) {
    // requireAuth throws a Response on failure
    if (authError instanceof Response) return authError
    return errorResponse('Unauthorized', 401)
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  if (!body || !('action' in body)) {
    return badRequest('Missing action field')
  }

  try {
    switch (body.action) {
      case 'search':
        return await handleSearch(body, userId)
      case 'create-payment':
        return await handleCreatePayment(userId)
      case 'book':
        return await handleBook(body, userId)
      default:
        return badRequest('Invalid action. Must be: search, create-payment, or book')
    }
  } catch (error) {
    console.error('Onward ticket error:', error)
    return serverError('Failed to process onward ticket request')
  }
}

/**
 * Search for holdable (pay-later) flight offers via Duffel.
 * Results are cached in ai_cache for 15 minutes.
 */
async function handleSearch(body: SearchBody, userId: string): Promise<Response> {
  const { origin, destination, date } = body

  if (!origin || !destination || !date) {
    return badRequest('Missing required fields: origin, destination, date')
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return badRequest('Invalid date format. Use YYYY-MM-DD')
  }

  // Check cache first (15-min TTL)
  const db = getDb()
  const cacheKey = `onward_${origin}_${destination}_${date}`

  const cached = await db`
    SELECT response_data FROM ai_cache
    WHERE cache_key = ${cacheKey}
    AND created_at > NOW() - INTERVAL '15 minutes'
    LIMIT 1
  `

  if (cached.length > 0) {
    return jsonResponse(cached[0].response_data)
  }

  // Search via Duffel
  const duffel = getDuffel()

  const offerRequest = await duffel.offerRequests.create({
    slices: [{
      origin,
      destination,
      departure_date: date,
    }],
    passengers: [{ type: 'adult' }],
    return_offers: false,
  })

  // List offers sorted by price
  const offersResponse = await duffel.offers.list({
    offer_request_id: offerRequest.data.id,
    sort: 'total_amount',
    limit: 20,
  })

  // Filter to only holdable offers (no instant payment required)
  const holdableOffers = offersResponse.data.filter(
    (offer) => offer.payment_requirements.requires_instant_payment === false
  )

  // Simplify offer data for the client
  const offers: SimplifiedOffer[] = holdableOffers.map((offer) => {
    const firstSlice = offer.slices[0]
    const segments = firstSlice?.segments || []
    const firstSegment = segments[0]
    const lastSegment = segments[segments.length - 1]

    return {
      id: offer.id,
      airline: offer.owner.name,
      airlineCode: offer.owner.iata_code,
      price: offer.total_amount,
      currency: offer.total_currency,
      departureTime: firstSegment?.departing_at || '',
      arrivalTime: lastSegment?.arriving_at || '',
      duration: firstSlice?.duration || null,
      stops: segments.length - 1,
      segments: segments.map((seg) => ({
        origin: seg.origin.iata_code || seg.origin.iata_city_code || '',
        destination: seg.destination.iata_code || seg.destination.iata_city_code || '',
        departureTime: seg.departing_at,
        arrivalTime: seg.arriving_at,
        airline: seg.operating_carrier.name,
        flightNumber: seg.marketing_carrier_flight_number,
        duration: seg.duration,
      })),
    }
  })

  const result = { offers }

  // Cache the results
  try {
    await db`
      INSERT INTO ai_cache (cache_key, response_data)
      VALUES (${cacheKey}, ${JSON.stringify(result)})
      ON CONFLICT (cache_key) DO UPDATE SET
        response_data = EXCLUDED.response_data,
        created_at = NOW()
    `
  } catch (cacheError) {
    // Caching failure is non-critical
    console.error('Failed to cache onward ticket search:', cacheError)
  }

  return jsonResponse(result)
}

/**
 * Create a Stripe PaymentIntent for our service fee.
 */
async function handleCreatePayment(userId: string): Promise<Response> {
  const stripe = getStripe()

  const paymentIntent = await stripe.paymentIntents.create({
    amount: SERVICE_FEE_CENTS,
    currency: 'usd',
    metadata: { user_id: userId, type: 'onward_ticket' },
  })

  return jsonResponse({ clientSecret: paymentIntent.client_secret })
}

/**
 * Book a hold order via Duffel after verifying Stripe payment.
 * If the hold fails, automatically refund the payment.
 */
async function handleBook(body: BookBody, userId: string): Promise<Response> {
  const { offerId, passenger, paymentIntentId } = body

  if (!offerId || !passenger || !paymentIntentId) {
    return badRequest('Missing required fields: offerId, passenger, paymentIntentId')
  }

  if (!passenger.given_name || !passenger.family_name || !passenger.born_on || !passenger.gender || !passenger.email || !passenger.phone) {
    return badRequest('Missing passenger details: given_name, family_name, born_on, gender, email, phone')
  }

  const stripe = getStripe()
  const duffel = getDuffel()

  // Verify Stripe payment succeeded
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (paymentIntent.status !== 'succeeded') {
    return errorResponse('Payment not completed', 400)
  }

  // Get the offer to find the passenger ID
  const offerResponse = await duffel.offers.get(offerId)
  const offerPassengerId = offerResponse.data.passengers[0]?.id
  if (!offerPassengerId) {
    return errorResponse('Invalid offer: no passenger found', 400)
  }

  // Create hold order via Duffel
  let order
  try {
    order = await duffel.orders.create({
      type: 'pay_later',
      selected_offers: [offerId],
      passengers: [{
        id: offerPassengerId,
        given_name: passenger.given_name,
        family_name: passenger.family_name,
        born_on: passenger.born_on,
        gender: passenger.gender,
        email: passenger.email,
        phone_number: passenger.phone,
        title: passenger.gender === 'm' ? 'mr' : 'ms',
        type: 'adult',
      }],
    })
  } catch (duffelError) {
    console.error('Duffel order creation failed:', duffelError)

    // Refund Stripe payment since the hold failed
    try {
      await stripe.refunds.create({ payment_intent: paymentIntentId })
    } catch (refundError) {
      console.error('Stripe refund also failed:', refundError)
    }

    return errorResponse('Failed to create reservation. Payment refunded.', 500)
  }

  // Extract flight details from the order
  const slices = order.data.slices
  const firstSlice = slices[0]
  const firstSegment = firstSlice?.segments[0]
  const lastSegment = firstSlice?.segments[firstSlice.segments.length - 1]
  const departureTime = firstSegment?.departing_at || ''
  const originCode = firstSegment?.origin?.iata_code || ''
  const destinationCode = lastSegment?.destination?.iata_code || ''

  // Store booking in the database
  const db = getDb()
  try {
    await db`
      INSERT INTO onward_bookings (
        user_id, duffel_order_id, stripe_payment_intent_id, pnr,
        airline, origin, destination, departure_time, hold_expires_at,
        passenger_name, passenger_email, amount_charged, currency, status
      ) VALUES (
        ${userId},
        ${order.data.id},
        ${paymentIntentId},
        ${order.data.booking_reference},
        ${order.data.owner?.name || 'Unknown'},
        ${originCode},
        ${destinationCode},
        ${departureTime},
        ${order.data.payment_status.payment_required_by || ''},
        ${passenger.given_name + ' ' + passenger.family_name},
        ${passenger.email},
        ${SERVICE_FEE_CENTS},
        ${'USD'},
        ${'active'}
      )
    `
  } catch (dbError) {
    // Log but don't fail — the booking was already created with Duffel
    console.error('Failed to store booking in database:', dbError)
  }

  return jsonResponse({
    bookingId: order.data.id,
    pnr: order.data.booking_reference,
    airline: order.data.owner?.name,
    origin: originCode,
    destination: destinationCode,
    departureTime: firstSegment?.departing_at || '',
    arrivalTime: lastSegment?.arriving_at || '',
    expiresAt: order.data.payment_status.payment_required_by || null,
    passengerName: passenger.given_name + ' ' + passenger.family_name,
  })
}
