import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { useInventory } from '@/context/InventoryContext'
import { MoveTypeBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, ArrowDownLeft, SlidersHorizontal, ArrowLeftRight } from 'lucide-react'

export const RecentOperationsTable: React.FC = () => {
  const { stockMoves } = useInventory()
  const [activeTab, setActiveTab] = useState('ALL')

  const tabs = [
    { id: 'ALL', label: 'All Operations', count: stockMoves.length },
    {
      id: 'RECEIPT',
      label: 'Receipts (IN)',
      count: stockMoves.filter((m) => m.type === 'RECEIPT').length,
    },
    {
      id: 'DELIVERY',
      label: 'Deliveries (OUT)',
      count: stockMoves.filter((m) => m.type === 'DELIVERY').length,
    },
    {
      id: 'INTERNAL_TRANSFER',
      label: 'Transfers',
      count: stockMoves.filter((m) => m.type === 'INTERNAL_TRANSFER').length,
    },
    {
      id: 'INVENTORY_ADJUSTMENT',
      label: 'Adjustments',
      count: stockMoves.filter((m) => m.type === 'INVENTORY_ADJUSTMENT').length,
    },
  ]

  const filteredMoves =
    activeTab === 'ALL' ? stockMoves : stockMoves.filter((m) => m.type === activeTab)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RECEIPT':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
      case 'DELIVERY':
        return <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
      case 'INTERNAL_TRANSFER':
        return <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
      case 'INVENTORY_ADJUSTMENT':
      default:
        return <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff6a00]" />
    }
  }

  return (
    <Card className="shadow-2xl">
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Stock Ledger / Live Movement Feed</CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of physical and recorded inventory changes
          </p>
        </div>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0a0e17]/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-5 font-semibold">Reference</th>
                <th className="py-3 px-4 font-semibold">Operation Type</th>
                <th className="py-3 px-4 font-semibold">Product & SKU</th>
                <th className="py-3 px-4 font-semibold">From → To</th>
                <th className="py-3 px-4 font-semibold text-right">Quantity</th>
                <th className="py-3 px-4 font-semibold text-right">Value Impact</th>
                <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
                <th className="py-3 px-5 font-semibold text-right">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredMoves.slice(0, 8).map((move) => (
                <tr
                  key={move.id}
                  className="hover:bg-white/[0.02] transition-colors group text-xs sm:text-sm"
                >
                  <td className="py-3 px-5 font-mono font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-white/[0.05] border border-white/10">
                        {getTypeIcon(move.type)}
                      </div>
                      <span className="group-hover:text-[#ff6a00] transition-colors">
                        {move.reference}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <MoveTypeBadge type={move.type} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap max-w-xs">
                    <div className="font-semibold text-white truncate">{move.productName}</div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">
                      {move.productSku}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-300 font-mono">
                    <span className="text-slate-400">{move.fromLocation}</span>
                    <span className="mx-1 text-[#ff6a00]">→</span>
                    <span className="text-slate-200 font-semibold">{move.toLocation}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold">
                    <span
                      className={
                        move.quantityChange > 0
                          ? 'text-emerald-400'
                          : move.quantityChange < 0
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }
                    >
                      {move.quantityChange > 0 ? `+${move.quantityChange}` : move.quantityChange}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-slate-200">
                    {formatCurrency(Math.abs(move.totalImpact))}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-xs text-slate-400">
                    {formatDateTime(move.timestamp)}
                  </td>
                  <td className="py-3 px-5 whitespace-nowrap text-right text-xs text-slate-300 font-medium">
                    {move.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-white/[0.06] bg-[#0a0e17]/50 flex items-center justify-between text-xs text-slate-400">
          <span>Showing latest operational movements across inventory nodes</span>
          <Link
            to="/move-history"
            className="text-[#ff6a00] hover:underline flex items-center gap-1 font-semibold"
          >
            Open Complete Stock Ledger <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
