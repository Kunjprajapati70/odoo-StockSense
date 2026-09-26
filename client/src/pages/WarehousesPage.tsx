import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import { formatNumber } from '@/utils/formatters'
import { Warehouse as WarehouseIcon, MapPin, User, Plus, Layers, ShieldCheck } from 'lucide-react'

export const WarehousesPage: React.FC = () => {
  const { warehouses, addWarehouse } = useInventory()
  const { toast } = useToast()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newCapacity, setNewCapacity] = useState('3500')
  const [newManager, setNewManager] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode || !newName || !newCity) return

    const cap = parseInt(newCapacity) || 2000
    addWarehouse({
      code: newCode.toUpperCase(),
      name: newName,
      city: newCity,
      country: 'United States',
      address: `${newCity} Logistics Park`,
      capacityPallets: cap,
      managerName: newManager || 'Facility Manager',
      managerEmail: 'ops@stocksense.io',
      locations: [
        { id: `loc-rec-${Date.now()}`, warehouseId: '', code: `${newCode}-RECV`, name: 'Fast Intake Dock', type: 'Receiving' },
        { id: `loc-stk-${Date.now()}`, warehouseId: '', code: `${newCode}-RACK-1`, name: 'General Staging Rack', type: 'Internal' },
        { id: `loc-ship-${Date.now()}`, warehouseId: '', code: `${newCode}-SHIP`, name: 'Outbound Bay', type: 'Shipping' },
      ],
    })

    toast({
      title: 'Warehouse Node Added',
      description: `Facility ${newCode} (${newName}) registered into network.`,
      type: 'success',
    })

    setIsAddOpen(false)
    setNewCode('')
    setNewName('')
    setNewCity('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Facilities & Locations"
        subtitle="Manage physical distribution hubs, sub-locations, pallet racking capacity, and dock configurations."
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4" /> Add Warehouse
          </Button>
        }
      />

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {warehouses.map((wh) => (
          <Card key={wh.id} className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6a00] to-[#ff8c2b] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#ff6a00]/25">
                  <WarehouseIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-white">{wh.code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono">
                      Active
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mt-0.5">{wh.name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ff6a00]" /> {wh.city}
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs text-slate-400">Utilization</div>
                <div className="text-lg font-bold text-emerald-400">{wh.utilizationPercent}%</div>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Pallet Storage Capacity</span>
                <span className="text-slate-200">
                  {formatNumber(wh.usedPallets)} / {formatNumber(wh.capacityPallets)} pallets
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff6a00] to-[#10b981] transition-all duration-500"
                  style={{ width: `${Math.min(wh.utilizationPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Sub-Locations List */}
            <div>
              <div className="text-xs font-mono font-bold uppercase text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#ff6a00]" /> Configured Zones & Sub-Locations
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {wh.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-white">{loc.code}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                        {loc.name}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                      {loc.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Manager contact */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Facility Lead: <strong className="text-slate-200">{wh.managerName}</strong></span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">{wh.managerEmail}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Warehouse Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Warehouse Node">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Warehouse Code"
              placeholder="e.g. WH-MIA"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              required
            />
            <Input
              label="City & State"
              placeholder="e.g. Miami, FL"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              required
            />
          </div>

          <Input
            label="Facility Name"
            placeholder="e.g. Southeast Gateway Logistics Park"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Pallet Capacity"
              type="number"
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
              required
            />
            <Input
              label="Lead Manager"
              placeholder="e.g. Robert Reyes"
              value={newManager}
              onChange={(e) => setNewManager(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Register Warehouse
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
