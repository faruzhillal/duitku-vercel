import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  )
}
