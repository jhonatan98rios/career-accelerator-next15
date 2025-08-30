import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-gray-50 text-gray-900">

      <div className="w-full h-10 flex justify-end pr-6 py-2">
        <Link href="/auth/login?returnTo=/gateway" className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
          Log in
        </Link>
      </div>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
          IA para acelerar sua carreira
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Estatísticas de mercado, plano de carreira, currículo otimizado e roadmap de estudos.
          Tudo em um só lugar. Simples, rápido e inteligente.
        </p>
        <Link href="/signup" className="inline-block mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold hover:scale-105 transition-transform">
          Comece agora
        </Link>
      </section>

      {/* Snapshot Section */}
      <section id="snapshot" className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 order-2 md:order-1 animate-fadeInUp-target">
            <h2 className="text-3xl font-bold text-purple-400">Dados que te colocam na frente</h2>
            <ul className="space-y-4">
              {[
                { icon: "📊", description: "Estatísticas reais do mercado de trabalho" },
                { icon: "🗺️", description: "Plano de carreira personalizado" },
                { icon: "📅", description: "Roadmap de estudos otimizado" },
                { icon: "📝", description: "Currículo adaptado para cada vaga" },
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-purple-500 text-2xl mr-3">{item.icon}</span>
                  <p className="font-bold text-gray-700">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative w-full flex justify-center order-1 md:order-2">
            <div className="w-80 h-80 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl transform rotate-6 shadow-2xl animate-float"></div>
            <div className="absolute top-8 left-12 w-64 h-64 bg-gray-900 rounded-lg transform -rotate-3 flex items-center justify-center text-4xl font-extrabold text-white shadow-lg animate-fadeInUp-target">
              Jobs
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            Planos para todos os objetivos
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

            {/* Básico */}
            <div className="border-2 border-purple-500 rounded-xl shadow-xl p-8 flex flex-col items-center scale-105 min-h-[460px]">
              <h3 className="text-2xl font-bold text-purple-500">Básico</h3>
              <p className="mt-4 text-4xl font-extrabold">R$14,99<span className="text-base font-normal">/mês</span></p>
              <ul className="mt-6 space-y-3 text-gray-600">
                <li>✅ Estatísticas de mercado</li>
                <li>✅ Plano de carreira</li>
                <li>✅ Roadmap de estudos</li>
                <li>✅ 30 tokens mensais</li>
								<li>✅ 7 dias grátis para testar </li>
                <li>⚠️ Com anúncios </li>
              </ul>
              <Link href="/signup?plan=basic" className="mt-auto px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:scale-105 transition-transform">
                Ver mais
              </Link>
            </div>

            {/* Intermediário */}
            <div className="border rounded-xl shadow-lg p-8 flex flex-col items-center opacity-60 min-h-[460px]">
              <h3 className="text-2xl font-bold text-gray-500">Intermediário</h3>
              <p className="mt-4 text-xl font-semibold text-gray-500">Em breve</p>
              <ul className="mt-6 space-y-3 text-gray-400">
                <li>✅ Estatísticas de mercado</li>
                <li>✅ Plano de carreira</li>
                <li>✅ Roadmap de estudos</li>
                <li>✅ Currículo otimizado para cada vaga</li>
                <li>✅ 100 tokens mensais </li>
                <li>✅ Sem anúncios </li>
              </ul>
              <button disabled className="mt-auto px-6 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                Em breve
              </button>
            </div>

            {/* Premium */}
            <div className="border rounded-xl shadow-lg p-8 flex flex-col items-center opacity-60 min-h-[460px]">
              <h3 className="text-2xl font-bold text-gray-500">Premium</h3>
              <p className="mt-4 text-xl font-semibold text-gray-500">Em breve</p>
              <ul className="mt-6 space-y-3 text-gray-400">
                <li>✅ Estatísticas de mercado</li>
                <li>✅ Plano de carreira</li>
                <li>✅ Roadmap de estudos</li>
                <li>✅ Currículo otimizado para cada vaga</li>
                <li>✅ 300 tokens mensais </li>
                <li>✨ Recursos surpresa</li>
              </ul>
              <button disabled className="mt-auto px-6 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                Em breve
              </button>
            </div>
          </div>
        </div>
        <div className="disclaimer text-center mt-12 text-gray-500 max-w-4/5 m-auto">
          <p>
						*Os tokens são utilizados somente para acessar as funcionalidades de IA. Os tokens são renovados mensalmente.
					</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-center">
        <h2 className="text-4xl font-bold">Pronto para acelerar sua carreira?</h2>
        <p className="mt-4 text-lg">Comece hoje mesmo e dê o próximo passo rumo ao seu futuro.</p>
        <Link href="signup" className="inline-block mt-8 px-8 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100">
          Criar conta grátis
        </Link>
      </section>
    </main>
  );
}
