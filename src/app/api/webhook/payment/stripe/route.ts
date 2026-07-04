import Stripe from "stripe";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { log, LogLevel } from "@/lib/logger";
import { getStripe, syncProfileFromStripeSubscription, upsertStripeSubscription } from "@/lib/subscription";
import { Subscription } from "@/models/Subscription";
import { HttpStatus } from "@/types/httpStatus";

const stripe = getStripe();

async function alreadyProcessed(eventId: string) {
  return Subscription.exists({ processedStripeEventIds: eventId });
}

async function handleSubscriptionEvent(event: Stripe.Event) {
  const stripeSubscription = event.data.object as Stripe.Subscription;

  if (await alreadyProcessed(event.id)) {
    await log(LogLevel.INFO, "Stripe webhook event already processed", { eventId: event.id, type: event.type });
    return;
  }

  await upsertStripeSubscription({ stripeSubscription, eventId: event.id });
  await syncProfileFromStripeSubscription(stripeSubscription);
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const checkout = event.data.object as Stripe.Checkout.Session;

  if (await alreadyProcessed(event.id)) {
    await log(LogLevel.INFO, "Stripe webhook event already processed", { eventId: event.id, type: event.type });
    return;
  }

  if (!checkout.subscription) {
    await log(LogLevel.ERROR, "Stripe checkout completed without subscription", {
      eventId: event.id,
      stripeCheckoutSessionId: checkout.id,
      email: checkout.customer_details?.email || checkout.customer_email,
    });
    return;
  }

  const stripeSubscriptionId = typeof checkout.subscription === "string" ? checkout.subscription : checkout.subscription.id;
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  await upsertStripeSubscription({
    stripeSubscription,
    stripeCheckoutSessionId: checkout.id,
    eventId: event.id,
  });
  await syncProfileFromStripeSubscription(stripeSubscription);
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as any;
  const stripeSubscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

  await log(LogLevel.WARN, "Stripe invoice payment failed", {
    eventId: event.id,
    stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id,
    stripeSubscriptionId,
    invoiceId: invoice.id,
  });

  if (!stripeSubscriptionId || await alreadyProcessed(event.id)) {
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  await upsertStripeSubscription({ stripeSubscription, eventId: event.id });
  await syncProfileFromStripeSubscription(stripeSubscription);
}

async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as any;
  const stripeSubscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

  await log(LogLevel.INFO, "Stripe invoice paid", {
    eventId: event.id,
    stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id,
    stripeSubscriptionId,
    invoiceId: invoice.id,
  });

  if (!stripeSubscriptionId || await alreadyProcessed(event.id)) {
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  await upsertStripeSubscription({ stripeSubscription, eventId: event.id });
  await syncProfileFromStripeSubscription(stripeSubscription);
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const secretPreview = webhookSecret
    ? `${webhookSecret.slice(0, 8)}...${webhookSecret.slice(-4)}`
    : "undefined";

  if (!signature || !webhookSecret) {
    await log(LogLevel.ERROR, "Stripe webhook missing signature or secret", {
      hasSignature: !!signature,
      hasSecret: !!webhookSecret,
    });
    return NextResponse.json({ error: "Invalid webhook configuration" }, { status: HttpStatus.BAD_REQUEST });
  }

  let event: Stripe.Event;

  let rawBody: Buffer = null as any;

  try {
    // ponytail: Buffer é o formato canônico que o Stripe SDK espera
    const buf = await req.arrayBuffer();
    rawBody = Buffer.from(buf);
    await log(LogLevel.INFO, "Stripe webhook received", {
      bodyLength: rawBody.length,
      bodyStart: rawBody.toString('utf8').slice(0, 100),
      signaturePreview: signature.slice(0, 16) + "...",
      secretPreview,
    });
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    await log(LogLevel.INFO, "Stripe webhook signature verified successfully", { eventId: event.id, type: event.type });
  } catch (error: any) {
    await log(LogLevel.ERROR, "Stripe webhook signature verification failed", {
      errorMessage: error?.message,
      errorType: error?.type || typeof error,
      errorRawType: error?.raw?.type,
      signatureLength: signature?.length,
      secretLength: webhookSecret?.length,
      bodyLength: rawBody?.length ?? -1,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: HttpStatus.BAD_REQUEST });
  }

  try {
    await connectDB();
    await log(LogLevel.INFO, "Received Stripe webhook", { eventId: event.id, type: event.type });

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event);
        break;
      case "customer.subscription.created":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.pending_update_applied":
      case "customer.subscription.pending_update_expired":
      case "customer.subscription.trial_will_end":
        await handleSubscriptionEvent(event);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event);
        break;
      default:
        await log(LogLevel.INFO, "Ignoring unsupported Stripe webhook event", { eventId: event.id, type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await log(LogLevel.ERROR, "Stripe webhook processing failed", { error, eventId: event.id, type: event.type });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}
