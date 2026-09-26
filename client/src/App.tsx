import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { InventoryProvider } from '@/context/InventoryContext'
import { ToastProvider } from '@/context/ToastContext'

// Pages
import { DashboardPage } from '@/pages/DashboardPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { ReceiptsPage } from '@/pages/ReceiptsPage'
import { DeliveriesPage } from '@/pages/DeliveriesPage'
import { TransfersPage } from '@/pages/TransfersPage'
import { AdjustmentsPage } from '@/pages/AdjustmentsPage'
import { MoveHistoryPage } from '@/pages/MoveHistoryPage'
import { WarehousesPage } from '@/pages/WarehousesPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { ProfilePage } from '@/pages/ProfilePage'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <InventoryProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/receipts" element={<ReceiptsPage />} />
              <Route path="/deliveries" element={<DeliveriesPage />} />
              <Route path="/transfers" element={<TransfersPage />} />
              <Route path="/adjustments" element={<AdjustmentsPage />} />
              <Route path="/move-history" element={<MoveHistoryPage />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </InventoryProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
