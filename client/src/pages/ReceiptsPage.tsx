import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus,
  Search,
  Warehouse,
  Truck,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreVertical,
  Eye,
  RefreshCw,
  X,
  Layers,
  Package,
} from 'lucide-react'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { Receipt, ReceiptStatus } from '@/types/inventory'
import { formatNumber, formatDate, formatCurrency } from '@/utils/formatters'
import { OperationStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { NewReceiptModal } from '@/components/forms/NewReceiptModal'
import { ReceiptDetailDrawer } from '@/components/receipts/ReceiptDetailDrawer'

export const ReceiptsPage: React.FC = () => {
  const { receipts, warehouses, validateReceipt } = useInventory()
  const { toast } = useToast()

  // Filter States
  const [search, setSearch] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Drawer & Modal States
  const [isNewReceiptOpen, setIsNewReceiptOpen] = useState(false)
  const [drawerReceipt, setDrawerReceipt] = useState<Receipt | null>(null)
  const [validationModalReceipt, setValidationModalReceipt] = useState<Receipt | null>(null)
  const [isValidating, setIsValidating] = useState(false)
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

  // Suppliers List
  const suppliers = useMemo(() => {
    const set = new Set<string>()
    receipts.forEach((r) => set.add(r.supplierName))
    return Array.from(set).sort()
  }, [receipts])

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const q = search.toLowerCase().trim()
      const matchSearch =
        !q ||
        r.reference.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q) ||
        r.destinationWarehouseName.toLowerCase().includes(q) ||
        r.lines.some(
          (l) =>
            l.productName.toLowerCase().includes(q) ||
            l.productSku.toLowerCase().includes(q),
        )

      const matchSupplier = selectedSupplier === 'ALL' || r.supplierName === selectedSupplier
      const matchWarehouse = selectedWarehouse === 'ALL' || r.destinationWarehouseId === selectedWarehouse
      const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus
      const matchDate = !selectedDate || r.orderDate === selectedDate || r.scheduledDate === selectedDate

      return matchSearch && matchSupplier && matchWarehouse && matchStatus && matchDate
    })
  }, [receipts, search, selectedSupplier, selectedWarehouse, selectedStatus, selectedDate])

  // Summary KPIs
  const totalReceiptsCount = receipts.length
  const waitingCount = receipts.filter((r) => r.status === 'waiting' || r.status === 'ready').length
  const completedCount = receipts.filter((r) => r.status === 'done').length
  const draftCount = receipts.filter((r) => r.status === 'draft').length

  const handleResetFilters = () => {
    setSearch('')
    setSelectedSupplier('ALL')
    setSelectedWarehouse('ALL')
    setSelectedStatus('ALL')
    setSelectedDate('')
  }

  // Handle Quick Validation with confirmation
  const handleValidateClick = (receipt: Receipt, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setValidationModalReceipt(receipt)
  }

  const handleConfirmValidation = () => {
    if (!validationModalReceipt) return
    try {
      setIsValidating(true)
      validateReceipt(validationModalReceipt.id)

      const totalQty = validationModalReceipt.lines.reduce(
        (sum, l) => sum + (l.quantityExpected || 0),
        0,
      )

      toast({
        title: 'Receipt Validated Successfully',
        description: `Inventory increased by +${totalQty} units into ${validationModalReceipt.destinationWarehouseName}. Stock ledger updated.`,
        type: 'success',
      })

      setValidationModalReceipt(null)
    } catch {
      toast({
        title: 'Validation Error',
        description: 'Failed to validate receipt.',
        type: 'error',
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: 'Inbound Stream Synced',
        description: 'Latest purchase requisitions and delivery arrivals updated.',
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Receipts</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#ff6a00]/15 text-[#ff8c33] border border-[#ff6a00]/30">
              {receipts.length} Orders
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Track incoming goods and update inventory when received.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs text-slate-300 hover:text-white"
            title="Refresh receipts stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewReceiptOpen(true)}
            className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white shadow-lg shadow-[#ff6a00]/25 gap-1.5 font-semibold text-xs sm:text-sm px-4"
          >
            <Plus className="w-4 h-4" />
            New Receipt
          </Button>
        </div>
      </div>

      {/* ── KPI HIGHLIGHT STRIP ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0e1320] border border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Total Inbound
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-0.5">
              {formatNumber(totalReceiptsCount)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Purchase Orders</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1320] border border-amber-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
              Awaiting Intake
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-0.5">
              {formatNumber(waitingCount)}
            </div>
            <div className="text-[11px] text-amber-400/70 font-mono mt-0.5">Waiting & Ready</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1320] border border-emerald-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
              Completed Receipts
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-0.5">
              {formatNumber(completedCount)}
            </div>
            <div className="text-[11px] text-emerald-400/70 font-mono mt-0.5">Stock Verified</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-700/40 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Draft Orders
            </div>
            <div className="text-2xl font-bold font-mono text-slate-300 mt-0.5">
              {formatNumber(draftCount)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Pending Sign-off</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400">
            <Layers className="w-5 h-5" />
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
            placeholder="Search receipt number, supplier, or product..."
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

        {/* Filter Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Supplier Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121826] border border-white/10 text-xs">
            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 hidden sm:inline">Supplier:</span>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium max-w-[150px] truncate"
            >
              <option value="ALL" className="bg-[#121826] text-white">
                All Suppliers
              </option>
              {suppliers.map((s) => (
                <option key={s} value={s} className="bg-[#121826] text-white">
                  {s}
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

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121826] border border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-[#121826] text-white">
                All Statuses
              </option>
              <option value="draft" className="bg-[#121826] text-slate-300">
                Draft
              </option>
              <option value="waiting" className="bg-[#121826] text-amber-400">
                Waiting
              </option>
              <option value="ready" className="bg-[#121826] text-sky-400">
                Ready
              </option>
              <option value="done" className="bg-[#121826] text-emerald-400">
                Done
              </option>
              <option value="cancelled" className="bg-[#121826] text-rose-400">
                Canceled
              </option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121826] border border-white/10 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-mono text-[11px]"
            />
          </div>

          {/* Clear button */}
          {(search ||
            selectedSupplier !== 'ALL' ||
            selectedWarehouse !== 'ALL' ||
            selectedStatus !== 'ALL' ||
            selectedDate) && (
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

      {/* ── RECEIPTS TABLE ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c101c] shadow-xl overflow-hidden relative">
        {isLoading ? (
          /* Skeletons */
          <div className="p-6 space-y-4">
            <div className="h-6 bg-white/[0.04] rounded animate-pulse w-48 mb-6" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-white/[0.04] animate-pulse">
                <div className="w-24 h-4 bg-white/[0.04] rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/[0.04] rounded w-1/3" />
                  <div className="h-3 bg-white/[0.02] rounded w-1/4" />
                </div>
                <div className="w-20 h-4 bg-white/[0.04] rounded" />
                <div className="w-24 h-6 bg-white/[0.04] rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredReceipts.length === 0 ? (
          /* Empty state */
          <div className="py-16 px-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-500 shadow-inner">
              <Truck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No receipts found</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                No incoming goods orders match your filter criteria.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                Clear Filters
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewReceiptOpen(true)}
                className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                New Receipt
              </Button>
            </div>
          </div>
        ) : (
          /* Populated Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#0e1424] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-semibold">Receipt Number</th>
                  <th className="px-4 py-3.5 font-semibold">Supplier</th>
                  <th className="px-4 py-3.5 font-semibold">Warehouse</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Items</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Expected Qty</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Received Qty</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                  <th className="px-4 py-3.5 font-semibold">Date</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredReceipts.map((r) => {
                  const totalExpected = r.lines.reduce((sum, l) => sum + l.quantityExpected, 0)
                  const totalReceived = r.lines.reduce((sum, l) => sum + (l.quantityReceived || 0), 0)
                  const isDone = r.status === 'done'
                  const isCancelled = r.status === 'cancelled'

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setDrawerReceipt(r)}
                      className="hover:bg-white/[0.025] cursor-pointer transition-colors group"
                    >
                      {/* Receipt Number */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-white text-xs group-hover:text-[#ff6a00] transition-colors">
                          {r.reference}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-100 group-hover:text-white truncate max-w-[200px]">
                          {r.supplierName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Order Date: {formatDate(r.orderDate)}
                        </div>
                      </td>

                      {/* Warehouse */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-200 flex items-center gap-1.5">
                          <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                          <span>{r.destinationWarehouseName.split('(')[0]}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#ff8c33]">
                          Dock: {r.destinationLocationCode}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-slate-300">
                          {r.lines.length} {r.lines.length === 1 ? 'SKU' : 'SKUs'}
                        </span>
                      </td>

                      {/* Expected Qty */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-white text-xs sm:text-sm whitespace-nowrap">
                        {formatNumber(totalExpected)}
                      </td>

                      {/* Received Qty */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
                        <span className={isDone ? 'text-emerald-400' : 'text-slate-400'}>
                          {formatNumber(totalReceived)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <OperationStatusBadge status={r.status} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {formatDate(r.scheduledDate)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Orange Details Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDrawerReceipt(r)
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#ff6a00]/15 text-[#ff8c33] hover:bg-[#ff6a00] hover:text-white border border-[#ff6a00]/30 transition-all font-mono"
                            title="Inspect receipt detail"
                          >
                            Details
                          </button>

                          {/* Quick Validate Button if pending */}
                          {!isDone && !isCancelled && (
                            <button
                              onClick={(e) => handleValidateClick(r, e)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-800/40 transition-all font-mono"
                              title="Validate receipt and intake stock"
                            >
                              Validate
                            </button>
                          )}

                          {/* Three-Dot Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMenuId(activeMenuId === r.id ? null : r.id)
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === r.id && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#141b2a] border border-white/10 shadow-2xl p-1 z-30 space-y-0.5 text-xs text-left"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenuId(null)
                                    setDrawerReceipt(r)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                                  View Details
                                </button>

                                {!isDone && !isCancelled && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setActiveMenuId(null)
                                      handleValidateClick(r)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-600/30 transition-colors"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Validate Intake
                                  </button>
                                )}
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
        {!isLoading && filteredReceipts.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.06] bg-[#0b0f1a] flex items-center justify-between text-xs text-slate-500 font-mono">
            <div>
              Showing <span className="text-slate-300 font-bold">{filteredReceipts.length}</span> of{' '}
              <span className="text-slate-300 font-bold">{receipts.length}</span> inbound receipts
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Validation immediately increments warehouse stock balances</span>
              <span className="text-[#ff6a00]">● StockSense Logistics Stream</span>
            </div>
          </div>
        )}
      </div>

      {/* ── RECEIPT DETAIL DRAWER ─────────────────────────────────────────── */}
      <ReceiptDetailDrawer
        receipt={drawerReceipt}
        isOpen={!!drawerReceipt}
        onClose={() => setDrawerReceipt(null)}
        onValidated={() => setDrawerReceipt(null)}
      />

      {/* ── NEW RECEIPT 3-STEP MODAL ──────────────────────────────────────── */}
      <NewReceiptModal
        isOpen={isNewReceiptOpen}
        onClose={() => setIsNewReceiptOpen(false)}
      />

      {/* ── VALIDATION WARNING CONFIRMATION MODAL ─────────────────────────── */}
      {validationModalReceipt && (
        <Modal
          isOpen={!!validationModalReceipt}
          onClose={() => setValidationModalReceipt(null)}
          title="Confirm Receipt Validation"
          description="Immediate inventory increment verification."
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-300 font-mono tracking-tight">
                  Validating this receipt will increase inventory.
                </h4>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  Receipt <strong className="text-white font-mono">{validationModalReceipt.reference}</strong> will
                  intake{' '}
                  <strong className="text-white font-mono">
                    +{validationModalReceipt.lines.reduce((s, l) => s + l.quantityExpected, 0)} units
                  </strong>{' '}
                  into{' '}
                  <strong className="text-white font-mono">
                    {validationModalReceipt.destinationWarehouseName}
                  </strong>{' '}
                  and log movement transactions to the ledger.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Dock Location:</span>
              <span className="text-white font-bold">{validationModalReceipt.destinationLocationCode}</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setValidationModalReceipt(null)}
                disabled={isValidating}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmValidation}
                isLoading={isValidating}
                className="bg-[#ff6a00] hover:bg-[#ff7b1a] text-white font-bold gap-1.5"
              >
                Confirm & Intake Stock
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
