import React, { createContext, useContext, useState, useMemo } from 'react'
import {
  Warehouse,
  Category,
  Product,
  StockItem,
  Receipt,
  Delivery,
  Transfer,
  Adjustment,
  StockMove,
  UserProfile,
} from '../types/inventory'
import {
  mockWarehouses,
  mockCategories,
  mockProducts,
  mockStockItems,
  mockReceipts,
  mockDeliveries,
  mockTransfers,
  mockAdjustments,
  mockStockMoves,
  mockCurrentUser,
} from '../mock/mockData'

interface InventoryContextType {
  warehouses: Warehouse[]
  categories: Category[]
  products: Product[]
  stockItems: StockItem[]
  receipts: Receipt[]
  deliveries: Delivery[]
  transfers: Transfer[]
  adjustments: Adjustment[]
  stockMoves: StockMove[]
  currentUser: UserProfile
  selectedWarehouseId: string | 'ALL'
  setSelectedWarehouseId: (id: string | 'ALL') => void

  // Actions
  addProduct: (newProd: Omit<Product, 'id' | 'totalOnHand' | 'totalAllocated' | 'totalAvailable'> & { initialStock?: number; warehouseId?: string; locationId?: string }) => Product
  updateProduct: (id: string, updates: Partial<Product>) => void
  addReceipt: (receipt: Omit<Receipt, 'id' | 'reference' | 'status'>) => Receipt
  validateReceipt: (id: string) => void
  addDelivery: (delivery: Omit<Delivery, 'id' | 'reference' | 'status'>) => Delivery
  validateDelivery: (id: string) => void
  addTransfer: (transfer: Omit<Transfer, 'id' | 'reference' | 'status'>) => Transfer
  validateTransfer: (id: string) => void
  addAdjustment: (adj: Omit<Adjustment, 'id' | 'reference' | 'status'>) => Adjustment
  applyAdjustment: (id: string) => void
  addWarehouse: (wh: Omit<Warehouse, 'id' | 'usedPallets' | 'utilizationPercent'>) => void
  addCategory: (cat: Omit<Category, 'id' | 'productCount' | 'totalValuation'>) => void

  // Filtered views according to selectedWarehouseId
  filteredStockItems: StockItem[]
  filteredReceipts: Receipt[]
  filteredDeliveries: Delivery[]
  filteredTransfers: Transfer[]
  filteredAdjustments: Adjustment[]
  filteredStockMoves: StockMove[]

  // Real-time aggregates
  kpis: {
    totalValuation: number
    totalSkuCount: number
    lowStockCount: number
    outOfStockCount: number
    pendingReceipts: number
    pendingDeliveries: number
    activeTransfers: number
    turnoverRate: number
    fillRate: number
  }
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(mockWarehouses)
  const [categories, setCategories] = useState<Category[]>(mockCategories)
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [stockItems, setStockItems] = useState<StockItem[]>(mockStockItems)
  const [receipts, setReceipts] = useState<Receipt[]>(mockReceipts)
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries)
  const [transfers, setTransfers] = useState<Transfer[]>(mockTransfers)
  const [adjustments, setAdjustments] = useState<Adjustment[]>(mockAdjustments)
  const [stockMoves, setStockMoves] = useState<StockMove[]>(mockStockMoves)
  const [currentUser] = useState<UserProfile>(mockCurrentUser)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | 'ALL'>('ALL')

  // Filtered datasets based on active warehouse selector
  const filteredStockItems = useMemo(() => {
    if (selectedWarehouseId === 'ALL') return stockItems
    return stockItems.filter((i) => i.warehouseId === selectedWarehouseId)
  }, [stockItems, selectedWarehouseId])

  const filteredReceipts = useMemo(() => {
    if (selectedWarehouseId === 'ALL') return receipts
    return receipts.filter((r) => r.destinationWarehouseId === selectedWarehouseId)
  }, [receipts, selectedWarehouseId])

  const filteredDeliveries = useMemo(() => {
    if (selectedWarehouseId === 'ALL') return deliveries
    return deliveries.filter((d) => d.sourceWarehouseId === selectedWarehouseId)
  }, [deliveries, selectedWarehouseId])

  const filteredTransfers = useMemo(() => {
    if (selectedWarehouseId === 'ALL') return transfers
    return transfers.filter(
      (t) => t.sourceWarehouseId === selectedWarehouseId || t.destWarehouseId === selectedWarehouseId,
    )
  }, [transfers, selectedWarehouseId])

  const filteredAdjustments = useMemo(() => {
    if (selectedWarehouseId === 'ALL') return adjustments
    return adjustments.filter((a) => a.warehouseId === selectedWarehouseId)
  }, [adjustments, selectedWarehouseId])

  const filteredStockMoves = useMemo(() => {
    return stockMoves
  }, [stockMoves])

  // KPIs
  const kpis = useMemo(() => {
    const relevantStock = selectedWarehouseId === 'ALL'
      ? stockItems
      : stockItems.filter((s) => s.warehouseId === selectedWarehouseId)

    const totalValuation = relevantStock.reduce((acc, curr) => acc + curr.totalValuation, 0)
    const totalSkuCount = products.length
    const lowStockCount = products.filter((p) => p.status === 'low_stock').length
    const outOfStockCount = products.filter((p) => p.status === 'out_of_stock').length
    const pendingReceipts = receipts.filter((r) => r.status === 'waiting' || r.status === 'draft').length
    const pendingDeliveries = deliveries.filter((d) => d.status === 'ready' || d.status === 'waiting_availability').length
    const activeTransfers = transfers.filter((t) => t.status === 'in_transit').length

    return {
      totalValuation,
      totalSkuCount,
      lowStockCount,
      outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
      activeTransfers,
      turnoverRate: 5.4,
      fillRate: 98.2,
    }
  }, [products, stockItems, receipts, deliveries, transfers, selectedWarehouseId])

  // Actions
  const addProduct = (
    newProd: Omit<Product, 'id' | 'totalOnHand' | 'totalAllocated' | 'totalAvailable'> & {
      initialStock?: number
      warehouseId?: string
      locationId?: string
    },
  ) => {
    const id = `prod-${Date.now().toString(36)}`
    const initialQty = Number(newProd.initialStock) || 0

    let status: Product['status'] = 'in_stock'
    if (initialQty === 0) status = 'out_of_stock'
    else if (initialQty <= newProd.minStock) status = 'low_stock'

    const targetWhId = newProd.warehouseId || warehouses[0].id
    const targetWh = warehouses.find((w) => w.id === targetWhId) || warehouses[0]
    const targetLoc = targetWh.locations.find((l) => l.id === newProd.locationId) || targetWh.locations[1] || targetWh.locations[0]

    const product: Product = {
      id,
      sku: newProd.sku,
      name: newProd.name,
      barcode: newProd.barcode,
      categoryId: newProd.categoryId,
      categoryName: newProd.categoryName,
      unit: newProd.unit,
      costPrice: newProd.costPrice,
      sellingPrice: newProd.sellingPrice,
      minStock: newProd.minStock,
      maxStock: newProd.maxStock,
      totalOnHand: initialQty,
      totalAllocated: 0,
      totalAvailable: initialQty,
      status,
      description: newProd.description,
      warehouseStock: [
        {
          warehouseId: targetWh.id,
          warehouseCode: targetWh.code,
          onHand: initialQty,
          available: initialQty,
        },
      ],
    }

    setProducts((prev) => [product, ...prev])

    // If initial stock was provided, create stock item and initial move
    if (initialQty > 0) {
      const stockItem: StockItem = {
        id: `stk-${Date.now().toString(36)}`,
        productId: id,
        productSku: product.sku,
        productName: product.name,
        categoryName: product.categoryName,
        warehouseId: targetWh.id,
        warehouseCode: targetWh.code,
        warehouseName: targetWh.name,
        locationId: targetLoc.id,
        locationCode: targetLoc.code,
        lotNumber: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        quantityOnHand: initialQty,
        allocated: 0,
        available: initialQty,
        unitCost: product.costPrice,
        totalValuation: initialQty * product.costPrice,
        lastCountedDate: new Date().toISOString().split('T')[0],
        status: status === 'in_stock' ? 'optimal' : 'warning',
      }
      setStockItems((prev) => [stockItem, ...prev])

      const move: StockMove = {
        id: `mv-${Date.now()}`,
        timestamp: new Date().toISOString(),
        reference: `INIT/${product.sku}`,
        type: 'INVENTORY_ADJUSTMENT',
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        fromLocation: 'Virtual/Initial Inventory',
        toLocation: targetLoc.code,
        quantityChange: initialQty,
        unitCost: product.costPrice,
        totalImpact: initialQty * product.costPrice,
        user: currentUser.name,
        notes: 'Initial inventory intake upon product creation',
      }
      setStockMoves((prev) => [move, ...prev])
    }

    return product
  }

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }

  const addReceipt = (receiptData: Omit<Receipt, 'id' | 'reference' | 'status'>) => {
    const count = receipts.length + 105
    const reference = `WH/IN/${count.toString().padStart(5, '0')}`
    const id = `rec-${Date.now()}`

    const newReceipt: Receipt = {
      ...receiptData,
      id,
      reference,
      status: 'waiting',
    }

    setReceipts((prev) => [newReceipt, ...prev])
    return newReceipt
  }

  const validateReceipt = (id: string) => {
    const target = receipts.find((r) => r.id === id)
    if (!target || target.status === 'done') return

    const now = new Date().toISOString()
    const nowDate = now.split('T')[0]

    // 1. Update Receipt status
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'done',
              completedDate: nowDate,
              lines: r.lines.map((l) => ({ ...l, quantityReceived: l.quantityExpected })),
            }
          : r,
      ),
    )

    // 2. Increase stock for each line & record stock move
    target.lines.forEach((line) => {
      const qty = line.quantityExpected
      const lot = line.lotNumber || `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

      // Update product totals
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== line.productId) return p
          const newOnHand = p.totalOnHand + qty
          const newAvail = p.totalAvailable + qty
          const newStatus: Product['status'] = newOnHand > p.minStock ? 'in_stock' : newOnHand > 0 ? 'low_stock' : 'out_of_stock'
          return {
            ...p,
            totalOnHand: newOnHand,
            totalAvailable: newAvail,
            status: newStatus,
          }
        }),
      )

      // Update or create StockItem in the warehouse/location
      setStockItems((prev) => {
        const existingIdx = prev.findIndex(
          (s) => s.productId === line.productId && s.warehouseId === target.destinationWarehouseId,
        )
        if (existingIdx >= 0) {
          const updated = [...prev]
          const cur = updated[existingIdx]
          const newQty = cur.quantityOnHand + qty
          updated[existingIdx] = {
            ...cur,
            quantityOnHand: newQty,
            available: cur.available + qty,
            totalValuation: newQty * cur.unitCost,
            lastCountedDate: nowDate,
          }
          return updated
        } else {
          const newStockItem: StockItem = {
            id: `stk-${Date.now()}-${line.productId}`,
            productId: line.productId,
            productSku: line.productSku,
            productName: line.productName,
            categoryName: 'General',
            warehouseId: target.destinationWarehouseId,
            warehouseCode: target.destinationWarehouseName.split(' ')[0] || 'WH',
            warehouseName: target.destinationWarehouseName,
            locationId: target.destinationLocationId,
            locationCode: target.destinationLocationCode,
            lotNumber: lot,
            quantityOnHand: qty,
            allocated: 0,
            available: qty,
            unitCost: line.unitPrice,
            totalValuation: qty * line.unitPrice,
            lastCountedDate: nowDate,
            status: 'optimal',
          }
          return [newStockItem, ...prev]
        }
      })

      // Add Stock Ledger entry
      const move: StockMove = {
        id: `mv-${Date.now()}-${line.productId}`,
        timestamp: now,
        reference: target.reference,
        type: 'RECEIPT',
        productId: line.productId,
        productSku: line.productSku,
        productName: line.productName,
        fromLocation: `Vendor (${target.supplierName})`,
        toLocation: `${target.destinationLocationCode}`,
        quantityChange: qty,
        unitCost: line.unitPrice,
        totalImpact: qty * line.unitPrice,
        user: currentUser.name,
        notes: `Validated receipt from ${target.supplierName}`,
      }
      setStockMoves((prev) => [move, ...prev])
    })
  }

  const addDelivery = (deliveryData: Omit<Delivery, 'id' | 'reference' | 'status'>) => {
    const count = deliveries.length + 250
    const reference = `WH/OUT/${count.toString().padStart(5, '0')}`
    const id = `del-${Date.now()}`

    const newDelivery: Delivery = {
      ...deliveryData,
      id,
      reference,
      status: 'ready',
    }

    setDeliveries((prev) => [newDelivery, ...prev])
    return newDelivery
  }

  const validateDelivery = (id: string) => {
    const target = deliveries.find((d) => d.id === id)
    if (!target || target.status === 'done') return

    const now = new Date().toISOString()
    const nowDate = now.split('T')[0]

    // 1. Update delivery status
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'done',
              completedDate: nowDate,
              lines: d.lines.map((l) => ({ ...l, quantityShipped: l.quantityDemanded })),
            }
          : d,
      ),
    )

    // 2. Reduce stock for each line & record move
    target.lines.forEach((line) => {
      const qty = line.quantityDemanded

      // Update product totals
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== line.productId) return p
          const newOnHand = Math.max(0, p.totalOnHand - qty)
          const newAvail = Math.max(0, p.totalAvailable - qty)
          const newStatus: Product['status'] = newOnHand > p.minStock ? 'in_stock' : newOnHand > 0 ? 'low_stock' : 'out_of_stock'
          return {
            ...p,
            totalOnHand: newOnHand,
            totalAvailable: newAvail,
            status: newStatus,
          }
        }),
      )

      // Reduce stock item in source warehouse
      setStockItems((prev) =>
        prev.map((s) => {
          if (s.productId === line.productId && s.warehouseId === target.sourceWarehouseId) {
            const newOnHand = Math.max(0, s.quantityOnHand - qty)
            const newAvail = Math.max(0, s.available - qty)
            return {
              ...s,
              quantityOnHand: newOnHand,
              available: newAvail,
              totalValuation: newOnHand * s.unitCost,
              status: newOnHand === 0 ? 'critical' : newOnHand < 10 ? 'warning' : 'optimal',
            }
          }
          return s
        }),
      )

      // Stock ledger entry
      const move: StockMove = {
        id: `mv-${Date.now()}-${line.productId}`,
        timestamp: now,
        reference: target.reference,
        type: 'DELIVERY',
        productId: line.productId,
        productSku: line.productSku,
        productName: line.productName,
        fromLocation: target.sourceLocationCode,
        toLocation: `Customer (${target.customerName})`,
        quantityChange: -qty,
        unitCost: line.unitPrice,
        totalImpact: -(qty * line.unitPrice),
        user: currentUser.name,
        notes: `Outbound shipment dispatched to ${target.customerName}`,
      }
      setStockMoves((prev) => [move, ...prev])
    })
  }

  const addTransfer = (transferData: Omit<Transfer, 'id' | 'reference' | 'status'>) => {
    const count = transfers.length + 90
    const reference = `WH/INT/${count.toString().padStart(5, '0')}`
    const id = `trf-${Date.now()}`

    const newTransfer: Transfer = {
      ...transferData,
      id,
      reference,
      status: 'in_transit',
    }

    setTransfers((prev) => [newTransfer, ...prev])
    return newTransfer
  }

  const validateTransfer = (id: string) => {
    const target = transfers.find((t) => t.id === id)
    if (!target || target.status === 'completed') return

    const now = new Date().toISOString()
    const nowDate = now.split('T')[0]

    // 1. Update transfer status
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'completed',
              completedDate: nowDate,
            }
          : t,
      ),
    )

    // 2. Shift inventory from source to target
    target.lines.forEach((line) => {
      const qty = line.quantity

      // Subtract from source location
      setStockItems((prev) =>
        prev.map((s) => {
          if (s.productId === line.productId && s.warehouseId === target.sourceWarehouseId) {
            const newOnHand = Math.max(0, s.quantityOnHand - qty)
            return {
              ...s,
              quantityOnHand: newOnHand,
              available: Math.max(0, s.available - qty),
              totalValuation: newOnHand * s.unitCost,
            }
          }
          return s
        }),
      )

      // Add to dest location
      setStockItems((prev) => {
        const destItemIdx = prev.findIndex(
          (s) => s.productId === line.productId && s.warehouseId === target.destWarehouseId,
        )
        if (destItemIdx >= 0) {
          const copy = [...prev]
          const destItem = copy[destItemIdx]
          const newOnHand = destItem.quantityOnHand + qty
          copy[destItemIdx] = {
            ...destItem,
            quantityOnHand: newOnHand,
            available: destItem.available + qty,
            totalValuation: newOnHand * destItem.unitCost,
          }
          return copy
        } else {
          const product = products.find((p) => p.id === line.productId)
          const newStockItem: StockItem = {
            id: `stk-${Date.now()}-${line.productId}`,
            productId: line.productId,
            productSku: line.productSku,
            productName: line.productName,
            categoryName: product?.categoryName || 'General',
            warehouseId: target.destWarehouseId,
            warehouseCode: target.destWarehouseName.split(' ')[0] || 'WH',
            warehouseName: target.destWarehouseName,
            locationId: target.destLocationId,
            locationCode: target.destLocationCode,
            lotNumber: line.lotNumber || 'LOT-TRANSFER',
            quantityOnHand: qty,
            allocated: 0,
            available: qty,
            unitCost: product?.costPrice || 100,
            totalValuation: qty * (product?.costPrice || 100),
            lastCountedDate: nowDate,
            status: 'optimal',
          }
          return [newStockItem, ...prev]
        }
      })

      // Add move to Stock Ledger
      const move: StockMove = {
        id: `mv-${Date.now()}-${line.productId}`,
        timestamp: now,
        reference: target.reference,
        type: 'INTERNAL_TRANSFER',
        productId: line.productId,
        productSku: line.productSku,
        productName: line.productName,
        fromLocation: `${target.sourceLocationCode}`,
        toLocation: `${target.destLocationCode}`,
        quantityChange: qty,
        unitCost: 0,
        totalImpact: 0,
        user: currentUser.name,
        notes: `Internal transfer between ${target.sourceLocationCode} and ${target.destLocationCode}`,
      }
      setStockMoves((prev) => [move, ...prev])
    })
  }

  const addAdjustment = (adjData: Omit<Adjustment, 'id' | 'reference' | 'status'>) => {
    const count = adjustments.length + 45
    const reference = `ADJ/${new Date().getFullYear()}/${count.toString().padStart(4, '0')}`
    const id = `adj-${Date.now()}`

    const newAdj: Adjustment = {
      ...adjData,
      id,
      reference,
      status: 'draft',
    }

    setAdjustments((prev) => [newAdj, ...prev])
    return newAdj
  }

  const applyAdjustment = (id: string) => {
    const target = adjustments.find((a) => a.id === id)
    if (!target || target.status === 'applied') return

    const now = new Date().toISOString()
    const diff = target.differenceQuantity

    // 1. Update adjustment status
    setAdjustments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'applied' } : a)),
    )

    // 2. Correct product stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== target.productId) return p
        const newOnHand = Math.max(0, p.totalOnHand + diff)
        const newAvail = Math.max(0, p.totalAvailable + diff)
        const newStatus: Product['status'] = newOnHand > p.minStock ? 'in_stock' : newOnHand > 0 ? 'low_stock' : 'out_of_stock'
        return {
          ...p,
          totalOnHand: newOnHand,
          totalAvailable: newAvail,
          status: newStatus,
        }
      }),
    )

    // 3. Update stock item
    setStockItems((prev) =>
      prev.map((s) => {
        if (s.productId === target.productId && s.warehouseId === target.warehouseId) {
          const newQty = Math.max(0, s.quantityOnHand + diff)
          return {
            ...s,
            quantityOnHand: newQty,
            available: Math.max(0, s.available + diff),
            totalValuation: newQty * s.unitCost,
            lastCountedDate: now.split('T')[0],
          }
        }
        return s
      }),
    )

    // 4. Record stock move
    const move: StockMove = {
      id: `mv-${Date.now()}`,
      timestamp: now,
      reference: target.reference,
      type: 'INVENTORY_ADJUSTMENT',
      productId: target.productId,
      productSku: target.productSku,
      productName: target.productName,
      fromLocation: diff >= 0 ? 'Virtual/Inventory Gain' : target.locationCode,
      toLocation: diff >= 0 ? target.locationCode : 'Virtual/Inventory Loss',
      quantityChange: diff,
      unitCost: target.unitCost,
      totalImpact: target.totalImpactValue,
      user: currentUser.name,
      notes: `Physical cycle count adjustment (${target.reason})`,
    }
    setStockMoves((prev) => [move, ...prev])
  }

  const addWarehouse = (whData: Omit<Warehouse, 'id' | 'usedPallets' | 'utilizationPercent'>) => {
    const id = `wh-${Date.now()}`
    const wh: Warehouse = {
      ...whData,
      id,
      usedPallets: 0,
      utilizationPercent: 0,
    }
    setWarehouses((prev) => [...prev, wh])
  }

  const addCategory = (catData: Omit<Category, 'id' | 'productCount' | 'totalValuation'>) => {
    const id = `cat-${Date.now()}`
    const cat: Category = {
      ...catData,
      id,
      productCount: 0,
      totalValuation: 0,
    }
    setCategories((prev) => [...prev, cat])
  }

  return (
    <InventoryContext.Provider
      value={{
        warehouses,
        categories,
        products,
        stockItems,
        receipts,
        deliveries,
        transfers,
        adjustments,
        stockMoves,
        currentUser,
        selectedWarehouseId,
        setSelectedWarehouseId,
        addProduct,
        updateProduct,
        addReceipt,
        validateReceipt,
        addDelivery,
        validateDelivery,
        addTransfer,
        validateTransfer,
        addAdjustment,
        applyAdjustment,
        addWarehouse,
        addCategory,
        filteredStockItems,
        filteredReceipts,
        filteredDeliveries,
        filteredTransfers,
        filteredAdjustments,
        filteredStockMoves,
        kpis,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export const useInventory = () => {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider')
  }
  return context
}
