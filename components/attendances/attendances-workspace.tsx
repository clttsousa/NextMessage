'use client';

import { useMemo, useState } from 'react';
import { AttendanceStatus } from '@prisma/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { AttendancesTable, type AttendanceTableRow } from '@/components/attendances/attendances-table';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { Button } from '@/components/ui/button';

const statuses: AttendanceStatus[] = ['PENDENTE', 'EM_ATENDIMENTO', 'RETORNAR_DEPOIS', 'RESOLVIDO'];

function fuzzyMatch(text: string, query: string) {
  if (!query.trim()) return true;
  const source = text.toLowerCase();
  const target = query.toLowerCase();
  let pointer = 0;
  for (const char of source) {
    if (char === target[pointer]) pointer += 1;
    if (pointer === target.length) return true;
  }
  return source.includes(target);
}

export function AttendancesWorkspace({ rows }: { rows: AttendanceTableRow[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<AttendanceStatus | 'ALL'>('ALL');
  const [view, setView] = useState<'tabela' | 'kanban'>('tabela');
  const [grouping, setGrouping] = useState<'status' | 'responsavel'>('status');

  const recent = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('ops.search.recent') ?? '[]') as string[] : [];

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus = status === 'ALL' || row.status === status;
      const matchesQuery = !query || [row.customerName, row.protocol, row.phone, row.reason, row.assigneeName ?? ''].some((text) => fuzzyMatch(text, query));
      return matchesStatus && matchesQuery;
    });
  }, [rows, status, query]);

  const saveSearch = () => {
    if (!query.trim()) return;
    const next = [query, ...recent.filter((item) => item !== query)].slice(0, 8);
    localStorage.setItem('ops.search.recent', JSON.stringify(next));
  };

  const onDrop = async (attendanceId: string, nextStatus: AttendanceStatus) => {
    if (nextStatus === 'RESOLVIDO' || nextStatus === 'RETORNAR_DEPOIS' || nextStatus === 'VIROU_OS' || nextStatus === 'CANCELADO') {
      toast.warning('Esse status exige dados complementares', { description: 'Abra o atendimento para concluir a transição com validação completa.' });
      return;
    }
    const response = await fetch(`/api/attendances/${attendanceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, serviceResult: '', outcome: '', notes: '', needsFollowUp: false, followUpDate: null, becameServiceOrder: false, serviceOrderNumber: '', serviceOrderJustification: '', cancellationReason: '' })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error('Não foi possível mover o card', { description: data.error || 'A transição não é permitida.' });
      return;
    }
    toast.success('Status atualizado no kanban. Atualize a tela para refletir todos os indicadores.');
  };

  const byResponsible = useMemo(() => {
    return filtered.reduce<Record<string, AttendanceTableRow[]>>((acc, row) => {
      const key = row.assigneeName ?? 'Sem responsável';
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="space-y-4">
      <Card className="sticky top-3 z-20">
        <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto,auto,auto] md:items-end">
          <div>
            <label className="mb-1 block">Busca inteligente</label>
            <input
              name="q"
              value={query}
              onFocus={() => setQuery((current) => current || recent[0] || '')}
              onBlur={saveSearch}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cliente, protocolo, telefone ou resumo"
            />
            <p className="mt-1 text-xs text-slate-400">{filtered.length} resultados em tempo real</p>
          </div>
          <div>
            <label className="mb-1 block">Status</label>
            <select value={status} onChange={(event) => setStatus(event.target.value as AttendanceStatus | 'ALL')}>
              <option value="ALL">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_ATENDIMENTO">Em atendimento</option>
              <option value="SEM_RETORNO">Sem retorno</option>
              <option value="RETORNAR_DEPOIS">Retornar depois</option>
              <option value="RESOLVIDO">Resolvido</option>
              <option value="VIROU_OS">Virou O.S.</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block">Visualização</label>
            <select value={view} onChange={(event) => setView(event.target.value as 'tabela' | 'kanban')}>
              <option value="tabela">Tabela</option>
              <option value="kanban">Kanban</option>
            </select>
          </div>
          {view === 'kanban' ? (
            <div>
              <label className="mb-1 block">Agrupamento</label>
              <select value={grouping} onChange={(event) => setGrouping(event.target.value as 'status' | 'responsavel')}>
                <option value="status">Por status</option>
                <option value="responsavel">Por responsável</option>
              </select>
            </div>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => { setQuery(''); setStatus('ALL'); }} className="h-[42px]">Limpar</Button>
        </div>
      </Card>

      {view === 'tabela' ? (
        filtered.length === 0 ? <Card className="p-10 text-center text-slate-400">Nenhum atendimento encontrado para os filtros aplicados.</Card> : <AttendancesTable data={filtered} searchTerm={query} />
      ) : (
        <>
          {grouping === 'status' ? (
            <div className="grid gap-3 xl:grid-cols-4">
              {statuses.map((column) => (
                <Card key={column} className="p-3">
                  <h3 className="mb-2 text-sm font-semibold text-slate-100">{column.replaceAll('_', ' ')}</h3>
                  <div
                    className="space-y-2"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      const id = event.dataTransfer.getData('text/plain');
                      if (id) void onDrop(id, column);
                    }}
                  >
                    {filtered.filter((item) => item.status === column).map((item) => (
                      <Link key={item.id} href={`/attendimentos/${item.id}`} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)} className="block rounded-xl border border-slate-700 bg-slate-900/70 p-3 transition hover:border-blue-400/40">
                        <p className="text-xs text-slate-400">{item.protocol}</p>
                        <p className="font-semibold text-slate-100">{item.customerName}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.reason}</p>
                        <div className="mt-2 flex flex-wrap gap-1"><StatusBadge status={item.status} /><PriorityBadge referenceDate={item.referenceDate} status={item.status} /></div>
                        <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-300"><AvatarInitials name={item.assigneeName ?? 'Não atribuído'} className="h-5 w-5 text-[10px]" />{item.assigneeName ?? 'Sem responsável'}</p>
                      </Link>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {Object.entries(byResponsible).map(([responsible, items]) => (
                <Card key={responsible} className="p-3">
                  <h3 className="mb-2 text-sm font-semibold text-slate-100">{responsible}</h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <Link key={item.id} href={`/attendimentos/${item.id}`} className="block rounded-lg border border-slate-700 bg-slate-900/70 p-2.5">
                        <p className="text-sm font-medium text-slate-100">{item.protocol} · {item.customerName}</p>
                        <div className="mt-1"><StatusBadge status={item.status} /></div>
                      </Link>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
