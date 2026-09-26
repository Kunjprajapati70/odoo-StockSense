import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search,
  Warehouse,
  MapPin,
  Filter,
  Boxes,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeftRight,
  SlidersHorizontal,
  RefreshCw,
  MoreVertical,
  Eye,
  X,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { StockItem, Product } from '@/types/inventory'
import { formatNumber } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { StockDetailDrawer } from '@/components/inventory/StockDetailDrawer'
import { NewTransferModal } from '@/components/forms/NewTransferModal'
import { NewAdjustmentModal } from '@/components/forms/NewAdjustmentModal'

export const InventoryPage: React.FC = () => {
  const { stockItems, warehouses, categories, products } = useInventory()
  const { toast } = useToast()

  // Filters state
  const [search, setSearch] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL')
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(false)

  // Drawer & Modals state
  const [drawerStockItem, setDrawerStockItem] = useState<StockItem | null>(null)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Menu click outside
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

  // Product lookup helper
  const productMap = useMemo(() => {
    const map = new Map<string, Product>()
    products.forEach((p) => {
      map.set(p.id, p)
      map.set(p.sku, p)
    })
    return map
  }, [products])

  // Available locations list based on warehouse selection
  const availableLocations = useMemo(() => {
    if (selectedWarehouse === 'ALL') {
      const set = new Set<string>()
      stockItems.forEach((si) => set.add(si.locationCode))
      return Array.from(set).sort()
    }
    const wh = warehouses.find((w) => w.id === selectedWarehouse)
    return wh ? wh.locations.map((l) => l.code) : []
  }, [selectedWarehouse, warehouses, stockItems])

  // Filtered Stock Positions
  const filteredStockPositions = useMemo(() => {
    return stockItems.filter((item) => {
      const q = search.toLowerCase().trim()
      const matchSearch =
        !q ||
        item.productName.toLowerCase().includes(q) ||
        item.productSku.toLowerCase().includes(q) ||
        item.locationCode.toLowerCase().includes(q) ||
        item.warehouseCode.toLowerCase().includes(q) ||
        item.warehouseName.toLowerCase().includes(q) ||
        (item.lotNumber && item.lotNumber.toLowerCase().includes(q))

      const matchWarehouse = selectedWarehouse === 'ALL' || item.warehouseId === selectedWarehouse
      const matchLocation = selectedLocation === 'ALL' || item.locationCode === selectedLocation

      // Match category
      const prod = productMap.get(item.productId) || productMap.get(item.productSku)
      const matchCategory =
        selectedCategory === 'ALL' ||
        (prod && prod.categoryId === selectedCategory) ||
        item.categoryName.toLowerCase().includes(selectedCategory.toLowerCase())

      // Status calculation: Available = On Hand - Reserved
      const onHand = item.quantityOnHand
      const reserved = item.allocated
      const available = onHand - reserved
      const reorderLevel = prod?.minStock ?? 20

      let calculatedStatus: 'healthy' | 'low_stock' | 'out_of_stock' = 'healthy'
      if (onHand === 0 || available <= 0) {
        calculatedStatus = 'out_of_stock'
      } else if (onHand <= reorderLevel) {
        calculatedStatus = 'low_stock'
      }

      let matchStatus = true
      if (selectedStatus !== 'ALL') {
        matchStatus = calculatedStatus === selectedStatus
      }

      return matchSearch && matchWarehouse && matchLocation && matchCategory && matchStatus
    })
  }, [stockItems, search, selectedWarehouse, selectedLocation, selectedCategory, selectedStatus, productMap])

  // ── STOCK SUMMARY KPIS ──────────────────────────────────────────────
  const totalUnits = filteredStockPositions.reduce((sum, item) => sum + item.quantityOnHand, 0)
  const totalReserved = filteredStockPositions.reduce((sum, item) => sum + item.allocated, 0)
  const totalAvailable = filteredStockPositions.reduce(
    (sum, item) => sum + Math.max(0, item.quantityOnHand - item.allocated),
    0,
  )

  const lowStockCount = filteredStockPositions.filter((item) => {
    const prod = productMap.get(item.productId) || productMap.get(item.productSku)
    const reorderLevel = prod?.minStock ?? 20
    return item.quantityOnHand > 0 && item.quantityOnHand <= reorderLevel
  }).length

  const outOfStockCount = filteredStockPositions.filter(
    (item) => item.quantityOnHand === 0 || item.quantityOnHand - item.allocated <= 0,
  ).length

  // Reset filters
  const handleResetFilters = () => {
    setSearch('')
    setSelectedWarehouse('ALL')
    setSelectedLocation('ALL')
    setSelectedCategory('ALL')
    setSelectedStatus('ALL')
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: 'Stock Overview Updated',
        description: 'Physical balances reconciled across all fulfillment nodes.',
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Stock Overview</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#ff6a00]/15 text-[#ff8c33] border border-[#ff6a00]/30">
              {filteredStockPositions.length} Positions
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Track available inventory across every warehouse and location.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs text-slate-300 hover:text-white"
            title="Refresh stock balances"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsTransferOpen(true)}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <ArrowLeftRight className="w-4 h-4 text-sky-400" />
            Move Stock
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAdjustmentOpen(true)}
            className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white shadow-lg shadow-[#ff6a00]/25 gap-1.5 font-semibold text-xs sm:text-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Cycle Count
          </Button>
        </div>
      </div>

      {/* ── STOCK SUMMARY (5 KPIS) ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* 1. Total Units */}
        <div className="p-4 rounded-xl bg-[#0e1320] border border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Total Units
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-0.5">
              {formatNumber(totalUnits)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Physical count</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Available Units */}
        <div className="p-4 rounded-xl bg-[#0e1320] border border-emerald-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
              Available
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-0.5">
              {formatNumber(totalAvailable)}
            </div>
            <div className="text-[11px] text-emerald-400/70 font-mono mt-0.5">Unallocated</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Reserved Units */}
        <div className="p-4 rounded-xl bg-[#0e1320] border border-amber-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
              Reserved
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-0.5">
              {formatNumber(totalReserved)}
            </div>
            <div className="text-[11px] text-amber-400/70 font-mono mt-0.5">Order holds</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Low Stock */}
        <div className="p-4 rounded-xl bg-[#0e1320] border border-amber-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
              Low Stock
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-0.5">
              {formatNumber(lowStockCount)}
            </div>
            <div className="text-[11px] text-amber-400/70 font-mono mt-0.5">Near threshold</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* 5. Out of Stock */}
        <div className="p-4 rounded-xl bg-[#0e1320] border border-rose-500/20 flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-rose-400">
              Out of Stock
            </div>
            <div className="text-2xl font-bold font-mono text-rose-300 mt-0.5">
              {formatNumber(outOfStockCount)}
            </div>
            <div className="text-[11px] text-rose-400/70 font-mono mt-0.5">Depleted bins</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ────────────────────────────────────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-[#0d1322] border border-white/[0.08] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, SKU or location..."
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

        {/* Filter Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Warehouse */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121826] border border-white/10 text-xs">
            <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 hidden sm:inline">Warehouse:</span>
            <select
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value)
                setSelectedLocation('ALL')
              }}
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

          {/* Location */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121826] border border-white/10 text-xs">
            <MapPin className="w-3.5 h-3.5 text-[#ff6a00] shrink-0" />
            <span className="text-slate-400 hidden sm:inline">Location:</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-[#121826] text-white">
                All Bins
              </option>
              {availableLocations.map((locCode) => (
                <option key={locCode} value={locCode} className="bg-[#121826] text-white">
                  {locCode}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
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

          {/* Stock Status */}
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

          {/* Clear button */}
          {(search ||
            selectedWarehouse !== 'ALL' ||
            selectedLocation !== 'ALL' ||
            selectedCategory !== 'ALL' ||
            selectedStatus !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
              title="Clear all filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN TABLE ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c101c] shadow-xl overflow-hidden relative">
        {isLoading ? (
          /* Skeletons */
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
                <div className="w-24 h-6 bg-white/[0.04] rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredStockPositions.length === 0 ? (
          /* Empty state */
          <div className="py-16 px-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-500 shadow-inner">
              <Boxes className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No stock positions found</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                No storage locations match your current filter parameters or search query.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                Clear Filters
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
                  <th className="px-4 py-3.5 font-semibold">Warehouse</th>
                  <th className="px-4 py-3.5 font-semibold">Location</th>
                  <th className="px-4 py-3.5 font-semibold text-right">On Hand</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Reserved</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Available</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Reorder Level</th>
                  <th className="px-4 py-3.5 font-semibold">Stock Level Meter</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredStockPositions.map((item) => {
                  const prod = productMap.get(item.productId) || productMap.get(item.productSku)
                  const unit = prod?.unit || 'pcs'
                  const onHand = item.quantityOnHand
                  const reserved = item.allocated
                  // Available = On Hand - Reserved
                  const available = onHand - reserved
                  const reorderLevel = prod?.minStock ?? 20

                  // Status
                  const isOut = onHand === 0 || available <= 0
                  const isLow = !isOut && onHand <= reorderLevel
                  const isHealthy = !isOut && !isLow

                  // Meter fill percentage (against 150% of reorder level or max stock)
                  const benchmark = Math.max(reorderLevel * 1.8, 50)
                  const fillPct = Math.min(Math.round((available / benchmark) * 100), 100)

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setDrawerStockItem(item)}
                      className="hover:bg-white/[0.025] cursor-pointer transition-colors group"
                    >
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:border-[#ff6a00]/40 transition-colors text-slate-400 group-hover:text-[#ff6a00]">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 max-w-[190px]">
                            <div className="font-semibold text-slate-100 group-hover:text-white truncate">
                              {item.productName}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 truncate">
                              Unit: <span className="uppercase text-slate-400">{unit}</span>
                              {item.lotNumber && ` • Lot: ${item.lotNumber}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-200 text-xs px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] group-hover:text-[#ff6a00] group-hover:border-[#ff6a00]/30 transition-colors whitespace-nowrap">
                          {item.productSku}
                        </span>
                      </td>

                      {/* Warehouse */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-200">
                          <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.warehouseCode}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                          {item.warehouseName.split('(')[0]}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <MapPin className="w-3.5 h-3.5 text-[#ff6a00]" />
                          <span className="px-2 py-0.5 rounded bg-white/[0.03] text-slate-200 border border-white/[0.06] font-semibold">
                            {item.locationCode}
                          </span>
                        </div>
                      </td>

                      {/* On Hand */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-white text-xs sm:text-sm whitespace-nowrap">
                        {formatNumber(onHand)}
                      </td>

                      {/* Reserved */}
                      <td className="px-4 py-3 text-right font-mono text-xs sm:text-sm whitespace-nowrap">
                        {reserved > 0 ? (
                          <span className="text-amber-400/90 font-medium">{formatNumber(reserved)}</span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>

                      {/* Available */}
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
                          {formatNumber(available)}
                        </span>
                      </td>

                      {/* Reorder Level */}
                      <td className="px-4 py-3 text-right font-mono text-slate-400 text-xs whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-white/[0.02]">
                          {formatNumber(reorderLevel)}
                        </span>
                      </td>

                      {/* Visual Quantity Indicator (Fill / Level Meter) */}
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-400">
                              {available > 0 ? `${available} ready` : 'Zero stock'}
                            </span>
                            <span className="text-slate-500">{fillPct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOut
                                  ? 'bg-rose-500'
                                  : isLow
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.max(fillPct, 6)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isHealthy && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                            Healthy
                          </span>
                        )}
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

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Orange Action Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDrawerStockItem(item)
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#ff6a00]/15 text-[#ff8c33] hover:bg-[#ff6a00] hover:text-white border border-[#ff6a00]/30 transition-all font-mono"
                            title="Inspect stock details & distribution"
                          >
                            Details
                          </button>

                          {/* Action Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMenuId(activeMenuId === item.id ? null : item.id)
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === item.id && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#141b2a] border border-white/10 shadow-2xl p-1 z-30 space-y-0.5 text-xs text-left"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenuId(null)
                                    setDrawerStockItem(item)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                                  Distribution View
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenuId(null)
                                    setIsTransferOpen(true)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                                >
                                  <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
                                  Transfer Item
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenuId(null)
                                    setIsAdjustmentOpen(true)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                                  Count Adjustment
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
        {!isLoading && filteredStockPositions.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.06] bg-[#0b0f1a] flex items-center justify-between text-xs text-slate-500 font-mono">
            <div>
              Showing <span className="text-slate-300 font-bold">{filteredStockPositions.length}</span> of{' '}
              <span className="text-slate-300 font-bold">{stockItems.length}</span> physical stock positions
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Formula: Available = On Hand - Reserved</span>
              <span className="text-[#ff6a00]">● StockSense Live Feeds</span>
            </div>
          </div>
        )}
      </div>

      {/* ── STOCK DETAIL DRAWER ───────────────────────────────────────────── */}
      <StockDetailDrawer
        stockItem={drawerStockItem}
        isOpen={!!drawerStockItem}
        onClose={() => setDrawerStockItem(null)}
        onTransfer={() => {
          setDrawerStockItem(null)
          setIsTransferOpen(true)
        }}
        onAdjust={() => {
          setDrawerStockItem(null)
          setIsAdjustmentOpen(true)
        }}
      />

      {/* ── TRANSFER & ADJUSTMENT MODALS ──────────────────────────────────── */}
      <NewTransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
      <NewAdjustmentModal isOpen={isAdjustmentOpen} onClose={() => setIsAdjustmentOpen(false)} />
    </div>
  )
}
