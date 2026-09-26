import React from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'orange' | 'outline' | 'flat'
  isInteractive?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', isInteractive = false, children, ...props }, ref) => {
    const base = 'rounded-2xl transition-all duration-200 relative overflow-hidden'

    const variants = {
      default:
        'bg-[#0e131f] border border-white/[0.08] shadow-xl shadow-black/40 text-slate-100',
      orange:
        'card-gradient-orange text-white border border-[#ff8533]/50 shadow-2xl shadow-[#ff6a00]/30',
      outline:
        'bg-[#0a0e17]/60 border border-white/10 backdrop-blur-sm text-slate-100',
      flat:
        'bg-[#121827] border border-white/[0.06] text-slate-100',
    }

    const interactiveClass = isInteractive
      ? 'hover:border-white/20 hover:bg-[#121929] hover:-translate-y-0.5 cursor-pointer'
      : ''

    return (
      <div ref={ref} className={cn(base, variants[variant], interactiveClass, className)} {...props}>
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-5 pb-3 flex items-center justify-between gap-4', className)} {...props}>
      {children}
    </div>
  )
}

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={cn('text-sm font-semibold tracking-wide text-slate-200 uppercase font-mono text-[13px]', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-5 pt-0', className)} {...props}>
      {children}
    </div>
  )
}

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-5 pt-3 border-t border-white/[0.06] flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  )
}
