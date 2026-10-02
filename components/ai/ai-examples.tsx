'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb } from 'lucide-react'

const EXAMPLES = [
  'beli kopi 64rb pakai BCA',
  'kemarin makan mie ayam 13rb tunai',
  'jajan eskrim 5rb',
  'gaji magang 1.2jt masuk BCA',
  'transfer 100rb dari BCA ke mandiri',
  '2 hari lalu beli buku 85rb',
  'ongkos shuttle 19rb qris',
  'terima uang saku 500rb dari mama',
]

interface Props {
  onSelect: (text: string) => void
}

export function AiExamples({ onSelect }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Contoh Kalimat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <Button
              key={ex}
              variant="outline"
              size="sm"
              onClick={() => onSelect(ex)}
              className="text-xs h-auto py-1.5"
            >
              {ex}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
