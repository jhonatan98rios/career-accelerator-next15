import '@/app/globals.css'
import type { AppProps } from 'next/app';

import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>AcelerAi</title>
        <meta name="description" content="Acelere sua carreira com o uso de IA: Descubra quais os requisitos mais pedidos nas vagas, como conseguir os melhores salarios e como se destacar." />
        <meta name="keywords" content="carreira, ia, inteligência artificial, procurar emprego, vagas de emprego, promoção, aumento salário, currículo, maiores salários, trabalho remoto" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />;
    </>
  )
}