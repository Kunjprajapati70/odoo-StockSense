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
  User,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useInventory } from '@/context/InventoryContext'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  name: string
  to: string
  icon: React.ElementType
  badge?: number
  badgeVariant?: 'green' | 'sky' | 'purple' | 'amber' | 'muted'
  exact?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (v: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (v: boolean) => void
  onOpenLogout: () => void
}

// ─── Badge variant colours ──────────────────────────────────────────────────────

const badgeVariantClass: Record<string, string> = {
  green: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  sky: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  muted: 'bg-white/8 text-slate-400',
}

// ─── NavLink item ───────────────────────────────────────────────────────────────

const SidebarNavItem: React.FC<{
  item: NavItem
  isCollapsed: boolean
  onClick: () => void
}> = ({ item, isCollapsed, onClick }) => {
  const location = useLocation()
  // exact match for dashboard
  const isActive = item.exact
    ? location.pathname === item.to
    : location.pathname === item.to || location.pathname.startsWith(item.to + '/')

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      end={item.exact}
      aria-label={item.name}
      title={isCollapsed ? item.name : undefined}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group',
        isCollapsed && 'justify-center px-0 w-full',
        isActive
          ? 'bg-white/[0.07] text-white'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]',
      )}
    >
      {/* Orange left-edge active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#ff6a00] shadow-[0_0_8px_rgba(255,106,0,0.6)]" />
      )}

      {/* Icon */}
      <item.icon
        className={cn(
          'w-[18px] h-[18px] shrink-0 transition-colors duration-150',
          isCollapsed && 'mx-auto',
          isActive ? 'text-[#ff6a00]' : 'text-slate-500 group-hover:text-slate-300',
        )}
        strokeWidth={isActive ? 2.2 : 1.8}
      />

      {/* Label + Badge */}
      {!isCollapsed && (
        <>
          <span className="truncate flex-1 leading-none">{item.name}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tabular-nums',
                badgeVariantClass[item.badgeVariant ?? 'muted'],
              )}
            >
              {item.badge}
            </span>
          )}
        </>
      )}

      {/* Collapsed tooltip badge dot */}
      {isCollapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ff6a00]" />
      )}
    </NavLink>
  )
}

// ─── Nav group ──────────────────────────────────────────────────────────────────

const SidebarNavGroup: React.FC<{
  group: NavGroup
  isCollapsed: boolean
  onItemClick: () => void
}> = ({ group, isCollapsed, onItemClick }) => (
  <div className="space-y-0.5">
    {!isCollapsed && (
      <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 select-none">
        {group.label}
      </p>
    )}
    {isCollapsed && <div className="h-3" />}
    {group.items.map((item) => (
      <SidebarNavItem
        key={item.to}
        item={item}
        isCollapsed={isCollapsed}
        onClick={onItemClick}
      />
    ))}
  </div>
)

// ─── Sidebar ────────────────────────────────────────────────────────────────────

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onOpenLogout,
}) => {
  const { kpis, currentUser } = useInventory()

  const navGroups: NavGroup[] = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', to: '/', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      label: 'Inventory',
      items: [
        {
          name: 'Products',
          to: '/products',
          icon: Package,
          badge: kpis.totalSkuCount,
          badgeVariant: 'muted',
        },
        { name: 'Stock Overview', to: '/inventory', icon: Layers },
        { name: 'Move History', to: '/move-history', icon: ScrollText },
      ],
    },
    {
      label: 'Operations',
      items: [
        {
          name: 'Receipts',
          to: '/receipts',
          icon: ArrowDownToLine,
          badge: kpis.pendingReceipts,
          badgeVariant: 'green',
        },
        {
          name: 'Deliveries',
          to: '/deliveries',
          icon: ArrowUpFromLine,
          badge: kpis.pendingDeliveries,
          badgeVariant: 'sky',
        },
        {
          name: 'Transfers',
          to: '/transfers',
          icon: ArrowLeftRight,
          badge: kpis.activeTransfers,
          badgeVariant: 'purple',
        },
        { name: 'Adjustments', to: '/adjustments', icon: SlidersHorizontal },
      ],
    },
    {
      label: 'Management',
      items: [
        { name: 'Warehouses', to: '/warehouses', icon: WarehouseIcon },
        { name: 'Categories', to: '/categories', icon: Tags },
      ],
    },
  ]

  const closeMobile = () => setIsMobileOpen(false)

  return (
    <>
      {/* ── Mobile backdrop ───────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* ── Sidebar container ─────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col',
          'bg-[#090c14] border-r border-white/[0.07]',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-[72px]' : 'w-60',
          // Mobile: slide in from left
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* ── Brand header ─────────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center h-[60px] px-4 border-b border-white/[0.06] shrink-0',
            isCollapsed ? 'justify-center px-0' : 'justify-between',
          )}
        >
          <div className={cn('flex items-center gap-3 min-w-0', isCollapsed && 'justify-center')}>
            {/* Logo mark */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6a00] to-[#e85a00] flex items-center justify-center shrink-0 shadow-lg shadow-[#ff6a00]/25 border border-[#ff8533]/30">
              <TrendingUp className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-[15px] font-extrabold tracking-tight text-white leading-none flex items-center gap-2">
                  StockSense
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#ff6a00]/20 text-[#ff9a55] border border-[#ff6a00]/25 tracking-wider uppercase">
                    PRO
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-none truncate">
                  Inventory intelligence
                </div>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          {!isCollapsed && (
            <button
              onClick={closeMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors shrink-0"
              aria-label="Close sidebar"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}
        </div>

        {/* ── Scrollable navigation ─────────────────────────────────────────── */}
        <nav
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0',
            isCollapsed ? 'px-2' : 'px-3',
          )}
          aria-label="Primary navigation"
        >
          {navGroups.map((group) => (
            <SidebarNavGroup
              key={group.label}
              group={group}
              isCollapsed={isCollapsed}
              onItemClick={closeMobile}
            />
          ))}
        </nav>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-white/[0.06] bg-[#080b12]">
          {/* User profile link */}
          <NavLink
            to="/profile"
            onClick={closeMobile}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 p-3 transition-all duration-150 group',
                isCollapsed && 'justify-center',
                isActive ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]',
              )
            }
            title={isCollapsed ? currentUser.name : undefined}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6a00]/80 to-[#c84e00]/80 flex items-center justify-center text-white font-bold text-[13px] border border-white/20 shadow-md">
                {currentUser.name.charAt(0)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#080b12]" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-slate-200 truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate leading-tight">
                  {currentUser.role.length > 24
                    ? currentUser.role.slice(0, 24) + '…'
                    : currentUser.role}
                </div>
              </div>
            )}
            {!isCollapsed && (
              <User className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
            )}
          </NavLink>

          {/* Settings + Logout + Collapse row */}
          <div
            className={cn(
              'flex items-center px-3 pb-3 gap-1',
              isCollapsed ? 'flex-col justify-center' : 'justify-between',
            )}
          >
            {/* Settings */}
            <NavLink
              to="/profile"
              title="Settings"
              onClick={closeMobile}
              className="flex items-center gap-2 p-2 rounded-lg text-[12px] text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors"
            >
              <Settings className="w-4 h-4" />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>

            {/* Logout */}
            <button
              onClick={onOpenLogout}
              title="Logout"
              className="flex items-center gap-2 p-2 rounded-lg text-[12px] text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span>Logout</span>}
            </button>

            {/* Collapse toggle – desktop only */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.05] transition-colors ml-auto"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
