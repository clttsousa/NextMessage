'use client';

import { Bell, BellRing, CheckCheck, TriangleAlert, CircleCheck, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  attendanceId: string;
  attendanceProtocol?: string;
  level: 'sucesso' | 'aviso' | 'critico';
  createdAt: string;
};

const toneClass = {
  sucesso: 'border-emerald-500/30 bg-emerald-500/10',
  aviso: 'border-amber-500/30 bg-amber-500/10',
  critico: 'border-rose-500/40 bg-rose-500/10'
};

const iconMap = {
  sucesso: CircleCheck,
  aviso: AlertCircle,
  critico: TriangleAlert
};

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setReadIds(JSON.parse(localStorage.getItem('ops.notifications.readIds') ?? '[]'));
    setSoundEnabled(localStorage.getItem('ops.notifications.sound') === 'on');

    fetch('/api/notifications/recent')
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => null);

    const es = new EventSource('/api/notifications/stream');
    es.addEventListener('notifications', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { items: NotificationItem[]; hasNew: boolean };
      setItems(payload.items);
      if (payload.hasNew && payload.items[0]) {
        const latest = payload.items[0];
        toast[latest.level === 'critico' ? 'error' : latest.level === 'aviso' ? 'warning' : 'success'](latest.title, {
          description: latest.description
        });
        if (soundEnabled) {
          audioRef.current?.play().catch(() => null);
        }
      }
    });

    return () => es.close();
  }, [soundEnabled]);

  const unreadCount = useMemo(() => items.filter((item) => !readIds.includes(item.id)).length, [items, readIds]);

  const markAsRead = () => {
    const ids = items.map((item) => item.id);
    setReadIds(ids);
    localStorage.setItem('ops.notifications.readIds', JSON.stringify(ids));
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('ops.notifications.sound', next ? 'on' : 'off');
    toast.success(next ? 'Som de notificações ativado' : 'Som de notificações desativado');
  };

  return (
    <div className="relative">
      <audio ref={audioRef} preload="auto" src="data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAAAAA=" />
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) markAsRead();
        }}
        className="relative rounded-xl border border-slate-700/90 bg-slate-900/80 p-2 text-slate-200 transition hover:bg-slate-800"
        aria-label="Abrir notificações"
      >
        {unreadCount > 0 ? <BellRing className="h-4 w-4 text-amber-300" /> : <Bell className="h-4 w-4" />}
        {unreadCount > 0 ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 text-center text-[10px] font-semibold text-white">{unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(94vw,440px)] rounded-2xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Notificações operacionais</h3>
            <div className="flex items-center gap-1">
              <button type="button" onClick={toggleSound} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800" title="Alternar som">
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button type="button" onClick={markAsRead} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800" title="Marcar como lidas">
                <CheckCheck className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-[26rem] space-y-2 overflow-auto pr-1">
            {items.length === 0 ? <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-400">Sem alertas recentes.</p> : items.map((item) => {
              const Icon = iconMap[item.level];
              return (
                <Link
                  key={item.id}
                  href={`/attendimentos/${item.attendanceId}`}
                  onClick={() => setOpen(false)}
                  className={cn('block rounded-xl border p-3 transition hover:border-blue-400/40', toneClass[item.level], !readIds.includes(item.id) && 'ring-1 ring-blue-400/20')}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                      <p className="truncate text-xs text-slate-300">{item.description}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{item.attendanceProtocol ? `${item.attendanceProtocol} • ` : ''}{formatTime(item.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
