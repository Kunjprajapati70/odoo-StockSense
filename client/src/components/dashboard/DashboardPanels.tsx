import React from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  Package,
  ArrowRight,
} from 'lucide-react'
import { useInventory } from '@/context/InventoryContext'
import { OperationStatusBadge } from '@/components/ui/Badge'
import { formatDate } from '@/utils/formatters'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

// ─── Activity Feed (Recent Movements) ─────────────────────────────────────────

export const RecentMovementsFeed: React.FC = () => {
  const { stockMoves } = useInventory()
  const recent = stockMoves.slice(0, 6)

  const typeConfig: Record<string, {
    icon: React.ReactNode
    color: string
    bg: string
    label: string
  }> = {
    RECEIPT: {
      icon: <ArrowDownToLine className="w-3.5 h-3.5" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      label: 'Receipt',
    },
    DELIVERY: {
      icon: <ArrowUpFromLine className="w-3.5 h-3.5" />,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      label: 'Delivery',
    },
    INTERNAL_TRANSFER: {
      icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      label: 'Transfer',
    },
    INVENTORY_ADJUSTMENT: {
      icon: <SlidersHorizontal className="w-3.5 h-3.5" />,
      color: 'text-[#ff8c33]',
      bg: 'bg-[#ff6a00]/10 border-[#ff6a00]/20',
      label: 'Adjustment',
    },
  }

  return (
    <div className="bg-[#0d1119] border border-white/[0.07] rounded-2xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-[#ff6a00]" />
            <h3 className="text-[13px] font-bold text-white">Recent Movements</h3>
          </div>
          <p className="text-[11px] text-slate-500">Latest stock activity across all locations</p>
        </div>
        <Link
          to="/move-history"
          className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#ff6a00] hover:text-[#ff8c33] transition-colors"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Feed */}
      <div className="flex-1 divide-y divide-white/[0.04]">
        {recent.map((move) => {
          const cfg = typeConfig[move.type] ?? typeConfig['RECEIPT']
          const isPositive = move.quantityChange > 0

          return (
            <div
              key={move.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group"
            >
              {/* Icon */}
              <div className={cn('p-2 rounded-xl border shrink-0', cfg.bg, cfg.color)}>
                {cfg.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-white truncate group-hover:text-slate-100">
                    {move.productName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{move.reference}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                  {move.fromLocation} <span className="text-[#ff6a00]">→</span> {move.toLocation}
                </div>
              </div>

              {/* Quantity */}
              <div className="text-right shrink-0">
                <div className={cn('text-[13px] font-mono font-extrabold', isPositive ? 'text-emerald-400' : 'text-rose-400')}>
                  {isPositive ? '+' : ''}{move.quantityChange}
                </div>
                <div className="text-[10px] text-slate-600 font-mono">
                  {formatDate(move.timestamp)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Pending Operations (tabbed table) ────────────────────────────────────────

type OpTab = 'receipts' | 'deliveries' | 'transfers'

export const PendingOperationsPanel: React.FC = () => {
  const { filteredReceipts, filteredDeliveries, filteredTransfers } = useInventory()
  const [activeTab, setActiveTab] = React.useState<OpTab>('receipts')

  const pendingReceipts   = filteredReceipts.filter(r => r.status !== 'done' && r.status !== 'cancelled')
  const pendingDeliveries = filteredDeliveries.filter(d => d.status !== 'done' && d.status !== 'cancelled')
  const pendingTransfers  = filteredTransfers.filter(t => t.status !== 'completed' && t.status !== 'cancelled')

  const tabs: { id: OpTab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'receipts',   label: 'Receipts',   count: pendingReceipts.length,   icon: <ArrowDownToLine className="w-3.5 h-3.5" /> },
    { id: 'deliveries', label: 'Deliveries', count: pendingDeliveries.length, icon: <ArrowUpFromLine className="w-3.5 h-3.5" /> },
    { id: 'transfers',  label: 'Transfers',  count: pendingTransfers.length,  icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="bg-[#0d1119] border border-white/[0.07] rounded-2xl">
      {/* Header */}
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-[13px] font-bold text-white">Pending Operations</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Operations awaiting action or validation</p>
          </div>

          {/* Tab strip */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150',
                  activeTab === tab.id
                    ? 'bg-[#ff6a00] text-white shadow-lg shadow-[#ff6a00]/25'
                    : 'text-slate-400 hover:text-slate-200',
                )}
              >
                {tab.icon}
                {tab.label}
                <span className={cn(
                  'px-1 py-0.5 rounded font-mono text-[9px]',
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-slate-500',
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {activeTab === 'receipts' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-white/[0.06] bg-white/[0.02]">
                {['Reference', 'Supplier', 'Warehouse', 'Date', 'Status'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {pendingReceipts.slice(0, 6).map(r => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-[12px] text-white">{r.reference}</td>
                  <td className="px-5 py-3 text-[12px] text-slate-300 truncate max-w-[160px]">{r.supplierName}</td>
                  <td className="px-5 py-3 text-[11px] font-mono text-slate-400 truncate max-w-[100px]">{r.destinationWarehouseName}</td>
                  <td className="px-5 py-3 text-[11px] font-mono text-slate-500">{formatDate(r.scheduledDate)}</td>
                  <td className="px-5 py-3"><OperationStatusBadge status={r.status} /></td>
                </tr>
              ))}
              {pendingReceipts.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[12px] text-slate-500">No pending receipts</td></tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'deliveries' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-white/[0.06] bg-white/[0.02]">
                {['Reference', 'Customer', 'Warehouse', 'Scheduled', 'Status'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {pendingDeliveries.slice(0, 6).map(d => (
                <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-[12px] text-white">{d.reference}</td>
                  <td className="px-5 py-3 text-[12px] text-slate-300 truncate max-w-[160px]">{d.customerName}</td>
                  <td className="px-5 py-3 text-[11px] font-mono text-slate-400 truncate max-w-[100px]">{d.sourceWarehouseName}</td>
                  <td className="px-5 py-3 text-[11px] font-mono text-slate-500">{formatDate(d.scheduledDate)}</td>
                  <td className="px-5 py-3"><OperationStatusBadge status={d.status} /></td>
                </tr>
              ))}
              {pendingDeliveries.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[12px] text-slate-500">No pending deliveries</td></tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'transfers' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-white/[0.06] bg-white/[0.02]">
                {['Reference', 'From', 'To', 'Scheduled', 'Status'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {pendingTransfers.slice(0, 6).map(t => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-[12px] text-white">{t.reference}</td>
                  <td className="px-5 py-3 text-[11px] font-mono text-slate-400 truncate max-w-[80px]">{t.sourceWarehouseName}</td>
                  <td className="px-5 py-3 text-[11px] font-mono text-slate-400 truncate max-w-[80px]">{t.destWarehouseName}</td>
                  <td className="px-5 py-3 text-[11px] font-mono text-slate-500">{formatDate(t.scheduledDate)}</td>
                  <td className="px-5 py-3"><OperationStatusBadge status={t.status} /></td>
                </tr>
              ))}
              {pendingTransfers.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[12px] text-slate-500">No pending transfers</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          Showing {activeTab === 'receipts' ? pendingReceipts.length : activeTab === 'deliveries' ? pendingDeliveries.length : pendingTransfers.length} pending {activeTab}
        </span>
        <Link
          to={`/${activeTab}`}
          className="text-[11px] font-mono font-semibold text-[#ff6a00] hover:text-[#ff8c33] transition-colors flex items-center gap-1"
        >
          Manage {activeTab} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
