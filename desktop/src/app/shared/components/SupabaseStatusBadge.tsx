import type { SupabaseStatus } from '../types';

interface SupabaseStatusBadgeProps {
  status: SupabaseStatus;
}

export function SupabaseStatusBadge({ status }: SupabaseStatusBadgeProps) {
  const colorClass =
    status === 'connected' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-yellow-500';

  const label =
    status === 'connected' ? 'Supabase OK' : status === 'error' ? 'Supabase Error' : 'Testing...';

  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <span className={`w-2 h-2 rounded-full ${colorClass}`} />
      <span>{label}</span>
    </div>
  );
}
