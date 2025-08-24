import { MERCADO_PAGO_SUBSCRIPTION_API_URL } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { UserStatus } from "@/lib/enums";
import { ISubscription, Subscription, WebhookStatus } from "@/models/Subscription";
import { User } from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

enum WebhookType {
  SUBSCRIPTION_PREAPPROVAL = "subscription_preapproval",
}

enum WebhookAction {
  CREATED = "created",
  UPDATED = "updated"
}

type WebhookBody = {
  action: string,
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

    console.log("Body Data: ", body);
    const { action, type, data } = body;

    if (type !== WebhookType.SUBSCRIPTION_PREAPPROVAL) return NextResponse.json({ error: "Erro interno" }, { status: 500 });

    await connectDB();

    const response = await fetch(`${MERCADO_PAGO_SUBSCRIPTION_API_URL!}/${data.id}`, {
      method: 'GET',
      headers: {
        'Authorization': "Bearer " + process.env.MERCADO_PAGO_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      }
    })

    const subscription: ISubscription = await response.json();
    console.log('Subscription Data:', subscription);

    // CREATED
    if (action == WebhookAction.CREATED) {
      console.log("Creating subscription...")
      await Subscription.create(subscription)
    }


    // UPDATED
    if (action == WebhookAction.UPDATED && [WebhookStatus.CANCELLED, WebhookStatus.AUTHORIZED].includes(subscription.status)) {

      if (subscription.status == WebhookStatus.CANCELLED) {
        console.log("Cancelling user...")
        await User.findOneAndUpdate(
          { email: subscription.external_reference },
          {
            status: UserStatus.INACTIVE,
          }
        )
      }

      if (subscription.status == WebhookStatus.AUTHORIZED) {
        console.log("Authorizing user...")
        await User.findOneAndUpdate(
          { email: subscription.external_reference },
          {
            status: UserStatus.ACTIVE,
            mercadoPagoSubscriptionId: data.id,
            subscriptionId: subscription.id,
          }
        )
      }

      // Replace by subscription_id to avoid conflicts
      console.log("Updating subscription...")
      await Subscription.findOneAndUpdate({ subscription_id: subscription.id }, subscription)
    }


    // Responda com 200 OK para Mercado Pago saber que recebeu
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error("Erro no webhook Mercado Pago:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
