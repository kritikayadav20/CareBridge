import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'
  size?: 'sm' | 'md'
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md'
}: BadgeProps) {
  const variants = {
    primary: 'bg-pink-50 text-pink-700 border-pink-100 ring-pink-500/10',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/10',
    warning: 'bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/10',
    danger: 'bg-red-50 text-red-700 border-red-100 ring-red-500/10',
    info: 'bg-blue-50 text-blue-700 border-blue-100 ring-blue-500/10',
    neutral: 'bg-slate-50 text-slate-600 border-slate-100 ring-slate-500/10'
  }

  const sizes = {
    sm: 'px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold',
    md: 'px-3 py-1 text-xs font-medium'
  }

  return (
    <span className={`inline-flex items-center rounded-full border ring-1 ring-inset ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}
