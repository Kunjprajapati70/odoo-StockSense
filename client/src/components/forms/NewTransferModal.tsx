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

const transferSchema = z.object({
  sourceWarehouseId: z.string().min(1, 'Source warehouse required'),
  sourceLocationId: z.string().min(1, 'Source location required'),
  destWarehouseId: z.string().min(1, 'Destination warehouse required'),
  destLocationId: z.string().min(1, 'Destination location required'),
  scheduledDate: z.string().min(1, 'Date required'),
  productId: z.string().min(1, 'Select product'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  driverOrCourier: z.string().optional(),
})

type TransferFormData = z.infer<typeof transferSchema>

interface NewTransferModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NewTransferModal: React.FC<NewTransferModalProps> = ({ isOpen, onClose }) => {
  const { warehouses, products, addTransfer } = useInventory()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceWarehouseId: warehouses[0]?.id || '',
      sourceLocationId: warehouses[0]?.locations[1]?.id || warehouses[0]?.locations[0]?.id || '',
      destWarehouseId: warehouses[1]?.id || warehouses[0]?.id || '',
      destLocationId: warehouses[1]?.locations[1]?.id || warehouses[1]?.locations[0]?.id || '',
      scheduledDate: new Date().toISOString().split('T')[0],
      productId: products[0]?.id || '',
      quantity: 5,
      driverOrCourier: 'Dedicated Inter-Facility Shuttle',
    },
  })

  const srcWhId = watch('sourceWarehouseId') || warehouses[0]?.id
  const srcWh = warehouses.find((w) => w.id === srcWhId) || warehouses[0]

  const destWhId = watch('destWarehouseId') || warehouses[1]?.id || warehouses[0]?.id
  const destWh = warehouses.find((w) => w.id === destWhId) || warehouses[0]

  const prodId = watch('productId')
  const selectedProduct = products.find((p) => p.id === prodId) || products[0]

  const onSubmit = (data: TransferFormData) => {
    try {
      const srcLoc = srcWh.locations.find((l) => l.id === data.sourceLocationId) || srcWh.locations[0]
      const destLoc = destWh.locations.find((l) => l.id === data.destLocationId) || destWh.locations[0]

      const transfer = addTransfer({
        sourceWarehouseId: srcWh.id,
        sourceWarehouseName: srcWh.name,
        sourceLocationId: srcLoc.id,
        sourceLocationCode: srcLoc.code,
        destWarehouseId: destWh.id,
        destWarehouseName: destWh.name,
        destLocationId: destLoc.id,
        destLocationCode: destLoc.code,
        scheduledDate: data.scheduledDate,
        totalItems: data.quantity,
        driverOrCourier: data.driverOrCourier,
        lines: [
          {
            id: `trfl-${Date.now()}`,
            productId: selectedProduct.id,
            productSku: selectedProduct.sku,
            productName: selectedProduct.name,
            quantity: data.quantity,
            lotNumber: 'LOT-XFER',
          },
        ],
      })

      toast({
        title: 'Transfer Created',
        description: `Order ${transfer.reference} initiated from ${srcLoc.code} to ${destLoc.code}.`,
        type: 'success',
      })

      reset()
      onClose()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create internal transfer.',
        type: 'error',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Internal Stock Transfer"
      description="Move inventory assets between physical warehouse bays, shelves, or facilities."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Source & Destination Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider block">
              Origin (Source)
            </span>
            <Select
              label="Source Warehouse"
              error={errors.sourceWarehouseId?.message}
              {...register('sourceWarehouseId')}
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.code} - {wh.city}
                </option>
              ))}
            </Select>
            <Select
              label="Source Location / Bin"
              error={errors.sourceLocationId?.message}
              {...register('sourceLocationId')}
            >
              {srcWh?.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} ({loc.name})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
              Destination (Target)
            </span>
            <Select
              label="Destination Warehouse"
              error={errors.destWarehouseId?.message}
              {...register('destWarehouseId')}
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.code} - {wh.city}
                </option>
              ))}
            </Select>
            <Select
              label="Destination Location / Bin"
              error={errors.destLocationId?.message}
              {...register('destLocationId')}
            >
              {destWh?.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} ({loc.name})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Transfer Item */}
        <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <Select label="Product to Transfer" {...register('productId')}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              error={errors.quantity?.message}
              {...register('quantity')}
            />
            <Input
              label="Courier / Vehicle / Team"
              placeholder="e.g. Shuttle #2 or Forklift B"
              {...register('driverOrCourier')}
            />
          </div>
        </div>

        <Input
          label="Scheduled Move Date"
          type="date"
          error={errors.scheduledDate?.message}
          {...register('scheduledDate')}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Initiate Transfer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
