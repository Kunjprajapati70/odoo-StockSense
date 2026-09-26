import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { formatCurrency, formatCompactNumber } from '@/utils/formatters'
import { mockValuationTrend } from '@/mock/mockData'
import { TrendingUp } from 'lucide-react'

export const ValuationChart: React.FC = () => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Inventory Valuation Over Time</CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Historical portfolio asset value across all active warehouses
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-mono font-semibold">
          <TrendingUp className="w-3.5 h-3.5" /> +28.1% YTD
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[260px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockValuationTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="valuationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff6a00" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ff6a00" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              fontFamily="JetBrains Mono"
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${formatCompactNumber(v)}`}
              fontFamily="JetBrains Mono"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f1524',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
              }}
              formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Valuation']}
              labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="valuation"
              stroke="#ff6a00"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#valuationGradient)"
              activeDot={{ r: 6, fill: '#ff6a00', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
