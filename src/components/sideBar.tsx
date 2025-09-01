"use client";

import Link from "next/link";
import { User } from "@/store/UserContext";

interface SideBarProps {
  id: string
  tokens: number
}

export default function SideBar({ id, tokens }: SideBarProps) {

  return (  
    <aside className={
      `fixed z-40 left-0 h-38 md:h-full w-full overflow-scroll md:overflow-hidden md:w-64 
      bg-gradient-to-b from-purple-500 to-indigo-500 text-white flex md:flex-col justify-between`
    }>
      {/* Top menu */}
      <div>
        <nav className="mt-24 flex md:flex-col whitespace-nowrap space-y-4 px-4">
          <Link href={`/profile/${id}`} className="hover:bg-purple-600 p-2 rounded-lg">
            Início
          </Link>
          <Link
            href={`/profile/${id}/input`}
            className="hover:bg-purple-600 p-2 rounded-lg"
          >
            Novo Plano de Carreira
          </Link>
          <Link
            href={`/profile/${id}/roadmaps`}
            className="hover:bg-purple-600 p-2 rounded-lg"
          >
            Acompanhe seu Progresso
          </Link>
          <Link
            href={`/profile/${id}/config`}
            className="hover:bg-purple-600 p-2 rounded-lg"
          >
            Configurações
          </Link>
        </nav>
      </div>

      {/* Bottom - Tokens */}
      <div className="p-4 bg-purple-600/40 m-4 rounded-lg shadow-inner h-10 md:h-auto mt-auto flex md:flex-col items-center md:items-start">
        <p className="text-sm opacity-80 whitespace-nowrap mr-2">Tokens disponíveis</p>
        <p className="text-2xl font-bold">{tokens}</p>
      </div>
    </aside>
  )
}