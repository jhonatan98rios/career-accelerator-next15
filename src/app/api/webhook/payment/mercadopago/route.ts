import { MERCADO_PAGO_SUBSCRIPTION_API_URL } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

enum WebhookType {
  SUBSCRIPTION_PREAPPROVAL = "subscription_preapproval",
  SUBSCRIPTION = "subscription",
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

type SubscriptionData = {
  id: string;
  status: string;
  reason: string;
  external_reference: string;
  payer_email: string;
  auto_recurring: {
    frequency: number;
    frequency_type: string;
    transaction_amount: number;
    currency_id: string;
  };
};


export async function POST(request: NextRequest) {
  try {
    const body: WebhookBody = await request.json();

    console.log(body);
    const { type, data } = body;

    if (type === WebhookType.SUBSCRIPTION_PREAPPROVAL) {

      // Herewe need to query the Mercado Pago API to get the subscription details like external_reference (user), status, plan, etc.
      // https://api.mercadopago.com/preapproval/{data.id}
      const response = await fetch(`${MERCADO_PAGO_SUBSCRIPTION_API_URL!}/${data.id}`, {
        method: 'GET',
        headers: {
          'Authorization': "Bearer " + process.env.MERCADO_PAGO_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        }
      })

      const subscriptionData: SubscriptionData = await response.json();

      console.log('Subscription Data:', subscriptionData);
    }
    

    // Responda com 200 OK para Mercado Pago saber que recebeu
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Erro no webhook Mercado Pago:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
