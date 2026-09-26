import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Layers,
  ScrollText,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  Warehouse as WarehouseIcon,
  Tags,
  X,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useInventory } from '@/context/InventoryContext'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpenLogout: () => void
}

const navItems = [
  // Main
  { name: 'Dashboard', to: '/', icon: LayoutDashboard, exact: true, group: 'Main' },
  // Inventory
  { name: 'Products', to: '/products', icon: Package, group: 'Inventory' },
  { name: 'Stock Overview', to: '/inventory', icon: Layers, group: 'Inventory' },
  { name: 'Move History', to: '/move-history', icon: ScrollText, group: 'Inventory' },
  // Operations
  { name: 'Receipts', to: '/receipts', icon: ArrowDownToLine, group: 'Operations' },
  { name: 'Deliveries', to: '/deliveries', icon: ArrowUpFromLine, group: 'Operations' },
  { name: 'Transfers', to: '/transfers', icon: ArrowLeftRight, group: 'Operations' },
  { name: 'Adjustments', to: '/adjustments', icon: SlidersHorizontal, group: 'Operations' },
  // Management
  { name: 'Warehouses', to: '/warehouses', icon: WarehouseIcon, group: 'Management' },
  { name: 'Categories', to: '/categories', icon: Tags, group: 'Management' },
]

/**
 * MobileSidebar
 *
 * Full-height slide-in navigation drawer for mobile/tablet viewports.
 * Rendered separately from the desktop Sidebar so it can be a true overlay
 * without interfering with the fixed desktop layout.
 */
export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { kpis } = useInventory()

  // Group items
  const groups = ['Main', 'Inventory', 'Operations', 'Management'] as const

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-[#090c14] border-r border-white/[0.07] shadow-2xl',
          'transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-[60px] px-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6a00] to-[#e85a00] flex items-center justify-center shrink-0 border border-[#ff8533]/30">
              <TrendingUp className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold text-white tracking-tight">StockSense</div>
              <div className="text-[11px] text-slate-500">Inventory intelligence</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0" aria-label="Mobile navigation">
          {groups.map((group) => {
            const items = navItems.filter((i) => i.group === group)
            return (
              <div key={group} className="space-y-0.5">
                <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                  {group}
                </p>
                {items.map((item) => {
                  const isActive = item.exact
                    ? location.pathname === item.to
                    : location.pathname === item.to || location.pathname.startsWith(item.to + '/')

                  // Show badge for some items
                  let badge: number | undefined
                  if (item.to === '/products') badge = kpis.totalSkuCount
                  else if (item.to === '/receipts') badge = kpis.pendingReceipts || undefined
                  else if (item.to === '/deliveries') badge = kpis.pendingDeliveries || undefined
                  else if (item.to === '/transfers') badge = kpis.activeTransfers || undefined

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      onClick={onClose}
                      className={cn(
                        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
                        isActive
                          ? 'bg-white/[0.07] text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]',
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#ff6a00] shadow-[0_0_8px_rgba(255,106,0,0.6)]" />
                      )}
                      <item.icon
                        className={cn(
                          'w-[18px] h-[18px] shrink-0',
                          isActive ? 'text-[#ff6a00]' : 'text-slate-500',
                        )}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      <span className="flex-1">{item.name}</span>
                      {badge !== undefined && badge > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/8 text-slate-400">
                          {badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-white/[0.06]">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors text-[13px] font-medium"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6a00]/80 to-[#c84e00]/80 flex items-center justify-center text-white font-bold text-[13px] border border-white/20 shrink-0">
              A
            </div>
            <div>
              <div className="font-semibold text-slate-200">My Profile</div>
              <div className="text-[11px] text-slate-500">Settings & preferences</div>
            </div>
          </NavLink>
        </div>
      </div>
    </>
  )
}
