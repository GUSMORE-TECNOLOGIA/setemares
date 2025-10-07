import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: { value: string; label: string }[];
  id?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helpText, options, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helpId = helpText && !error ? `${selectId}-help` : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={selectId}
            className="form-label"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
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
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-900 text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select';

export { Select };