import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}

/**
 * PageHeader
 *
 * Renders the top section of a page with a title, optional subtitle,
 * optional badge (e.g. live indicator), and action buttons on the right.
 *
 * Note: Breadcrumbs are handled by the Topbar — no need to include them here.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
}) => {
  return (
    <div className="mb-6 space-y-4">
      {/* Title row */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1.5 text-sm text-slate-400 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Optional slot for tabs, filters, etc. */}
      {children}
    </div>
  )
}
