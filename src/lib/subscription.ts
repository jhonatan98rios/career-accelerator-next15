import { ISubscription } from "@/models/Subscription";
import { BACK_URL, MERCADO_PAGO_SUBSCRIPTION_API_URL } from "./constants";
import { Plan } from "./enums";

export type SubscriptionRequest = {
  reason: string
  // preapproval_plan_id: string
  external_reference: string
  payer_email: string
  back_url: string,
  status: string,
  auto_recurring: {
    frequency: number,
    frequency_type: string,
    transaction_amount: number,
    currency_id: string
    start_date: string,
    end_date: string,
  },
}

type CreateSubscriptionParams = {
    // planId: string
    plan: Plan
    email: string
}

function createSubscriptionRequest({ email, plan }: CreateSubscriptionParams): SubscriptionRequest {
  
  const values_by_plan = {
    [Plan.BASIC]: 9.99,
    [Plan.INTERMEDIARY]: 19.99,
    // [Plan.PREMIUM]: 'premium_plan_id_placeholder',
  }
  
  return {
    reason: `Assinatura do plano: Career Accelerator ${plan} - ${email}`,
    external_reference: email,
    payer_email: email,
    // preapproval_plan_id: planId,
    back_url: BACK_URL,
    status: 'pending',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: values_by_plan[plan]!,
      currency_id: 'BRL',
      start_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), // 7 trial days
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    },
  };
}

export async function createSubscription({ email, plan }: CreateSubscriptionParams): Promise<ISubscription> {
  try {
    const subscriptionRequest = createSubscriptionRequest({ email, plan });

    const response = await fetch(MERCADO_PAGO_SUBSCRIPTION_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': "Bearer " + process.env.MERCADO_PAGO_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log(data)
      throw new Error(`Failed to create subscription: ${data.message || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}