import React, { useState, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, Column } from '@/components/common/DataTable'
import { SearchInput } from '@/components/common/SearchInput'
import { OperationStatusBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { Tabs } from '@/components/ui/Tabs'
import { Adjustment } from '@/types/inventory'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters'
import { Plus, SlidersHorizontal, CheckCircle2, Warehouse, User, AlertCircle } from 'lucide-react'
import { NewAdjustmentModal } from '@/components/forms/NewAdjustmentModal'

export const AdjustmentsPage: React.FC = () => {
  const { adjustments, applyAdjustment } = useInventory()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [confirmAdjId, setConfirmAdjId] = useState<string | null>(null)
  const [isNewAdjOpen, setIsNewAdjOpen] = useState(false)

  const tabs = [
    { id: 'ALL', label: 'All Adjustments', count: adjustments.length },
    {
      id: 'draft',
      label: 'Draft / Pending',
      count: adjustments.filter((a) => a.status === 'draft').length,
    },
    {
      id: 'applied',
      label: 'Applied to Ledger',
      count: adjustments.filter((a) => a.status === 'applied').length,
    },
  ]

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((a) => {
      const matchSearch =
        a.reference.toLowerCase().includes(search.toLowerCase()) ||
        a.productName.toLowerCase().includes(search.toLowerCase()) ||
        a.productSku.toLowerCase().includes(search.toLowerCase()) ||
        a.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
        a.reason.toLowerCase().includes(search.toLowerCase())

      const matchTab = activeTab === 'ALL' || a.status === activeTab

      return matchSearch && matchTab
    })
  }, [adjustments, search, activeTab])

  const handleConfirmApply = () => {
    if (!confirmAdjId) return
    const target = adjustments.find((a) => a.id === confirmAdjId)
    applyAdjustment(confirmAdjId)

    toast({
      title: 'Stock Adjustment Applied',
      description: `Adjustment ${target?.reference} applied. System stock corrected by ${
        target && target.differenceQuantity > 0 ? `+${target.differenceQuantity}` : target?.differenceQuantity
      } units and recorded in Stock Ledger.`,
      type: 'success',
    })

    setConfirmAdjId(null)
  }

  const getReasonBadge = (reason: Adjustment['reason']) => {
    switch (reason) {
      case 'damage':
        return <Badge variant="red">Damage</Badge>
      case 'spoilage':
        return <Badge variant="red">Spoilage</Badge>
      case 'theft_loss':
        return <Badge variant="red">Theft / Loss</Badge>
      case 'found_stock':
        return <Badge variant="green">Found Stock</Badge>
      case 'calibration':
        return <Badge variant="blue">Calibration</Badge>
      case 'cycle_count':
      default:
        return <Badge variant="amber">Cycle Count</Badge>
    }
  }

  const columns: Column<Adjustment>[] = [
    {
      key: 'reference',
      header: 'Reference',
      sortable: true,
      render: (a) => (
        <span className="font-mono font-bold text-white group-hover:text-[#ff6a00] transition-colors">
          {a.reference}
        </span>
      ),
    },
    {
      key: 'productName',
      header: 'Product & SKU',
      sortable: true,
      render: (a) => (
        <div className="max-w-xs">
          <div className="font-semibold text-white truncate">{a.productName}</div>
          <div className="text-[11px] font-mono text-[#ff8c33] truncate">{a.productSku}</div>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse & Bay',
      sortable: true,
      render: (a) => (
        <div>
          <div className="font-medium text-slate-200 flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
            <span>{a.warehouseName}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            Bin: {a.locationCode}
          </div>
        </div>
      ),
    },
    {
      key: 'systemQuantity',
      header: 'System Recorded',
      sortable: true,
      align: 'right',
      render: (a) => (
        <span className="font-mono text-slate-300">{formatNumber(a.systemQuantity)}</span>
      ),
    },
    {
      key: 'countedQuantity',
      header: 'Counted Physical',
      sortable: true,
      align: 'right',
      render: (a) => (
        <span className="font-mono font-bold text-white">{formatNumber(a.countedQuantity)}</span>
      ),
    },
    {
      key: 'differenceQuantity',
      header: 'Variance',
      sortable: true,
      align: 'right',
      render: (a) => (
        <span
          className={`font-mono font-bold text-sm ${
            a.differenceQuantity > 0
              ? 'text-emerald-400'
              : a.differenceQuantity < 0
              ? 'text-rose-400'
              : 'text-slate-400'
          }`}
        >
          {a.differenceQuantity > 0 ? `+${a.differenceQuantity}` : a.differenceQuantity}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (a) => getReasonBadge(a.reason),
    },
    {
      key: 'totalImpactValue',
      header: 'Impact Value',
      sortable: true,
      align: 'right',
      render: (a) => (
        <span
          className={`font-mono font-semibold ${
            a.totalImpactValue > 0
              ? 'text-emerald-400'
              : a.totalImpactValue < 0
              ? 'text-rose-400'
              : 'text-slate-300'
          }`}
        >
          {formatCurrency(a.totalImpactValue)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <OperationStatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (a) => {
        if (a.status === 'applied') {
          return (
            <span className="text-xs font-mono text-emerald-400 flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
            </span>
          )
        }
        return (
          <Button
            variant="primary"
            size="xs"
            onClick={(e) => {
              e.stopPropagation()
              setConfirmAdjId(a.id)
            }}
          >
            Apply & Adjust
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Physical Inventory Adjustments"
        subtitle="Cycle counts, physical audit reconciliation, and accounting variance alignment."
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsNewAdjOpen(true)}>
            <Plus className="w-4 h-4" /> New Cycle Count
          </Button>
        }
      />

      {/* Filter and Tab Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e131f] border border-white/[0.08]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by adjustment ref, SKU, bay, or reason..."
        />
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />
      </div>

      {/* Adjustments Data Table */}
      <DataTable
        columns={columns}
        data={filteredAdjustments}
        keyExtractor={(a) => a.id}
        emptyTitle="No inventory adjustments found"
        emptyDescription="There are no cycle count records matching the selected criteria."
        emptyActionLabel="Record Cycle Count"
        onEmptyAction={() => setIsNewAdjOpen(true)}
      />

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!confirmAdjId}
        onClose={() => setConfirmAdjId(null)}
        onConfirm={handleConfirmApply}
        title="Apply Inventory Adjustment"
        description="Applying this adjustment will permanently correct the system inventory balances to match the physical count and log a ledger transaction in the Move History."
        confirmText="Confirm & Reconcile"
        variant="primary"
      />

      <NewAdjustmentModal isOpen={isNewAdjOpen} onClose={() => setIsNewAdjOpen(false)} />
    </div>
  )
}
