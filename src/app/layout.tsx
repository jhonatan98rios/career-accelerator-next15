import type { Metadata } from "next";
import Script from "next/script";
import { FormProvider } from "@/store/FormContext";
import { UserContextProvider } from "@/store/UserContext";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import "./globals.css";

export const metadata: Metadata = {
  title: "AcelerAi",
  description:
    "Acelere sua carreira com o uso de IA: Descubra quais os requisitos mais pedidos nas vagas, como conseguir os melhores salarios e como se destacar.",
  keywords:
    "carreira, ia, inteligência artificial, procurar emprego, vagas de emprego, promoção, aumento salário, currículo, maiores salários, trabalho remoto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`antialiased`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PQV5VMQ6"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PQV5VMQ6');`}
        </Script>
        <Auth0Provider>
          <UserContextProvider>
            <FormProvider>{children}</FormProvider>
          </UserContextProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
