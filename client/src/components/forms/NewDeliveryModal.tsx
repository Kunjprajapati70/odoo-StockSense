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

const deliverySchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  sourceWarehouseId: z.string().min(1, 'Select source warehouse'),
  sourceLocationId: z.string().min(1, 'Select shipping location'),
  scheduledDate: z.string().min(1, 'Delivery scheduled date required'),
  productId: z.string().min(1, 'Select product to dispatch'),
  quantityDemanded: z.coerce.number().positive('Quantity must be greater than 0'),
  carrier: z.string().optional(),
})

type DeliveryFormData = z.infer<typeof deliverySchema>

interface NewDeliveryModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NewDeliveryModal: React.FC<NewDeliveryModalProps> = ({ isOpen, onClose }) => {
  const { warehouses, products, addDelivery } = useInventory()
  const { toast } = useToast()

  const defaultWh = warehouses[0]

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      customerName: '',
      sourceWarehouseId: defaultWh?.id || '',
      sourceLocationId: defaultWh?.locations.find((l) => l.type === 'Shipping')?.id || defaultWh?.locations[0]?.id || '',
      scheduledDate: new Date().toISOString().split('T')[0],
      productId: products[0]?.id || '',
      quantityDemanded: 5,
      carrier: 'FedEx Freight Priority',
    },
  })

  const selectedWhId = watch('sourceWarehouseId') || defaultWh?.id
  const targetWh = warehouses.find((w) => w.id === selectedWhId) || defaultWh

  const selectedProdId = watch('productId')
  const selectedProduct = products.find((p) => p.id === selectedProdId) || products[0]

  const onSubmit = (data: DeliveryFormData) => {
    try {
      const sourceLoc =
        targetWh.locations.find((l) => l.id === data.sourceLocationId) || targetWh.locations[0]

      const lineTotal = data.quantityDemanded * selectedProduct.sellingPrice

      const newDelivery = addDelivery({
        customerName: data.customerName,
        sourceWarehouseId: targetWh.id,
        sourceWarehouseName: targetWh.name,
        sourceLocationId: sourceLoc.id,
        sourceLocationCode: sourceLoc.code,
        orderDate: new Date().toISOString().split('T')[0],
        scheduledDate: data.scheduledDate,
        totalItems: data.quantityDemanded,
        totalValue: lineTotal,
        carrier: data.carrier || 'Standard Freight',
        trackingNumber: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
        lines: [
          {
            id: `dell-${Date.now()}`,
            productId: selectedProduct.id,
            productSku: selectedProduct.sku,
            productName: selectedProduct.name,
            quantityDemanded: data.quantityDemanded,
            quantityShipped: 0,
            unitPrice: selectedProduct.sellingPrice,
            subtotal: lineTotal,
          },
        ],
      })

      toast({
        title: 'Delivery Order Created',
        description: `Order ${newDelivery.reference} created for ${data.customerName}.`,
        type: 'success',
      })

      reset()
      onClose()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create delivery order.',
        type: 'error',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Outbound Delivery"
      description="Prepare and schedule a customer shipment order from warehouse inventory."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Customer / Client Entity"
          placeholder="e.g. AeroDynamics Propulsion Labs"
          error={errors.customerName?.message}
          {...register('customerName')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Source Warehouse"
            error={errors.sourceWarehouseId?.message}
            {...register('sourceWarehouseId')}
          >
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.code} - {wh.name}
              </option>
            ))}
          </Select>

          <Select
            label="Picking / Outbound Location"
            error={errors.sourceLocationId?.message}
            {...register('sourceLocationId')}
          >
            {targetWh?.locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.code} ({loc.name})
              </option>
            ))}
          </Select>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 font-mono">
            Items to Dispatch
          </h4>
          <Select label="Product" {...register('productId')}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.name} (Available: {p.totalAvailable} {p.unit})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Quantity to Ship"
              type="number"
              error={errors.quantityDemanded?.message}
              {...register('quantityDemanded')}
            />
            <Input
              label="Logistics Carrier"
              placeholder="e.g. FedEx Freight, DHL"
              {...register('carrier')}
            />
          </div>
        </div>

        <Input
          label="Target Delivery Date"
          type="date"
          error={errors.scheduledDate?.message}
          {...register('scheduledDate')}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Create Delivery
          </Button>
        </div>
      </form>
    </Modal>
  )
}
