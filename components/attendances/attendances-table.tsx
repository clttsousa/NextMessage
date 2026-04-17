'use client';

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { StatusBadge } from '@/components/ui/badge';

type Row = {
  id: string;
  protocol: string;
  customerName: string;
  phone: string;
  status: any;
  assigneeName: string | null;
};

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'protocol', header: 'Protocolo' },
  { accessorKey: 'customerName', header: 'Cliente' },
  { accessorKey: 'phone', header: 'Telefone' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: 'assigneeName', header: 'Responsável', cell: ({ row }) => row.original.assigneeName ?? 'Não atribuído' },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <a className="text-blue-300" href={`/attendimentos/${row.original.id}`}>Detalhes</a>
      </div>
    )
  }
];

export function AttendancesTable({ data }: { data: Row[] }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-auto rounded-lg border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>{hg.headers.map((h) => <th className="p-3" key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr className="border-t border-slate-800" key={row.id}>{row.getVisibleCells().map((c) => <td className="p-3" key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
