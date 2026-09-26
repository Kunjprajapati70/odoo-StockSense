import React, { useState, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, Column } from '@/components/common/DataTable'
import { SearchInput } from '@/components/common/SearchInput'
import { OperationStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { Tabs } from '@/components/ui/Tabs'
import { Delivery } from '@/types/inventory'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters'
import { Plus, ArrowUpFromLine, CheckCircle2, Warehouse, Calendar, Truck, Package } from 'lucide-react'
import { NewDeliveryModal } from '@/components/forms/NewDeliveryModal'

export const DeliveriesPage: React.FC = () => {
  const { deliveries, validateDelivery } = useInventory()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [confirmDeliveryId, setConfirmDeliveryId] = useState<string | null>(null)
  const [isNewDeliveryOpen, setIsNewDeliveryOpen] = useState(false)

  const tabs = [
    { id: 'ALL', label: 'All Orders', count: deliveries.length },
    {
      id: 'ready',
      label: 'Ready for Dispatch',
      count: deliveries.filter((d) => d.status === 'ready').length,
    },
    {
      id: 'done',
      label: 'Shipped / Fulfilled',
      count: deliveries.filter((d) => d.status === 'done').length,
    },
  ]

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const matchSearch =
        d.reference.toLowerCase().includes(search.toLowerCase()) ||
        d.customerName.toLowerCase().includes(search.toLowerCase()) ||
        d.sourceWarehouseName.toLowerCase().includes(search.toLowerCase()) ||
        (d.carrier && d.carrier.toLowerCase().includes(search.toLowerCase()))

      const matchTab = activeTab === 'ALL' || d.status === activeTab

      return matchSearch && matchTab
    })
  }, [deliveries, search, activeTab])

  const handleConfirmValidation = () => {
    if (!confirmDeliveryId) return
    const target = deliveries.find((d) => d.id === confirmDeliveryId)
    validateDelivery(confirmDeliveryId)

    toast({
      title: 'Outbound Order Dispatched',
      description: `Shipment ${target?.reference} dispatched to ${target?.customerName}. Stock deducted and logged to ledger.`,
      type: 'success',
    })

    setConfirmDeliveryId(null)
    if (selectedDelivery?.id === confirmDeliveryId) {
      setSelectedDelivery(null)
    }
  }

  const columns: Column<Delivery>[] = [
    {
      key: 'reference',
      header: 'Reference',
      sortable: true,
      render: (d) => (
        <span className="font-mono font-bold text-white group-hover:text-[#ff6a00] transition-colors">
          {d.reference}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer / Recipient',
      sortable: true,
      render: (d) => (
        <div>
          <div className="font-semibold text-slate-100">{d.customerName}</div>
          <div className="text-[11px] text-slate-400 font-mono">Order Date: {formatDate(d.orderDate)}</div>
        </div>
      ),
    },
    {
      key: 'sourceWarehouseName',
      header: 'Source Origin',
      sortable: true,
      render: (d) => (
        <div>
          <div className="font-medium text-slate-200 flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
            <span>{d.sourceWarehouseName}</span>
          </div>
          <div className="text-[11px] font-mono text-[#ff8c33] mt-0.5">
            Bay: {d.sourceLocationCode}
          </div>
        </div>
      ),
    },
    {
      key: 'carrier',
      header: 'Carrier & Tracking',
      render: (d) => (
        <div>
          <div className="flex items-center gap-1.5 text-slate-300 text-xs">
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            <span>{d.carrier || 'Freight Line'}</span>
          </div>
          {d.trackingNumber && (
            <div className="text-[10px] font-mono text-slate-400">{d.trackingNumber}</div>
          )}
        </div>
      ),
    },
    {
      key: 'totalItems',
      header: 'Items',
      sortable: true,
      align: 'right',
      render: (d) => (
        <span className="font-mono font-bold text-white">{formatNumber(d.totalItems)}</span>
      ),
    },
    {
      key: 'totalValue',
      header: 'Invoice Total',
      sortable: true,
      align: 'right',
      render: (d) => (
        <span className="font-mono font-semibold text-slate-100">
          {formatCurrency(d.totalValue)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => <OperationStatusBadge status={d.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (d) => {
        if (d.status === 'done') {
          return (
            <span className="text-xs font-mono text-emerald-400 flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
            </span>
          )
        }
        return (
          <Button
            variant="primary"
            size="xs"
            onClick={(e) => {
              e.stopPropagation()
              setConfirmDeliveryId(d.id)
            }}
          >
            Ship Order
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outbound Deliveries"
        subtitle="Customer sales fulfillment orders, staging dock dispatching, and inventory deduction."
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsNewDeliveryOpen(true)}>
            <Plus className="w-4 h-4" /> Create Delivery
          </Button>
        }
      />

      {/* Filter and Tab Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e131f] border border-white/[0.08]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by SO reference, client name, or carrier..."
        />
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />
      </div>

      {/* Deliveries Data Table */}
      <DataTable
        columns={columns}
        data={filteredDeliveries}
        keyExtractor={(d) => d.id}
        onRowClick={(d) => setSelectedDelivery(d)}
        emptyTitle="No deliveries found"
        emptyDescription="There are no outbound shipment orders matching the selected criteria."
        emptyActionLabel="Create Outbound Delivery"
        onEmptyAction={() => setIsNewDeliveryOpen(true)}
      />

      {/* Order Details Modal */}
      {selectedDelivery && (
        <Modal
          isOpen={!!selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          title={`Delivery Order ${selectedDelivery.reference}`}
          description={`Customer: ${selectedDelivery.customerName} • Source: ${selectedDelivery.sourceWarehouseName} (${selectedDelivery.sourceLocationCode})`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Status overview */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
              <div>
                <span className="text-xs text-slate-400 font-mono">Fulfillment Status</span>
                <div className="mt-1">
                  <OperationStatusBadge status={selectedDelivery.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono">Shipment Value</span>
                <div className="text-lg font-bold font-mono text-white">
                  {formatCurrency(selectedDelivery.totalValue)}
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#ff6a00]" /> Dispatched Order Lines
              </h4>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0a0e17] text-slate-400 font-mono uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th className="p-3">SKU & Item</th>
                      <th className="p-3 text-right">Demanded Qty</th>
                      <th className="p-3 text-right">Shipped Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {selectedDelivery.lines.map((l) => (
                      <tr key={l.id} className="text-slate-200">
                        <td className="p-3">
                          <div className="font-semibold text-white">{l.productName}</div>
                          <div className="text-[11px] font-mono text-[#ff8c33]">{l.productSku}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {l.quantityDemanded}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-sky-400">
                          {selectedDelivery.status === 'done' ? l.quantityDemanded : l.quantityShipped}
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

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <Button variant="ghost" size="sm" onClick={() => setSelectedDelivery(null)}>
                Close
              </Button>
              {selectedDelivery.status !== 'done' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setConfirmDeliveryId(selectedDelivery.id)}
                >
                  <CheckCircle2 className="w-4 h-4" /> Validate & Ship Order
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!confirmDeliveryId}
        onClose={() => setConfirmDeliveryId(null)}
        onConfirm={handleConfirmValidation}
        title="Confirm Dispatch Delivery"
        description="Dispatching this delivery will immediately reduce on-hand warehouse inventory balances, mark the order as fulfilled, and generate an outbound audit trail entry in the Stock Ledger."
        confirmText="Confirm & Dispatch"
        variant="primary"
      />

      <NewDeliveryModal isOpen={isNewDeliveryOpen} onClose={() => setIsNewDeliveryOpen(false)} />
    </div>
  )
}
