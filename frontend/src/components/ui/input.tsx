import React from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-medium text-[#172033] block">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-lg border border-[#E5EAF0] bg-white px-3 py-1.5 text-sm text-[#172033] placeholder:text-[#94A3B8] transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[#DC4C4C] focus:border-[#DC4C4C] focus:ring-[#DC4C4C]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-[#DC4C4C]">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

