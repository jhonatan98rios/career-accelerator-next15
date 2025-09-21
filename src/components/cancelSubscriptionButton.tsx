'use client';

export function CancelSubscriptionButton({ profileId }: { profileId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("Tem certeza que deseja cancelar sua assinatura?")) {
          window.location.href = `/auth/login?returnTo=profile/${profileId}/config/cancel-subscription/confirm&prompt=login`;
        }
      }}
      className="w-full px-6 py-2 rounded-xl border border-red-500 text-red-500 font-bold hover:bg-red-50 transition-colors cursor-pointer"
    >
      Cancelar assinatura
    </button>
  );
}
