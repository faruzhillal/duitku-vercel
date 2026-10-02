import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-20 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  )
}
