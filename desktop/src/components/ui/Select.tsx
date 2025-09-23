import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helpText, options, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs text-slate-400 font-medium">
            {label}
          </label>
        )}
        <select
          className={cn(
            "w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-slate-200",
            "focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-400 focus:ring-red-400/40",
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-800">
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        {helpText && !error && (
          <p className="text-xs text-slate-500">{helpText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };