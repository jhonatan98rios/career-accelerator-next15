'use client';

import React, { useEffect } from 'react';
import { useFormContext } from '@/store/FormContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/store/UserContext';


export default function InsightForm(user: User) {
  const router = useRouter();

  const {
    manualDescription,
    answers,
    setManualDescription,
    setAnswers,
  } = useFormContext();

  // optional double check on client
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAnswers({ ...answers, [name]: value });
  };

  return (
  <div className="max-w-3xl mx-auto p-6 space-y-10">
    <h1 className="text-3xl font-bold text-center">
      Comece falando um pouco sobre você {user?.name}
    </h1>

    {/* Perguntas guiadas */}
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Ajude-nos a entender você melhor</h2>

      <div>
        <label className="block font-semibold mb-1">1. Qual é o seu cargo atual?</label>
        <input
          name="currentRole"
          type="text"
          className="w-full p-3 border rounded-lg"
          value={answers.currentRole}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">2. Qual trabalho você adoraria ter?</label>
        <input
          name="dreamJob"
          type="text"
          className="w-full p-3 border rounded-lg"
          value={answers.dreamJob}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">3. Quais são suas principais soft skills?</label>
        <input
          name="softSkills"
          type="text"
          className="w-full p-3 border rounded-lg"
          placeholder="ex.: comunicação, liderança, adaptabilidade"
          value={answers.softSkills}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">4. Quais são suas principais hard skills?</label>
        <input
          name="hardSkills"
          type="text"
          className="w-full p-3 border rounded-lg"
          placeholder="ex.: JavaScript, SQL, computação em nuvem"
          value={answers.hardSkills}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">5. Quais são os maiores desafios que bloqueiam seu crescimento?</label>
        <textarea
          name="blockers"
          rows={3}
          className="w-full p-3 border rounded-lg"
          value={answers.blockers}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">6. O que você espera alcançar nos próximos 6-12 meses?</label>
        <textarea
          name="goals"
          rows={3}
          className="w-full p-3 border rounded-lg"
          value={answers.goals}
          onChange={handleChange}
        />
      </div>
    </section>

    {/* Entrada manual ou upload */}
    <section className="space-y-4">
      <label className="block font-semibold">Descrição manual do perfil</label>
      <textarea
        rows={6}
        className="w-full p-3 border rounded-lg"
        placeholder="Descreva seu histórico, experiência e interesses..."
        value={manualDescription}
        onChange={(e) => setManualDescription(e.target.value)}
      />

      {/* <label className="block font-semibold">Ou envie um arquivo (PDF, DOCX)</label>
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileUpload}
        className="block"
      />
      {uploadedFileName && <p className="text-sm text-green-600">Enviado: {uploadedFileName}</p>} */}
    </section>

    {/* Botão de envio */}
    <div className="text-center">
      <Link
        href={`/profile/${user.id}/output/abcd/v3`}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Gerar meu roadmap
      </Link>
    </div>
  </div>
);

}
