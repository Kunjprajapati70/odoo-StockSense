import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useInventory } from '@/context/InventoryContext'
import { useToast } from '@/context/ToastContext'
import {
  User,
  Shield,
  Key,
  Bell,
  Warehouse,
  CheckCircle2,
  Copy,
  LogOut,
  Laptop,
} from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const { currentUser, warehouses } = useInventory()
  const { toast } = useToast()

  const [name, setName] = useState(currentUser.name)
  const [email, setEmail] = useState(currentUser.email)
  const [defaultWarehouse, setDefaultWarehouse] = useState(currentUser.defaultWarehouseId)
  const [notifications, setNotifications] = useState(currentUser.notificationsEnabled)
  const [apiKeyCopied, setApiKeyCopied] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: 'Profile Updated',
      description: 'Your user preferences have been saved successfully.',
      type: 'success',
    })
  }

  const copyApiKey = () => {
    navigator.clipboard?.writeText('sk_live_stk_8849204910294810294819')
    setApiKeyCopied(true)
    toast({
      title: 'API Token Copied',
      description: 'StockSense REST integration key copied to clipboard.',
      type: 'info',
    })
    setTimeout(() => setApiKeyCopied(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="User Profile & Settings"
        subtitle="Manage your operator profile, default warehouse node, security credentials, and ERP integrations."
      />

      {/* Main Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white border-2 border-white/20 shadow-xl shadow-black/40">
                <User className="w-8 h-8 text-slate-200" />
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0e131f]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">{name}</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#ff6a00]/15 text-[#ff8c33] border border-[#ff6a00]/30 uppercase">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.role}</p>
              <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Ledger Signing Access
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-5 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Enterprise Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Default Warehouse Hub"
              value={defaultWarehouse}
              onChange={(e) => setDefaultWarehouse(e.target.value)}
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.code} - {wh.name}
                </option>
              ))}
            </Select>

            <Input
              label="Role & Privileges"
              value="Global Inventory Director (Tier 1)"
              disabled
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#ff6a00]" />
              <div>
                <div className="text-sm font-semibold text-white">Stock Variance & Low-Threshold Alerts</div>
                <div className="text-xs text-slate-400">Receive instant push notifications for critical stockouts</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-4 h-4 accent-[#ff6a00] rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-white/[0.08]">
            <Button variant="primary" size="sm" type="submit">
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>

      {/* API & ERP Integration Key */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-[#ff6a00]" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
              REST API & ERP Integration Keys
            </h3>
            <p className="text-xs text-slate-400">
              Use this bearer key to connect StockSense to Odoo, SAP, or custom WMS microservices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="password"
            value="sk_live_stk_8849204910294810294819"
            readOnly
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs text-slate-300 focus:outline-none select-all"
          />
          <Button variant="secondary" size="sm" onClick={copyApiKey}>
            {apiKeyCopied ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Copied
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="w-4 h-4" /> Copy Key
              </span>
            )}
          </Button>
        </div>
      </Card>

      {/* Security & Sessions */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
                Two-Factor Security Authentication
              </h3>
              <p className="text-xs text-slate-400">Hardware FIDO2 / YubiKey & Authenticator App</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            Enforced
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Laptop className="w-4 h-4 text-slate-400" />
            <div>
              <div className="font-semibold text-white">Current Active Session (This Device)</div>
              <div className="text-[11px] font-mono text-slate-400">IP: 198.51.100.44 • Chrome on Windows</div>
            </div>
          </div>
          <span className="text-emerald-400 font-mono">Active Now</span>
        </div>
      </Card>
    </div>
  )
}
