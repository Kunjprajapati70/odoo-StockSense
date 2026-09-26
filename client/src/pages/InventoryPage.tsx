import React, { useState, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, Column } from '@/components/common/DataTable'
import { SearchInput } from '@/components/common/SearchInput'
import { StockItem } from '@/types/inventory'
import { useInventory } from '@/context/InventoryContext'
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Warehouse, Boxes, MapPin, ArrowLeftRight, SlidersHorizontal, Plus } from 'lucide-react'
import { NewTransferModal } from '@/components/forms/NewTransferModal'
import { NewAdjustmentModal } from '@/components/forms/NewAdjustmentModal'

export const InventoryPage: React.FC = () => {
  const { stockItems, warehouses } = useInventory()
  const [search, setSearch] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL')
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)

  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      const matchSearch =
        item.productName.toLowerCase().includes(search.toLowerCase()) ||
        item.productSku.toLowerCase().includes(search.toLowerCase()) ||
        (item.lotNumber && item.lotNumber.toLowerCase().includes(search.toLowerCase())) ||
        item.locationCode.toLowerCase().includes(search.toLowerCase())

      const matchWh = selectedWarehouse === 'ALL' || item.warehouseId === selectedWarehouse

      return matchSearch && matchWh
    })
  }, [stockItems, search, selectedWarehouse])

  const totalOnHandUnits = filteredItems.reduce((acc, curr) => acc + curr.quantityOnHand, 0)
  const totalValuation = filteredItems.reduce((acc, curr) => acc + curr.totalValuation, 0)
  const uniqueLotsCount = new Set(filteredItems.map((i) => i.lotNumber).filter(Boolean)).size

  const columns: Column<StockItem>[] = [
    {
      key: 'productSku',
      header: 'Product & SKU',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-white truncate max-w-xs">{item.productName}</div>
          <div className="font-mono text-xs text-[#ff8c33] font-medium">{item.productSku}</div>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse & Bay',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium text-slate-200 flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
            <span>{item.warehouseCode}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-[#ff6a00]" />
            <span>{item.locationCode}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'lotNumber',
      header: 'Batch / Lot #',
      render: (item) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-slate-300">
          {item.lotNumber || 'N/A'}
        </span>
      ),
    },
    {
      key: 'quantityOnHand',
      header: 'On Hand',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-white text-sm">
          {formatNumber(item.quantityOnHand)}
        </span>
      ),
    },
    {
      key: 'available',
      header: 'Available',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span
          className={`font-mono font-semibold ${
            item.available === 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {formatNumber(item.available)}
        </span>
      ),
    },
    {
      key: 'unitCost',
      header: 'Unit Cost',
      align: 'right',
      sortable: true,
      render: (item) => formatCurrency(item.unitCost),
    },
    {
      key: 'totalValuation',
      header: 'Total Value',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-slate-100">
          {formatCurrency(item.totalValuation)}
        </span>
      ),
    },
    {
      key: 'lastCountedDate',
      header: 'Last Audit',
      align: 'right',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs text-slate-400">{formatDate(item.lastCountedDate)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          variant={item.status === 'optimal' ? 'green' : item.status === 'warning' ? 'amber' : 'red'}
          dot
        >
          {item.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Physical Inventory & Stock Locations"
        subtitle="Granular stock on-hand balances segmented by warehouse bays, storage racks, and lot tracking."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsTransferOpen(true)}>
              <ArrowLeftRight className="w-4 h-4" /> Move Stock
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsAdjustmentOpen(true)}>
              <SlidersHorizontal className="w-4 h-4" /> Cycle Count
            </Button>
          </>
        }
      />

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-400">Total Units Stored</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatNumber(totalOnHandUnits)} units
          </div>
          <div className="text-xs text-slate-400 mt-1">Across all filtered warehouse bins</div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-400">Physical Stock Valuation</div>
          <div className="text-2xl font-extrabold text-[#ff8c33] font-mono mt-1">
            {formatCurrency(totalValuation)}
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Assessed at unit acquisition cost</div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono font-bold uppercase text-slate-400">Active Tracked Lots</div>
          <div className="text-2xl font-extrabold text-sky-400 font-mono mt-1">
            {uniqueLotsCount} Batches
          </div>
          <div className="text-xs text-slate-400 mt-1">Verified with traceability barcodes</div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0e131f] border border-white/[0.08]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by product, SKU, bin (e.g. WH1-A-01), or lot..."
        />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141b2a] border border-white/10 text-xs">
            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#121826] text-white">
                All Warehouses
              </option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id} className="bg-[#121826] text-white">
                  {wh.code} - {wh.city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stock Items Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        emptyTitle="No inventory locations found"
        emptyDescription="No stock positions exist matching your search filters."
      />

      <NewTransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
      <NewAdjustmentModal isOpen={isAdjustmentOpen} onClose={() => setIsAdjustmentOpen(false)} />
    </div>
  )
}
