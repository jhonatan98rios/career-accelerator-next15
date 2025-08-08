'use client'

import { useRouter } from 'next/navigation'
import { useUserContext } from '@/store/UserContext'
import { useState } from 'react'

export default function Page() {

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
    
      setMessage('Logged in successfully!')
      setUser({ id: data.userId, email })
      router.push(`/profile/${data.userId}/`) // Redirect to dashboard or another page

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
          <span className="text-sm">Password</span>
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
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Login
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </form>
    </div>
  )
}
