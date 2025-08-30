import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";

export default async function Page() {
  const user = await getUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col items-center w-full">
      Veja aqui as configurações da sua conta

      {/* Adicionar aqui o formulário de configurações da conta */}

      <label htmlFor="">
        Nome:
        <input type="text" name="" id="" />
      </label>
    </div>
  );
}
