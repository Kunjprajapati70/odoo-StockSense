import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { HeroKpiCard } from '@/components/dashboard/HeroKpiCard'
import { SparklineCard } from '@/components/dashboard/SparklineCard'
import { ValuationChart } from '@/components/dashboard/ValuationChart'
import { MovementFlowChart } from '@/components/dashboard/MovementFlowChart'
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts'
import { RecentOperationsTable } from '@/components/dashboard/RecentOperationsTable'
import { useInventory } from '@/context/InventoryContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Warehouse,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NewReceiptModal } from '@/components/forms/NewReceiptModal'
import { NewDeliveryModal } from '@/components/forms/NewDeliveryModal'
import { NewProductModal } from '@/components/forms/NewProductModal'

export const DashboardPage: React.FC = () => {
  const { kpis, warehouses, selectedWarehouseId } = useInventory()
  const navigate = useNavigate()

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  const activeWh = warehouses.find((w) => w.id === selectedWarehouseId)

  // Sparkline mock datasets for visual polish
  const redSparkData = [
    { value: 28 },
    { value: 24 },
    { value: 22 },
    { value: 25 },
    { value: 19 },
    { value: 15 },
    { value: 12 },
  ]
  const greenSparkData1 = [
    { value: 14 },
    { value: 19 },
    { value: 22 },
    { value: 26 },
    { value: 31 },
    { value: 38 },
    { value: 45 },
  ]
  const greenSparkData2 = [
    { value: 20 },
    { value: 22 },
    { value: 21 },
    { value: 28 },
    { value: 33 },
    { value: 35 },
    { value: 42 },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={activeWh ? `${activeWh.code} Operations Overview` : 'Enterprise Inventory Overview'}
        subtitle={
          activeWh
            ? `Live warehouse operations, dock throughput, and inventory storage metrics for ${activeWh.name}.`
            : 'Unified multi-warehouse intelligence, stock ledger audit logs, and supply chain telemetry.'
        }
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
          </span>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsProductModalOpen(true)}>
              + Add SKU
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsReceiptModalOpen(true)}>
              Receive Stock
            </Button>
          </>
        }
      />

      {/* TOP HERO SECTION: Matching the reference image layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Performance / Warehouses Summary Card (Reference: Safe Vaults Performance left card) */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="p-6 h-full flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-slate-300">
                    <Warehouse className="w-4 h-4 text-[#ff6a00]" />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                    Network Capacity
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                  All Systems Online
                </span>
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold text-slate-300">Operational Hubs</div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {warehouses.map((wh) => (
                    <div
                      key={wh.id}
                      className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff6a00]" />
                      <span className="text-white font-bold">{wh.code}</span>
                      <span className="text-slate-400 text-[10px]">({wh.utilizationPercent}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar inside left card */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/[0.08]">
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Inbound Orders</div>
                <div className="text-xl font-extrabold text-white font-mono mt-0.5">
                  {kpis.pendingReceipts} Pending
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Outbound Ready</div>
                <div className="text-xl font-extrabold text-white font-mono mt-0.5">
                  {kpis.pendingDeliveries} Ready
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-[10px] font-mono uppercase text-slate-400">Transfers</div>
                <div className="text-xl font-extrabold text-white font-mono mt-0.5">
                  {kpis.activeTransfers} In-Transit
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Hero Card: Vibrant Orange Card matching reference photo! */}
        <div className="lg:col-span-7">
          <HeroKpiCard
            valuation={kpis.totalValuation}
            totalSkus={kpis.totalSkuCount}
            turnoverRate={kpis.turnoverRate}
            fillRate={kpis.fillRate}
          />
        </div>
      </div>

      {/* THREE ANALYTICS SPARKLINE CARDS: Matching "Popular Vaults" row from reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SparklineCard
          title="Stock Deficit & Critical Alerts"
          subtitle="Items needing immediate purchase reorder"
          value={kpis.lowStockCount}
          unitLabel="Critical SKUs"
          changePercent={14.2}
          trend="down"
          data={redSparkData}
          color="red"
          icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
          onClick={() => navigate('/products')}
        />
        <SparklineCard
          title="Inbound Receipts Intake"
          subtitle="Scheduled supplier purchase orders"
          value={kpis.pendingReceipts}
          unitLabel="Shipments"
          changePercent={24.8}
          trend="up"
          data={greenSparkData1}
          color="green"
          icon={<ArrowDownToLine className="w-4 h-4 text-emerald-400" />}
          onClick={() => navigate('/receipts')}
        />
        <SparklineCard
          title="Outbound Customer Dispatch"
          subtitle="Orders packed and ready for shipping"
          value={kpis.pendingDeliveries}
          unitLabel="Orders"
          changePercent={18.4}
          trend="up"
          data={greenSparkData2}
          color="green"
          icon={<ArrowUpFromLine className="w-4 h-4 text-emerald-400" />}
          onClick={() => navigate('/deliveries')}
        />
      </div>

      {/* TWO INTEGRATED CHARTS: Valuation Area Chart & Flow Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ValuationChart />
        <MovementFlowChart />
      </div>

      {/* BOTTOM SECTION: Critical Alerts + Live Movement Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4">
          <LowStockAlerts onOpenNewReceipt={() => setIsReceiptModalOpen(true)} />
        </div>
        <div className="lg:col-span-8">
          <RecentOperationsTable />
        </div>
      </div>

      {/* Modals */}
      <NewReceiptModal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} />
      <NewDeliveryModal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} />
      <NewProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} />
    </div>
  )
}
