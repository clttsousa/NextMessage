import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className, children, variant = 'primary', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
  const styles: Record<Variant, string> = {
    primary: 'bg-blue-500 text-white hover:bg-blue-400 shadow-[0_6px_16px_rgba(59,130,246,0.35)]',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
    ghost: 'bg-transparent text-slate-300 hover:bg-slate-800/80',
    danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_6px_16px_rgba(225,29,72,0.35)]'
  };

  return <button className={cn(base, styles[variant], className)} {...props}>{children}</button>;
}
