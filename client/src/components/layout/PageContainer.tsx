import React from 'react'
import { cn } from '@/utils/cn'

interface PageContainerProps {
  children: React.ReactNode
  /** Optionally constrain max-width (default: 7xl) */
  maxWidth?: 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  className?: string
}

const maxWidthMap: Record<string, string> = {
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

/**
 * PageContainer
 *
 * Wraps page-level content with consistent horizontal padding,
 * vertical spacing, and a controlled max-width.
 * Used inside AppLayout's <main> region.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = '7xl',
  className,
}) => {
  return (
    <main
      className={cn(
        'flex-1 w-full mx-auto',
        'px-4 sm:px-6 lg:px-8',
        'py-6 sm:py-8',
        maxWidthMap[maxWidth],
        className,
      )}
    >
      {children}
    </main>
  )
}
