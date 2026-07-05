"use client";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("Tem certeza que deseja sair da sua conta?")) {
          window.location.href = "/auth/logout"; // rota do auth0
        }
      }}
      className="w-full px-6 py-2 rounded-xl border border-red-500 text-red-500 font-bold hover:bg-red-50 transition-colors cursor-pointer"
    >
      Sair
    </button>
  );
}
