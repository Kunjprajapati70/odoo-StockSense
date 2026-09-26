import React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'red' | 'amber' | 'blue' | 'orange' | 'slate' | 'purple'
  dot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  dot = false,
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    green: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
    red: 'bg-rose-950/60 text-rose-400 border-rose-800/40',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
    blue: 'bg-sky-950/60 text-sky-400 border-sky-800/40',
    orange: 'bg-[#ff6a00]/15 text-[#ff8c33] border-[#ff6a00]/30',
    slate: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
    purple: 'bg-purple-950/60 text-purple-300 border-purple-800/40',
  }

  const dotStyles = {
    green: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    red: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]',
    amber: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
    blue: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]',
    orange: 'bg-[#ff6a00] shadow-[0_0_8px_rgba(255,106,0,0.6)]',
    slate: 'bg-slate-400',
    purple: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase font-mono text-[11px]',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotStyles[variant])} />}
      {children}
    </span>
  )
}

// Helpers for specific inventory domain objects
export const StockStatusBadge: React.FC<{ status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' }> = ({
  status,
}) => {
  switch (status) {
    case 'in_stock':
      return (
        <Badge variant="green" dot>
          In Stock
        </Badge>
      )
    case 'low_stock':
      return (
        <Badge variant="amber" dot>
          Low Stock
        </Badge>
      )
    case 'out_of_stock':
      return (
        <Badge variant="red" dot>
          Out of Stock
        </Badge>
      )
    case 'discontinued':
      return (
        <Badge variant="slate" dot>
          Discontinued
        </Badge>
      )
    default:
      return <Badge variant="slate">{status}</Badge>
  }
}

export const OperationStatusBadge: React.FC<{
  status: 'draft' | 'waiting' | 'waiting_availability' | 'ready' | 'done' | 'in_transit' | 'completed' | 'applied' | 'cancelled'
}> = ({ status }) => {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="slate" dot>
          Draft
        </Badge>
      )
    case 'waiting':
    case 'waiting_availability':
      return (
        <Badge variant="amber" dot>
          Waiting
        </Badge>
      )
    case 'ready':
      return (
        <Badge variant="blue" dot>
          Ready
        </Badge>
      )
    case 'in_transit':
      return (
        <Badge variant="purple" dot>
          In Transit
        </Badge>
      )
    case 'done':
    case 'completed':
    case 'applied':
      return (
        <Badge variant="green" dot>
          {status === 'applied' ? 'Applied' : 'Done'}
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge variant="red" dot>
          Cancelled
        </Badge>
      )
    default:
      return <Badge variant="slate">{status}</Badge>
  }
}

export const MoveTypeBadge: React.FC<{
  type: 'RECEIPT' | 'DELIVERY' | 'INTERNAL_TRANSFER' | 'INVENTORY_ADJUSTMENT'
}> = ({ type }) => {
  switch (type) {
    case 'RECEIPT':
      return (
        <Badge variant="green" className="font-semibold">
          Receipt (IN)
        </Badge>
      )
    case 'DELIVERY':
      return (
        <Badge variant="red" className="font-semibold">
          Delivery (OUT)
        </Badge>
      )
    case 'INTERNAL_TRANSFER':
      return (
        <Badge variant="blue" className="font-semibold">
          Internal Transfer
        </Badge>
      )
    case 'INVENTORY_ADJUSTMENT':
      return (
        <Badge variant="orange" className="font-semibold">
          Stock Adjustment
        </Badge>
      )
    default:
      return <Badge variant="slate">{type}</Badge>
  }
}
