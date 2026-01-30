import type { Context, Config } from '@netlify/functions'
import Stripe from 'stripe'
import { getDb } from './lib/db.mts'

function getStripe() {
  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY')
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured')
  }
  return new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' })
}

export default async (req: Request, context: Context) => {
  const db = await getDb()
  const userId = req.headers.get('x-user-id')

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const stripe = getStripe()

    switch (req.method) {
      case 'POST': {
        const body = await req.json()
        const { action, email } = body

        if (action === 'create-checkout') {
          // Get or create user profile
          let userResult = await db`
            SELECT * FROM user_profiles WHERE user_id = ${userId}
          `

          if (userResult.length === 0) {
            // Create user profile if it doesn't exist
            userResult = await db`
              INSERT INTO user_profiles (user_id, prefs, is_pro)
              VALUES (${userId}, '{}', false)
              RETURNING *
            `
          }

          const user = userResult[0]
          let customerId = user.stripe_customer_id

          if (!customerId) {
            const customer = await stripe.customers.create({
              email: email || undefined,
              metadata: { user_id: userId as string },
            })
            customerId = customer.id

            await db`
              UPDATE user_profiles SET stripe_customer_id = ${customerId} WHERE user_id = ${userId}
            `
          }

          const priceId = Netlify.env.get('STRIPE_PRO_PRICE_ID')
          if (!priceId) {
            return new Response(JSON.stringify({ error: 'Price not configured' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const baseUrl = Netlify.env.get('URL') || 'http://localhost:8888'
          const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${baseUrl}/dashboard?upgrade=success`,
            cancel_url: `${baseUrl}/dashboard?upgrade=canceled`,
            metadata: { user_id: userId as string },
            subscription_data: {
              trial_period_days: 7,
            },
          })

          return new Response(JSON.stringify({ url: session.url }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (action === 'create-portal') {
          const userResult = await db`
            SELECT stripe_customer_id FROM user_profiles WHERE user_id = ${userId}
          `
          if (userResult.length === 0 || !userResult[0].stripe_customer_id) {
            return new Response(JSON.stringify({ error: 'No subscription found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const baseUrl = Netlify.env.get('URL') || 'http://localhost:8888'
          const session = await stripe.billingPortal.sessions.create({
            customer: userResult[0].stripe_customer_id,
            return_url: `${baseUrl}/dashboard`,
          })

          return new Response(JSON.stringify({ url: session.url }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      case 'GET': {
        const userResult = await db`
          SELECT is_pro, stripe_subscription_id FROM user_profiles WHERE user_id = ${userId}
        `
        if (userResult.length === 0) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const user = userResult[0]
        let subscription = null

        if (user.stripe_subscription_id) {
          try {
            const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id)
            subscription = {
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            }
          } catch (e) {
            console.error('Failed to fetch subscription:', e)
          }
        }

        return new Response(
          JSON.stringify({
            isPro: user.is_pro,
            subscription,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    console.error('Subscription function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

