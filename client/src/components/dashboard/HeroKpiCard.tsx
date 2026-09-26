import React from 'react'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { TrendingUp, Layers, CheckCircle2, RefreshCw } from 'lucide-react'

interface HeroKpiCardProps {
  valuation: number
  totalSkus: number
  turnoverRate: number
  fillRate: number
}

export const HeroKpiCard: React.FC<HeroKpiCardProps> = ({
  valuation,
  totalSkus,
  turnoverRate,
  fillRate,
}) => {
  return (
    <Card variant="orange" className="p-6 md:p-7 glow-orange">
      <div className="flex flex-col justify-between h-full space-y-6">
        {/* Top Tag & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/20">
              <Layers className="w-4 h-4 text-white" />
            </span>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-white/90">
              Total Stock Valuation
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-black/25 text-white border border-white/20">
            <TrendingUp className="w-3 h-3 text-white" /> +14.8% MoM
          </span>
        </div>

        {/* Big Large Number matching the reference */}
        <div>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-mono drop-shadow-md">
            {formatCurrency(valuation)}
          </div>
          <p className="mt-1 text-xs text-white/80 font-medium">
            Aggregated valuation across all active warehouse locations and staging docks
          </p>
        </div>

        {/* Sub-metrics bar */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
          <div>
            <div className="text-[11px] font-mono text-white/70 uppercase">Catalog SKUs</div>
            <div className="text-base sm:text-lg font-bold text-white font-mono">
              {formatNumber(totalSkus)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-white/70 uppercase flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-white/70" /> Turnover
            </div>
            <div className="text-base sm:text-lg font-bold text-white font-mono">
              {turnoverRate}x / yr
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-white/70 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-white/70" /> Fill Rate
            </div>
            <div className="text-base sm:text-lg font-bold text-white font-mono">
              {fillRate}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
