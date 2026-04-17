'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'border border-slate-700/80 bg-slate-900 text-slate-100',
          title: 'text-sm font-semibold',
          description: 'text-xs text-slate-300'
        }
      }}
    />
  );
}
