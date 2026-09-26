import React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SearchInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search by SKU, product name, reference, or batch...',
  className,
}) => {
  return (
    <div className={cn('relative flex items-center w-full max-w-md', className)}>
      <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0d121f] border border-white/10 rounded-xl pl-9 pr-14 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00]"
      />
      {value ? (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="absolute right-3 pointer-events-none hidden sm:flex items-center gap-0.5">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/[0.06] text-slate-400 border border-white/10 rounded">
            /
          </kbd>
        </div>
      )}
    </div>
  )
}
