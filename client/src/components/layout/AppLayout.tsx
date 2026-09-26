import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileSidebar } from './MobileSidebar'
import { Topbar } from './Topbar'
import { PageContainer } from './PageContainer'
import { LogoutModal } from './LogoutModal'
import { CommandSearchModal } from '@/components/common/CommandSearchModal'
import { NewProductModal } from '@/components/forms/NewProductModal'
import { NewReceiptModal } from '@/components/forms/NewReceiptModal'
import { NewDeliveryModal } from '@/components/forms/NewDeliveryModal'
import { NewTransferModal } from '@/components/forms/NewTransferModal'
import { NewAdjustmentModal } from '@/components/forms/NewAdjustmentModal'
import { cn } from '@/utils/cn'

/**
 * AppLayout
 *
 * Application shell. Renders:
 * - Fixed desktop Sidebar (collapsible, hidden on mobile)
 * - Overlay MobileSidebar (drawer, only visible on mobile/tablet)
 * - Sticky Topbar
 * - PageContainer wrapping the current route's <Outlet />
 * - All global modals (forms + command palette + logout)
 */
export const AppLayout: React.FC = () => {
  const location = useLocation()

  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Global modal state
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)

  // Auto-close mobile drawer on navigation
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  // Global keyboard shortcut: Ctrl+K / ⌘K → command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-100 overflow-x-hidden">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      {/* Always mounted; hidden on mobile via `hidden lg:block` wrapper */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          onOpenLogout={() => setIsLogoutOpen(true)}
        />
      </div>

      {/* ── Mobile Sidebar Drawer ───────────────────────────────────────────── */}
      <MobileSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        onOpenLogout={() => setIsLogoutOpen(true)}
      />

      {/* ── Main column (shifts right on lg+ to make room for sidebar) ─────── */}
      <div
        className={cn(
          'app-main-column flex flex-col min-h-screen',
          isCollapsed && 'sidebar-collapsed',
        )}
      >
        {/* Topbar */}
        <Topbar
          onToggleMobileMenu={() => setIsMobileOpen(true)}
          onOpenCommandSearch={() => setIsCommandOpen(true)}
          onOpenNewProduct={() => setIsProductModalOpen(true)}
          onOpenNewReceipt={() => setIsReceiptModalOpen(true)}
          onOpenNewDelivery={() => setIsDeliveryModalOpen(true)}
          onOpenNewTransfer={() => setIsTransferModalOpen(true)}
          onOpenNewAdjustment={() => setIsAdjustmentModalOpen(true)}
        />

        {/* Page content */}
        <PageContainer>
          <div
            key={location.pathname}
            className="animate-in"
          >
            <Outlet />
          </div>
        </PageContainer>
      </div>

      {/* ── Global Modals ────────────────────────────────────────────────────── */}
      <CommandSearchModal isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <LogoutModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} />
      <NewProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} />
      <NewReceiptModal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} />
      <NewDeliveryModal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} />
      <NewTransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} />
      <NewAdjustmentModal isOpen={isAdjustmentModalOpen} onClose={() => setIsAdjustmentModalOpen(false)} />
    </div>
  )
}
