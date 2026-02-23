import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r border-slate-200 bg-white shrink-0 hidden md:flex flex-col gap-3 p-4">
        <Skeleton className="h-8 w-36 mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 border-b border-slate-200 bg-white flex items-center px-6 gap-4">
          <Skeleton className="h-6 w-48" />
          <div className="ml-auto flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
