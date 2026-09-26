import React, { useState, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, Column } from '@/components/common/DataTable'
import { SearchInput } from '@/components/common/SearchInput'
import { OperationStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { Tabs } from '@/components/ui/Tabs'
import { Receipt } from '@/types/inventory'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters'
import { Plus, ArrowDownToLine, CheckCircle2, Warehouse, Calendar, Package } from 'lucide-react'
import { NewReceiptModal } from '@/components/forms/NewReceiptModal'

export const ReceiptsPage: React.FC = () => {
  const { receipts, validateReceipt } = useInventory()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [confirmReceiptId, setConfirmReceiptId] = useState<string | null>(null)
  const [isNewReceiptOpen, setIsNewReceiptOpen] = useState(false)

  const tabs = [
    { id: 'ALL', label: 'All Receipts', count: receipts.length },
    {
      id: 'waiting',
      label: 'Waiting Receipt',
      count: receipts.filter((r) => r.status === 'waiting').length,
    },
    {
      id: 'done',
      label: 'Completed / Received',
      count: receipts.filter((r) => r.status === 'done').length,
    },
  ]

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchSearch =
        r.reference.toLowerCase().includes(search.toLowerCase()) ||
        r.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        r.destinationWarehouseName.toLowerCase().includes(search.toLowerCase())

      const matchTab = activeTab === 'ALL' || r.status === activeTab

      return matchSearch && matchTab
    })
  }, [receipts, search, activeTab])

  const handleConfirmValidation = () => {
    if (!confirmReceiptId) return
    const target = receipts.find((r) => r.id === confirmReceiptId)
    validateReceipt(confirmReceiptId)

    toast({
      title: 'Inbound Shipment Accepted',
      description: `Stock for ${target?.reference} has been received into ${target?.destinationWarehouseName} and recorded in the Stock Ledger.`,
      type: 'success',
    })

    setConfirmReceiptId(null)
    if (selectedReceipt?.id === confirmReceiptId) {
      setSelectedReceipt(null)
    }
  }

  const columns: Column<Receipt>[] = [
    {
      key: 'reference',
      header: 'Reference',
      sortable: true,
      render: (r) => (
        <span className="font-mono font-bold text-white group-hover:text-[#ff6a00] transition-colors">
          {r.reference}
        </span>
      ),
    },
    {
      key: 'supplierName',
      header: 'Supplier / Vendor',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-100">{r.supplierName}</div>
          <div className="text-[11px] text-slate-400 font-mono">Order Date: {formatDate(r.orderDate)}</div>
        </div>
      ),
    },
    {
      key: 'destinationWarehouseName',
      header: 'Destination Node',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-medium text-slate-200 flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
            <span>{r.destinationWarehouseName}</span>
          </div>
          <div className="text-[11px] font-mono text-[#ff8c33] mt-0.5">
            Dock: {r.destinationLocationCode}
          </div>
        </div>
      ),
    },
    {
      key: 'scheduledDate',
      header: 'Scheduled Date',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatDate(r.scheduledDate)}</span>
        </div>
      ),
    },
    {
      key: 'totalItems',
      header: 'Units Expected',
      sortable: true,
      align: 'right',
      render: (r) => (
        <span className="font-mono font-bold text-white">{formatNumber(r.totalItems)}</span>
      ),
    },
    {
      key: 'totalValue',
      header: 'Total Value',
      sortable: true,
      align: 'right',
      render: (r) => (
        <span className="font-mono font-semibold text-emerald-400">
          {formatCurrency(r.totalValue)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <OperationStatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => {
        if (r.status === 'done') {
          return (
            <span className="text-xs font-mono text-emerald-400 flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Received
            </span>
          )
        }
        return (
          <Button
            variant="success"
            size="xs"
            onClick={(e) => {
              e.stopPropagation()
              setConfirmReceiptId(r.id)
            }}
          >
            Validate & Intake
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbound Receipts"
        subtitle="Manage supplier purchases, intake dock verification, and automated warehouse stock incrementing."
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsNewReceiptOpen(true)}>
            <Plus className="w-4 h-4" /> Create Receipt
          </Button>
        }
      />

      {/* Filter and Tab Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e131f] border border-white/[0.08]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by PO reference, vendor name, or dock..."
        />
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />
      </div>

      {/* Receipts Data Table */}
      <DataTable
        columns={columns}
        data={filteredReceipts}
        keyExtractor={(r) => r.id}
        onRowClick={(r) => setSelectedReceipt(r)}
        emptyTitle="No receipts found"
        emptyDescription="There are no inbound shipments matching the selected criteria."
        emptyActionLabel="Create Inbound Receipt"
        onEmptyAction={() => setIsNewReceiptOpen(true)}
      />

      {/* Order Line Details Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title={`Receipt Order ${selectedReceipt.reference}`}
          description={`Supplier: ${selectedReceipt.supplierName} • Destination: ${selectedReceipt.destinationWarehouseName} (${selectedReceipt.destinationLocationCode})`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Status overview */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
              <div>
                <span className="text-xs text-slate-400 font-mono">Current Lifecycle Status</span>
                <div className="mt-1">
                  <OperationStatusBadge status={selectedReceipt.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono">Total Shipment Value</span>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {formatCurrency(selectedReceipt.totalValue)}
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#ff6a00]" /> Ordered Shipment Products
              </h4>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0a0e17] text-slate-400 font-mono uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th className="p-3">SKU & Item</th>
                      <th className="p-3 text-right">Expected Qty</th>
                      <th className="p-3 text-right">Received Qty</th>
                      <th className="p-3 text-right">Unit Cost</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {selectedReceipt.lines.map((l) => (
                      <tr key={l.id} className="text-slate-200">
                        <td className="p-3">
                          <div className="font-semibold text-white">{l.productName}</div>
                          <div className="text-[11px] font-mono text-[#ff8c33]">{l.productSku}</div>
                          {l.lotNumber && (
                            <div className="text-[10px] font-mono text-slate-400">
                              Lot: {l.lotNumber}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {l.quantityExpected}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {selectedReceipt.status === 'done' ? l.quantityExpected : l.quantityReceived}
                        </td>
                        <td className="p-3 text-right font-mono">{formatCurrency(l.unitPrice)}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-100">
                          {formatCurrency(l.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedReceipt.notes && (
              <div className="text-xs text-slate-400 p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                <span className="font-semibold text-slate-300">Receiving Instructions: </span>
                {selectedReceipt.notes}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <Button variant="ghost" size="sm" onClick={() => setSelectedReceipt(null)}>
                Close
              </Button>
              {selectedReceipt.status !== 'done' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setConfirmReceiptId(selectedReceipt.id)}
                >
                  <CheckCircle2 className="w-4 h-4" /> Validate & Intake Stock
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!confirmReceiptId}
        onClose={() => setConfirmReceiptId(null)}
        onConfirm={handleConfirmValidation}
        title="Confirm Shipment Intake"
        description="Validating this receipt will immediately increment on-hand physical stock in the receiving warehouse, recalculate total available inventory, and append a verified entry to the Stock Ledger."
        confirmText="Confirm & Receive Stock"
        variant="success"
      />

      <NewReceiptModal isOpen={isNewReceiptOpen} onClose={() => setIsNewReceiptOpen(false)} />
    </div>
  )
}
