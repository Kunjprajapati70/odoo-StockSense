import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'

const receiptSchema = z.object({
  supplierName: z.string().min(2, 'Supplier name is required'),
  destinationWarehouseId: z.string().min(1, 'Select warehouse'),
  destinationLocationId: z.string().min(1, 'Select receiving location'),
  scheduledDate: z.string().min(1, 'Scheduled date required'),
  productId: z.string().min(1, 'Select product to receive'),
  quantityExpected: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().positive('Unit price must be positive'),
  lotNumber: z.string().optional(),
  notes: z.string().optional(),
})

type ReceiptFormData = z.infer<typeof receiptSchema>

interface NewReceiptModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NewReceiptModal: React.FC<NewReceiptModalProps> = ({ isOpen, onClose }) => {
  const { warehouses, products, addReceipt } = useInventory()
  const { toast } = useToast()

  const defaultWh = warehouses[0]

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      supplierName: '',
      destinationWarehouseId: defaultWh?.id || '',
      destinationLocationId: defaultWh?.locations[0]?.id || '',
      scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      productId: products[0]?.id || '',
      quantityExpected: 20,
      unitPrice: products[0]?.costPrice || 100,
      lotNumber: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: '',
    },
  })

  const selectedWhId = watch('destinationWarehouseId') || defaultWh?.id
  const targetWh = warehouses.find((w) => w.id === selectedWhId) || defaultWh

  const selectedProdId = watch('productId')
  const selectedProduct = products.find((p) => p.id === selectedProdId) || products[0]

  const onSubmit = (data: ReceiptFormData) => {
    try {
      const destLocation =
        targetWh.locations.find((l) => l.id === data.destinationLocationId) || targetWh.locations[0]

      const lineTotal = data.quantityExpected * data.unitPrice

      const newReceipt = addReceipt({
        supplierName: data.supplierName,
        destinationWarehouseId: targetWh.id,
        destinationWarehouseName: targetWh.name,
        destinationLocationId: destLocation.id,
        destinationLocationCode: destLocation.code,
        orderDate: new Date().toISOString().split('T')[0],
        scheduledDate: data.scheduledDate,
        totalItems: data.quantityExpected,
        totalValue: lineTotal,
        notes: data.notes,
        lines: [
          {
            id: `recl-${Date.now()}`,
            productId: selectedProduct.id,
            productSku: selectedProduct.sku,
            productName: selectedProduct.name,
            quantityExpected: data.quantityExpected,
            quantityReceived: 0,
            unitPrice: data.unitPrice,
            subtotal: lineTotal,
            lotNumber: data.lotNumber,
          },
        ],
      })

      toast({
        title: 'Receipt Created',
        description: `Order ${newReceipt.reference} created for ${data.supplierName}. Status: Waiting.`,
        type: 'success',
      })

      reset()
      onClose()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create receipt.',
        type: 'error',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Inbound Receipt"
      description="Record an incoming purchase shipment from a supplier to a designated warehouse intake location."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Supplier / Vendor"
          placeholder="e.g. Apex Precision Semiconductor Ltd."
          error={errors.supplierName?.message}
          {...register('supplierName')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Destination Warehouse"
            error={errors.destinationWarehouseId?.message}
            {...register('destinationWarehouseId')}
          >
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.code} - {wh.name}
              </option>
            ))}
          </Select>

          <Select
            label="Receiving Dock / Bay"
            error={errors.destinationLocationId?.message}
            {...register('destinationLocationId')}
          >
            {targetWh?.locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.code} ({loc.name})
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Scheduled Expected Date"
            type="date"
            error={errors.scheduledDate?.message}
            {...register('scheduledDate')}
          />
          <Input
            label="Batch / Lot #"
            placeholder="e.g. LOT-2026-9042"
            error={errors.lotNumber?.message}
            {...register('lotNumber')}
          />
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
            Shipment Item Details
          </h4>
          <Select label="Product" {...register('productId')}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Quantity Ordered"
              type="number"
              error={errors.quantityExpected?.message}
              {...register('quantityExpected')}
            />
            <Input
              label="Agreed Unit Price ($)"
              type="number"
              step="0.01"
              error={errors.unitPrice?.message}
              {...register('unitPrice')}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono text-[11px]">
            Receiving Notes
          </label>
          <textarea
            rows={2}
            className="w-full bg-[#121826] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00]"
            placeholder="Customs clearance docs, hazmat instructions..."
            {...register('notes')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Generate Receipt
          </Button>
        </div>
      </form>
    </Modal>
  )
}
