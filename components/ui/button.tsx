import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-primary text-white shadow-lg shadow-blue-900/35 hover:bg-blue-500 focus-visible:ring-blue-400',
        variant === 'secondary' && 'bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:ring-slate-400',
        variant === 'ghost' && 'bg-transparent text-slate-100 hover:bg-slate-800/80 focus-visible:ring-slate-400',
        variant === 'danger' && 'bg-rose-600 text-rose-50 hover:bg-rose-500 focus-visible:ring-rose-400',
        className
      )}
      {...props}
    />
  );
}
