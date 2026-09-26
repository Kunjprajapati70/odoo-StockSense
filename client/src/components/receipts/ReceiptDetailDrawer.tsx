import React, { useState } from 'react'
import {
  X,
  Warehouse,
  Truck,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Package,
  Layers,
  FileText,
  Printer,
  Ban,
  ArrowDownToLine,
  ExternalLink,
} from 'lucide-react'
import { Receipt, StockMove } from '@/types/inventory'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { OperationStatusBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatNumber, formatDate, formatCurrency } from '@/utils/formatters'

interface ReceiptDetailDrawerProps {
  receipt: Receipt | null
  isOpen: boolean
  onClose: () => void
  onValidated?: () => void
}

export const ReceiptDetailDrawer: React.FC<ReceiptDetailDrawerProps> = ({
  receipt,
  isOpen,
  onClose,
  onValidated,
}) => {
  const { stockMoves, validateReceipt, products } = useInventory()
  const { toast } = useToast()

  const [isValidationWarningOpen, setIsValidationWarningOpen] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !receipt) return null

  // Find associated stock moves
  const relatedMoves = stockMoves.filter(
    (m) =>
      m.reference === receipt.reference ||
      (m.type === 'RECEIPT' && receipt.lines.some((l) => l.productId === m.productId)),
  )

  const isDone = receipt.status === 'done'
  const isDraft = receipt.status === 'draft'
  const isWaiting = receipt.status === 'waiting'
  const isReady = receipt.status === 'ready'
  const isCancelled = receipt.status === 'cancelled'

  const totalExpected = receipt.lines.reduce((sum, l) => sum + l.quantityExpected, 0)
  const totalReceived = receipt.lines.reduce((sum, l) => sum + (l.quantityReceived || 0), 0)
  const progressPct = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0

  // Execute validation
  const handleConfirmValidation = () => {
    try {
      setIsValidating(true)
      validateReceipt(receipt.id)

      toast({
        title: 'Receipt Validated',
        description: `Inventory increased by +${totalExpected} units. Movement logged in Stock Ledger.`,
        type: 'success',
      })

      setIsValidationWarningOpen(false)
      onValidated?.()
      onClose()
    } catch {
      toast({
        title: 'Validation Error',
        description: 'Failed to validate receipt.',
        type: 'error',
      })
    } finally {
      setIsValidating(false)
    }
  }

  // Print slip
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-2xl bg-[#0c101c] border-l border-white/[0.08] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-white/[0.08] bg-[#0e1424] flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#ff6a00]/15 text-[#ff8c33] border border-[#ff6a00]/30 font-bold">
                    {receipt.reference}
                  </span>
                  <OperationStatusBadge status={receipt.status} />
                </div>

                <h2 className="text-xl font-bold text-white tracking-tight truncate">
                  {receipt.supplierName}
                </h2>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                    Dest: <strong className="text-slate-200">{receipt.destinationWarehouseName}</strong>
                  </span>
                  <span>•</span>
                  <span>Dock: <strong className="text-[#ff8c33]">{receipt.destinationLocationCode}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handlePrint}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="Print delivery slip"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Lifecycle Progress Stepper */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
                  <span>Lifecycle Timeline</span>
                  <span className="text-[#ff8c33] font-bold">
                    {isDone ? 'COMPLETED' : isCancelled ? 'CANCELLED' : 'IN PROGRESS'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {/* Step 1: Draft */}
                  <div
                    className={`p-2.5 rounded-lg border text-center font-mono text-[11px] ${
                      isDraft
                        ? 'bg-slate-800 text-white border-slate-600'
                        : isWaiting || isReady || isDone
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/[0.02] text-slate-500 border-white/[0.04]'
                    }`}
                  >
                    <div className="font-bold">1. Draft</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">PO Created</div>
                  </div>

                  {/* Step 2: Waiting */}
                  <div
                    className={`p-2.5 rounded-lg border text-center font-mono text-[11px] ${
                      isWaiting
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800/60 ring-1 ring-amber-500/30'
                        : isReady || isDone
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/[0.02] text-slate-500 border-white/[0.04]'
                    }`}
                  >
                    <div className="font-bold">2. Waiting</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Inbound Transit</div>
                  </div>

                  {/* Step 3: Ready */}
                  <div
                    className={`p-2.5 rounded-lg border text-center font-mono text-[11px] ${
                      isReady
                        ? 'bg-sky-950/60 text-sky-300 border-sky-800/60 ring-1 ring-sky-500/30'
                        : isDone
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/[0.02] text-slate-500 border-white/[0.04]'
                    }`}
                  >
                    <div className="font-bold">3. Ready</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">At Intake Dock</div>
                  </div>

                  {/* Step 4: Done */}
                  <div
                    className={`p-2.5 rounded-lg border text-center font-mono text-[11px] ${
                      isDone
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 ring-1 ring-emerald-500/40'
                        : isCancelled
                        ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                        : 'bg-white/[0.02] text-slate-500 border-white/[0.04]'
                    }`}
                  >
                    <div className="font-bold">4. Done</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {isDone ? 'Stock Received' : isCancelled ? 'Voided' : 'Intake'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantities Summary Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Product Lines
                  </div>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {receipt.lines.length} SKUs
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">Catalog items</div>
                </div>

                <div className="p-4 rounded-xl bg-sky-500/[0.03] border border-sky-500/20">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400">
                    Expected Qty
                  </div>
                  <div className="text-2xl font-bold font-mono text-sky-300 mt-1">
                    {formatNumber(totalExpected)}
                  </div>
                  <div className="text-[11px] font-mono text-sky-400/70 mt-0.5">Contracted units</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                    Received Qty
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                    {formatNumber(totalReceived)}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400/70 mt-0.5">
                    {progressPct}% Verified
                  </div>
                </div>
              </div>

              {/* Product Lines Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#ff6a00]" />
                    Product Lines & Verification
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Valuation: {formatCurrency(receipt.totalValue)}
                  </span>
                </div>

                <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d1322]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-mono text-[10px] uppercase">
                        <th className="px-4 py-2.5">Product</th>
                        <th className="px-4 py-2.5">SKU</th>
                        <th className="px-4 py-2.5 text-right">Expected</th>
                        <th className="px-4 py-2.5 text-right">Received</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {receipt.lines.map((l) => {
                        const prod = products.find((p) => p.id === l.productId || p.sku === l.productSku)
                        const unit = prod?.unit || 'pcs'
                        return (
                          <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-white">{l.productName}</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                Lot: {l.lotNumber || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-[#ff8c33] text-xs">
                              {l.productSku}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-white">
                              {formatNumber(l.quantityExpected)}{' '}
                              <span className="text-[10px] text-slate-400 uppercase">{unit}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                              {formatNumber(l.quantityReceived)}{' '}
                              <span className="text-[10px] text-emerald-400/70 uppercase">{unit}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-300 font-semibold">
                              {formatCurrency(l.subtotal)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receipt Information Details */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Order Date</span>
                  <span className="text-white font-bold">{formatDate(receipt.orderDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Scheduled Arrival</span>
                  <span className="text-white font-bold">{formatDate(receipt.scheduledDate)}</span>
                </div>
                {receipt.completedDate && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Receipt Completed</span>
                    <span className="text-emerald-400 font-bold">{formatDate(receipt.completedDate)}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Receiving Location</span>
                  <span className="text-slate-200 font-bold">{receipt.destinationLocationCode}</span>
                </div>
              </div>

              {receipt.notes && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300 font-mono text-[10px] uppercase block mb-1">
                    Inspection / Carrier Notes:
                  </strong>
                  {receipt.notes}
                </div>
              )}

              {/* Stock Movements Created */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    Stock Ledger Movements Created
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">Audit trail</span>
                </div>

                {isDone ? (
                  <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d1322]">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-mono text-[10px] uppercase">
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Product</th>
                          <th className="px-4 py-2.5">Route</th>
                          <th className="px-4 py-2.5 text-right">Quantity Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {relatedMoves.length > 0 ? (
                          relatedMoves.map((m) => (
                            <tr key={m.id} className="hover:bg-white/[0.02]">
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                                {formatDate(m.timestamp)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-white">{m.productName}</div>
                                <div className="text-[10px] font-mono text-[#ff8c33]">{m.productSku}</div>
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                                {m.fromLocation} → {m.toLocation}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                                +{m.quantityChange}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-slate-400 text-xs">
                              Movements recorded on receipt validation.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] text-center space-y-1">
                    <div className="text-xs text-slate-400">No stock movements posted yet.</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Validating this receipt will create verified inbound entries and increment on-hand stock.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/[0.08] bg-[#0e1424] flex items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>

              <div className="flex items-center gap-2">
                {!isDone && !isCancelled && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsValidationWarningOpen(true)}
                    className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white font-bold gap-1.5 shadow-lg shadow-[#ff6a00]/25"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Validate Receipt
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── VALIDATION WARNING MODAL ────────────────────────────────────── */}
      {isValidationWarningOpen && (
        <Modal
          isOpen={isValidationWarningOpen}
          onClose={() => setIsValidationWarningOpen(false)}
          title="Confirm Receipt Validation"
          description="Immediate inventory increment verification."
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-300 font-mono tracking-tight">
                  Validating this receipt will increase inventory.
                </h4>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  This action will immediately increment physical stock by{' '}
                  <strong className="text-white font-mono">+{formatNumber(totalExpected)} units</strong> across{' '}
                  <strong className="text-white font-mono">{receipt.lines.length} lines</strong> at{' '}
                  <strong className="text-white font-mono">{receipt.destinationWarehouseName}</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Destination Dock:</span>
              <span className="text-white font-bold">{receipt.destinationLocationCode}</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsValidationWarningOpen(false)}
                disabled={isValidating}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmValidation}
                isLoading={isValidating}
                className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white font-bold gap-1.5"
              >
                Confirm & Intake Stock
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
