import React from 'react'
import {
  X,
  Package,
  Layers,
  MapPin,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  Scale,
  DollarSign,
  Barcode,
  Clock,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Plus,
} from 'lucide-react'
import { Product, StockMove, StockItem } from '@/types/inventory'
import { useInventory } from '@/context/InventoryContext'
import { StockStatusBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters'
import { useNavigate } from 'react-router-dom'

interface ProductDetailDrawerProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (product: Product) => void
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { stockMoves, stockItems, warehouses } = useInventory()
  const navigate = useNavigate()

  if (!isOpen || !product) return null

  // Filter items & moves for this product
  const productStockItems = stockItems.filter(
    (item) => item.productId === product.id || item.productSku === product.sku,
  )

  const productMoves = stockMoves
    .filter((m) => m.productId === product.id || m.productSku === product.sku)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  const isLowStock = product.totalOnHand <= product.minStock && product.totalOnHand > 0
  const isOutOfStock = product.totalOnHand === 0
  const isHealthy = !isLowStock && !isOutOfStock

  const marginPct =
    product.sellingPrice > 0
      ? (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-[#0c101c] border-l border-white/[0.08] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
          {/* Top Bar / Header */}
          <div className="p-6 border-b border-white/[0.08] bg-[#0e1424] flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#ff6a00]/15 text-[#ff8c33] border border-[#ff6a00]/30 font-bold">
                  {product.sku}
                </span>
                <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                  {product.categoryName}
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
                {product.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5 text-slate-500" />
                  {product.barcode || 'NO-BARCODE'}
                </span>
                <span>•</span>
                <span>Unit: <strong className="text-slate-200 uppercase">{product.unit}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(product)}
                  className="text-xs"
                >
                  Edit
                </Button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Stock Summary (Total, Available, Reserved) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#ff6a00]" />
                  Stock Summary
                </h3>
                <span className="text-[11px] font-mono text-slate-500">Real-time valuation</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Total Stock */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] relative overflow-hidden">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Total Stock
                  </div>
                  <div className="text-2xl font-black font-mono text-white mt-1">
                    {formatNumber(product.totalOnHand)}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {product.unit} on hand
                  </div>
                  <div className="absolute top-0 right-0 w-12 h-12 bg-white/[0.02] rounded-bl-full pointer-events-none" />
                </div>

                {/* Available Stock */}
                <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20 relative overflow-hidden">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                    Available
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
                    {formatNumber(product.totalAvailable)}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400/70 mt-0.5">
                    Unallocated
                  </div>
                </div>

                {/* Reserved Stock */}
                <div className="p-4 rounded-xl bg-amber-500/[0.03] border border-amber-500/20 relative overflow-hidden">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                    Reserved
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-300 mt-1">
                    {formatNumber(product.totalAllocated)}
                  </div>
                  <div className="text-[11px] font-mono text-amber-400/70 mt-0.5">
                    Order holds
                  </div>
                </div>
              </div>
            </div>

            {/* Reorder Configuration & Health Banner */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  Reorder Configuration
                </h3>
                <span className="text-[11px] font-mono text-slate-500">Safety thresholds</span>
              </div>

              <div className="p-4 rounded-xl bg-[#0f1526] border border-white/[0.08] space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[11px] font-mono text-slate-400">Reorder Level (Min)</div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5 flex items-baseline gap-1.5">
                      {formatNumber(product.minStock)}
                      <span className="text-xs font-normal text-slate-500 uppercase">{product.unit}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Minimum safety stock target</div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[11px] font-mono text-slate-400">Reorder Quantity (Target)</div>
                    <div className="text-lg font-bold font-mono text-[#ff8c33] mt-0.5 flex items-baseline gap-1.5">
                      {formatNumber(product.maxStock)}
                      <span className="text-xs font-normal text-slate-500 uppercase">{product.unit}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Batch procurement ceiling</div>
                  </div>
                </div>

                {/* Alert condition indicator */}
                {isOutOfStock ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Critical stockout! Zero inventory available across all fulfillment nodes.</span>
                    </div>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => navigate('/receipts')}
                      className="bg-rose-600 hover:bg-rose-500 text-white shrink-0 ml-2"
                    >
                      Receive Stock
                    </Button>
                  </div>
                ) : isLowStock ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Current stock ({product.totalOnHand}) is below reorder threshold ({product.minStock}). Reorder recommended.
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => navigate('/receipts')}
                      className="bg-amber-600 hover:bg-amber-500 text-black font-semibold shrink-0 ml-2"
                    >
                      Restock
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Stock level is healthy. Optimal operating buffer above minimum reorder floor.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stock by Location */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-[#ff6a00]" />
                  Stock by Location
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  {productStockItems.length > 0 ? `${productStockItems.length} locations mapped` : 'Global allocation'}
                </span>
              </div>

              {productStockItems.length > 0 ? (
                <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d1322]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-mono text-[10px] uppercase">
                        <th className="px-4 py-2.5">Warehouse</th>
                        <th className="px-4 py-2.5">Location</th>
                        <th className="px-4 py-2.5 text-right">On Hand</th>
                        <th className="px-4 py-2.5 text-right">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {productStockItems.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{item.warehouseName}</div>
                            <div className="text-[11px] font-mono text-slate-500">{item.warehouseCode}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                              {item.locationCode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-white">
                            {formatNumber(item.quantityOnHand)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                            {formatNumber(item.available)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] text-center space-y-1.5">
                  <div className="text-xs text-slate-400">No warehouse stock mapped to individual bins yet.</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Use an Inbound Receipt or Inventory Adjustment to assign bin locations.
                  </div>
                </div>
              )}
            </div>

            {/* Recent Movements */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Recent Movements
                </h3>
                <span className="text-[11px] font-mono text-slate-500">Audit trail</span>
              </div>

              {productMoves.length > 0 ? (
                <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d1322]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-mono text-[10px] uppercase">
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Operation</th>
                        <th className="px-4 py-2.5">Location</th>
                        <th className="px-4 py-2.5 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {productMoves.map((m) => {
                        const isPositive = m.quantityChange > 0
                        return (
                          <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {formatDate(m.timestamp)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {m.type === 'RECEIPT' && (
                                  <Badge variant="green">Inbound</Badge>
                                )}
                                {m.type === 'DELIVERY' && (
                                  <Badge variant="orange">Outbound</Badge>
                                )}
                                {m.type === 'INTERNAL_TRANSFER' && (
                                  <Badge variant="blue">Transfer</Badge>
                                )}
                                {m.type === 'INVENTORY_ADJUSTMENT' && (
                                  <Badge variant="purple">Adjustment</Badge>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 mt-0.5">{m.reference}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-300 text-[11px] font-mono truncate max-w-[160px]">
                              {m.toLocation || m.fromLocation}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                              <span
                                className={
                                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {isPositive ? `+${m.quantityChange}` : m.quantityChange} {product.unit}
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
                  <div className="text-xs text-slate-400">No recorded movements for this SKU yet.</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Stock activity from Receipts, Deliveries, and Transfers will appear here automatically.
                  </div>
                </div>
              )}
            </div>

            {/* Commercial Details & Specs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Commercial Valuation
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Cost Price</div>
                  <div className="text-white font-bold mt-0.5">{formatCurrency(product.costPrice)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Selling Price</div>
                  <div className="text-white font-bold mt-0.5">{formatCurrency(product.sellingPrice)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Gross Margin</div>
                  <div className="text-emerald-400 font-bold mt-0.5">+{marginPct}%</div>
                </div>
              </div>

              {product.description && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300 font-mono text-[11px] uppercase block mb-1">
                    Catalog Specifications:
                  </strong>
                  {product.description}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-white/[0.08] bg-[#0e1424] flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close Drawer
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/adjustments')}
                className="gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Adjust Stock
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/receipts')}
                className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                New Receipt
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
