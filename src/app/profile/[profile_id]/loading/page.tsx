'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useFormContext } from '@/store/FormContext'


interface PageProps {
  output_id: string
  profile_id: string
}

export default function Page() {

  const router = useRouter()
  const params = useParams()

  const { profile_id } = params as unknown as PageProps

  const { answers, manualDescription } = useFormContext()
  const hasFetched = useRef(false)

  useEffect(() => {

    if (hasFetched.current) return
    hasFetched.current = true

    if (!answers) {
      router.push(`/profile/${profile_id}/input`)
      return
    }

    submit()
      .then((data) => {
        console.log('Roadmap generated:', data)
        router.push(`/profile/${profile_id}/output/${data._id}`)
      })
      .catch((err) => {
        console.log('Error while generating the insight:', err)
        router.push(`/profile/${profile_id}/input`)
      })

  }, [])

  const submit = async () => {
    const res = await fetch('/api/roadmap', {
      method: 'POST',
      body: JSON.stringify({ answers, manualDescription, profile_id }),
    })
    const { data } = await res.json()
    return data
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
    </div>
  )
}