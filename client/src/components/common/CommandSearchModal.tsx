import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Warehouse, X, ArrowRight } from 'lucide-react'
import { useInventory } from '@/context/InventoryContext'

interface CommandSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { products, receipts, deliveries, transfers, warehouses } = useInventory()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // handled outside
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()

    const matches: {
      type: 'product' | 'receipt' | 'delivery' | 'transfer' | 'warehouse'
      title: string
      subtitle: string
      url: string
      icon: any
    }[] = []

    // Products
    products.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      ) {
        matches.push({
          type: 'product',
          title: p.name,
          subtitle: `SKU: ${p.sku} • On-Hand: ${p.totalOnHand} ${p.unit} • ${p.categoryName}`,
          url: '/products',
          icon: Package,
        })
      }
    })

    // Receipts
    receipts.forEach((r) => {
      if (r.reference.toLowerCase().includes(q) || r.supplierName.toLowerCase().includes(q)) {
        matches.push({
          type: 'receipt',
          title: `${r.reference} - ${r.supplierName}`,
          subtitle: `Destination: ${r.destinationWarehouseName} • Status: ${r.status.toUpperCase()}`,
          url: '/receipts',
          icon: ArrowDownToLine,
        })
      }
    })

    // Deliveries
    deliveries.forEach((d) => {
      if (d.reference.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q)) {
        matches.push({
          type: 'delivery',
          title: `${d.reference} - ${d.customerName}`,
          subtitle: `Source: ${d.sourceWarehouseName} • Status: ${d.status.toUpperCase()}`,
          url: '/deliveries',
          icon: ArrowUpFromLine,
        })
      }
    })

    // Transfers
    transfers.forEach((t) => {
      if (t.reference.toLowerCase().includes(q)) {
        matches.push({
          type: 'transfer',
          title: `${t.reference}`,
          subtitle: `From ${t.sourceWarehouseName} to ${t.destWarehouseName} • Status: ${t.status.toUpperCase()}`,
          url: '/transfers',
          icon: ArrowLeftRight,
        })
      }
    })

    // Warehouses
    warehouses.forEach((w) => {
      if (w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q) || w.city.toLowerCase().includes(q)) {
        matches.push({
          type: 'warehouse',
          title: `${w.code} - ${w.name}`,
          subtitle: `${w.city} • Capacity: ${w.usedPallets}/${w.capacityPallets} pallets (${w.utilizationPercent}%)`,
          url: '/warehouses',
          icon: Warehouse,
        })
      }
    })

    return matches.slice(0, 8)
  }, [query, products, receipts, deliveries, transfers, warehouses])

  if (!isOpen) return null

  const handleSelect = (url: string) => {
    navigate(url)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0f1422] border border-white/10 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] bg-[#121827]">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a product SKU, order ref (e.g. WH/IN/00104), or warehouse..."
            className="w-full bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results list */}
        <div className="p-2 max-h-96 overflow-y-auto">
          {query.trim() === '' ? (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              <p className="font-medium text-slate-300">Quick Navigation Suggestions</p>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {['Products', 'Receipts', 'Deliveries', 'Transfers', 'Move History', 'Warehouses'].map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSelect(`/${item.toLowerCase().replace(' ', '-')}`)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 text-xs"
                  >
                    Go to {item}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching products, references, or warehouses found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((res, idx) => {
                const Icon = res.icon
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(res.url)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.06] text-left group transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-white/[0.05] border border-white/10 text-slate-300 group-hover:text-[#ff6a00] group-hover:border-[#ff6a00]/30 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate group-hover:text-[#ff8c33] transition-colors">
                          {res.title}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{res.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
