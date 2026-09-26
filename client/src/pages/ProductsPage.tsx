import React, { useState, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, Column } from '@/components/common/DataTable'
import { SearchInput } from '@/components/common/SearchInput'
import { StockStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Product } from '@/types/inventory'
import { useInventory } from '@/context/InventoryContext'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { Plus, Package, Warehouse, Filter, ArrowUpRight } from 'lucide-react'
import { NewProductModal } from '@/components/forms/NewProductModal'

export const ProductsPage: React.FC = () => {
  const { products, categories, warehouses } = useInventory()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)

      const matchCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus

      return matchSearch && matchCat && matchStatus
    })
  }, [products, search, selectedCategory, selectedStatus])

  // KPIs
  const totalValuation = products.reduce((sum, p) => sum + p.totalOnHand * p.costPrice, 0)
  const lowStockCount = products.filter((p) => p.status === 'low_stock').length
  const outOfStockCount = products.filter((p) => p.status === 'out_of_stock').length

  const columns: Column<Product>[] = [
    {
      key: 'sku',
      header: 'SKU & Barcode',
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-mono font-bold text-white group-hover:text-[#ff6a00] transition-colors">
            {p.sku}
          </div>
          <div className="text-[11px] font-mono text-slate-500">{p.barcode}</div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Product Details',
      sortable: true,
      render: (p) => (
        <div className="max-w-xs">
          <div className="font-semibold text-slate-100 truncate">{p.name}</div>
          <div className="text-xs text-slate-400 truncate">{p.categoryName}</div>
        </div>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (p) => <span className="font-mono text-slate-400 uppercase text-xs">{p.unit}</span>,
    },
    {
      key: 'costPrice',
      header: 'Cost Price',
      sortable: true,
      align: 'right',
      render: (p) => formatCurrency(p.costPrice),
    },
    {
      key: 'sellingPrice',
      header: 'Selling Price',
      sortable: true,
      align: 'right',
      render: (p) => {
        const margin = ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100
        return (
          <div>
            <div className="font-mono font-medium text-slate-200">{formatCurrency(p.sellingPrice)}</div>
            <div className="text-[10px] font-mono text-emerald-400">+{margin.toFixed(0)}% margin</div>
          </div>
        )
      },
    },
    {
      key: 'totalOnHand',
      header: 'On Hand',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono font-bold text-white text-sm">
          {formatNumber(p.totalOnHand)}
        </span>
      ),
    },
    {
      key: 'totalAvailable',
      header: 'Available',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span
          className={`font-mono font-semibold ${
            p.totalAvailable === 0
              ? 'text-rose-400'
              : p.totalAvailable <= p.minStock
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}
        >
          {formatNumber(p.totalAvailable)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Stock Status',
      render: (p) => <StockStatusBadge status={p.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <Button
          variant="outline"
          size="xs"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedProduct(p)
          }}
        >
          Locations
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog"
        subtitle="Centralized product master data with real-time stock balances across warehouses."
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsNewProductOpen(true)}>
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-400">Total SKUs</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatNumber(products.length)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Across 6 product categories</div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-400">Total Catalog Valuation</div>
          <div className="text-2xl font-extrabold text-[#ff8c33] font-mono mt-1">
            {formatCurrency(totalValuation)}
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Based on current on-hand cost</div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-400">Low Stock SKUs</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {lowStockCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">Below minimum safety levels</div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-400">Depleted / Stockout</div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
            {outOfStockCount}
          </div>
          <div className="text-xs text-rose-400/80 mt-1">Zero available units</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0e131f] border border-white/[0.08]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by product name, SKU, or barcode..."
        />

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141b2a] border border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#121826] text-white">
                All Categories
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#121826] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141b2a] border border-white/10 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#121826] text-white">
                All Statuses
              </option>
              <option value="in_stock" className="bg-[#121826] text-white">
                In Stock
              </option>
              <option value="low_stock" className="bg-[#121826] text-white">
                Low Stock
              </option>
              <option value="out_of_stock" className="bg-[#121826] text-white">
                Out of Stock
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Data Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => setSelectedProduct(p)}
        emptyTitle="No products match your filters"
        emptyDescription="Try clearing your search query or adjusting category filters."
        emptyActionLabel="Add New Product"
        onEmptyAction={() => setIsNewProductOpen(true)}
      />

      {/* Warehouse Breakdown Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={selectedProduct.name}
          description={`SKU: ${selectedProduct.sku} • Barcode: ${selectedProduct.barcode}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* High-level stats */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Total On Hand</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {selectedProduct.totalOnHand} {selectedProduct.unit}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Allocated / Reserved</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                  {selectedProduct.totalAllocated} {selectedProduct.unit}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Net Available</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {selectedProduct.totalAvailable} {selectedProduct.unit}
                </div>
              </div>
            </div>

            {/* Warehouse Stock Matrix */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-3 flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-[#ff6a00]" /> Physical Warehouse Stock Allocation
              </h4>
              <div className="space-y-2">
                {warehouses.map((wh) => {
                  const whStock = selectedProduct.warehouseStock?.find(
                    (ws) => ws.warehouseId === wh.id,
                  )
                  const onHand = whStock ? whStock.onHand : 0
                  const avail = whStock ? whStock.available : 0

                  return (
                    <div
                      key={wh.id}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs sm:text-sm">{wh.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {wh.code} • {wh.city}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right font-mono text-xs">
                        <div>
                          <div className="text-slate-400 text-[10px]">On Hand</div>
                          <div className="font-bold text-white">{onHand}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">Available</div>
                          <div className="font-bold text-emerald-400">{avail}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {selectedProduct.description && (
              <div className="text-xs text-slate-400 p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                <span className="font-semibold text-slate-300">Catalog Description: </span>
                {selectedProduct.description}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-white/[0.08]">
              <Button variant="secondary" size="sm" onClick={() => setSelectedProduct(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Product Modal */}
      <NewProductModal isOpen={isNewProductOpen} onClose={() => setIsNewProductOpen(false)} />
    </div>
  )
}
