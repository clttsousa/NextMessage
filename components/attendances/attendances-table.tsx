'use client';

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { StatusBadge } from '@/components/ui/badge';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { PriorityBadge } from '@/components/ui/priority-badge';

type Row = {
  id: string;
  protocol: string;
  customerName: string;
  phone: string;
  reason: string;
  status: any;
  assigneeName: string | null;
  referenceDate: string;
  originalAttendantName: string;
};

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'protocol', header: 'Protocolo' },
  { accessorKey: 'customerName', header: 'Cliente', cell: ({ row }) => <div><p className="font-medium text-slate-100">{row.original.customerName}</p><p className="truncate text-xs text-slate-400">{row.original.reason}</p></div> },
  { accessorKey: 'phone', header: 'Telefone' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <div className="flex flex-wrap gap-2"><StatusBadge status={row.original.status} /><PriorityBadge referenceDate={row.original.referenceDate} status={row.original.status} /></div> },
  { accessorKey: 'assigneeName', header: 'Responsável', cell: ({ row }) => <div className="inline-flex items-center gap-2"><AvatarInitials name={row.original.assigneeName ?? 'Não atribuído'} className="h-7 w-7 text-[10px]" /><span>{row.original.assigneeName ?? 'Não atribuído'}</span></div> },
  { accessorKey: 'originalAttendantName', header: 'Atendente original' },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <a className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-100 hover:bg-blue-500/20" href={`/attendimentos/${row.original.id}`}>Abrir</a>
      </div>
    )
  }
];

export function AttendancesTable({ data }: { data: Row[] }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <>
      <div className="hidden overflow-auto rounded-2xl border border-slate-800/80 bg-slate-900/60 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/90 text-slate-300">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>{hg.headers.map((h) => <th className="p-3.5 font-medium" key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr className="border-t border-slate-800/80 transition hover:bg-slate-800/35" key={row.id}>{row.getVisibleCells().map((c) => <td className="p-3.5 align-top" key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {data.map((row) => (
          <article key={row.id} className="surface p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-slate-400">{row.protocol}</p>
                <p className="font-semibold text-slate-50">{row.customerName}</p>
              </div>
              <StatusBadge status={row.status} />
            </div>
            <p className="text-sm text-slate-300">{row.reason}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
              <span>{row.phone}</span>
              <span className="text-right">{row.originalAttendantName}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs text-slate-300"><AvatarInitials name={row.assigneeName ?? 'Não atribuído'} className="h-6 w-6 text-[10px]" />{row.assigneeName ?? 'Não atribuído'}</span>
              <a href={`/attendimentos/${row.id}`} className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white">Abrir</a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
