'use client'

import { useRouter } from 'next/navigation'
import { useUserContext } from '@/store/UserContext'
import { useState } from 'react'
import { UserStatus } from '@/lib/enums'

export default function LoginForm() {

  const { setUser } = useUserContext()

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await res.json()
    if (res.ok) {

      if (data.status == UserStatus.INACTIVE) {
        setMessage('Sua conta consta como inativa devido a problemas no pagamento.')
      }
    
      setMessage('Login realizado com sucesso')
      setUser({ id: data.userId, email, name: data.name })
      router.push(`/profile/${data.userId}/`)

    } else {
      setMessage(data.error || 'Login failed')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-4">Login</h1>

        <label className="block mb-2">
          <span className="text-sm">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm">Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </label>

        <button
          type="submit"
          className="w-full cursor-pointer px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:scale-105 transition-transform"
        >
          Entrar
        </button>

        <p className="mt-4 text-sm text-gray-600">
          Não tem uma conta ainda?{' '}
          <a href="/signup" className="text-purple-500 hover:underline">
            Criar conta
          </a>
        </p>

        {/* <p className="mt-4 text-sm text-gray-600">
          Esqueceu a senha?{' '}
          <a href="/password-recovery" className="text-purple-500 hover:underline">
            Recuperar a senha
          </a>
        </p> */}

        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </form>
    </div>
  )
}
