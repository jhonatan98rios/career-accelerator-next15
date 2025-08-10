"use client";

import Link from "next/link";
import { User } from "@/store/UserContext";

interface SideBarProps {
  user: User
  tokens: number
}

export default function SideBar({ user, tokens }: SideBarProps) {

  return (  
    <aside className={`fixed z-40 top-0 left-0 h-full w-64 bg-gradient-to-b from-purple-500 to-indigo-500 text-white flex flex-col justify-between`}>
      {/* Top menu */}
      <div>
        <div className="p-6 text-2xl font-extrabold">🚀 MinhaCarreira</div>
        <nav className="mt-8 flex flex-col space-y-4 px-4">
          <Link href={`/profile/${user.id}`} className="hover:bg-purple-600 p-2 rounded-lg">
            Início
          </Link>
          <Link
            href={`/profile/${user.id}/input`}
            className="hover:bg-purple-600 p-2 rounded-lg"
          >
            Novo Plano de Carreira
          </Link>
          <Link
            href={`/profile/${user.id}/`}
            className="hover:bg-purple-600 p-2 rounded-lg"
          >
            Histórico de Planos
          </Link>
          <Link
            href={`/profile/${user.id}/`}
            className="hover:bg-purple-600 p-2 rounded-lg"
          >
            Roadmap
          </Link>
          <Link
            href={`/profile/${user.id}/`}
            className="hover:bg-purple-600 p-2 rounded-lg"
          >
            Configurações
          </Link>
        </nav>
      </div>

      {/* Bottom - Tokens */}
      <div className="p-4 bg-purple-600/40 m-4 rounded-lg shadow-inner">
        <p className="text-sm opacity-80">Tokens disponíveis</p>
        <p className="text-2xl font-bold">{tokens}</p>
      </div>
    </aside>
  )
}