import React, { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  Plus,
  ChevronDown,
  Warehouse as WarehouseIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  Package,
  Home,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { useInventory } from '@/context/InventoryContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/formatters'

// ─── Route → display name map ─────────────────────────────────────────────────

const PAGE_NAMES: Record<string, { title: string; section: string }> = {
  '/': { title: 'Dashboard', section: 'Main' },
  '/products': { title: 'Products', section: 'Inventory' },
  '/inventory': { title: 'Stock Overview', section: 'Inventory' },
  '/move-history': { title: 'Move History', section: 'Inventory' },
  '/receipts': { title: 'Receipts', section: 'Operations' },
  '/deliveries': { title: 'Deliveries', section: 'Operations' },
  '/transfers': { title: 'Transfers', section: 'Operations' },
  '/adjustments': { title: 'Adjustments', section: 'Operations' },
  '/warehouses': { title: 'Warehouses', section: 'Management' },
  '/categories': { title: 'Categories', section: 'Management' },
  '/profile': { title: 'Profile', section: 'Account' },
}

// ─── Breadcrumb strip ─────────────────────────────────────────────────────────

const TopbarBreadcrumb: React.FC = () => {
  const location = useLocation()
  const current = PAGE_NAMES[location.pathname]

  if (!current || location.pathname === '/') return null

  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-slate-500" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-slate-300 transition-colors flex items-center gap-1">
        <Home className="w-3 h-3" />
      </Link>
      <ChevronRight className="w-3 h-3 text-slate-700" />
      {current.section !== 'Main' && (
        <>
          <span className="text-slate-600">{current.section}</span>
          <ChevronRight className="w-3 h-3 text-slate-700" />
        </>
      )}
      <span className="text-slate-300 font-medium">{current.title}</span>
    </nav>
  )
}

// ─── Page title ───────────────────────────────────────────────────────────────

const TopbarTitle: React.FC = () => {
  const location = useLocation()
  const current = PAGE_NAMES[location.pathname]
  return (
    <h1 className="text-[15px] font-bold text-white leading-tight">
      {current?.title ?? 'StockSense'}
    </h1>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TopbarProps {
  onToggleMobileMenu: () => void
  onOpenCommandSearch: () => void
  onOpenNewProduct: () => void
  onOpenNewReceipt: () => void
  onOpenNewDelivery: () => void
  onOpenNewTransfer: () => void
  onOpenNewAdjustment: () => void
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileMenu,
  onOpenCommandSearch,
  onOpenNewProduct,
  onOpenNewReceipt,
  onOpenNewDelivery,
  onOpenNewTransfer,
  onOpenNewAdjustment,
}) => {
  const { warehouses, selectedWarehouseId, setSelectedWarehouseId, stockMoves, kpis } =
    useInventory()

  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false)

  const quickMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const warehouseRef = useRef<HTMLDivElement>(null)

  const activeWarehouse = warehouses.find((w) => w.id === selectedWarehouseId)
  const alertCount = kpis.lowStockCount + kpis.outOfStockCount

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target as Node)) {
        setIsQuickMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false)
      }
      if (warehouseRef.current && !warehouseRef.current.contains(e.target as Node)) {
        setIsWarehouseOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsQuickMenuOpen(false)
        setIsNotificationsOpen(false)
        setIsWarehouseOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const closeAll = () => {
    setIsQuickMenuOpen(false)
    setIsNotificationsOpen(false)
    setIsWarehouseOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 h-[60px] flex items-center justify-between gap-4 px-4 sm:px-6 bg-[#090c14]/95 backdrop-blur-md border-b border-white/[0.06] shrink-0">

      {/* ── LEFT: Hamburger + Title + Breadcrumb ──────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 -ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title + breadcrumb */}
        <div className="min-w-0 hidden sm:block">
          <TopbarTitle />
          <TopbarBreadcrumb />
        </div>
      </div>

      {/* ── CENTRE: Search ────────────────────────────────────────────────── */}
      <button
        onClick={onOpenCommandSearch}
        className="hidden md:flex items-center gap-3 h-9 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] text-slate-400 hover:text-slate-300 transition-all duration-150 w-64 lg:w-80 xl:w-96 text-[12px] select-none shrink-0"
        aria-label="Global search (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left truncate">Search products, SKUs, references…</span>
        <div className="flex items-center gap-1 shrink-0">
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.07] text-slate-500 border border-white/[0.08]">
            ⌘
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.07] text-slate-500 border border-white/[0.08]">
            K
          </kbd>
        </div>
      </button>

      {/* ── RIGHT: Actions row ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

        {/* Mobile search */}
        <button
          onClick={onOpenCommandSearch}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* ── Warehouse selector ────────────────────────────────────────── */}
        <div ref={warehouseRef} className="relative hidden sm:block">
          <button
            onClick={() => { closeAll(); setIsWarehouseOpen((v) => !v) }}
            className="flex items-center gap-2 h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] text-slate-300 hover:text-white transition-all duration-150 text-[12px] font-medium max-w-[180px]"
            aria-haspopup="listbox"
            aria-expanded={isWarehouseOpen}
          >
            <WarehouseIcon className="w-3.5 h-3.5 text-[#ff6a00] shrink-0" />
            <span className="truncate">
              {activeWarehouse ? activeWarehouse.code : 'All Warehouses'}
            </span>
            {activeWarehouse && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded shrink-0">
                {activeWarehouse.utilizationPercent}%
              </span>
            )}
            <ChevronDown className={cn('w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150', isWarehouseOpen && 'rotate-180')} />
          </button>

          {isWarehouseOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#0e1422] border border-white/[0.09] shadow-2xl shadow-black/60 overflow-hidden z-50">
              <div className="p-1">
                {/* All Warehouses */}
                <button
                  onClick={() => { setSelectedWarehouseId('ALL'); setIsWarehouseOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] transition-colors text-left',
                    selectedWarehouseId === 'ALL'
                      ? 'bg-[#ff6a00]/10 text-[#ff8c33] border border-[#ff6a00]/20'
                      : 'text-slate-300 hover:bg-white/[0.05] hover:text-white',
                  )}
                >
                  <WarehouseIcon className="w-4 h-4 shrink-0 opacity-70" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">All Warehouses</div>
                    <div className="text-[10px] text-slate-500">Global network view</div>
                  </div>
                  {selectedWarehouseId === 'ALL' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff6a00] shrink-0" />
                  )}
                </button>

                <div className="h-px bg-white/[0.06] my-1" />

                {warehouses.map((wh) => (
                  <button
                    key={wh.id}
                    onClick={() => { setSelectedWarehouseId(wh.id); setIsWarehouseOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] transition-colors text-left',
                      selectedWarehouseId === wh.id
                        ? 'bg-[#ff6a00]/10 text-[#ff8c33] border border-[#ff6a00]/20'
                        : 'text-slate-300 hover:bg-white/[0.05] hover:text-white',
                    )}
                  >
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', wh.utilizationPercent > 85 ? 'bg-rose-400' : wh.utilizationPercent > 70 ? 'bg-amber-400' : 'bg-emerald-400')} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{wh.code} · {wh.city}</div>
                      <div className="text-[10px] text-slate-500">{wh.utilizationPercent}% utilized</div>
                    </div>
                    {selectedWarehouseId === wh.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff6a00] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { closeAll(); setIsNotificationsOpen((v) => !v) }}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label={`Notifications (${alertCount} alerts)`}
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6a00] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff6a00]" />
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#0e1422] border border-white/[0.09] shadow-2xl shadow-black/60 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
                <div>
                  <h4 className="text-[12px] font-bold text-white">Stock Events</h4>
                  <p className="text-[10px] text-slate-500">{alertCount} items need attention</p>
                </div>
                <Link
                  to="/move-history"
                  onClick={closeAll}
                  className="text-[11px] text-[#ff6a00] hover:text-[#ff8c33] flex items-center gap-1 transition-colors"
                >
                  All events <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Alert pills */}
              {(kpis.lowStockCount > 0 || kpis.outOfStockCount > 0) && (
                <div className="px-3 py-2.5 flex gap-2 border-b border-white/[0.06]">
                  {kpis.outOfStockCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      {kpis.outOfStockCount} stockout{kpis.outOfStockCount > 1 ? 's' : ''}
                    </div>
                  )}
                  {kpis.lowStockCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {kpis.lowStockCount} low stock
                    </div>
                  )}
                </div>
              )}

              {/* Recent moves */}
              <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04]">
                {stockMoves.slice(0, 6).map((move) => (
                  <div key={move.id} className="px-4 py-3 hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-mono font-semibold text-slate-300">
                        {move.reference}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {formatDateTime(move.timestamp)}
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-400 truncate">{move.productName}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-slate-600 truncate max-w-[200px]">
                        {move.fromLocation} → {move.toLocation}
                      </span>
                      <span
                        className={cn(
                          'text-[11px] font-mono font-bold',
                          move.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400',
                        )}
                      >
                        {move.quantityChange > 0 ? `+${move.quantityChange}` : move.quantityChange}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── New Operation ─────────────────────────────────────────────── */}
        <div ref={quickMenuRef} className="relative">
          <Button
            variant="primary"
            size="sm"
            onClick={() => { closeAll(); setIsQuickMenuOpen((v) => !v) }}
            className="gap-1.5 h-9 font-semibold pl-3 pr-3.5"
            aria-haspopup="menu"
            aria-expanded={isQuickMenuOpen}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline text-[12px]">New</span>
            <ChevronDown className={cn('w-3.5 h-3.5 hidden sm:block shrink-0 transition-transform duration-150', isQuickMenuOpen && 'rotate-180')} />
          </Button>

          {isQuickMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-[#0e1422] border border-white/[0.09] shadow-2xl shadow-black/60 p-1.5 z-50 space-y-0.5">
              {/* Section label */}
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Stock Operations
              </p>

              {[
                {
                  label: 'Receive Stock',
                  sub: 'Inbound from supplier',
                  icon: ArrowDownToLine,
                  color: 'text-emerald-400',
                  action: onOpenNewReceipt,
                },
                {
                  label: 'Dispatch Delivery',
                  sub: 'Outbound to customer',
                  icon: ArrowUpFromLine,
                  color: 'text-sky-400',
                  action: onOpenNewDelivery,
                },
                {
                  label: 'Internal Transfer',
                  sub: 'Move between locations',
                  icon: ArrowLeftRight,
                  color: 'text-purple-400',
                  action: onOpenNewTransfer,
                },
                {
                  label: 'Stock Adjustment',
                  sub: 'Cycle count correction',
                  icon: SlidersHorizontal,
                  color: 'text-amber-400',
                  action: onOpenNewAdjustment,
                },
              ].map(({ label, sub, icon: Icon, color, action }) => (
                <button
                  key={label}
                  onClick={() => { closeAll(); action() }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] text-slate-200 hover:bg-white/[0.06] hover:text-white transition-colors text-left"
                >
                  <Icon className={cn('w-4 h-4 shrink-0', color)} />
                  <div className="min-w-0">
                    <div className="font-semibold text-white leading-tight">{label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{sub}</div>
                  </div>
                </button>
              ))}

              <div className="h-px bg-white/[0.07] my-1" />

              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Catalog
              </p>
              <button
                onClick={() => { closeAll(); onOpenNewProduct() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] text-slate-200 hover:bg-white/[0.06] hover:text-white transition-colors text-left"
              >
                <Package className="w-4 h-4 text-[#ff8c33] shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-white leading-tight">Create Product</div>
                  <div className="text-[10px] text-slate-500 leading-tight">Add new SKU to catalog</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* ── User avatar (desktop) ──────────────────────────────────────── */}
        <Link
          to="/profile"
          className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6a00]/80 to-[#c84e00]/80 text-white font-bold text-[13px] border border-white/20 hover:border-white/40 transition-colors shrink-0"
          title="My Profile"
        >
          A
        </Link>
      </div>
    </header>
  )
}
