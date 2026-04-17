'use client';

import { AttendanceStatus } from '@prisma/client';
import { ColumnDef, SortingState, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Row = {
  id: string;
  protocol: string;
  customerName: string;
  phone: string;
  reason: string;
  status: AttendanceStatus;
  assigneeName: string | null;
  referenceDate: string;
  originalAttendantName: string;
};

function getUrgencyTone(referenceDate: string, status: AttendanceStatus) {
  if (['RESOLVIDO', 'VIROU_OS', 'CANCELADO'].includes(status)) return 'border-l-slate-700';
  const diffHours = (Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60);
  if (diffHours >= 36) return 'border-l-rose-500';
  if (diffHours >= 24) return 'border-l-orange-500';
  if (diffHours >= 16) return 'border-l-amber-500';
  return 'border-l-emerald-500';
}

export function AttendancesTable({ data }: { data: Row[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'protocol', desc: true }]);

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { accessorKey: 'protocol', header: 'Protocolo' },
      {
        accessorKey: 'customerName',
        header: 'Cliente',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-slate-100">{row.original.customerName}</p>
            <p className="truncate text-xs text-slate-400">{row.original.reason}</p>
          </div>
        )
      },
      { accessorKey: 'phone', header: 'Telefone' },
      {
        accessorKey: 'status',
        header: 'Status / SLA',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={row.original.status} />
            <PriorityBadge referenceDate={row.original.referenceDate} status={row.original.status} />
          </div>
        )
      },
      {
        accessorKey: 'assigneeName',
        header: 'Responsável',
        cell: ({ row }) => (
          <div className="inline-flex items-center gap-2">
            <AvatarInitials name={row.original.assigneeName ?? 'Não atribuído'} className="h-8 w-8 text-[10px]" />
            <span>{row.original.assigneeName ?? 'Não atribuído'}</span>
          </div>
        )
      },
      { accessorKey: 'originalAttendantName', header: 'Atendente original' },
      {
        id: 'actions',
        header: 'Ação rápida',
        enableSorting: false,
        cell: ({ row }) => (
          <Link className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-100 hover:bg-blue-500/20" href={`/attendimentos/${row.original.id}`}>
            Abrir
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )
      }
    ],
    []
  );

  const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });

  return (
    <>
      <div className="hidden overflow-auto rounded-2xl border border-slate-800/80 bg-slate-900/60 md:block">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-slate-900/90 text-slate-300">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th className="p-3.5 font-medium" key={h.id}>
                    {h.isPlaceholder ? null : (
                      <button type="button" className={h.column.getCanSort() ? 'inline-flex items-center gap-1 hover:text-slate-100' : ''} onClick={h.column.getToggleSortingHandler()}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {{ asc: '↑', desc: '↓' }[h.column.getIsSorted() as string] ?? ''}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                tabIndex={0}
                onClick={() => (window.location.href = `/attendimentos/${row.original.id}`)}
                onKeyDown={(event) => event.key === 'Enter' && (window.location.href = `/attendimentos/${row.original.id}`)}
                className={cn(
                  'cursor-pointer border-l-4 border-t border-slate-800/80 transition hover:bg-slate-800/35 focus-visible:bg-slate-800/45',
                  getUrgencyTone(row.original.referenceDate, row.original.status)
                )}
                key={row.id}
              >
                {row.getVisibleCells().map((c) => (
                  <td className="p-3.5 align-top" key={c.id} onClick={(event) => c.column.id === 'actions' && event.stopPropagation()}>
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {table.getRowModel().rows.map((r) => {
          const row = r.original;
          return (
            <Link key={row.id} href={`/attendimentos/${row.id}`} className={cn('surface block border-l-4 p-4 transition active:scale-[0.995]', getUrgencyTone(row.referenceDate, row.status))}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-400">{row.protocol}</p>
                  <p className="font-semibold text-slate-50">{row.customerName}</p>
                </div>
                <StatusBadge status={row.status} />
              </div>
              <p className="text-sm text-slate-300">{row.reason}</p>
              <div className="mt-2">
                <PriorityBadge referenceDate={row.referenceDate} status={row.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <span>{row.phone}</span>
                <span className="text-right">{row.originalAttendantName}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs text-slate-300"><AvatarInitials name={row.assigneeName ?? 'Não atribuído'} className="h-6 w-6 text-[10px]" />{row.assigneeName ?? 'Não atribuído'}</span>
                <span className="inline-flex items-center text-xs font-semibold text-blue-200">Abrir<ChevronRight className="h-4 w-4" /></span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
