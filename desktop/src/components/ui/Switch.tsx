import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

interface SwitchProps {
  label?: string;
  error?: string;
  helpText?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ label, error, helpText, ...props }, ref) => (
  <div className="space-y-2">
    {label && (
      <label className="text-xs text-slate-400 font-medium">
        {label}
      </label>
    )}
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-400">Não</span>
      <SwitchPrimitives.Root
        className={cn(
          "peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-brand data-[state=unchecked]:bg-white/10"
        )}
        {...props}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
            "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
          )}
        />
      </SwitchPrimitives.Root>
      <span className="text-sm text-slate-400">Sim</span>
    </div>
    {error && (
      <p className="text-xs text-red-400">{error}</p>
    )}
    {helpText && !error && (
      <p className="text-xs text-slate-500">{helpText}</p>
    )}
  </div>
));

Switch.displayName = 'Switch';

export { Switch };