import React from 'react'
import { cn } from '@/utils/cn'

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-white/[0.06] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.05] before:to-transparent',
        className,
      )}
    />
  )
}

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="w-full space-y-3 p-4 bg-[#0e131f] rounded-2xl border border-white/[0.07]">
      <div className="flex gap-4 border-b border-white/[0.06] pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`head-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`row-${r}`} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={`cell-${r}-${c}`} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export const KpiSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-[#0e131f] border border-white/[0.07] space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}
