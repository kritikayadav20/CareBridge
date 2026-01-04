import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
  
  const variants = {
    // Soft Pink Primary - Love & Care
    primary: 'bg-pink-400 text-white hover:bg-pink-500 hover:shadow-md hover:shadow-pink-200 focus:ring-pink-300 border border-transparent',
    // Secondary - clean white/gray
    secondary: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 focus:ring-slate-200 shadow-sm',
    // Danger - muted red
    danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md hover:shadow-red-200 focus:ring-red-300 border border-transparent',
    // Outline - pink tinted
    outline: 'bg-transparent border border-pink-300 text-pink-500 hover:bg-pink-50 focus:ring-pink-200',
    // Success - soft emerald
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md hover:shadow-emerald-200 focus:ring-emerald-300 border border-transparent',
    // Ghost - simple text
    ghost: 'bg-transparent text-slate-500 hover:text-pink-500 hover:bg-pink-50/50'
  }
  
  const sizes = {
    sm: 'px-4 py-1.5 text-xs tracking-wide',
    md: 'px-6 py-2.5 text-sm tracking-wide',
    lg: 'px-8 py-3.5 text-base tracking-wide'
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
