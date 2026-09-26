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
import { Package, MapPin, Warehouse, Layers, Hash, Scale, AlertCircle } from 'lucide-react'

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required (min 2 characters)'),
  sku: z.string().min(2, 'SKU must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category selection is required'),
  unit: z.enum(['pcs', 'box', 'kg', 'm', 'pallet', 'bag']),
  minStock: z.coerce.number().min(0, 'Reorder level cannot be negative'),
  maxStock: z.coerce.number().min(1, 'Reorder quantity must be at least 1'),
  initialStock: z.coerce.number().min(0, 'Initial stock cannot be negative'),
  warehouseId: z.string().min(1, 'Target warehouse is required'),
  locationId: z.string().min(1, 'Storage location is required'),
  costPrice: z.coerce.number().min(0.01, 'Cost price must be positive'),
  sellingPrice: z.coerce.number().min(0.01, 'Selling price must be positive'),
  barcode: z.string().optional(),
  description: z.string().optional(),
})

export type ProductFormData = z.infer<typeof productSchema>

interface NewProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const NewProductModal: React.FC<NewProductModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { categories, warehouses, addProduct } = useInventory()
  const { toast } = useToast()

  const defaultWarehouse = warehouses[0]
  const defaultLocation = defaultWarehouse?.locations[0]

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      categoryId: categories[0]?.id || '',
      unit: 'pcs',
      minStock: 20,
      maxStock: 100,
      initialStock: 0,
      warehouseId: defaultWarehouse?.id || '',
      locationId: defaultLocation?.id || '',
      costPrice: 50,
      sellingPrice: 75,
      barcode: '',
      description: '',
    },
  })

  const selectedWhId = watch('warehouseId') || defaultWarehouse?.id
  const targetWh = warehouses.find((w) => w.id === selectedWhId) || defaultWarehouse

  const onSubmit = (data: ProductFormData) => {
    try {
      const selectedCategory = categories.find((c) => c.id === data.categoryId)
      const targetLocation = targetWh?.locations.find((l) => l.id === data.locationId) || targetWh?.locations[0]

      const autoBarcode = data.barcode?.trim() || `${Math.floor(100000000000 + Math.random() * 900000000000)}`

      addProduct({
        sku: data.sku.trim().toUpperCase(),
        name: data.name.trim(),
        barcode: autoBarcode,
        categoryId: data.categoryId,
        categoryName: selectedCategory ? selectedCategory.name : 'General Supplies',
        unit: data.unit,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        minStock: data.minStock,
        maxStock: data.maxStock,
        description: data.description || `${data.name} master SKU catalog item.`,
        status:
          data.initialStock > data.minStock
            ? 'in_stock'
            : data.initialStock > 0
            ? 'low_stock'
            : 'out_of_stock',
        initialStock: data.initialStock,
        warehouseId: data.warehouseId,
        locationId: targetLocation?.id,
      })

      toast({
        title: 'Product Created Successfully',
        description: `Product "${data.name}" (${data.sku.toUpperCase()}) added to inventory.`,
        type: 'success',
      })

      reset()
      onSuccess?.()
      onClose()
    } catch {
      toast({
        title: 'Error Creating Product',
        description: 'Failed to create product. Please verify entered values and retry.',
        type: 'error',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Product"
      description="Register a new SKU with storage parameters, safety thresholds, and initial intake."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-white/[0.06]">
            <Package className="w-4 h-4 text-[#ff6a00]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Product Information
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Product Name *"
                placeholder="e.g. Steel Rod 8mm or AMD Server Blade"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <div>
              <Input
                label="SKU Identifier *"
                placeholder="e.g. STL-008"
                error={errors.sku?.message}
                {...register('sku')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Select
                label="Category *"
                error={errors.categoryId?.message}
                {...register('categoryId')}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select
                label="Unit of Measure *"
                error={errors.unit?.message}
                {...register('unit')}
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="bag">Bags (bag)</option>
                <option value="box">Boxes (box)</option>
                <option value="m">Meters (m)</option>
                <option value="pallet">Pallets (pallet)</option>
              </Select>
            </div>

            <div>
              <Input
                label="Barcode / EAN (Optional)"
                placeholder="Auto-generated if empty"
                error={errors.barcode?.message}
                {...register('barcode')}
              />
            </div>
          </div>
        </div>

        {/* Reorder Configuration */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/[0.04] to-orange-500/[0.02] border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                Reorder Configuration
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Inventory Safety Limits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Reorder Level (Safety Threshold) *"
              type="number"
              placeholder="e.g. 50"
              error={errors.minStock?.message}
              {...register('minStock')}
            />
            <Input
              label="Reorder Quantity (Max Target) *"
              type="number"
              placeholder="e.g. 200"
              error={errors.maxStock?.message}
              {...register('maxStock')}
            />
          </div>
        </div>

        {/* Initial Stock Intake & Location Assignment */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-[#ff6a00]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Initial Stock & Storage Location
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Warehouse Placement</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Initial Stock *"
              type="number"
              placeholder="0"
              error={errors.initialStock?.message}
              {...register('initialStock')}
            />

            <Select
              label="Warehouse *"
              error={errors.warehouseId?.message}
              {...register('warehouseId')}
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.code} - {wh.city}
                </option>
              ))}
            </Select>

            <Select
              label="Location *"
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
        </div>

        {/* Pricing & Commercials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Cost Price ($) *"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.costPrice?.message}
            {...register('costPrice')}
          />
          <Input
            label="Selling Price ($) *"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.sellingPrice?.message}
            {...register('sellingPrice')}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono text-[11px]">
            Description (Optional)
          </label>
          <textarea
            rows={2}
            className="w-full bg-[#121826] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] transition-colors"
            placeholder="Item specifications, handling parameters, and notes..."
            {...register('description')}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white shadow-lg shadow-[#ff6a00]/20 font-semibold"
          >
            Create Product
          </Button>
        </div>
      </form>
    </Modal>
  )
}
