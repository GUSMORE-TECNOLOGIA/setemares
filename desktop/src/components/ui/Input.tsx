import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  id?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helpId = helpText && !error ? `${inputId}-help` : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="form-label"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full h-10 rounded-lg px-3 text-sm transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-brand/60",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "form-input",
            error && "border-red-500 focus:ring-red-500/60 focus:border-red-500",
            className
          )}
          style={{
            backgroundColor: 'var(--surface-tertiary)',
            borderColor: error ? '#EF4444' : 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
          ref={ref}
          aria-describedby={errorId || helpId}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-red-400" role="alert" aria-live="polite">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={helpId} className="text-sm text-slate-400">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };