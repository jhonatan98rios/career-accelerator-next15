// app/settings/page.tsx
import { redirect } from "next/navigation";
import { getSessionCached } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { IProfile, Profile } from "@/models/Profile";
import { updateUserData } from "@/app/actions/user_config";
import { LogoutButton } from "@/components/logoutButton";
import { CancelSubscriptionButton } from "@/components/cancelSubscriptionButton";
import DataUsageCheckbox from "@/components/dataUsageCheckbox";
import { ITerm, Term } from "@/models/Term";
import { Consent, ConsentEventStatus, IConsent } from "@/models/Consent";
import Link from "next/link";
import { formatCep, formatCpf } from "@/lib/tax-profile";
import {
  getPlanLimits,
  getPlanLabel,
  getNextPlan,
  getLowerPlans,
  isChatAvailable,
} from "@/lib/plan-service";
import { changePlan } from "@/app/actions/change_plan";
import { Subscription, ISubscription } from "@/models/Subscription";
import { Plan } from "@/lib/enums";

export default async function Page() {
  const [session] = await Promise.all([getSessionCached(), connectDB()]);

  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const { email } = session.user;

  const user = (await Profile.findOne({ email })) as IProfile | null;

  if (!user) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const term = (await Term.findOne({}, {}, { sort: { createdAt: -1 } })) as ITerm;
  const consent = (await Consent.findOne({
    email,
    currentVersion: term.version,
  })) as IConsent | null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Ajuste as informações da sua conta
      </h2>
      <ProfileForm user={user} term={term} consent={consent} />
    </div>
  );
}

// ponytail: extracted to reduce Page complexity below 40
async function ProfileForm({
  user,
  term,
  consent,
}: {
  user: IProfile;
  term: ITerm;
  consent: IConsent | null;
}) {
  const sub = user.subscriptionId
    ? ((await Subscription.findOne({
        stripeSubscriptionId: user.subscriptionId,
      })) as ISubscription | null)
    : null;

  const billingAddress = user.billingAddress;

  const planLabel = getPlanLabel(user.plan);
  const limits = getPlanLimits(user.plan);
  const nextPlan = getNextPlan(user.plan);
  const lowerPlans = getLowerPlans(user.plan);
  const nextPlanLabel = nextPlan ? getPlanLabel(nextPlan) : null;

  return (
    <form className="bg-white shadow-lg rounded-2xl p-8 space-y-6 border" action={updateUserData}>
      <input type="hidden" name="billingAddress.country" value="BR" />
      {/* Nome */}
      <div>
        <label htmlFor="user-name" className="block text-sm font-semibold text-gray-700 mb-2">
          Nome
        </label>
        <input
          id="user-name"
          name="name"
          type="text"
          defaultValue={user.name ?? ""}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Email (read-only) */}
      <div>
        <label htmlFor="user-email" className="block text-sm font-semibold text-gray-700 mb-2">
          Email
        </label>
        <input
          id="user-email"
          type="email"
          value={user.email ?? ""}
          readOnly
          className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
        />
      </div>

      <div>
        <label htmlFor="billing-email" className="block text-sm font-semibold text-gray-700 mb-2">
          E-mail para faturamento
        </label>
        <input
          id="billing-email"
          name="billingEmail"
          type="email"
          defaultValue={user.billingEmail ?? user.email ?? ""}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label htmlFor="tax-document" className="block text-sm font-semibold text-gray-700 mb-2">
          CPF
        </label>
        <input
          id="tax-document"
          name="taxDocument"
          type="text"
          defaultValue={formatCpf(user.taxDocument ?? user.cpf ?? "")}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="billing-cep" className="block text-sm font-semibold text-gray-700 mb-2">
            CEP
          </label>
          <input
            id="billing-cep"
            name="billingAddress.cep"
            type="text"
            defaultValue={formatCep(billingAddress?.cep ?? user.cep ?? "")}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label
            htmlFor="billing-number"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Numero
          </label>
          <input
            id="billing-number"
            name="billingAddress.number"
            type="text"
            defaultValue={billingAddress?.number ?? ""}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="billing-street" className="block text-sm font-semibold text-gray-700 mb-2">
          Logradouro
        </label>
        <input
          id="billing-street"
          name="billingAddress.street"
          type="text"
          defaultValue={billingAddress?.street ?? user.address ?? ""}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="billing-complement"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Complemento
          </label>
          <input
            id="billing-complement"
            name="billingAddress.complement"
            type="text"
            defaultValue={billingAddress?.complement ?? user.address2 ?? ""}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label
            htmlFor="billing-neighborhood"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Bairro
          </label>
          <input
            id="billing-neighborhood"
            name="billingAddress.neighborhood"
            type="text"
            defaultValue={billingAddress?.neighborhood ?? ""}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="billing-city" className="block text-sm font-semibold text-gray-700 mb-2">
            Cidade
          </label>
          <input
            id="billing-city"
            name="billingAddress.city"
            type="text"
            defaultValue={billingAddress?.city ?? ""}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label htmlFor="billing-state" className="block text-sm font-semibold text-gray-700 mb-2">
            UF
          </label>
          <input
            id="billing-state"
            name="billingAddress.state"
            type="text"
            maxLength={2}
            defaultValue={billingAddress?.state ?? ""}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Consent */}
      <div className="mt-10 text-left">
        <DataUsageCheckbox
          email={user.email}
          version={term.version ?? ""}
          consent={consent?.status == ConsentEventStatus.AGREED}
          hasButton={false}
        />
      </div>

      <PlanCard
        plan={user.plan}
        planLabel={planLabel}
        limits={limits}
        nextPlan={nextPlan}
        nextPlanLabel={nextPlanLabel}
        lowerPlans={lowerPlans}
        isDowngrading={!!(sub?.cancelAtPeriodEnd && sub?.currentPeriodEnd)}
        currentPeriodEnd={sub?.currentPeriodEnd}
      />

      {/* Botões */}
      <div className="flex justify-end gap-4">
        <Link
          href="/gateway"
          className="flex-1 w-0 px-6 py-2 rounded-xl border border-gray-300 text-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          className="flex-1 w-0 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold hover:scale-105 transition-transform cursor-pointer"
        >
          Salvar
        </button>
      </div>

      {/* Logout */}
      <LogoutButton />

      {/* Cancel Subscription */}
      <CancelSubscriptionButton />
    </form>
  );
}

// ponytail: extracted to reduce Page complexity below 40
function PlanCard({
  plan,
  planLabel,
  limits,
  nextPlan,
  nextPlanLabel,
  lowerPlans,
  isDowngrading,
  currentPeriodEnd,
}: {
  plan: Plan;
  planLabel: { name: string; price: string };
  limits: { chatSessionsPerDay: number; resumeGenerationsPerDay: number };
  nextPlan: Plan | null;
  nextPlanLabel: { name: string; price: string } | null;
  lowerPlans: Plan[];
  isDowngrading: boolean;
  currentPeriodEnd: Date | undefined;
}) {
  return (
    <div className="mt-10 rounded-xl border border-purple-200 bg-purple-50 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Seu Plano</h3>
      <p className="text-gray-700">
        <span className="font-semibold">{planLabel.name}</span> — {planLabel.price}
      </p>
      <div className="mt-2 text-sm text-gray-500 space-y-1">
        {isChatAvailable(plan) ? (
          <p>Chat: até {limits.chatSessionsPerDay} sessões/dia</p>
        ) : (
          <p>Chat: indisponível</p>
        )}
        <p>Currículos: {limits.resumeGenerationsPerDay}/dia</p>
      </div>

      {isDowngrading && currentPeriodEnd && (
        <p className="mt-2 text-sm text-amber-700">
          Seu plano será alterado em {currentPeriodEnd.toLocaleDateString("pt-BR")}.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {nextPlanLabel && nextPlan && (
          <form action={changePlan.bind(null, nextPlan)}>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition"
            >
              Fazer upgrade para {nextPlanLabel.name}
            </button>
          </form>
        )}
        {lowerPlans.map((lp) => {
          const lpLabel = getPlanLabel(lp);
          return (
            <form key={lp} action={changePlan.bind(null, lp)}>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition"
              >
                Mudar para {lpLabel.name}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
