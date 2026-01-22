import NfseButton from "@/components/nfse";

export default async function ConfirmCancelPage() {
  return (
    <section className="min-h-dvh flex items-center justify-center bg-gray-50 flex flex-col">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-green-500">NFS-E</h1>
        <p className="text-gray-600">
          Teste de emissão de NFS-E com a Nuvem Fiscal.
        </p>
      </div>

      <NfseButton />
    </section>
  )
}