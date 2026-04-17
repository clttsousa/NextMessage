'use client';

import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function ConfirmDialog({ trigger, title, description, confirmLabel, cancelLabel = 'Voltar', destructive, onConfirm }: { trigger: ReactNode; title: string; description: string; confirmLabel: string; cancelLabel?: string; destructive?: boolean; onConfirm: () => Promise<void> | void; }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{cancelLabel}</Button>
          <Button type="button" variant={destructive ? 'danger' : 'primary'} onClick={confirm} disabled={loading}>{loading ? 'Processando...' : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
