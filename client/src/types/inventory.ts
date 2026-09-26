export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
export type MoveType = 'RECEIPT' | 'DELIVERY' | 'INTERNAL_TRANSFER' | 'INVENTORY_ADJUSTMENT'
export type ReceiptStatus = 'draft' | 'waiting' | 'done' | 'cancelled'
export type DeliveryStatus = 'draft' | 'waiting_availability' | 'ready' | 'done' | 'cancelled'
export type TransferStatus = 'draft' | 'in_transit' | 'completed' | 'cancelled'
export type AdjustmentStatus = 'draft' | 'applied'
export type AdjustmentReason = 'cycle_count' | 'damage' | 'spoilage' | 'theft_loss' | 'found_stock' | 'calibration'

export interface WarehouseLocation {
  id: string
  warehouseId: string
  code: string
  name: string
  type: 'Internal' | 'Receiving' | 'Shipping' | 'Quarantine' | 'Scrap'
}

export interface Warehouse {
  id: string
  code: string
  name: string
  city: string
  country: string
  address: string
  capacityPallets: number
  usedPallets: number
  utilizationPercent: number
  managerName: string
  managerEmail: string
  locations: WarehouseLocation[]
}

export interface Category {
  id: string
  name: string
  code: string
  description: string
  productCount: number
  totalValuation: number
}

export interface Product {
  id: string
  sku: string
  name: string
  barcode: string
  categoryId: string
  categoryName: string
  unit: 'pcs' | 'box' | 'kg' | 'm' | 'pallet'
  costPrice: number
  sellingPrice: number
  minStock: number
  maxStock: number
  totalOnHand: number
  totalAllocated: number
  totalAvailable: number
  status: StockStatus
  description?: string
  warehouseStock?: { warehouseId: string; warehouseCode: string; onHand: number; available: number }[]
}

export interface StockItem {
  id: string
  productId: string
  productSku: string
  productName: string
  categoryName: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  locationId: string
  locationCode: string
  lotNumber?: string
  quantityOnHand: number
  allocated: number
  available: number
  unitCost: number
  totalValuation: number
  lastCountedDate: string
  status: 'optimal' | 'warning' | 'critical'
}

export interface ReceiptLine {
  id: string
  productId: string
  productSku: string
  productName: string
  quantityExpected: number
  quantityReceived: number
  unitPrice: number
  subtotal: number
  lotNumber?: string
}

export interface Receipt {
  id: string
  reference: string
  supplierName: string
  destinationWarehouseId: string
  destinationWarehouseName: string
  destinationLocationId: string
  destinationLocationCode: string
  orderDate: string
  scheduledDate: string
  completedDate?: string
  status: ReceiptStatus
  lines: ReceiptLine[]
  totalItems: number
  totalValue: number
  notes?: string
}

export interface DeliveryLine {
  id: string
  productId: string
  productSku: string
  productName: string
  quantityDemanded: number
  quantityShipped: number
  unitPrice: number
  subtotal: number
}

export interface Delivery {
  id: string
  reference: string
  customerName: string
  sourceWarehouseId: string
  sourceWarehouseName: string
  sourceLocationId: string
  sourceLocationCode: string
  orderDate: string
  scheduledDate: string
  completedDate?: string
  status: DeliveryStatus
  lines: DeliveryLine[]
  totalItems: number
  totalValue: number
  carrier?: string
  trackingNumber?: string
}

export interface TransferLine {
  id: string
  productId: string
  productSku: string
  productName: string
  quantity: number
  lotNumber?: string
}

export interface Transfer {
  id: string
  reference: string
  sourceWarehouseId: string
  sourceWarehouseName: string
  sourceLocationId: string
  sourceLocationCode: string
  destWarehouseId: string
  destWarehouseName: string
  destLocationId: string
  destLocationCode: string
  scheduledDate: string
  completedDate?: string
  status: TransferStatus
  lines: TransferLine[]
  totalItems: number
  driverOrCourier?: string
}

export interface Adjustment {
  id: string
  reference: string
  warehouseId: string
  warehouseName: string
  locationId: string
  locationCode: string
  productId: string
  productSku: string
  productName: string
  systemQuantity: number
  countedQuantity: number
  differenceQuantity: number
  unitCost: number
  totalImpactValue: number
  reason: AdjustmentReason
  date: string
  status: AdjustmentStatus
  notes?: string
  user: string
}

export interface StockMove {
  id: string
  timestamp: string
  reference: string
  type: MoveType
  productId: string
  productSku: string
  productName: string
  fromLocation: string
  toLocation: string
  quantityChange: number // positive for additions, negative for reductions
  unitCost: number
  totalImpact: number
  user: string
  notes?: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
  defaultWarehouseId: string
  notificationsEnabled: boolean
  twoFactorEnabled: boolean
}
