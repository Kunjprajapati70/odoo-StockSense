import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '@/context/InventoryContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip'
import { InventoryMovementChart } from '@/components/dashboard/InventoryMovementChart'
import { WarehouseStockPanel } from '@/components/dashboard/WarehouseStockPanel'
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts'
import { RecentMovementsFeed, PendingOperationsPanel } from '@/components/dashboard/DashboardPanels'
import { Button } from '@/components/ui/Button'
import { NewReceiptModal } from '@/components/forms/NewReceiptModal'
import { NewProductModal } from '@/components/forms/NewProductModal'
import {
  RefreshCw,
  Filter,
  Download,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// ─── Small Live Stat Pill ──────────────────────────────────────────────────────

const LivePill: React.FC = () => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
    Live
  </span>
)

// ─── Dashboard Page ────────────────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const { kpis, warehouses, selectedWarehouseId } = useInventory()
  const navigate = useNavigate()

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const activeWh = warehouses.find((w) => w.id === selectedWarehouseId)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="space-y-6 pb-4">

      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <PageHeader
        title="Inventory Overview"
        subtitle="Monitor your stock, warehouse activity and pending operations."
        badge={<LivePill />}
        actions={
          <>
            {/* Date / filter control */}
            <button className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] text-slate-400 hover:text-slate-200 transition-all text-[12px] font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Sep 2026</span>
            </button>

            {/* Warehouse selector pill (shows current filter) */}
            <div className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] font-medium text-slate-300">
              <div className="w-2 h-2 rounded-full bg-[#ff6a00]" />
              {activeWh ? activeWh.code : 'All Warehouses'}
            </div>

            {/* Filter */}
            <button className="hidden lg:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] text-slate-400 hover:text-slate-200 transition-all text-[12px]">
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>

            {/* Export */}
            <button className="hidden lg:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] text-slate-400 hover:text-slate-200 transition-all text-[12px]">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] text-slate-400 hover:text-slate-200 transition-all text-[12px]"
              title="Refresh dashboard"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 transition-transform', isRefreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Primary actions */}
            <Button variant="secondary" size="sm" onClick={() => setIsProductModalOpen(true)} className="h-9">
              + Product
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsReceiptModalOpen(true)} className="h-9 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              Receive Stock
            </Button>
          </>
        }
      />

      {/* ── KPI Strip ─────────────────────────────────────────────────────────── */}
      <DashboardKpiStrip
        kpis={kpis}
        onNavigate={navigate}
      />

      {/* ── Movement Chart + Warehouse Panel ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 min-h-[400px]">
          <InventoryMovementChart />
        </div>
        <div className="lg:col-span-4 min-h-[400px]">
          <WarehouseStockPanel />
        </div>
      </div>

      {/* ── Low Stock + Recent Movements ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-5">
          <LowStockAlerts onOpenNewReceipt={() => setIsReceiptModalOpen(true)} />
        </div>
        <div className="lg:col-span-7">
          <RecentMovementsFeed />
        </div>
      </div>

      {/* ── Pending Operations (tabbed table) ─────────────────────────────────── */}
      <PendingOperationsPanel />

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      <NewReceiptModal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} />
      <NewProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} />
    </div>
  )
}
