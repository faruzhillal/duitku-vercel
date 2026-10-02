import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <div className="flex items-center gap-3 p-4 border-b">
        <Skeleton className="w-10 h-10 rounded-md" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <Skeleton className="h-20 w-3/4" />
        <Skeleton className="h-20 w-3/4 ml-auto" />
        <Skeleton className="h-20 w-3/4" />
      </div>
    </div>
  )
}
