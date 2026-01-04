import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm'
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const shadowClasses = {
    none: 'border border-slate-100',
    sm: 'shadow-sm border border-slate-100',
    md: 'shadow-md shadow-slate-200/40 border border-slate-100',
    lg: 'shadow-lg shadow-slate-200/40 border border-slate-100'
  }
  
  return (
    <div className={`bg-white rounded-2xl ${paddingClasses[padding]} ${shadowClasses[shadow]} ${className} transition-all duration-300`}>
      {children}
    </div>
  )
}
