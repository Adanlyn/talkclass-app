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

// Wordcloud
export type WordcloudItem = { word: string; count: number };

const toIso = (d: string | Date) =>
  new Date(d).toISOString();

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
export function getTopicsHeatmap(p: {
  limit?: number; // ou top
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  // compatibilidade: se vier top, mapeia para limit
  const payload = { ...p, limit: p.limit ?? (p as any).top };
  return api.get(`/dashboard/topics-heatmap${qs(payload)}`).then(r => r.data);
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

// Wordcloud (positiva/negativa)
export function getWordcloud(p: {
  polarity: 'pos' | 'neg';
  from: string; to: string;
  categoryId?: number; questionId?: number;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
}) {
  return api.get(`/dashboard/wordcloud${qs(p)}`).then(r => r.data);
}
