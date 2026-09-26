import React, { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { mockMovementChart } from '@/mock/mockData'
import { TrendingDown, TrendingUp, Activity } from 'lucide-react'

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const inbound = payload.find((p: any) => p.dataKey === 'inbound')
  const outbound = payload.find((p: any) => p.dataKey === 'outbound')
  const net = (inbound?.value ?? 0) - (outbound?.value ?? 0)

  return (
    <div className="bg-[#0e1422] border border-white/10 rounded-xl px-4 py-3 shadow-2xl shadow-black/60 min-w-[180px]">
      <p className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[12px] text-slate-300">Inbound</span>
          </div>
          <span className="text-[12px] font-mono font-bold text-emerald-400">+{inbound?.value} units</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-[12px] text-slate-300">Outbound</span>
          </div>
          <span className="text-[12px] font-mono font-bold text-rose-400">-{outbound?.value} units</span>
        </div>
        <div className="pt-1.5 mt-1.5 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Net</span>
          <span className={`text-[12px] font-mono font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {net >= 0 ? '+' : ''}{net}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Movement Chart ────────────────────────────────────────────────────────────

export const InventoryMovementChart: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '14d' | '30d'>('30d')

  const periodMap = { '7d': 7, '14d': 14, '30d': 26 }
  const visibleData = mockMovementChart.slice(-periodMap[period])

  const totalIn = visibleData.reduce((s, d) => s + d.inbound, 0)
  const totalOut = visibleData.reduce((s, d) => s + d.outbound, 0)

  return (
    <div className="bg-[#0d1119] border border-white/[0.07] rounded-2xl flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-[#ff6a00]" />
              <h3 className="text-[13px] font-bold text-white tracking-tight">Inventory Movement</h3>
            </div>
            <p className="text-[11px] text-slate-500">Inbound receipts vs outbound deliveries over time</p>
          </div>

          {/* Period toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07]">
            {(['7d', '14d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all duration-150 ${
                  period === p
                    ? 'bg-[#ff6a00] text-white shadow-lg shadow-[#ff6a00]/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-mono font-bold text-emerald-400">{totalIn.toLocaleString()} IN</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] font-mono font-bold text-rose-400">{totalOut.toLocaleString()} OUT</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${totalIn - totalOut >= 0 ? 'bg-sky-500/10 border-sky-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
            <span className="text-[11px] font-mono font-bold text-slate-300">
              Net: {totalIn - totalOut >= 0 ? '+' : ''}{(totalIn - totalOut).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.04)" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#334155"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              fontFamily="JetBrains Mono"
              interval={period === '30d' ? 4 : period === '14d' ? 1 : 0}
              tick={{ fill: '#475569' }}
            />
            <YAxis
              stroke="#334155"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              fontFamily="JetBrains Mono"
              tick={{ fill: '#475569' }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
              formatter={(value) => (
                <span style={{ color: value === 'inbound' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  {value === 'inbound' ? 'Inbound (Receipts)' : 'Outbound (Deliveries)'}
                </span>
              )}
            />

            <Area
              type="monotone"
              dataKey="inbound"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradIn)"
              activeDot={{ r: 5, fill: '#10b981', stroke: '#0d1119', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="outbound"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#gradOut)"
              activeDot={{ r: 5, fill: '#ef4444', stroke: '#0d1119', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
