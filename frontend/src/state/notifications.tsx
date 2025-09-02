import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/** Tipo de notificação */
export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  when: string;   // "Hoje 10:12"
  ago: string;    // "4d"
  tag?: 'ALERTA' | 'INFO' | 'OK';
  read?: boolean; // false => nova
  meta?: string;
};

type Ctx = {
  list: NotificationItem[];
  unreadCount: number;

  // seleção/expansão
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  isSelected: (id: string) => boolean;
  isExpanded: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  toggleExpand: (id: string) => void;

  // ações
  markSelectedRead: () => void;
  deleteSelected: () => void;
  markAllRead: () => void;
  deleteAll: () => void;

  setList: (items: NotificationItem[]) => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

/** MOCK inicial – troque depois por fetch do backend */
const initialMock: NotificationItem[] = [
  {
    id: '1',
    title: 'Novo feedback em Laboratórios',
    message: '2 novos registros foram submetidos nas últimas 24h.',
    when: 'Hoje 10:12',
    ago: '2h',
    tag: 'INFO',
    read: false,
  },
  {
    id: '2',
    title: 'Alerta: Wi-Fi abaixo de 3.0',
    message: 'Queda de satisfação registrada em 48h. Priorizar suporte.',
    when: 'Ontem 18:20',
    ago: '16h',
    tag: 'ALERTA',
    read: false,
  },
  {
    id: '3',
    title: 'Exportação concluída',
    message: 'Relatório semanal pronto para download.',
    when: 'Seg 08:00',
    ago: '2d',
    tag: 'OK',
    read: true,
  },
];

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<NotificationItem[]>(initialMock);
  const [selectedIds, setSelected] = useState<Set<string>>(new Set());
  const [expandedIds, setExpanded] = useState<Set<string>>(new Set());

  const unreadCount = useMemo(() => list.filter(n => !n.read).length, [list]);

  const isSelected = (id: string) => selectedIds.has(id);
  const isExpanded = (id: string) => expandedIds.has(id);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const markSelectedRead = () => {
    setList(prev => prev.map(n => (selectedIds.has(n.id) ? { ...n, read: true } : n)));
    clearSelection();
  };

  const deleteSelected = () => {
    setList(prev => prev.filter(n => !selectedIds.has(n.id)));
    clearSelection();
  };

  const markAllRead = () => setList(prev => prev.map(n => ({ ...n, read: true })));
  const deleteAll = () => { setList([]); clearSelection(); };

  const value: Ctx = {
    list, unreadCount,
    selectedIds, expandedIds,
    isSelected, isExpanded, toggleSelect, clearSelection, toggleExpand,
    markSelectedRead, deleteSelected, markAllRead, deleteAll,
    setList,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
