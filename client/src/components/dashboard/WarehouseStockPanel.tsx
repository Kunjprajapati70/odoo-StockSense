import React from 'react'
import { mockWarehouseStock } from '@/mock/mockData'
import { Warehouse, TrendingUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'

export const WarehouseStockPanel: React.FC = () => {
  const total = mockWarehouseStock.reduce((s, w) => s + w.qty, 0)
  const maxQty = Math.max(...mockWarehouseStock.map((w) => w.qty))

  return (
    <div className="bg-[#0d1119] border border-white/[0.07] rounded-2xl flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Warehouse className="w-4 h-4 text-[#ff6a00]" />
              <h3 className="text-[13px] font-bold text-white tracking-tight">Stock by Warehouse</h3>
            </div>
            <p className="text-[11px] text-slate-500">Utilization across all active hubs</p>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Total Network</div>
            <div className="text-[18px] font-extrabold text-white font-mono">{total.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 font-mono">pallets</div>
          </div>
        </div>
      </div>

      {/* Bars */}
      <div className="flex-1 px-5 py-4 space-y-4">
        {mockWarehouseStock.map((wh) => {
          const widthPct = Math.round((wh.qty / maxQty) * 100)
          const isOverloaded = wh.pct > 85
          const isWarning = wh.pct > 75 && !isOverloaded

          return (
            <div key={wh.code}>
              {/* Label row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: wh.color }}
                  />
                  <span className="text-[12px] font-semibold text-slate-200">{wh.name}</span>
                  {isOverloaded && (
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    {wh.qty.toLocaleString()} / {wh.capacity.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md',
                      isOverloaded
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                        : isWarning
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
                    )}
                  >
                    {wh.pct}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${widthPct}%`,
                    background: isOverloaded
                      ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                      : isWarning
                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                      : `linear-gradient(90deg, ${wh.color}, ${wh.color}cc)`,
                    boxShadow: `0 0 8px ${wh.color}40`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-slate-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Avg utilization across network</span>
          </div>
          <span className="font-mono font-bold text-[#ff8c33]">
            {Math.round(mockWarehouseStock.reduce((s, w) => s + w.pct, 0) / mockWarehouseStock.length)}%
          </span>
        </div>
      </div>
    </div>
  )
}
