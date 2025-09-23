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
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, label, error, helpText, type = 'decimal', value, onChange, ...props }, ref) => {
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
          <label className="text-xs text-slate-400 font-medium">
            {label}
          </label>
        )}
        <NumericFormat
          getInputRef={ref}
          className={cn(
            "w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-slate-200 placeholder:text-slate-500",
            "focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-400 focus:ring-red-400/40",
            className
          )}
          value={value}
          onValueChange={(values) => {
            onChange?.(values.floatValue);
          }}
          {...getFormatProps()}
          {...props}
        />
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

NumberInput.displayName = 'NumberInput';

export { NumberInput };