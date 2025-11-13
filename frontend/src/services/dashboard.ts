import { api } from '../services/api';
import dayjs from 'dayjs';


const qp = (o: Record<string, any>) =>
  Object.fromEntries(Object.entries(o).filter(([,v]) => v !== undefined && v !== null
));

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    // booleans e números viram string
    sp.append(k, String(v));
  });
  return `?${sp.toString()}`;
}


export type KpisDTO = {
  nps: number;
  totalFeedbacks: number;
  areasComAlerta: number;
  totalAreas: number;
};

export type SeriesPoint = { bucket: string; avg: number; count: number };
export type DistBin = { rating: number; total: number };
export type TopArea = { categoryId: number; area: string; media: number; alertas: number };



// ====== TIPOS NOVOS (adicione somente se ainda não existir) ======
export type NpsSeriesPoint = { bucket: string; nps: number };
export type VolumePoint = { bucket: string; total: number };
export type HeatmapItem = { topic: string; week: string; total: number };
export type TopicsPolarityRow = { topic: string; neg: number; neu: number; pos: number; pneg: number };
export type WorstQuestionRow = { questionId: string; pergunta: string; media: number };
export type AreasAlertsRow = { area: string; total: number; crit: number; ok: number };
export type HourlyRow = { hour: number; total: number };

// Boxplot
export type BoxplotRow = {
  group: string;
  min: number; q1: number; median: number; q3: number; max: number;
  outliers: number[];
};

// ====== SERVICES  ======

// KPIs (header)
export function getKpis(p: {
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/kpis${qs(p)}`).then(r => r.data);
}

// Série temporal (linha)
export function getSeries(p: {
  interval: 'day' | 'week' | 'month';
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/series${qs(p)}`).then(r => r.data);
}

// Distribuição de notas (barras)
export function getDistribution(p: {
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/distribution${qs(p)}`).then(r => r.data);
}

// Top áreas (cards/painéis auxiliares)
export function getTopAreas(p: {
  limit: number;
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/top-areas${qs(p)}`).then(r => r.data);
}

// NPS (linha)
export function getNpsSeries(p: {
  interval: 'day' | 'week' | 'month';
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/nps-series${qs(p)}`).then(r => r.data);
}

// Volume de feedbacks (linha)
export function getVolumeSeries(p: {
  interval: 'day' | 'week' | 'month';
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/volume-series${qs(p)}`).then(r => r.data);
}

// Polaridade por tópico (barras empilhadas)
export function getTopicsPolarity(p: {
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/topics-polarity${qs(p)}`).then(r => r.data);
}

// Heatmap Tópicos × Semana (empilhado)
export async function getTopicsHeatmap(params: {
  from?: string;
  to?: string;
  categoryId?: string;
  top?: number;
}) {
  const { data } = await api.get('/dashboard/topics-heatmap', { params });
  // data esperado: Array<{ week: string; topic: string; total: number }>
  return data;
}

// Piores perguntas (Top 5)
export function getWorstQuestions(p: {
  limit: number;
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/questions-worst${qs(p)}`).then(r => r.data);
}

// Alertas por área (barras empilhadas)
export function getAreasAlerts(p: {
  limit: number;
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/areas-alerts${qs(p)}`).then(r => r.data);
}

// Participação por horário
export function getHourly(p: {
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/hourly${qs(p)}`).then(r => r.data);
}

// Boxplot — notas por Curso/Turno
export function getBoxplotNotas(p: {
  groupBy: 'curso' | 'turno';
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/boxplot-notas${qs(p)}`).then(r => r.data);
}
export type WordsHeatRow = {
  week: string;
  categoryId: string | null;
  word: string;
  total: number;
  rk: number;
};

// Ajuste: usar query params (axios monta e faz encode)
export async function getWordsHeatmapByPolarity(opts: {
  polarity: 'pos' | 'neg';
  top?: number;
  from?: string | null;
  to?: string | null;
  categoryId?: string | null;
  curso?: string | null;
  turno?: string | null;
  unidade?: string | null;
  identified?: boolean | null;
}) {
  const { polarity, top = 6, from, to, categoryId, curso, turno, unidade, identified } = opts;

  const res = await api.get('/dashboard/words/heatmap', {
    params: {
      polarity,
      top,
      from: from ?? undefined,
      to: to ?? undefined,
      categoryId: categoryId ?? undefined,
      curso: curso ?? undefined,
      turno: turno ?? undefined,
      unidade: unidade ?? undefined,
      identified: identified ?? undefined,
    },
  });

  return res.data;
}
