import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  const nameMap: Record<string, string> = {
    products: 'Products',
    inventory: 'Inventory & Locations',
    receipts: 'Inbound Receipts',
    deliveries: 'Outbound Deliveries',
    transfers: 'Internal Transfers',
    adjustments: 'Cycle Adjustments',
    'move-history': 'Stock Ledger',
    warehouses: 'Warehouses',
    categories: 'Categories',
    profile: 'User Profile',
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-medium" aria-label="Breadcrumb">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-slate-200 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Dashboard</span>
      </Link>

      {pathnames.map((segment, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        const title = nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {isLast ? (
              <span className="text-slate-200 font-semibold" aria-current="page">
                {title}
              </span>
            ) : (
              <Link to={to} className="hover:text-slate-200 transition-colors">
                {title}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
