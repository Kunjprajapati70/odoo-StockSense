import React from 'react'
import { useInventory } from '@/context/InventoryContext'
import {
  AlertTriangle,
  ArrowRight,
  Package,
  ShoppingCart,
} from 'lucide-react'
import { StockStatusBadge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface LowStockAlertsProps {
  onOpenNewReceipt: () => void
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ onOpenNewReceipt }) => {
  const { products, stockItems } = useInventory()

  const alertProducts = products
    .filter((p) => p.status === 'low_stock' || p.status === 'out_of_stock')
    .slice(0, 8)

  // Get location for a product from stockItems
  const getLocation = (productId: string) => {
    const si = stockItems.find((s) => s.productId === productId)
    return si ? `${si.warehouseCode} · ${si.locationCode}` : '—'
  }

  return (
    <div className="bg-[#0d1119] border border-white/[0.07] rounded-2xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-white leading-tight">Low Stock Alerts</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {alertProducts.length} SKU{alertProducts.length !== 1 ? 's' : ''} below safe threshold
            </p>
          </div>
        </div>
        <Link
          to="/products"
          className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#ff6a00] hover:text-[#ff8c33] transition-colors shrink-0"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Table header */}
      {alertProducts.length > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-5 py-2 border-b border-white/[0.04] bg-white/[0.02]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono">Product / Location</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono text-right">Stock</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono text-right">Status</span>
        </div>
      )}

      {/* Rows */}
      <div className="flex-1 divide-y divide-white/[0.04] overflow-y-auto">
        {alertProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-5">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-[13px] font-semibold text-slate-300">All stock levels optimal</div>
            <div className="text-[11px] text-slate-500 mt-1">No SKUs below minimum threshold</div>
          </div>
        ) : (
          alertProducts.map((prod) => {
            const isOut = prod.status === 'out_of_stock'
            const stockPct = prod.minStock > 0
              ? Math.min(Math.round((prod.totalOnHand / prod.minStock) * 100), 100)
              : 0

            return (
              <div
                key={prod.id}
                className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-5 py-3 hover:bg-white/[0.025] transition-colors group"
              >
                {/* Product info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-1.5 h-5 rounded-full shrink-0',
                      isOut ? 'bg-rose-500' : 'bg-amber-400',
                    )} />
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-white truncate leading-tight group-hover:text-slate-100">
                        {prod.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 leading-tight flex items-center gap-1.5 mt-0.5">
                        <span>{prod.sku}</span>
                        <span className="text-slate-700">·</span>
                        <span className="truncate">{getLocation(prod.id)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock level */}
                <div className="text-right shrink-0">
                  <div className={cn(
                    'text-[13px] font-mono font-extrabold leading-tight',
                    isOut ? 'text-rose-400' : 'text-amber-400',
                  )}>
                    {prod.totalOnHand}
                    <span className="text-slate-600 font-normal text-[11px]">/{prod.minStock}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-600">{prod.unit}</div>
                  {/* Mini progress */}
                  <div className="mt-1 w-16 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', isOut ? 'bg-rose-500' : 'bg-amber-400')}
                      style={{ width: `${stockPct}%` }}
                    />
                  </div>
                </div>

                {/* Status + Restock */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StockStatusBadge status={prod.status} />
                  <button
                    onClick={onOpenNewReceipt}
                    className="flex items-center gap-1 text-[10px] font-mono font-semibold text-[#ff8c33] hover:text-[#ff6a00] transition-colors"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    Restock
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {alertProducts.length > 0 && (
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {products.filter(p => p.status === 'out_of_stock').length} out of stock,{' '}
            {products.filter(p => p.status === 'low_stock').length} low stock
          </span>
          <button
            onClick={onOpenNewReceipt}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-[#ff6a00]/15 hover:bg-[#ff6a00]/25 border border-[#ff6a00]/25 px-2.5 py-1 rounded-lg transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#ff8c33]" />
            Create Restock Receipt
          </button>
        </div>
      )}
    </div>
  )
}
