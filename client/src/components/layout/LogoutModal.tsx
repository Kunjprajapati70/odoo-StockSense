import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { LogOut } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast()

  const handleLogout = () => {
    toast({
      title: 'Session Ended',
      description: 'You have safely signed out of StockSense Enterprise.',
      type: 'info',
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Sign Out" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-400">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Sign out of Alex Vance?</h4>
            <p className="text-xs text-slate-400">
              Any unsaved drafts in memory will be synced upon next login.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>
    </Modal>
  )
}
