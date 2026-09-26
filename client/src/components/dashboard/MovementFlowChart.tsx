import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { mockFlowTrend } from '@/mock/mockData'

export const MovementFlowChart: React.FC = () => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Inbound vs Outbound Flow</CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Weekly throughput comparing supplier intake vs customer fulfillment orders
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Inbound</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="text-slate-300">Outbound</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[260px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockFlowTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="day"
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
              formatter={(val: any, name: any) => [
                `${val} orders`,
                name === 'inbound' ? 'Inbound (Receipts)' : 'Outbound (Deliveries)',
              ]}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="inbound" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="outbound" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
