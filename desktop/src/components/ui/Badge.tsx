import React from 'react';
import { X } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md', 
  removable = false,
  onRemove,
  className = ""
}: BadgeProps) {
  const baseClasses = "inline-flex items-center font-medium rounded-full transition-all duration-150";
  
  const variantClasses = {
    default: "bg-slate-700 text-slate-200 border border-slate-600",
    success: "bg-green-500/20 text-green-300 border border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    error: "bg-red-500/20 text-red-300 border border-red-500/30",
    info: "bg-blue-500/20 text-blue-300 border border-blue-500/30"
  };
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1.5 hover:bg-white/10 rounded-full p-0.5 transition-colors duration-150"
          aria-label="Remover"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}

interface ChipProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

export function Chip({ label, onRemove, className = "" }: ChipProps) {
  return (
    <Badge 
      variant="info" 
      size="sm" 
      removable={!!onRemove}
      onRemove={onRemove}
      className={className}
    >
      {label}
    </Badge>
  );
}
