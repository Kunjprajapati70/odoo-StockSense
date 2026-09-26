import React, { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Package,
  Warehouse,
  Calendar,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Scale,
  Sparkles,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { ReceiptLine, ReceiptStatus } from '@/types/inventory'
import { formatNumber } from '@/utils/formatters'

interface NewReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface TempLineItem {
  id: string
  productId: string
  productSku: string
  productName: string
  unit: string
  quantityExpected: number
  quantityReceived: number
  unitPrice: number
  lotNumber?: string
}

export const NewReceiptModal: React.FC<NewReceiptModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { warehouses, products, addReceipt, validateReceipt } = useInventory()
  const { toast } = useToast()

  const defaultWh = warehouses[0]

  // Step state: 1 | 2 | 3
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isValidationWarningOpen, setIsValidationWarningOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Logistics
  const [supplierName, setSupplierName] = useState('')
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(defaultWh?.id || '')
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
  )
  const [notes, setNotes] = useState('')
  const [step1Errors, setStep1Errors] = useState<{ supplier?: string; warehouse?: string; date?: string }>({})

  // Step 2: Line Items
  const defaultProd = products[0]
  const [lineItems, setLineItems] = useState<TempLineItem[]>([
    {
      id: `line-${Date.now()}`,
      productId: defaultProd?.id || '',
      productSku: defaultProd?.sku || '',
      productName: defaultProd?.name || '',
      unit: defaultProd?.unit || 'pcs',
      quantityExpected: 25,
      quantityReceived: 25,
      unitPrice: defaultProd?.costPrice || 50,
      lotNumber: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    },
  ])
  const [lineItemError, setLineItemError] = useState<string | null>(null)

  const selectedWarehouse = warehouses.find((w) => w.id === destinationWarehouseId) || defaultWh
  const defaultLocation = selectedWarehouse?.locations[0]

  // Reset form
  const handleReset = () => {
    setStep(1)
    setSupplierName('')
    setDestinationWarehouseId(defaultWh?.id || '')
    setExpectedDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0])
    setNotes('')
    setStep1Errors({})
    setLineItemError(null)
    setIsValidationWarningOpen(false)
    if (products[0]) {
      setLineItems([
        {
          id: `line-${Date.now()}`,
          productId: products[0].id,
          productSku: products[0].sku,
          productName: products[0].name,
          unit: products[0].unit,
          quantityExpected: 25,
          quantityReceived: 25,
          unitPrice: products[0].costPrice,
          lotNumber: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      ])
    }
  }

  // Step 1 Validation
  const handleNextToStep2 = () => {
    const errors: { supplier?: string; warehouse?: string; date?: string } = {}
    if (!supplierName.trim()) {
      errors.supplier = 'Supplier name is required'
    }
    if (!destinationWarehouseId) {
      errors.warehouse = 'Please select a destination warehouse'
    }
    if (!expectedDate) {
      errors.date = 'Expected delivery date is required'
    }

    if (Object.keys(errors).length > 0) {
      setStep1Errors(errors)
      return
    }

    setStep1Errors({})
    setStep(2)
  }

  // Step 2 Validation
  const handleNextToStep3 = () => {
    if (lineItems.length === 0) {
      setLineItemError('Please add at least one product line item.')
      return
    }

    const hasInvalidQty = lineItems.some((l) => l.quantityExpected <= 0)
    if (hasInvalidQty) {
      setLineItemError('Expected quantity must be greater than 0 for all items.')
      return
    }

    setLineItemError(null)
    setStep(3)
  }

  // Add line item
  const handleAddLineItem = () => {
    const prod = products[0]
    setLineItems((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${Math.random()}`,
        productId: prod?.id || '',
        productSku: prod?.sku || '',
        productName: prod?.name || '',
        unit: prod?.unit || 'pcs',
        quantityExpected: 10,
        quantityReceived: 10,
        unitPrice: prod?.costPrice || 20,
        lotNumber: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      },
    ])
  }

  // Update line item
  const handleUpdateLine = (id: string, updates: Partial<TempLineItem>) => {
    setLineItems((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const updated = { ...l, ...updates }
        if (updates.productId) {
          const matchedProd = products.find((p) => p.id === updates.productId)
          if (matchedProd) {
            updated.productSku = matchedProd.sku
            updated.productName = matchedProd.name
            updated.unit = matchedProd.unit
            updated.unitPrice = matchedProd.costPrice
          }
        }
        return updated
      }),
    )
  }

  // Remove line item
  const handleRemoveLine = (id: string) => {
    if (lineItems.length <= 1) {
      toast({
        title: 'Notice',
        description: 'A receipt must contain at least one line item.',
        type: 'warning',
      })
      return
    }
    setLineItems((prev) => prev.filter((l) => l.id !== id))
  }

  // Calculations
  const totalItems = lineItems.length
  const totalExpectedQuantity = lineItems.reduce((acc, l) => acc + (Number(l.quantityExpected) || 0), 0)
  const totalReceivedQuantity = lineItems.reduce((acc, l) => acc + (Number(l.quantityReceived) || 0), 0)
  const totalOrderValue = lineItems.reduce(
    (acc, l) => acc + (Number(l.quantityExpected) || 0) * (Number(l.unitPrice) || 0),
    0,
  )

  // Save as Draft
  const handleSaveDraft = () => {
    try {
      setIsSubmitting(true)
      const receipt = addReceipt({
        supplierName: supplierName.trim(),
        destinationWarehouseId: selectedWarehouse.id,
        destinationWarehouseName: selectedWarehouse.name,
        destinationLocationId: defaultLocation?.id || '',
        destinationLocationCode: defaultLocation?.code || 'WH-RECV',
        orderDate: new Date().toISOString().split('T')[0],
        scheduledDate: expectedDate,
        totalItems: totalExpectedQuantity,
        totalValue: totalOrderValue,
        notes: notes.trim() || undefined,
        status: 'draft',
        lines: lineItems.map((l) => ({
          id: `recl-${Date.now()}-${Math.random()}`,
          productId: l.productId,
          productSku: l.productSku,
          productName: l.productName,
          quantityExpected: Number(l.quantityExpected),
          quantityReceived: 0,
          unitPrice: Number(l.unitPrice),
          subtotal: Number(l.quantityExpected) * Number(l.unitPrice),
          lotNumber: l.lotNumber,
        })),
      })

      toast({
        title: 'Draft Receipt Saved',
        description: `Receipt ${receipt.reference} saved as Draft. Inventory has not been altered.`,
        type: 'info',
      })

      handleReset()
      onSuccess?.()
      onClose()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save draft receipt.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Confirm Validation
  const handleConfirmValidation = () => {
    try {
      setIsSubmitting(true)
      // 1. Create the receipt
      const receipt = addReceipt({
        supplierName: supplierName.trim(),
        destinationWarehouseId: selectedWarehouse.id,
        destinationWarehouseName: selectedWarehouse.name,
        destinationLocationId: defaultLocation?.id || '',
        destinationLocationCode: defaultLocation?.code || 'WH-RECV',
        orderDate: new Date().toISOString().split('T')[0],
        scheduledDate: expectedDate,
        totalItems: totalExpectedQuantity,
        totalValue: totalOrderValue,
        notes: notes.trim() || undefined,
        status: 'waiting',
        lines: lineItems.map((l) => ({
          id: `recl-${Date.now()}-${Math.random()}`,
          productId: l.productId,
          productSku: l.productSku,
          productName: l.productName,
          quantityExpected: Number(l.quantityExpected),
          quantityReceived: Number(l.quantityReceived) || Number(l.quantityExpected),
          unitPrice: Number(l.unitPrice),
          subtotal: Number(l.quantityExpected) * Number(l.unitPrice),
          lotNumber: l.lotNumber,
        })),
      })

      // 2. Validate receipt (increases stock on hand in products & locations, writes moves)
      validateReceipt(receipt.id)

      toast({
        title: 'Receipt Validated Successfully',
        description: `Stock on hand increased by +${totalExpectedQuantity} units across ${totalItems} products. Transaction posted to Stock Ledger.`,
        type: 'success',
      })

      handleReset()
      onSuccess?.()
      onClose()
    } catch {
      toast({
        title: 'Validation Error',
        description: 'Failed to validate receipt.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !isValidationWarningOpen}
        onClose={onClose}
        title="Create Inbound Receipt"
        description="Receive stock from suppliers, verify shipments, and update inventory balances."
        size="lg"
      >
        <div className="space-y-6">
          {/* Stepper Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  step === 1
                    ? 'bg-[#ff6a00] text-white shadow-lg shadow-[#ff6a00]/30 ring-2 ring-[#ff6a00]/30'
                    : step > 1
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.05] text-slate-500'
                }`}
              >
                {step > 1 ? '✓' : '1'}
              </div>
              <div>
                <div className={`text-xs font-bold font-mono uppercase ${step === 1 ? 'text-white' : 'text-slate-400'}`}>
                  Step 1: Logistics
                </div>
                <div className="text-[10px] text-slate-500">Supplier & Destination</div>
              </div>
            </div>

            <div className="h-0.5 flex-1 max-w-[40px] bg-white/[0.06] mx-2" />

            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  step === 2
                    ? 'bg-[#ff6a00] text-white shadow-lg shadow-[#ff6a00]/30 ring-2 ring-[#ff6a00]/30'
                    : step > 2
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.05] text-slate-500'
                }`}
              >
                {step > 2 ? '✓' : '2'}
              </div>
              <div>
                <div className={`text-xs font-bold font-mono uppercase ${step === 2 ? 'text-white' : 'text-slate-400'}`}>
                  Step 2: Products
                </div>
                <div className="text-[10px] text-slate-500">Add Line Items</div>
              </div>
            </div>

            <div className="h-0.5 flex-1 max-w-[40px] bg-white/[0.06] mx-2" />

            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  step === 3
                    ? 'bg-[#ff6a00] text-white shadow-lg shadow-[#ff6a00]/30 ring-2 ring-[#ff6a00]/30'
                    : 'bg-white/[0.05] text-slate-500'
                }`}
              >
                3
              </div>
              <div>
                <div className={`text-xs font-bold font-mono uppercase ${step === 3 ? 'text-white' : 'text-slate-400'}`}>
                  Step 3: Review
                </div>
                <div className="text-[10px] text-slate-500">Validation & Intake</div>
              </div>
            </div>
          </div>

          {/* ── STEP 1: LOGISTICS ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono text-[11px]">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  list="suggested-suppliers"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. ArcelorMittal Global Steel or Apex Precision"
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] transition-colors"
                />
                <datalist id="suggested-suppliers">
                  <option value="ArcelorMittal Global Steel" />
                  <option value="Apex Precision Semiconductor Ltd." />
                  <option value="NovaPhotonics Global Manufacturing" />
                  <option value="VoltCell Technologies Corp." />
                  <option value="Kaiser Alloys International" />
                  <option value="Heidelberg Materials AG" />
                  <option value="Herman Miller Logistics" />
                </datalist>
                {step1Errors.supplier && (
                  <p className="text-xs text-rose-400 font-mono mt-1">{step1Errors.supplier}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono text-[11px]">
                    Destination Warehouse *
                  </label>
                  <Select
                    value={destinationWarehouseId}
                    onChange={(e) => setDestinationWarehouseId(e.target.value)}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </Select>
                  {step1Errors.warehouse && (
                    <p className="text-xs text-rose-400 font-mono mt-1">{step1Errors.warehouse}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono text-[11px]">
                    Expected Delivery Date *
                  </label>
                  <Input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                  {step1Errors.date && (
                    <p className="text-xs text-rose-400 font-mono mt-1">{step1Errors.date}</p>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Warehouse className="w-4 h-4 text-[#ff6a00]" />
                  <span>Assigned Intake Dock:</span>
                  <span className="font-mono text-slate-200 font-bold">{defaultLocation?.code || 'WH1-RECV'}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-500">Cross-dock receiving</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono text-[11px]">
                  Order Notes / Carrier Reference (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="PO reference number, bill of lading, inspection notes..."
                  className="w-full bg-[#121826] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNextToStep2}
                  className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white gap-1.5"
                >
                  Next: Add Products <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: ADD PRODUCTS ──────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Product Line Items ({lineItems.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">Define SKUs, expected quantities and units.</p>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleAddLineItem}
                  className="gap-1 border-white/10 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#ff6a00]" /> Add Product Line
                </Button>
              </div>

              {lineItemError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{lineItemError}</span>
                </div>
              )}

              {/* Line Items List */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {lineItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-slate-400 font-bold">
                        Line #{idx + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveLine(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Remove product line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                          Product *
                        </label>
                        <Select
                          value={item.productId}
                          onChange={(e) => handleUpdateLine(item.id, { productId: e.target.value })}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                          SKU Identifier
                        </label>
                        <div className="w-full bg-[#141b2a] border border-white/5 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#ff8c33] truncate">
                          {item.productSku}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                          Expected Qty *
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantityExpected}
                          onChange={(e) =>
                            handleUpdateLine(item.id, {
                              quantityExpected: Number(e.target.value),
                              quantityReceived: Number(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                          Received Qty
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={item.quantityReceived}
                          onChange={(e) =>
                            handleUpdateLine(item.id, {
                              quantityReceived: Number(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                          Unit
                        </label>
                        <div className="w-full bg-[#141b2a] border border-white/5 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-300">
                          {item.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNextToStep3}
                  className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white gap-1.5"
                >
                  Next: Review <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: REVIEW ────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header Logistics Summary Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Supplier</div>
                  <div className="text-sm font-bold text-white mt-0.5">{supplierName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Destination Hub</div>
                  <div className="text-sm font-mono text-slate-200 mt-0.5">
                    {selectedWarehouse.code} ({selectedWarehouse.city})
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Expected Date</div>
                  <div className="text-sm font-mono text-slate-200 mt-0.5">{expectedDate}</div>
                </div>
              </div>

              {/* KPI Strip: Total Items, Expected Quantity, Received Quantity */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Total Items</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{totalItems} SKUs</div>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-500/[0.04] border border-sky-500/20 text-center">
                  <div className="text-[10px] font-mono uppercase text-sky-400">Expected Qty</div>
                  <div className="text-xl font-bold font-mono text-sky-300 mt-0.5">
                    {formatNumber(totalExpectedQuantity)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 text-center">
                  <div className="text-[10px] font-mono uppercase text-emerald-400">Received Qty</div>
                  <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">
                    {formatNumber(totalReceivedQuantity)}
                  </div>
                </div>
              </div>

              {/* Product Lines Review Table */}
              <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d1322]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-mono text-[10px] uppercase">
                      <th className="px-3.5 py-2.5">Product & SKU</th>
                      <th className="px-3.5 py-2.5 text-right">Expected</th>
                      <th className="px-3.5 py-2.5 text-right">Received</th>
                      <th className="px-3.5 py-2.5 text-right">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {lineItems.map((l) => (
                      <tr key={l.id} className="hover:bg-white/[0.02]">
                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-white">{l.productName}</div>
                          <div className="font-mono text-[10px] text-[#ff8c33]">{l.productSku}</div>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-white">
                          {formatNumber(l.quantityExpected)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-400">
                          {formatNumber(l.quantityReceived)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-slate-400 uppercase text-[11px]">
                          {l.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Inventory Awareness Alert */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>Save Draft:</strong> Creates a pending PO requisition without affecting inventory.{' '}
                  <br />
                  <strong>Validate Receipt:</strong> Immediately increments on-hand stock balances in {selectedWarehouse.code}.
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>

                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    isLoading={isSubmitting}
                    className="border-white/10 text-xs font-mono"
                  >
                    Save Draft
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsValidationWarningOpen(true)}
                    className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white shadow-lg shadow-[#ff6a00]/25 gap-1.5 font-semibold text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Validate Receipt
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── VALIDATION WARNING CONFIRMATION MODAL ───────────────────────── */}
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
                  <strong className="text-white font-mono">+{formatNumber(totalExpectedQuantity)} units</strong> at{' '}
                  <strong className="text-white font-mono">{selectedWarehouse.code}</strong> and generate formal stock movement records in the Stock Ledger.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Lines Affected:</span>
              <span className="text-white font-bold">{totalItems} SKUs</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsValidationWarningOpen(false)}
                disabled={isSubmitting}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmValidation}
                isLoading={isSubmitting}
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
