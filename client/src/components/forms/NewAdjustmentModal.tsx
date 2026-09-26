import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { formatCurrency } from '@/utils/formatters'

const adjustmentSchema = z.object({
  warehouseId: z.string().min(1, 'Select warehouse'),
  locationId: z.string().min(1, 'Select location'),
  productId: z.string().min(1, 'Select product'),
  systemQuantity: z.coerce.number(),
  countedQuantity: z.coerce.number().min(0, 'Count cannot be negative'),
  reason: z.enum(['cycle_count', 'damage', 'spoilage', 'theft_loss', 'found_stock', 'calibration']),
  notes: z.string().optional(),
})

type AdjustmentFormData = z.infer<typeof adjustmentSchema>

interface NewAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NewAdjustmentModal: React.FC<NewAdjustmentModalProps> = ({ isOpen, onClose }) => {
  const { warehouses, products, stockItems, addAdjustment, currentUser } = useInventory()
  const { toast } = useToast()

  const defaultWh = warehouses[0]
  const defaultProd = products[0]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      warehouseId: defaultWh?.id || '',
      locationId: defaultWh?.locations[1]?.id || defaultWh?.locations[0]?.id || '',
      productId: defaultProd?.id || '',
      systemQuantity: defaultProd?.totalOnHand || 10,
      countedQuantity: defaultProd?.totalOnHand || 10,
      reason: 'cycle_count',
      notes: '',
    },
  })

  const selectedWhId = watch('warehouseId')
  const targetWh = warehouses.find((w) => w.id === selectedWhId) || defaultWh

  const selectedProdId = watch('productId')
  const selectedProduct = products.find((p) => p.id === selectedProdId) || defaultProd

  const systemQty = watch('systemQuantity') || 0
  const countedQty = watch('countedQuantity') || 0
  const difference = countedQty - systemQty
  const unitCost = selectedProduct?.costPrice || 0
  const impactValue = difference * unitCost

  // Sync system quantity when product or warehouse changes
  useEffect(() => {
    if (!selectedProdId || !selectedWhId) return
    const match = stockItems.find(
      (s) => s.productId === selectedProdId && s.warehouseId === selectedWhId,
    )
    const qty = match ? match.quantityOnHand : selectedProduct?.totalOnHand || 0
    setValue('systemQuantity', qty)
    setValue('countedQuantity', qty)
  }, [selectedProdId, selectedWhId, stockItems, selectedProduct, setValue])

  const onSubmit = (data: AdjustmentFormData) => {
    try {
      const loc =
        targetWh.locations.find((l) => l.id === data.locationId) || targetWh.locations[0]

      const diff = data.countedQuantity - data.systemQuantity
      const totalImpact = diff * (selectedProduct?.costPrice || 0)

      const adj = addAdjustment({
        warehouseId: targetWh.id,
        warehouseName: targetWh.name,
        locationId: loc.id,
        locationCode: loc.code,
        productId: selectedProduct.id,
        productSku: selectedProduct.sku,
        productName: selectedProduct.name,
        systemQuantity: data.systemQuantity,
        countedQuantity: data.countedQuantity,
        differenceQuantity: diff,
        unitCost: selectedProduct.costPrice,
        totalImpactValue: totalImpact,
        reason: data.reason,
        date: new Date().toISOString().split('T')[0],
        notes: data.notes,
        user: currentUser.name,
      })

      toast({
        title: 'Adjustment Recorded',
        description: `Draft adjustment ${adj.reference} created. Impact: ${diff > 0 ? `+${diff}` : diff} units.`,
        type: 'info',
      })

      reset()
      onClose()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to record adjustment.',
        type: 'error',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physical Inventory Adjustment"
      description="Record a cycle count or physical discrepancy to align recorded inventory with actual warehouse counts."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Warehouse"
            error={errors.warehouseId?.message}
            {...register('warehouseId')}
          >
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.code} - {wh.name}
              </option>
            ))}
          </Select>

          <Select
            label="Location / Bay"
            error={errors.locationId?.message}
            {...register('locationId')}
          >
            {targetWh?.locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.code} ({loc.name})
              </option>
            ))}
          </Select>
        </div>

        <Select
          label="Product"
          error={errors.productId?.message}
          {...register('productId')}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} - {p.name}
            </option>
          ))}
        </Select>

        {/* Quantities & Calculated Variance */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="System Recorded Quantity"
              type="number"
              disabled
              {...register('systemQuantity')}
            />
            <Input
              label="Actual Counted Quantity"
              type="number"
              error={errors.countedQuantity?.message}
              {...register('countedQuantity')}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/[0.06] text-xs">
            <div>
              <span className="text-slate-400">Inventory Difference:</span>{' '}
              <span
                className={`font-mono font-bold text-sm ${
                  difference > 0
                    ? 'text-emerald-400'
                    : difference < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {difference > 0 ? `+${difference}` : difference} {selectedProduct?.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Valuation Impact:</span>{' '}
              <span
                className={`font-mono font-bold text-sm ${
                  impactValue > 0
                    ? 'text-emerald-400'
                    : impactValue < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {formatCurrency(impactValue)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Discrepancy Reason" {...register('reason')}>
            <option value="cycle_count">Routine Cycle Count</option>
            <option value="damage">Damaged in Transit / Storage</option>
            <option value="spoilage">Expired / Degradation</option>
            <option value="theft_loss">Theft / Unaccounted Shrinkage</option>
            <option value="found_stock">Found Unrecorded Stock</option>
            <option value="calibration">Equipment Unit Calibration</option>
          </Select>

          <Input
            label="Adjustment Auditor"
            value={currentUser.name}
            disabled
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono text-[11px]">
            Audit Findings / Reason Description
          </label>
          <textarea
            rows={2}
            className="w-full bg-[#121826] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00]"
            placeholder="Audit notes or inspection details..."
            {...register('notes')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Save Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  )
}
