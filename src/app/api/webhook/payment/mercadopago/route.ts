import { MERCADO_PAGO_SUBSCRIPTION_API_URL } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { UserStatus } from "@/lib/enums";
import { Profile } from "@/models/Profile";
import { ISubscription, Subscription, SubscriptionStatus } from "@/models/Subscription";
import { HttpStatus } from "@/types/httpStatus";
import { NextRequest, NextResponse } from "next/server";
import { log, LogLevel } from "@/lib/logger"

enum WebhookType {
  SUBSCRIPTION_PREAPPROVAL = "subscription_preapproval",
}

enum WebhookAction {
  CREATED = "created",
  UPDATED = "updated"
}

type WebhookBody = {
  action: WebhookAction,
  application_id: string,
  data: {
    id: string
  },
  date: string,
  entity: string,
  id: string,
  type: WebhookType,
  version: number
}

export async function POST(request: NextRequest) {
  try {
    const body: WebhookBody = await request.json();

    await log(LogLevel.INFO, "Received Mercado Pago webhook", { body });
    const { action, type, data } = body;

    if (type !== WebhookType.SUBSCRIPTION_PREAPPROVAL) return NextResponse.json({ error: "Erro interno" }, { status: HttpStatus.BAD_REQUEST });

    await connectDB();

    const response = await fetch(`${MERCADO_PAGO_SUBSCRIPTION_API_URL!}/${data.id}`, {
      method: 'GET',
      headers: {
        'Authorization': "Bearer " + process.env.MERCADO_PAGO_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      }
    })

    const subscription: ISubscription = await response.json();
    await log(LogLevel.INFO, "Fetched subscription data", { subscription });

    // CREATED
    if (action == WebhookAction.CREATED) {
      
      // Validate if the subscription already exists (to avoid duplicates)
      const existing = await Subscription.findOne({ subscription_id: subscription.subscription_id });
      
      if (existing) {
        await log(LogLevel.INFO, "Subscription already exists, skipping creation.", { subscriptionId: subscription.subscription_id });
        return NextResponse.json(null, { status: HttpStatus.OK });
      }
      
      await log(LogLevel.INFO, "Creating new subscription", { subscription });
      await Subscription.create(subscription)
    }


    // UPDATED
    if (action == WebhookAction.UPDATED && [SubscriptionStatus.CANCELLED, SubscriptionStatus.AUTHORIZED].includes(subscription.status)) {

      if (subscription.status == SubscriptionStatus.CANCELLED) {
        await log(LogLevel.INFO, "Cancelling user", { subscription });
        await Profile.findOneAndUpdate(
          { email: subscription.external_reference },
          {
            status: UserStatus.INACTIVE,
          }
        )
      }

      if (subscription.status == SubscriptionStatus.AUTHORIZED) {
        await log(LogLevel.INFO, "Authorizing user", { subscription });
        const profile = await Profile.findOneAndUpdate(
          { email: subscription.external_reference },
          {
            status: UserStatus.ACTIVE,
            subscriptionId: subscription.subscription_id,
          }
        )

        if (!profile) {
          await log(LogLevel.ERROR, "Profile not found for subscription authorization", { subscription });
        }

        await log(LogLevel.INFO, "User authorized", { profile });
      }

      await log(LogLevel.INFO, "Updating subscription", { subscription });
      await Subscription.findOneAndUpdate(
        { subscription_id: subscription.subscription_id }, 
        subscription
      )
    }

    // Responda com 200 OK para Mercado Pago saber que recebeu
    return NextResponse.json(null, { status: HttpStatus.OK });

  } catch (error) {
    await log(LogLevel.ERROR, "Erro no webhook Mercado Pago", { error });
    return NextResponse.json({ error: "Internal Error" }, { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}
