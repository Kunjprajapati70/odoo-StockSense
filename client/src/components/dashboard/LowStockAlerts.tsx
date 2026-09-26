import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { useInventory } from '@/context/InventoryContext'
import { AlertTriangle, ArrowRight, Package } from 'lucide-react'
import { StockStatusBadge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'

interface LowStockAlertsProps {
  onOpenNewReceipt: () => void
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ onOpenNewReceipt }) => {
  const { products } = useInventory()
  const lowOrOutStock = products.filter(
    (p) => p.status === 'low_stock' || p.status === 'out_of_stock',
  )

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-950/50 border border-amber-800/40 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Inventory Critical Alerts</CardTitle>
            <p className="text-xs text-slate-400">SKUs below safe minimum operating thresholds</p>
          </div>
        </div>
        <Link
          to="/products"
          className="text-xs text-[#ff6a00] hover:underline flex items-center gap-1 font-mono font-semibold"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {lowOrOutStock.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            All SKUs are operating within optimal stock limits.
          </div>
        ) : (
          lowOrOutStock.map((prod) => (
            <div
              key={prod.id}
              className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-black/40 border border-white/10 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {prod.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    SKU: {prod.sku} • Min Safe: {prod.minStock} {prod.unit}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-white">
                    {prod.totalOnHand} / {prod.minStock}
                  </div>
                  <StockStatusBadge status={prod.status} />
                </div>
                <button
                  onClick={onOpenNewReceipt}
                  className="px-2.5 py-1 text-xs rounded-lg bg-[#ff6a00]/15 hover:bg-[#ff6a00]/25 text-[#ff8c33] border border-[#ff6a00]/30 font-semibold transition-colors"
                >
                  Restock
                </button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
