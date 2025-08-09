import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(body);
    // const { type, data } = body;

    // if (type === "subscription") {
    //   const subscriptionId = data.id; // id da assinatura
    //   console.log(`Assinatura ${subscriptionId} atualizada para ativa.`);
    // }

    // Responda com 200 OK para Mercado Pago saber que recebeu
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Erro no webhook Mercado Pago:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
