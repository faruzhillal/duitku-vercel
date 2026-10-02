'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto p-6 text-center space-y-4">
      <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Coba Lagi</Button>
    </div>
  )
}
