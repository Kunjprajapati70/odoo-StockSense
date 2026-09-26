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

const productSchema = z.object({
  sku: z.string().min(2, 'SKU must be at least 2 characters'),
  name: z.string().min(2, 'Product name is required'),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  unit: z.enum(['pcs', 'box', 'kg', 'm', 'pallet']),
  costPrice: z.coerce.number().positive('Cost must be positive'),
  sellingPrice: z.coerce.number().positive('Selling price must be positive'),
  minStock: z.coerce.number().min(0, 'Minimum stock cannot be negative'),
  maxStock: z.coerce.number().min(1, 'Maximum stock must be at least 1'),
  description: z.string().optional(),
  initialStock: z.coerce.number().min(0).default(0),
  warehouseId: z.string().optional(),
  locationId: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface NewProductModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NewProductModal: React.FC<NewProductModalProps> = ({ isOpen, onClose }) => {
  const { categories, warehouses, addProduct } = useInventory()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      barcode: '',
      categoryId: categories[0]?.id || '',
      unit: 'pcs',
      costPrice: 100,
      sellingPrice: 150,
      minStock: 10,
      maxStock: 100,
      description: '',
      initialStock: 0,
      warehouseId: warehouses[0]?.id || '',
    },
  })

  const selectedWhId = watch('warehouseId') || warehouses[0]?.id
  const targetWh = warehouses.find((w) => w.id === selectedWhId) || warehouses[0]

  const onSubmit = (data: ProductFormData) => {
    try {
      const selectedCategory = categories.find((c) => c.id === data.categoryId)
      addProduct({
        sku: data.sku.toUpperCase(),
        name: data.name,
        barcode: data.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        categoryId: data.categoryId,
        categoryName: selectedCategory ? selectedCategory.name : 'General',
        unit: data.unit,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        minStock: data.minStock,
        maxStock: data.maxStock,
        description: data.description,
        status: data.initialStock > data.minStock ? 'in_stock' : data.initialStock > 0 ? 'low_stock' : 'out_of_stock',
        initialStock: data.initialStock,
        warehouseId: data.warehouseId,
        locationId: data.locationId || targetWh?.locations[0]?.id,
      })

      toast({
        title: 'Product Created',
        description: `Product "${data.name}" (${data.sku}) added to catalog.`,
        type: 'success',
      })

      reset()
      onClose()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create product. Please check form values.',
        type: 'error',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Product"
      description="Add a new SKU to the central inventory catalog with baseline cost and storage parameters."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="SKU / Identifier"
            placeholder="e.g. SRV-AMD-9654"
            error={errors.sku?.message}
            {...register('sku')}
          />
          <Input
            label="Barcode / UPC / EAN"
            placeholder="Auto-generated if empty"
            error={errors.barcode?.message}
            {...register('barcode')}
          />
        </div>

        <Input
          label="Product Name"
          placeholder="e.g. AMD EPYC 9654 Genoa Server Blade"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            error={errors.categoryId?.message}
            {...register('categoryId')}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select label="Unit of Measure" {...register('unit')}>
            <option value="pcs">Pieces (pcs)</option>
            <option value="box">Box / Pack (box)</option>
            <option value="kg">Kilograms (kg)</option>
            <option value="m">Meters (m)</option>
            <option value="pallet">Full Pallet (pallet)</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Cost Price ($)"
            type="number"
            step="0.01"
            error={errors.costPrice?.message}
            {...register('costPrice')}
          />
          <Input
            label="Selling / Valuation Price ($)"
            type="number"
            step="0.01"
            error={errors.sellingPrice?.message}
            {...register('sellingPrice')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Min Reorder Threshold"
            type="number"
            error={errors.minStock?.message}
            {...register('minStock')}
          />
          <Input
            label="Max Stock Level"
            type="number"
            error={errors.maxStock?.message}
            {...register('maxStock')}
          />
        </div>

        {/* Initial Stock Intake Option */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#ff6a00] font-mono">
            Initial Stock Placement (Optional)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Initial Quantity"
              type="number"
              placeholder="0"
              {...register('initialStock')}
            />
            <Select label="Warehouse" {...register('warehouseId')}>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.code} - {wh.city}
                </option>
              ))}
            </Select>
            <Select label="Storage Location" {...register('locationId')}>
              {targetWh?.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} ({loc.name})
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono text-[11px]">
            Description & Notes
          </label>
          <textarea
            rows={2}
            className="w-full bg-[#121826] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00]"
            placeholder="Technical specs, handling instructions, or dimensions..."
            {...register('description')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Save Product
          </Button>
        </div>
      </form>
    </Modal>
  )
}
