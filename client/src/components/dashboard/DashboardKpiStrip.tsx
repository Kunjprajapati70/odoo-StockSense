import React from 'react'
import {
  Boxes,
  AlertTriangle,
  XCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/formatters'

interface KpiCardProps {
  title: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  iconBg: string
  change?: number
  changeSuffix?: string
  accent?: 'orange' | 'green' | 'red' | 'amber' | 'sky' | 'purple'
  onClick?: () => void
}

const accentMap = {
  orange: { border: 'hover:border-[#ff6a00]/40', glow: 'hover:shadow-[0_0_24px_-4px_rgba(255,106,0,0.25)]' },
  green:  { border: 'hover:border-emerald-500/40', glow: 'hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.20)]' },
  red:    { border: 'hover:border-rose-500/40', glow: 'hover:shadow-[0_0_24px_-4px_rgba(239,68,68,0.20)]' },
  amber:  { border: 'hover:border-amber-500/40', glow: 'hover:shadow-[0_0_24px_-4px_rgba(245,158,11,0.20)]' },
  sky:    { border: 'hover:border-sky-500/40', glow: 'hover:shadow-[0_0_24px_-4px_rgba(56,189,248,0.20)]' },
  purple: { border: 'hover:border-purple-500/40', glow: 'hover:shadow-[0_0_24px_-4px_rgba(168,85,247,0.20)]' },
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  icon,
  iconBg,
  change,
  changeSuffix = '% vs last week',
  accent = 'orange',
  onClick,
}) => {
  const positive = change !== undefined && change >= 0
  const theme = accentMap[accent]

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-3 p-5 rounded-2xl text-left',
        'bg-[#0d1119] border border-white/[0.07]',
        'transition-all duration-200',
        theme.border,
        theme.glow,
        onClick && 'cursor-pointer hover:-translate-y-0.5',
        !onClick && 'cursor-default',
      )}
    >
      {/* Top row: icon + change pill */}
      <div className="flex items-start justify-between">
        {/* Icon box */}
        <div className={cn('p-2.5 rounded-xl border', iconBg)}>
          {icon}
        </div>

        {/* Change indicator */}
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border',
              positive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            )}
          >
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {positive ? '+' : ''}{change}%
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <div className="text-[28px] sm:text-[32px] font-extrabold text-white font-mono tracking-tight leading-none">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        {unit && (
          <div className="mt-0.5 text-[11px] font-mono text-slate-500 uppercase tracking-wider">{unit}</div>
        )}
      </div>

      {/* Label */}
      <div className="text-[12px] font-semibold text-slate-400 group-hover:text-slate-300 transition-colors leading-tight">
        {title}
      </div>

      {/* Change suffix */}
      {change !== undefined && (
        <div className={cn('text-[10px] font-mono', positive ? 'text-emerald-600' : 'text-rose-600')}>
          {positive ? '+' : ''}{change}% {changeSuffix}
        </div>
      )}

      {/* Bottom accent line */}
      <div className={cn(
        'absolute bottom-0 left-4 right-4 h-[2px] rounded-t-full opacity-0 group-hover:opacity-100 transition-opacity duration-200',
        accent === 'orange' && 'bg-gradient-to-r from-transparent via-[#ff6a00] to-transparent',
        accent === 'green'  && 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent',
        accent === 'red'    && 'bg-gradient-to-r from-transparent via-rose-500 to-transparent',
        accent === 'amber'  && 'bg-gradient-to-r from-transparent via-amber-500 to-transparent',
        accent === 'sky'    && 'bg-gradient-to-r from-transparent via-sky-500 to-transparent',
        accent === 'purple' && 'bg-gradient-to-r from-transparent via-purple-500 to-transparent',
      )} />
    </button>
  )
}

// ─── KPI Grid ──────────────────────────────────────────────────────────────────

interface DashboardKpiStripProps {
  kpis: {
    totalSkuCount: number
    lowStockCount: number
    outOfStockCount: number
    pendingReceipts: number
    pendingDeliveries: number
    activeTransfers: number
  }
  onNavigate: (path: string) => void
}

export const DashboardKpiStrip: React.FC<DashboardKpiStripProps> = ({ kpis, onNavigate }) => {
  const cards: KpiCardProps[] = [
    {
      title: 'Total SKUs in Catalog',
      value: kpis.totalSkuCount,
      unit: 'products',
      icon: <Boxes className="w-5 h-5 text-[#ff8c33]" />,
      iconBg: 'bg-[#ff6a00]/10 border-[#ff6a00]/20',
      change: 8.4,
      accent: 'orange',
      onClick: () => onNavigate('/products'),
    },
    {
      title: 'Low Stock Alerts',
      value: kpis.lowStockCount,
      unit: 'items',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      change: -5.2,
      accent: 'amber',
      onClick: () => onNavigate('/products'),
    },
    {
      title: 'Out of Stock',
      value: kpis.outOfStockCount,
      unit: 'items',
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
      iconBg: 'bg-rose-500/10 border-rose-500/20',
      change: -12.0,
      accent: 'red',
      onClick: () => onNavigate('/products'),
    },
    {
      title: 'Pending Receipts',
      value: kpis.pendingReceipts,
      unit: 'shipments',
      icon: <ArrowDownToLine className="w-5 h-5 text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      change: 24.8,
      accent: 'green',
      onClick: () => onNavigate('/receipts'),
    },
    {
      title: 'Pending Deliveries',
      value: kpis.pendingDeliveries,
      unit: 'orders',
      icon: <ArrowUpFromLine className="w-5 h-5 text-sky-400" />,
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      change: 18.4,
      accent: 'sky',
      onClick: () => onNavigate('/deliveries'),
    },
    {
      title: 'Scheduled Transfers',
      value: kpis.activeTransfers,
      unit: 'in transit',
      icon: <ArrowLeftRight className="w-5 h-5 text-purple-400" />,
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      change: 6.7,
      accent: 'purple',
      onClick: () => onNavigate('/transfers'),
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} />
      ))}
    </div>
  )
}
