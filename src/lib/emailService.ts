// lib/emailService.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function getEmailTemplate(name: string, plan: string, paymentLink: string) {
  const planLabel = plan === "basic" ? "Básico" : plan === "intermediary" ? "Intermediário" : plan;

  return `
  <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
    <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="background: linear-gradient(to right, #8b5cf6, #6366f1); padding: 20px; text-align: center; color: white; font-size: 24px; font-weight: bold;">
          IA Carreira+
        </td>
      </tr>
      <tr>
        <td style="padding: 30px; color: #374151; font-size: 16px; line-height: 1.5;">
          <p>Olá <strong>${name}</strong>,</p>
          <p>Obrigado por se cadastrar! Para ativar seu plano <strong>${planLabel}</strong>, é necessário confirmar o pagamento através do nosso parceiro seguro <strong>Mercado Pago</strong>.</p>
          <p>O link abaixo é exclusivo para sua assinatura e garante que você terá acesso imediato aos benefícios do seu plano assim que o pagamento for confirmado.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="background: linear-gradient(to right, #8b5cf6, #6366f1); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold;">
              Ativar Assinatura
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            Este link direciona para o sistema de pagamentos do Mercado Pago para garantir a segurança da sua transação.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
          © ${new Date().getFullYear()} IA Carreira+. Todos os direitos reservados.
        </td>
      </tr>
    </table>
  </div>
  `;
}

export async function sendPaymentEmail(
  to: string,
  name: string,
  plan: string,
  paymentLink: string
) {
  const htmlBody = getEmailTemplate(name, plan, paymentLink);

  const command = new SendEmailCommand({
    Source: process.env.SES_FROM_EMAIL!,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: "Ative sua assinatura IA Carreira+",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    await ses.send(command);
    console.log(`E-mail enviado para ${to}`);
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw error;
  }
}
