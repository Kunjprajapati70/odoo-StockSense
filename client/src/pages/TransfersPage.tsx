import React, { useState, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, Column } from '@/components/common/DataTable'
import { SearchInput } from '@/components/common/SearchInput'
import { OperationStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { Tabs } from '@/components/ui/Tabs'
import { Transfer } from '@/types/inventory'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { formatDate, formatNumber } from '@/utils/formatters'
import { Plus, ArrowLeftRight, CheckCircle2, Warehouse, Calendar, Truck, Package } from 'lucide-react'
import { NewTransferModal } from '@/components/forms/NewTransferModal'

export const TransfersPage: React.FC = () => {
  const { transfers, validateTransfer } = useInventory()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [confirmTransferId, setConfirmTransferId] = useState<string | null>(null)
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false)

  const tabs = [
    { id: 'ALL', label: 'All Transfers', count: transfers.length },
    {
      id: 'in_transit',
      label: 'In Transit',
      count: transfers.filter((t) => t.status === 'in_transit').length,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: transfers.filter((t) => t.status === 'completed').length,
    },
  ]

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchSearch =
        t.reference.toLowerCase().includes(search.toLowerCase()) ||
        t.sourceWarehouseName.toLowerCase().includes(search.toLowerCase()) ||
        t.destWarehouseName.toLowerCase().includes(search.toLowerCase()) ||
        t.sourceLocationCode.toLowerCase().includes(search.toLowerCase()) ||
        t.destLocationCode.toLowerCase().includes(search.toLowerCase())

      const matchTab = activeTab === 'ALL' || t.status === activeTab

      return matchSearch && matchTab
    })
  }, [transfers, search, activeTab])

  const handleConfirmValidation = () => {
    if (!confirmTransferId) return
    const target = transfers.find((t) => t.id === confirmTransferId)
    validateTransfer(confirmTransferId)

    toast({
      title: 'Internal Transfer Completed',
      description: `Assets for ${target?.reference} successfully moved from ${target?.sourceLocationCode} to ${target?.destLocationCode}.`,
      type: 'success',
    })

    setConfirmTransferId(null)
    if (selectedTransfer?.id === confirmTransferId) {
      setSelectedTransfer(null)
    }
  }

  const columns: Column<Transfer>[] = [
    {
      key: 'reference',
      header: 'Reference',
      sortable: true,
      render: (t) => (
        <span className="font-mono font-bold text-white group-hover:text-[#ff6a00] transition-colors">
          {t.reference}
        </span>
      ),
    },
    {
      key: 'sourceLocationCode',
      header: 'Origin Location',
      sortable: true,
      render: (t) => (
        <div>
          <div className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>{t.sourceLocationCode}</span>
          </div>
          <div className="text-[11px] text-slate-400">{t.sourceWarehouseName}</div>
        </div>
      ),
    },
    {
      key: 'destLocationCode',
      header: 'Destination Location',
      sortable: true,
      render: (t) => (
        <div>
          <div className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{t.destLocationCode}</span>
          </div>
          <div className="text-[11px] text-slate-400">{t.destWarehouseName}</div>
        </div>
      ),
    },
    {
      key: 'scheduledDate',
      header: 'Transfer Date',
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatDate(t.scheduledDate)}</span>
        </div>
      ),
    },
    {
      key: 'totalItems',
      header: 'Units Moved',
      sortable: true,
      align: 'right',
      render: (t) => (
        <span className="font-mono font-bold text-white">{formatNumber(t.totalItems)}</span>
      ),
    },
    {
      key: 'driverOrCourier',
      header: 'Transport Mode',
      render: (t) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Truck className="w-3.5 h-3.5 text-slate-500" />
          <span>{t.driverOrCourier || 'Internal Logistics'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <OperationStatusBadge status={t.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (t) => {
        if (t.status === 'completed') {
          return (
            <span className="text-xs font-mono text-emerald-400 flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          )
        }
        return (
          <Button
            variant="primary"
            size="xs"
            onClick={(e) => {
              e.stopPropagation()
              setConfirmTransferId(t.id)
            }}
          >
            Confirm Arrival
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Stock Transfers"
        subtitle="Manage cross-docking and inter-warehouse stock movements across storage zones and locations."
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsNewTransferOpen(true)}>
            <Plus className="w-4 h-4" /> Create Transfer
          </Button>
        }
      />

      {/* Filter and Tab Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e131f] border border-white/[0.08]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by transfer ref, origin, destination, or transport..."
        />
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />
      </div>

      {/* Transfers Data Table */}
      <DataTable
        columns={columns}
        data={filteredTransfers}
        keyExtractor={(t) => t.id}
        onRowClick={(t) => setSelectedTransfer(t)}
        emptyTitle="No transfers found"
        emptyDescription="There are no internal warehouse movements matching the current filters."
        emptyActionLabel="Create Stock Transfer"
        onEmptyAction={() => setIsNewTransferOpen(true)}
      />

      {/* Transfer Details Modal */}
      {selectedTransfer && (
        <Modal
          isOpen={!!selectedTransfer}
          onClose={() => setSelectedTransfer(null)}
          title={`Internal Transfer ${selectedTransfer.reference}`}
          description={`From ${selectedTransfer.sourceWarehouseName} (${selectedTransfer.sourceLocationCode}) to ${selectedTransfer.destWarehouseName} (${selectedTransfer.destLocationCode})`}
          size="lg"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono">Status</span>
                <div className="mt-1">
                  <OperationStatusBadge status={selectedTransfer.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono">Assigned Logistics Team</span>
                <div className="text-sm font-semibold text-white mt-0.5">
                  {selectedTransfer.driverOrCourier || 'Inter-facility Transport'}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#ff6a00]" /> Product Units in Transit
              </h4>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0a0e17] text-slate-400 font-mono uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th className="p-3">SKU & Item</th>
                      <th className="p-3 text-right">Transfer Quantity</th>
                      <th className="p-3 text-right">Lot Tracking</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {selectedTransfer.lines.map((l) => (
                      <tr key={l.id} className="text-slate-200">
                        <td className="p-3">
                          <div className="font-semibold text-white">{l.productName}</div>
                          <div className="text-[11px] font-mono text-[#ff8c33]">{l.productSku}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white text-sm">
                          {l.quantity}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {l.lotNumber || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <Button variant="ghost" size="sm" onClick={() => setSelectedTransfer(null)}>
                Close
              </Button>
              {selectedTransfer.status !== 'completed' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setConfirmTransferId(selectedTransfer.id)}
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm Transfer Arrival
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!confirmTransferId}
        onClose={() => setConfirmTransferId(null)}
        onConfirm={handleConfirmValidation}
        title="Confirm Transfer Receipt"
        description="Confirming this transfer moves the inventory from the origin staging location to the target destination bay, updates location balances, and records the transfer in the Stock Ledger."
        confirmText="Confirm Arrival"
        variant="primary"
      />

      <NewTransferModal isOpen={isNewTransferOpen} onClose={() => setIsNewTransferOpen(false)} />
    </div>
  )
}
