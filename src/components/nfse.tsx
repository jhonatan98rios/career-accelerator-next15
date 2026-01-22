"use client";

import { useState, useTransition } from "react";
import { getNuvemFiscalToken } from "@/lib/nuvemFiscal";

export default function NfseButton() {

  const [isPending, startTransition] = useTransition()
  const [token, setToken] = useState<string|null>(null)

  const handleChange = () => {
    startTransition(async () => {
      const t = await getNuvemFiscalToken()
      console.log("Token:", t)
      setToken(t.access_token)
    });
  };

  return (
    <div>
      <button 
        className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        onClick={handleChange}
        disabled={isPending}
      >
        Emitir NFS-E de teste
      </button>
      {isPending && <p className="mt-2 text-gray-600">Processando...</p>}
      {token && <p className="mt-2 text-green-600">Token: {token}</p>}
    </div>
  )
}