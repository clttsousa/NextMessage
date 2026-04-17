'use client';

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { StatusBadge, Pill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

type Row = {
  id: string;
  protocol: string;
  customerName: string;
  phone: string;
  reason: string;
  status: any;
  assigneeName: string | null;
  assignedTo: string | null;
  referenceDate: string;
  originalAttendantName: string;
};

export function AttendancesTable({ data, currentUserId }: { data: Row[]; currentUserId: string }) {
  const [message, setMessage] = useState('');

  const claim = async (id: string) => {
    setMessage('');
    const res = await fetch(`/api/attendances/${id}/claim`, { method: 'POST' });
    const payload = await res.json();
    if (!res.ok) return setMessage(payload.error || 'Falha ao assumir atendimento');
    window.location.reload();
  };

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: 'protocol',
      header: 'Protocolo',
      cell: ({ row }) => <div><p className="font-medium text-slate-100">{row.original.protocol}</p><p className="text-xs text-slate-400">Ref. {format(new Date(row.original.referenceDate), 'dd/MM/yyyy', { locale: ptBR })}</p></div>
    },
    {
      accessorKey: 'customerName',
      header: 'Cliente',
      cell: ({ row }) => <div><p>{row.original.customerName}</p><p className="text-xs text-slate-400">{row.original.phone}</p></div>
    },
    {
      accessorKey: 'reason',
      header: 'Motivo',
      cell: ({ row }) => <p className="max-w-xs truncate text-slate-300" title={row.original.reason}>{row.original.reason}</p>
    },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      accessorKey: 'assigneeName',
      header: 'Responsável',
      cell: ({ row }) => row.original.assigneeName ? (
        <div className="space-y-1"><Pill>{row.original.assigneeName}</Pill>{row.original.assignedTo === currentUserId && <p className="text-xs text-blue-300">Este atendimento é seu</p>}</div>
      ) : <Pill className="border-amber-500/40 text-amber-300">Sem responsável</Pill>
    },
    { accessorKey: 'originalAttendantName', header: 'Atendente original' },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {!row.original.assignedTo && <Button type="button" className="px-3 py-1.5 text-xs" onClick={() => claim(row.original.id)}>Assumir</Button>}
          <a className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800" href={`/attendimentos/${row.original.id}`}>Abrir</a>
        </div>
      )
    }
  ];

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-3">
      {message && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-sm text-rose-300">{message}</p>}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.12em] text-slate-400">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>{hg.headers.map((h) => <th className="px-3 py-3" key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-800/80 align-top transition hover:bg-slate-800/40">
                {row.getVisibleCells().map((c) => <td className="px-3 py-3" key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {data.map((item) => (
          <div key={item.id} className="surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{item.protocol}</p>
                <p className="text-xs text-slate-400">{item.customerName}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm text-slate-300 ">{item.reason}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <span>{item.phone}</span><span>•</span><span>{item.assigneeName ?? 'Sem responsável'}</span>
            </div>
            <div className="mt-3 flex gap-2">
              {!item.assignedTo && <Button type="button" className="px-3 py-1.5 text-xs" onClick={() => claim(item.id)}>Assumir</Button>}
              <a className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs" href={`/attendimentos/${item.id}`}>Abrir detalhes</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
