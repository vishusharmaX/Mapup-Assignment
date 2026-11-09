import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#F5F7FA] text-[#172033] border border-[#E5EAF0]',
        delivery: 'bg-blue-50 text-[#2563EB] border border-blue-200',
        restricted: 'bg-red-50 text-[#DC4C4C] border border-red-200',
        toll: 'bg-amber-50 text-[#E9A23B] border border-amber-200',
        customer: 'bg-emerald-50 text-[#0F9D8A] border border-emerald-200',
        active: 'bg-emerald-50 text-[#16A36A] border border-emerald-200',
        idle: 'bg-amber-50 text-[#E9A23B] border border-amber-200',
        offline: 'bg-slate-100 text-[#667085] border border-slate-200',
        entry: 'bg-emerald-50 text-[#16A36A] border border-emerald-200',
        exit: 'bg-amber-50 text-[#E9A23B] border border-amber-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export function CategoryBadge({ category }: { category: string }) {
  switch (category) {
    case 'delivery_zone':
      return <Badge variant="delivery">Delivery Zone</Badge>
    case 'restricted_zone':
      return <Badge variant="restricted">Restricted Zone</Badge>
    case 'toll_zone':
      return <Badge variant="toll">Toll Zone</Badge>
    case 'customer_area':
      return <Badge variant="customer">Customer Area</Badge>
    default:
      return <Badge>{category}</Badge>
  }
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-[#16A36A] border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16A36A] animate-pulse"></span>
          Active
        </span>
      )
    case 'idle':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-[#E9A23B] border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E9A23B]"></span>
          Idle
        </span>
      )
    case 'offline':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-[#667085] border border-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
          Offline
        </span>
      )
  }
}

export function EventBadge({ eventType }: { eventType: string }) {
  if (eventType === 'entry') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#16A36A] border border-emerald-200">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        ENTRY
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-[#E9A23B] border border-amber-200">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      EXIT
    </span>
  )
}

