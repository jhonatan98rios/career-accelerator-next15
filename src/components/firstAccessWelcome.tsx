"use client";

/**
 * Inline welcome banner that replaces the modal onboarding for first-access users.
 * Shown at the top of the /input page when the user hasn't generated an insight yet.
 */
export default function FirstAccessWelcome() {
  return (
    <div className="mb-12 space-y-6">
      {/* Main welcome */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-6 sm:p-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          👋 Vamos descobrir seu potencial
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
          Responda as perguntas abaixo e em instantes você recebe um plano de
          carreira personalizado com dados reais do mercado.
        </p>
      </div>

      {/* Preview cards: what you'll get */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PreviewCard
          emoji="📈"
          title="Faixa salarial"
          description="Descubra quanto o mercado paga para o seu perfil, com dados de vagas reais."
        />
        <PreviewCard
          emoji="🎯"
          title="Skills em alta"
          description="Veja quais tecnologias e competências as empresas mais pedem."
        />
        <PreviewCard
          emoji="🗺️"
          title="Roadmap prático"
          description="Receba um passo a passo de curto prazo para chegar onde você quer."
        />
      </div>
    </div>
  );
}

function PreviewCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm hover:shadow-md transition-shadow">
      <div className="text-3xl mb-2">{emoji}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
