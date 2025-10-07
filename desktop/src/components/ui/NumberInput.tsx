import { forwardRef } from 'react';
import { NumericFormat } from 'react-number-format';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  label?: string;
  error?: string;
  helpText?: string;
  type?: 'currency' | 'percentage' | 'decimal';
  value?: number;
  onChange?: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, label, error, helpText, type = 'decimal', value, onChange, id, ...props }, ref) => {
    const inputId = id || `number-input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helpId = helpText && !error ? `${inputId}-help` : undefined;
    const getFormatProps = () => {
      switch (type) {
        case 'currency':
          return {
            thousandSeparator: '.',
            decimalSeparator: ',',
            prefix: 'USD ',
            decimalScale: 2,
            fixedDecimalScale: true,
          };
        case 'percentage':
          return {
            suffix: ' %',
            decimalSeparator: ',',
            decimalScale: 2,
            fixedDecimalScale: true,
          };
        default:
          return {
            decimalSeparator: ',',
            decimalScale: 2,
          };
      }
    };

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
        <NumericFormat
          id={inputId}
          getInputRef={ref}
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
          value={value}
          onValueChange={(values) => {
            onChange?.(values.floatValue);
          }}
          aria-describedby={errorId || helpId}
          aria-invalid={error ? 'true' : 'false'}
          {...getFormatProps()}
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

NumberInput.displayName = 'NumberInput';

export { NumberInput };