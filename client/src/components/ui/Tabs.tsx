import React from 'react'
import { cn } from '@/utils/cn'

export interface TabItem {
  id: string
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
  size?: 'sm' | 'md'
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  size = 'md',
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-xl bg-[#090d15] border border-white/[0.08] text-slate-400',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg font-medium transition-all duration-150 text-xs select-none',
              size === 'sm' ? 'px-3 py-1' : 'px-4 py-1.5',
              isActive
                ? 'bg-[#1b2338] text-white shadow-md border border-white/10 font-semibold'
                : 'hover:text-slate-200 hover:bg-white/[0.03]',
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  isActive
                    ? 'bg-[#ff6a00] text-white font-bold'
                    : 'bg-white/10 text-slate-300',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
