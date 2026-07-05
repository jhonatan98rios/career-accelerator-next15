import Stripe from "stripe";
import { ISubscription, Subscription, SubscriptionStatus } from "@/models/Subscription";
import { STRIPE_CHECKOUT_CANCEL_URL, STRIPE_CHECKOUT_SUCCESS_URL } from "./constants";
import { Plan, UserStatus } from "./enums";
import { log, LogLevel } from "@/lib/logger";
import { Profile } from "@/models/Profile";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type CreateSubscriptionParams = {
  plan: Plan;
  email: string;
  profileId?: string;
  externalAuthId?: string;
  stripeCustomerId?: string | null;
};

export type CreatedSubscription = {
  checkoutSessionId: string;
  checkoutUrl: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
};

function getStripePriceId(plan: Plan) {
  if (plan !== Plan.BASIC) {
    throw new Error("Only the Basic monthly plan is supported");
  }

  if (!process.env.STRIPE_BASIC_MONTHLY_PRICE_ID) {
    throw new Error("STRIPE_BASIC_MONTHLY_PRICE_ID is not configured");
  }

  return process.env.STRIPE_BASIC_MONTHLY_PRICE_ID;
}

export function getStripe() {
  return stripe;
}

async function findOrCreateCustomer({
  email,
  stripeCustomerId,
  profileId,
  externalAuthId,
}: CreateSubscriptionParams) {
  if (stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      if (!customer.deleted) {
        return stripeCustomerId;
      }
      // ponytail: customer was soft-deleted in Stripe, create new one
    } catch (err: any) {
      // ponytail: customer not found (resource_missing), create new one
      if (err.code !== "resource_missing") throw err;
    }
  }

  const customers = await stripe.customers.list({ email, limit: 1 });
  const existingCustomerId = customers.data[0]?.id;

  if (existingCustomerId) {
    return existingCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: {
      profileId: profileId || "",
      externalAuthId: externalAuthId || "",
    },
  });

  return customer.id;
}

export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<CreatedSubscription> {
  const { email, plan, profileId, externalAuthId } = params;

  try {
    const stripePriceId = getStripePriceId(plan);
    const stripeCustomerId = await findOrCreateCustomer(params);

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer: stripeCustomerId,
      client_reference_id: profileId || email,
      success_url: STRIPE_CHECKOUT_SUCCESS_URL,
      cancel_url: STRIPE_CHECKOUT_CANCEL_URL,
      metadata: {
        email,
        plan,
        profileId: profileId || "",
        externalAuthId: externalAuthId || "",
      },
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          email,
          plan,
          profileId: profileId || "",
          externalAuthId: externalAuthId || "",
        },
      },
    });

    if (!checkout.url) {
      throw new Error("Stripe Checkout did not return a checkout URL");
    }

    await log(LogLevel.INFO, "Stripe Checkout Session created", {
      email,
      plan,
      profileId,
      stripeCustomerId,
      stripeCheckoutSessionId: checkout.id,
    });

    return {
      checkoutSessionId: checkout.id,
      checkoutUrl: checkout.url,
      stripeCustomerId,
      stripeSubscriptionId:
        typeof checkout.subscription === "string"
          ? checkout.subscription
          : checkout.subscription?.id,
    };
  } catch (error) {
    await log(LogLevel.ERROR, "Error creating Stripe subscription", {
      error,
      email,
      plan,
      profileId,
    });
    throw error;
  }
}

export async function cancelSubscription(stripeSubscriptionId: string) {
  await log(LogLevel.INFO, "Cancelling Stripe subscription", { stripeSubscriptionId });

  const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await log(LogLevel.INFO, "Stripe subscription cancellation requested", {
    stripeSubscriptionId: updatedSubscription.id,
    status: updatedSubscription.status,
    cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
  });

  return updatedSubscription;
}

export async function upsertStripeSubscription({
  stripeSubscription,
  stripeCheckoutSessionId,
  eventId,
}: {
  stripeSubscription: Stripe.Subscription;
  stripeCheckoutSessionId?: string;
  eventId: string;
}): Promise<ISubscription> {
  const subscription = stripeSubscription as any;
  const firstItem = subscription.items?.data?.[0];
  const email = subscription.metadata?.email || "";
  const profileId = subscription.metadata?.profileId || "";
  const stripeCustomerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

  return Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      $set: {
        email,
        profileId,
        plan: subscription.metadata?.plan || Plan.BASIC,
        status: subscription.status,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        stripeCheckoutSessionId,
        stripePriceId: firstItem?.price?.id,
        currentPeriodStart: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : null,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        latestInvoiceId:
          typeof subscription.latest_invoice === "string"
            ? subscription.latest_invoice
            : subscription.latest_invoice?.id,
        lastStripeEventId: eventId,
        raw: {
          id: subscription.id,
          status: subscription.status,
          customer: stripeCustomerId,
          metadata: subscription.metadata,
        },
      },
      $addToSet: { processedStripeEventIds: eventId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function syncProfileFromStripeSubscription(stripeSubscription: Stripe.Subscription) {
  const subscription = stripeSubscription as any;
  const email = subscription.metadata?.email;
  const profileId = subscription.metadata?.profileId;
  const stripeCustomerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  const status = [SubscriptionStatus.TRIALING, SubscriptionStatus.ACTIVE].includes(
    subscription.status
  )
    ? UserStatus.ACTIVE
    : [
          SubscriptionStatus.CANCELED,
          SubscriptionStatus.UNPAID,
          SubscriptionStatus.INCOMPLETE_EXPIRED,
          SubscriptionStatus.PAUSED,
        ].includes(subscription.status)
      ? UserStatus.INACTIVE
      : null;

  if (subscription.status === SubscriptionStatus.PAST_DUE) {
    await log(LogLevel.WARN, "Stripe subscription is past_due; access unchanged", {
      email,
      profileId,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
    });
    return;
  }

  if (!status) {
    return;
  }

  const query = profileId ? { _id: profileId } : { email };
  await Profile.findOneAndUpdate(query, {
    status,
    subscriptionId: subscription.id,
    stripeCustomerId,
  });
}
