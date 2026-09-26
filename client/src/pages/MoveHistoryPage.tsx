import React, { useState, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, Column } from '@/components/common/DataTable'
import { SearchInput } from '@/components/common/SearchInput'
import { MoveTypeBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { StockMove } from '@/types/inventory'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/formatters'
import { Download, ScrollText, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, SlidersHorizontal } from 'lucide-react'

export const MoveHistoryPage: React.FC = () => {
  const { stockMoves } = useInventory()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('ALL')

  const tabs = [
    { id: 'ALL', label: 'All Moves', count: stockMoves.length },
    {
      id: 'RECEIPT',
      label: 'Receipts',
      count: stockMoves.filter((m) => m.type === 'RECEIPT').length,
    },
    {
      id: 'DELIVERY',
      label: 'Deliveries',
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

  const filteredMoves = useMemo(() => {
    return stockMoves.filter((m) => {
      const matchSearch =
        m.reference.toLowerCase().includes(search.toLowerCase()) ||
        m.productName.toLowerCase().includes(search.toLowerCase()) ||
        m.productSku.toLowerCase().includes(search.toLowerCase()) ||
        m.fromLocation.toLowerCase().includes(search.toLowerCase()) ||
        m.toLocation.toLowerCase().includes(search.toLowerCase()) ||
        m.user.toLowerCase().includes(search.toLowerCase())

      const matchTab = activeTab === 'ALL' || m.type === activeTab

      return matchSearch && matchTab
    })
  }, [stockMoves, search, activeTab])

  const totalMovesCount = filteredMoves.length
  const totalInboundVolume = filteredMoves
    .filter((m) => m.quantityChange > 0)
    .reduce((acc, curr) => acc + curr.quantityChange, 0)
  const totalOutboundVolume = Math.abs(
    filteredMoves
      .filter((m) => m.quantityChange < 0)
      .reduce((acc, curr) => acc + curr.quantityChange, 0),
  )

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Reference',
      'Type',
      'SKU',
      'Product',
      'From Location',
      'To Location',
      'Quantity Change',
      'Unit Cost',
      'Total Impact',
      'User',
    ]

    const rows = filteredMoves.map((m) => [
      m.timestamp,
      m.reference,
      m.type,
      m.productSku,
      `"${m.productName}"`,
      m.fromLocation,
      m.toLocation,
      m.quantityChange,
      m.unitCost,
      m.totalImpact,
      `"${m.user}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `stocksense_ledger_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Ledger Exported',
      description: 'Stock ledger records downloaded as CSV format.',
      type: 'success',
    })
  }

  const columns: Column<StockMove>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (m) => (
        <span className="font-mono text-xs text-slate-300">{formatDateTime(m.timestamp)}</span>
      ),
    },
    {
      key: 'reference',
      header: 'Reference Doc',
      sortable: true,
      render: (m) => (
        <span className="font-mono font-bold text-white group-hover:text-[#ff6a00] transition-colors">
          {m.reference}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Operation',
      render: (m) => <MoveTypeBadge type={m.type} />,
    },
    {
      key: 'productName',
      header: 'Product & SKU',
      sortable: true,
      render: (m) => (
        <div className="max-w-xs">
          <div className="font-semibold text-white truncate">{m.productName}</div>
          <div className="text-[11px] font-mono text-[#ff8c33] truncate">{m.productSku}</div>
        </div>
      ),
    },
    {
      key: 'fromLocation',
      header: 'Origin → Destination',
      render: (m) => (
        <div className="text-xs font-mono">
          <span className="text-slate-400">{m.fromLocation}</span>
          <span className="mx-1.5 text-[#ff6a00]">→</span>
          <span className="text-slate-100 font-bold">{m.toLocation}</span>
        </div>
      ),
    },
    {
      key: 'quantityChange',
      header: 'Delta Qty',
      sortable: true,
      align: 'right',
      render: (m) => (
        <span
          className={`font-mono font-bold text-sm ${
            m.quantityChange > 0
              ? 'text-emerald-400'
              : m.quantityChange < 0
              ? 'text-rose-400'
              : 'text-slate-300'
          }`}
        >
          {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
        </span>
      ),
    },
    {
      key: 'totalImpact',
      header: 'Impact Value',
      sortable: true,
      align: 'right',
      render: (m) => (
        <span className="font-mono font-semibold text-slate-200">
          {formatCurrency(Math.abs(m.totalImpact))}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Responsible User',
      render: (m) => <span className="text-xs text-slate-300 font-medium">{m.user}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Ledger / Move History"
        subtitle="Immutable transaction log of every stock-changing intake, dispatch, relocation, and physical count adjustment."
        actions={
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        }
      />

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-400">Total Move Events</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatNumber(totalMovesCount)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Complete system audit trail</div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-400">Inbound Receipts Vol.</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            +{formatNumber(totalInboundVolume)} units
          </div>
          <div className="text-xs text-emerald-400/80 mt-1 font-mono">Stock increments verified</div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-400">Outbound Delivery Vol.</div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
            -{formatNumber(totalOutboundVolume)} units
          </div>
          <div className="text-xs text-rose-400/80 mt-1 font-mono">Customer dispatch reductions</div>
        </Card>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e131f] border border-white/[0.08]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by ref, SKU, location bin, or auditor..."
        />
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />
      </div>

      {/* Move History Table */}
      <DataTable
        columns={columns}
        data={filteredMoves}
        keyExtractor={(m) => m.id}
        emptyTitle="No stock movements logged"
        emptyDescription="There are no audit ledger transactions recorded for this criteria."
      />
    </div>
  )
}
