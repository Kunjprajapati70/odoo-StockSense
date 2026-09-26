import React, { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/40 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]'

    const variantClasses = {
      primary:
        'bg-gradient-to-r from-[#ff6a00] to-[#ff8533] text-white hover:brightness-110 shadow-lg shadow-[#ff6a00]/25 border border-[#ff8533]/40 font-semibold',
      secondary:
        'bg-[#141b2a] hover:bg-[#1a2336] text-slate-200 border border-white/10 hover:border-white/20',
      outline:
        'bg-transparent hover:bg-white/[0.04] text-slate-300 hover:text-white border border-white/15',
      ghost:
        'bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white',
      danger:
        'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 hover:border-rose-700/60',
      success:
        'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 hover:border-emerald-700/60',
    }

    const sizeClasses = {
      xs: 'text-xs px-2.5 py-1 gap-1.5 h-7',
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-12',
      icon: 'p-2 h-10 w-10 flex items-center justify-center shrink-0',
    }

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
