import React from 'react'
import {
  X,
  Package,
  Warehouse,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Layers,
} from 'lucide-react'
import { StockItem, Product, StockMove } from '@/types/inventory'
import { useInventory } from '@/context/InventoryContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatNumber, formatDate } from '@/utils/formatters'
import { useNavigate } from 'react-router-dom'

interface StockDetailDrawerProps {
  stockItem: StockItem | null
  product?: Product | null
  isOpen: boolean
  onClose: () => void
  onTransfer?: (item: StockItem) => void
  onAdjust?: (item: StockItem) => void
}

export const StockDetailDrawer: React.FC<StockDetailDrawerProps> = ({
  stockItem,
  product,
  isOpen,
  onClose,
  onTransfer,
  onAdjust,
}) => {
  const { stockItems, stockMoves, warehouses, products } = useInventory()
  const navigate = useNavigate()

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !stockItem) return null

  // Find corresponding product if not passed
  const activeProduct =
    product ||
    products.find((p) => p.id === stockItem.productId || p.sku === stockItem.productSku)

  // Find all location distribution records for this product across all warehouses
  const distributionItems = stockItems.filter(
    (si) => si.productId === stockItem.productId || si.productSku === stockItem.productSku,
  )

  const totalOnHandAllLocations = distributionItems.reduce((acc, curr) => acc + curr.quantityOnHand, 0)
  const totalAvailableAllLocations = distributionItems.reduce((acc, curr) => acc + curr.available, 0)
  const totalReservedAllLocations = distributionItems.reduce((acc, curr) => acc + curr.allocated, 0)

  // Product moves
  const recentMoves = stockMoves
    .filter(
      (m) => m.productId === stockItem.productId || m.productSku === stockItem.productSku,
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  const reorderLevel = activeProduct?.minStock ?? 20
  const isOutOfStock = totalOnHandAllLocations === 0
  const isLowStock = totalOnHandAllLocations <= reorderLevel && !isOutOfStock
  const isHealthy = !isLowStock && !isOutOfStock

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-[#0c101c] border-l border-white/[0.08] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 border-b border-white/[0.08] bg-[#0e1424] flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#ff6a00]/15 text-[#ff8c33] border border-[#ff6a00]/30 font-bold">
                  {stockItem.productSku}
                </span>
                <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                  {stockItem.categoryName}
                </span>
                {isHealthy && (
                  <Badge variant="green" dot>
                    Healthy
                  </Badge>
                )}
                {isLowStock && (
                  <Badge variant="amber" dot>
                    Low Stock
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge variant="red" dot>
                    Out of Stock
                  </Badge>
                )}
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight truncate">
                {stockItem.productName}
              </h2>

              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                  Primary Selected: <strong className="text-slate-200">{stockItem.warehouseCode}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#ff6a00]" />
                  Bay: <strong className="text-slate-200">{stockItem.locationCode}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* KPI Summary strip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Global On Hand
                </div>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {formatNumber(totalOnHandAllLocations)}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Across all nodes
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  Total Available
                </div>
                <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
                  {formatNumber(totalAvailableAllLocations)}
                </div>
                <div className="text-[11px] font-mono text-emerald-400/70 mt-0.5">
                  Ready to fulfill
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/[0.03] border border-amber-500/20">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  Total Reserved
                </div>
                <div className="text-2xl font-black font-mono text-amber-300 mt-1">
                  {formatNumber(totalReservedAllLocations)}
                </div>
                <div className="text-[11px] font-mono text-amber-400/70 mt-0.5">
                  Committed orders
                </div>
              </div>
            </div>

            {/* Inventory Distribution Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#ff6a00]" />
                  Inventory Distribution
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  {distributionItems.length} active locations
                </span>
              </div>

              {/* Visual Location Cards */}
              <div className="space-y-2.5">
                {distributionItems.map((item) => {
                  const sharePct =
                    totalOnHandAllLocations > 0
                      ? Math.round((item.quantityOnHand / totalOnHandAllLocations) * 100)
                      : 0

                  const isCurrent = item.id === stockItem.id

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-[#12192c] border-[#ff6a00]/40 shadow-lg shadow-[#ff6a00]/5 ring-1 ring-[#ff6a00]/20'
                          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">
                              {item.warehouseName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                              {item.warehouseCode}
                            </span>
                            {isCurrent && (
                              <span className="font-mono text-[10px] text-[#ff8c33] bg-[#ff6a00]/10 px-2 py-0.5 rounded-full border border-[#ff6a00]/30 font-bold">
                                Selected Location
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-[#ff6a00]" />
                            <span className="text-slate-300 font-semibold">{item.locationCode}</span>
                            {item.lotNumber && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500">Lot: {item.lotNumber}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Quantitative Breakdown */}
                        <div className="text-right shrink-0">
                          <div className="text-xl font-bold font-mono text-white">
                            {formatNumber(item.quantityOnHand)}{' '}
                            <span className="text-xs font-normal text-slate-400 uppercase">
                              {activeProduct?.unit || 'units'}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-2 text-[11px] font-mono mt-0.5">
                            <span className="text-emerald-400">{item.available} Avail</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-amber-400">{item.allocated} Rsvd</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar of distribution */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Share of total stock</span>
                          <span>{sharePct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCurrent ? 'bg-[#ff6a00]' : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.max(sharePct, 4)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Reorder Status Alert Box */}
            <div className="p-4 rounded-xl bg-[#0f1526] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Safety Reorder Threshold
                </span>
                <span className="font-mono text-xs text-white">
                  Target: <strong>{reorderLevel} {activeProduct?.unit || 'units'}</strong>
                </span>
              </div>
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-xs text-rose-300">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Item is completely out of stock across all warehouses.</span>
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Current global stock ({totalOnHandAllLocations}) is below minimum reorder floor ({reorderLevel}).
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Operating buffer is above safety reorder threshold.</span>
                </div>
              )}
            </div>

            {/* Recent Stock Movements Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Recent Stock Movements
                </h3>
                <span className="text-[11px] font-mono text-slate-500">Transaction audit</span>
              </div>

              {recentMoves.length > 0 ? (
                <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d1322]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-mono text-[10px] uppercase">
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Operation</th>
                        <th className="px-4 py-2.5">Route</th>
                        <th className="px-4 py-2.5 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {recentMoves.map((m) => {
                        const isPositive = m.quantityChange > 0
                        return (
                          <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {formatDate(m.timestamp)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {m.type === 'RECEIPT' && <Badge variant="green">Receipt</Badge>}
                                {m.type === 'DELIVERY' && <Badge variant="orange">Delivery</Badge>}
                                {m.type === 'INTERNAL_TRANSFER' && <Badge variant="blue">Transfer</Badge>}
                                {m.type === 'INVENTORY_ADJUSTMENT' && <Badge variant="purple">Adjust</Badge>}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 mt-0.5">{m.reference}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-300 text-[11px] font-mono truncate max-w-[170px]">
                              {m.fromLocation ? `${m.fromLocation} → ${m.toLocation}` : m.toLocation}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                              <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                                {isPositive ? `+${m.quantityChange}` : m.quantityChange}{' '}
                                {activeProduct?.unit || 'units'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] text-center space-y-1.5">
                  <div className="text-xs text-slate-400">No recorded movements found for this product.</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Moves created via Receipts, Deliveries, and Transfers will appear here.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-white/[0.08] bg-[#0e1424] flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onAdjust) onAdjust(stockItem)
                  else navigate('/adjustments')
                }}
                className="gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Adjust Bin
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (onTransfer) onTransfer(stockItem)
                  else navigate('/transfers')
                }}
                className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white gap-1.5"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Transfer Stock
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
