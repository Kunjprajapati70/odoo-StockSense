import React from 'react'
import { Card } from '@/components/ui/Card'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SparklineCardProps {
  title: string
  subtitle?: string
  value: string | number
  unitLabel?: string
  changePercent: number
  trend: 'up' | 'down'
  data: { value: number }[]
  color: 'green' | 'red' | 'orange' | 'blue'
  icon?: React.ReactNode
  onClick?: () => void
}

export const SparklineCard: React.FC<SparklineCardProps> = ({
  title,
  subtitle,
  value,
  unitLabel,
  changePercent,
  trend,
  data,
  color,
  icon,
  onClick,
}) => {
  const colorMap = {
    green: {
      stroke: '#10b981',
      fill: 'rgba(16, 185, 129, 0.2)',
      text: 'text-emerald-400',
      badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
    },
    red: {
      stroke: '#ef4444',
      fill: 'rgba(239, 68, 68, 0.2)',
      text: 'text-rose-400',
      badge: 'bg-rose-950/60 text-rose-400 border-rose-800/40',
    },
    orange: {
      stroke: '#ff6a00',
      fill: 'rgba(255, 106, 0, 0.2)',
      text: 'text-[#ff8c33]',
      badge: 'bg-[#ff6a00]/15 text-[#ff8c33] border-[#ff6a00]/30',
    },
    blue: {
      stroke: '#38bdf8',
      fill: 'rgba(56, 189, 248, 0.2)',
      text: 'text-sky-400',
      badge: 'bg-sky-950/60 text-sky-400 border-sky-800/40',
    },
  }

  const selectedTheme = colorMap[color]

  return (
    <Card
      isInteractive={!!onClick}
      onClick={onClick}
      className="p-5 flex flex-col justify-between group"
    >
      <div>
        {/* Top header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 group-hover:border-white/20 transition-colors">
                {icon}
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-white tracking-wide truncate">{title}</div>
              {subtitle && <div className="text-[11px] text-slate-400 truncate">{subtitle}</div>}
            </div>
          </div>
          {onClick && (
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
          )}
        </div>

        {/* Big Value Row */}
        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {value}
            </span>
            {unitLabel && <span className="text-xs font-mono text-slate-400">{unitLabel}</span>}
          </div>

          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border tracking-wider',
              selectedTheme.badge,
            )}
          >
            {trend === 'up' ? '+' : ''}
            {changePercent}%
          </span>
        </div>
      </div>

      {/* Mini Integrated Sparkline Chart */}
      <div className="h-14 mt-3 w-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${color}-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={selectedTheme.stroke} stopOpacity={0.4} />
                <stop offset="95%" stopColor={selectedTheme.stroke} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={selectedTheme.stroke}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#grad-${color}-${title})`}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
