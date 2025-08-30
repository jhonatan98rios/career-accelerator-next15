import type { Metadata } from "next";
import { FormProvider } from '@/store/FormContext';
import { UserContextProvider } from "@/store/UserContext";
import { Auth0Provider } from '@auth0/nextjs-auth0';
import "./globals.css";

export const metadata: Metadata = {
  title: "AcelerAi",
  description: "Acelere sua carreira com o uso de IA: Descubra quais os requisitos mais pedidos nas vagas, como conseguir os melhores salarios e como se destacar.",
  keywords: "carreira, ia, inteligência artificial, procurar emprego, vagas de emprego, promoção, aumento salário, currículo, maiores salários, trabalho remoto"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <Auth0Provider>
          <UserContextProvider>
            <FormProvider>
              {children}
            </FormProvider>
          </UserContextProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
