import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'default', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0';
  
  const variantClasses = {
    default: 'bg-gradient-to-r from-brand to-brand/80 text-white hover:from-brand/90 hover:to-brand/70 focus:ring-brand/40 shadow-brand/25',
    outline: 'border-2 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-slate-200 hover:border-slate-500 focus:ring-slate-500/40 bg-slate-800/30 backdrop-blur-sm',
    ghost: 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-200 focus:ring-slate-500/40 bg-slate-800/20 backdrop-blur-sm',
    destructive: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500/40 shadow-red-500/25'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
