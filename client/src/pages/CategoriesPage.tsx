import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { Tags, Package, Plus, Layers } from 'lucide-react'

export const CategoriesPage: React.FC = () => {
  const { categories, addCategory, products } = useInventory()
  const { toast } = useToast()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !code) return

    addCategory({
      name,
      code: code.toUpperCase(),
      description: description || 'General inventory category',
    })

    toast({
      title: 'Category Added',
      description: `Category "${name}" created in catalog.`,
      type: 'success',
    })

    setIsAddOpen(false)
    setName('')
    setCode('')
    setDescription('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Categories & Taxonomy"
        subtitle="Organize product lines, inventory grouping, and category-level valuation totals."
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        }
      />

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const matchingProducts = products.filter((p) => p.categoryId === cat.id)
          const actualCount = matchingProducts.length || cat.productCount
          const actualValuation = matchingProducts.reduce(
            (sum, p) => sum + p.totalOnHand * p.costPrice,
            cat.totalValuation,
          )

          return (
            <Card key={cat.id} className="p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#ff6a00]">
                    <Tags className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    {cat.code}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-3">{cat.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description}</p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3 font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Active SKUs</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {formatNumber(actualCount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Category Valuation</div>
                  <div className="text-lg font-bold text-[#ff8c33] mt-0.5 truncate">
                    {formatCurrency(actualValuation)}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Add Category Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Product Category">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category Name"
              placeholder="e.g. Cryogenics & Chillers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Code / Prefix"
              placeholder="e.g. CRYO-CHL"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono text-[11px]">
              Category Description
            </label>
            <textarea
              rows={3}
              className="w-full bg-[#121826] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00]"
              placeholder="Products encompassed, storage parameters..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
