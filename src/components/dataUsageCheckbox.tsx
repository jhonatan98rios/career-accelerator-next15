'use client'

import { toggleConsent } from "@/app/actions/consent";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";

interface IDataUsageCheckbox { 
  email: string, 
  version: string,
  consent?: boolean,
  hasButton: boolean
}

export default function DataUsageCheckbox(props: IDataUsageCheckbox) {

  const { email, version, hasButton } = props
  const [consent, setConsent] = useState(props.consent || false)
  const [ isPending, startTransition ] = useTransition()

  const handleChange = (checked: boolean) => {
    setConsent(checked)
    startTransition(async () => {
      await toggleConsent(email, checked)
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Link para o PDF */}
      <Link
        className="inline-block text-purple-600 font-bold underline hover:text-indigo-500 transition-colors"
        href={`/terms/data-usage/${version}.pdf`}
        target="_blank"
      >
        📄 Termo de Aceite e Uso da Plataforma
      </Link>

      {/* Checkbox estilizado */}
      <label
        htmlFor="consent"
        className="flex items-center space-x-3 p-4 rounded-xl border-2 border-purple-500 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
      >
        <input
          type="checkbox"
          name="consent"
          id="consent"
          checked={consent}
          disabled={isPending}
          onChange={(e) => handleChange(!consent)}
          className="w-5 h-5 accent-purple-500"
        />
        <span className="text-gray-800 font-medium">
          Confirmo que li e concordo com os termos presentes no documento referido.
        </span>
      </label>

      {
        hasButton && (
          <button
            disabled={!consent || isPending}
            className={`
              mt-6 px-8 py-3 rounded-xl bg-gradient-to-r 
              ${
                consent && !isPending ? 
                "from-purple-500 to-indigo-500 hover:scale-105 transition-transform" : 
                "bg-gray-500"
              }
              text-white font-bold 
            `
            }
            onClick={() => redirect("/gateway")}
          >
            Aceitar e continuar
          </button>  
        )
      }
    </div>
  );
}
