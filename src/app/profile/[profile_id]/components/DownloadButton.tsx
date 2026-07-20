"use client";

import { useState, useCallback } from "react";

export default function DownloadButton({ jwtToken }: { jwtToken: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/resume/download", {
        method: "POST",
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (!res.ok) throw new Error("Falha ao baixar currículo.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // filename comes from Content-Disposition header
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      a.download = match?.[1] ?? "curriculo.docx";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao baixar currículo.");
    } finally {
      setDownloading(false);
    }
  }, [downloading, jwtToken]);

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="mt-3 px-4 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2 text-sm"
    >
      {downloading ? "Baixando..." : "📥 Baixar DOCX"}
    </button>
  );
}
