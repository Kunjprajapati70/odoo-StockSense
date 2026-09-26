import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Package,
  Warehouse,
  Scale,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  FileText,
} from 'lucide-react'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { Product } from '@/types/inventory'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { NewProductModal } from '@/components/forms/NewProductModal'
import { ProductDetailDrawer } from '@/components/products/ProductDetailDrawer'
import { useNavigate } from 'react-router-dom'

export const ProductsPage: React.FC = () => {
  const { products, categories, warehouses } = useInventory()
  const { toast } = useToast()
  const navigate = useNavigate()

  // State
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(false)

  // Modals & Drawer
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Click outside to close action menu
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const q = search.toLowerCase().trim()
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)

      // Category filter
      const matchCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory

      // Status filter
      let matchStatus = true
      if (selectedStatus === 'healthy' || selectedStatus === 'in_stock') {
        matchStatus = p.status === 'in_stock'
      } else if (selectedStatus === 'low_stock') {
        matchStatus = p.status === 'low_stock'
      } else if (selectedStatus === 'out_of_stock') {
        matchStatus = p.status === 'out_of_stock'
      }

      // Warehouse filter
      let matchWarehouse = true
      if (selectedWarehouse !== 'ALL') {
        matchWarehouse =
          p.warehouseStock?.some((ws) => ws.warehouseId === selectedWarehouse && ws.onHand > 0) ??
          true
      }

      return matchSearch && matchCat && matchStatus && matchWarehouse
    })
  }, [products, search, selectedCategory, selectedStatus, selectedWarehouse])

  // KPIs
  const totalSkus = products.length
  const healthyCount = products.filter((p) => p.status === 'in_stock').length
  const lowStockCount = products.filter((p) => p.status === 'low_stock').length
  const outOfStockCount = products.filter((p) => p.status === 'out_of_stock').length

  // Reset filters
  const handleResetFilters = () => {
    setSearch('')
    setSelectedCategory('ALL')
    setSelectedWarehouse('ALL')
    setSelectedStatus('ALL')
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      toast({
        title: 'Export Skipped',
        description: 'No products available to export matching the current criteria.',
        type: 'warning',
      })
      return
    }

    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Unit',
      'Total Stock',
      'Available',
      'Reserved',
      'Reorder Level',
      'Reorder Quantity',
      'Status',
      'Cost Price',
      'Selling Price',
      'Barcode',
    ]

    const rows = filteredProducts.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      `"${p.categoryName}"`,
      p.unit,
      p.totalOnHand,
      p.totalAvailable,
      p.totalAllocated,
      p.minStock,
      p.maxStock,
      p.status,
      p.costPrice,
      p.sellingPrice,
      p.barcode,
    ])

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `StockSense_Products_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Catalog Exported',
      description: `Successfully exported ${filteredProducts.length} items to CSV.`,
      type: 'success',
    })
  }

  // Simulate refresh / loading state
  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: 'Catalog Synced',
        description: 'Product balances updated from central inventory state.',
        type: 'info',
      })
    }, 450)
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Products</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#ff6a00]/15 text-[#ff8c33] border border-[#ff6a00]/30">
              {totalSkus} SKUs
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage products, SKUs, categories and inventory settings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs text-slate-300 hover:text-white"
            title="Refresh product balances"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white shadow-lg shadow-[#ff6a00]/25 gap-1.5 font-semibold text-xs sm:text-sm px-4"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* ── KPI HIGHLIGHT STRIP ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0e1320] border border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Total Catalog
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-0.5">
              {formatNumber(totalSkus)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Active SKUs</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1320] border border-emerald-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
              Healthy Stock
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-0.5">
              {formatNumber(healthyCount)}
            </div>
            <div className="text-[11px] text-emerald-400/70 font-mono mt-0.5">
              Optimal buffer
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1320] border border-amber-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
              Low Stock
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-0.5">
              {formatNumber(lowStockCount)}
            </div>
            <div className="text-[11px] text-amber-400/70 font-mono mt-0.5">
              Below threshold
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1320] border border-rose-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-rose-400">
              Out of Stock
            </div>
            <div className="text-2xl font-bold font-mono text-rose-300 mt-0.5">
              {formatNumber(outOfStockCount)}
            </div>
            <div className="text-[11px] text-rose-400/70 font-mono mt-0.5">Depleted units</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── TOP TOOLBAR (Search + Filters + Import / Export) ──────────── */}
      <div className="p-3.5 rounded-2xl bg-[#0d1322] border border-white/[0.08] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or SKU..."
            className="w-full bg-[#121826] border border-white/10 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters & Actions Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121826] border border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 hidden sm:inline">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
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

          {/* Warehouse Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121826] border border-white/10 text-xs">
            <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 hidden sm:inline">Warehouse:</span>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-[#121826] text-white">
                All Hubs
              </option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#121826] text-white">
                  {w.code} ({w.city})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121826] border border-white/10 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-[#121826] text-white">
                All Statuses
              </option>
              <option value="healthy" className="bg-[#121826] text-emerald-400">
                Healthy
              </option>
              <option value="low_stock" className="bg-[#121826] text-amber-400">
                Low Stock
              </option>
              <option value="out_of_stock" className="bg-[#121826] text-rose-400">
                Out of Stock
              </option>
            </select>
          </div>

          {/* Reset button if filtered */}
          {(search || selectedCategory !== 'ALL' || selectedWarehouse !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
              title="Clear all filters"
            >
              Clear
            </button>
          )}

          <div className="h-4 w-px bg-white/10 hidden sm:block mx-0.5" />

          {/* Import Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="text-xs text-slate-300 hover:text-white border-white/10 gap-1.5"
            title="Import products from CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Import</span>
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs text-slate-300 hover:text-white border-white/10 gap-1.5"
            title="Export current view to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* ── PRODUCT TABLE ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c101c] shadow-xl overflow-hidden relative">
        {isLoading ? (
          /* Loading State (Skeletons) */
          <div className="p-6 space-y-4">
            <div className="h-6 bg-white/[0.04] rounded animate-pulse w-48 mb-6" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-white/[0.04] animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/[0.04] rounded w-1/3" />
                  <div className="h-3 bg-white/[0.02] rounded w-1/4" />
                </div>
                <div className="w-20 h-4 bg-white/[0.04] rounded" />
                <div className="w-16 h-4 bg-white/[0.04] rounded" />
                <div className="w-16 h-4 bg-white/[0.04] rounded" />
                <div className="w-24 h-6 bg-white/[0.04] rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-500 shadow-inner">
              <Package className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No products found</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                No inventory items match your current filter parameters or search term "{search}".
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                Clear Filters
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </Button>
            </div>
          </div>
        ) : (
          /* Populated Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#0e1424] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-semibold">Product</th>
                  <th className="px-4 py-3.5 font-semibold">SKU</th>
                  <th className="px-4 py-3.5 font-semibold">Category</th>
                  <th className="px-4 py-3.5 font-semibold">Unit</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Total Stock</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Available</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Reserved</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Reorder Level</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredProducts.map((p) => {
                  const isLow = p.status === 'low_stock'
                  const isOut = p.status === 'out_of_stock'
                  const isHealthy = p.status === 'in_stock'

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setDrawerProduct(p)}
                      className="hover:bg-white/[0.025] cursor-pointer transition-colors group"
                    >
                      {/* 1. Product Name & Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:border-[#ff6a00]/40 transition-colors text-slate-400 group-hover:text-[#ff6a00]">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                            <div className="font-semibold text-slate-100 group-hover:text-white truncate">
                              {p.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 truncate">
                              {p.barcode || 'NO-BARCODE'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. SKU */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-200 text-xs px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] group-hover:text-[#ff6a00] group-hover:border-[#ff6a00]/30 transition-colors whitespace-nowrap">
                          {p.sku}
                        </span>
                      </td>

                      {/* 3. Category */}
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-white/[0.02] border border-white/[0.05]">
                          {p.categoryName}
                        </span>
                      </td>

                      {/* 4. Unit */}
                      <td className="px-4 py-3 font-mono uppercase text-slate-400 text-xs whitespace-nowrap">
                        {p.unit}
                      </td>

                      {/* 5. Total Stock */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-white text-xs sm:text-sm whitespace-nowrap">
                        {formatNumber(p.totalOnHand)}
                      </td>

                      {/* 6. Available */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
                        <span
                          className={
                            isOut
                              ? 'text-rose-400'
                              : isLow
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {formatNumber(p.totalAvailable)}
                        </span>
                      </td>

                      {/* 7. Reserved */}
                      <td className="px-4 py-3 text-right font-mono text-slate-400 text-xs sm:text-sm whitespace-nowrap">
                        {p.totalAllocated > 0 ? (
                          <span className="text-amber-300/90 font-medium">
                            {formatNumber(p.totalAllocated)}
                          </span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>

                      {/* 8. Reorder Level */}
                      <td className="px-4 py-3 text-right font-mono text-slate-300 text-xs whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-slate-400">
                          {formatNumber(p.minStock)}
                        </span>
                      </td>

                      {/* 9. Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isHealthy && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                            Healthy
                          </span>
                        )}
                        {isLow}
                        {isLow && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                            Low Stock
                          </span>
                        )}
                        {isOut && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
                            Out of Stock
                          </span>
                        )}
                      </td>

                      {/* 10. Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Orange Action Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDrawerProduct(p)
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#ff6a00]/15 text-[#ff8c33] hover:bg-[#ff6a00] hover:text-white border border-[#ff6a00]/30 transition-all font-mono"
                            title="Inspect product detail"
                          >
                            Details
                          </button>

                          {/* Three-Dot Action Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMenuId(activeMenuId === p.id ? null : p.id)
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                              title="Product actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === p.id && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#141b2a] border border-white/10 shadow-2xl p-1 z-30 space-y-0.5 text-xs text-left"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenuId(null)
                                    setDrawerProduct(p)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                                  View Drawer
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenuId(null)
                                    navigate('/receipts')
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5 text-[#ff6a00]" />
                                  Receive Stock
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenuId(null)
                                    navigate('/adjustments')
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                                  Stock Adjustment
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.06] bg-[#0b0f1a] flex items-center justify-between text-xs text-slate-500 font-mono">
            <div>
              Showing <span className="text-slate-300 font-bold">{filteredProducts.length}</span> of{' '}
              <span className="text-slate-300 font-bold">{products.length}</span> products
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Click any row to open slide-over detail drawer</span>
              <span className="text-[#ff6a00]">● StockSense Live</span>
            </div>
          </div>
        )}
      </div>

      {/* ── PRODUCT DETAIL SLIDE-OVER DRAWER ─────────────────────────── */}
      <ProductDetailDrawer
        product={drawerProduct}
        isOpen={!!drawerProduct}
        onClose={() => setDrawerProduct(null)}
      />

      {/* ── ADD PRODUCT MODAL ────────────────────────────────────────── */}
      <NewProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* ── IMPORT MODAL ─────────────────────────────────────────────── */}
      {isImportModalOpen && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Products Catalog"
          description="Batch import products into the master inventory directory via CSV or Excel format."
          size="md"
        >
          <div className="space-y-4">
            <div className="border-2 border-dashed border-white/10 hover:border-[#ff6a00]/50 rounded-2xl p-6 text-center space-y-2 cursor-pointer transition-colors bg-white/[0.01]">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto text-[#ff6a00]">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Click to upload or drag & drop</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  CSV, XLSX or TXT (Max 10MB per file)
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 font-mono text-[11px] uppercase">
                Expected Column Headers:
              </div>
              <p className="font-mono text-[10px] text-slate-500">
                name, sku, category, unit, cost_price, selling_price, min_stock, max_stock, initial_stock
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Download template
                  const sample = `name,sku,category,unit,cost_price,selling_price,min_stock,max_stock,initial_stock\nSteel Rod 8mm,STL-008,Raw Material,kg,4.50,7.20,50,300,150\nCement 50kg,CEM-050,Construction,bag,12.00,18.50,20,100,8`
                  const blob = new Blob([sample], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'stocksense_product_template.csv'
                  a.click()
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Download Template CSV
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsImportModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: 'Import Processed',
                      description: 'Sample products parsed and validated against catalog schema.',
                      type: 'success',
                    })
                    setIsImportModalOpen(false)
                  }}
                  className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white"
                >
                  Confirm Import
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
