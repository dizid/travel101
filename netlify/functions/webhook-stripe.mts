import type { Context, Config } from '@netlify/functions'
import Stripe from 'stripe'
import { getDb } from './lib/db.mts'
import { methodNotAllowed, serverError, badRequest, rawJsonResponse } from './lib/responses.mts'

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return methodNotAllowed()
  }

  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Netlify.env.get('STRIPE_WEBHOOK_SECRET')

  if (!secretKey || !webhookSecret) {
    console.error('Stripe not configured')
    return serverError('Webhook not configured')
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' })
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return badRequest('Missing signature')
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    const db = await getDb()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const subscriptionId = session.subscription as string

        if (userId && subscriptionId) {
          await db`
            UPDATE user_profiles
            SET is_pro = true, stripe_subscription_id = ${subscriptionId}, updated_at = NOW()
            WHERE user_id = ${userId}
          `
          console.log(`Pro activated for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const isPro = ['active', 'trialing'].includes(subscription.status)

        await db`
          UPDATE user_profiles
          SET is_pro = ${isPro}, updated_at = NOW()
          WHERE stripe_customer_id = ${customerId}
        `
        console.log(`Subscription updated for customer ${customerId}: isPro=${isPro}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await db`
          UPDATE user_profiles
          SET is_pro = false, stripe_subscription_id = NULL, updated_at = NOW()
          WHERE stripe_customer_id = ${customerId}
        `
        console.log(`Subscription canceled for customer ${customerId}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        console.warn(`Payment failed for customer ${customerId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return rawJsonResponse({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return badRequest('Webhook error')
  }
}

