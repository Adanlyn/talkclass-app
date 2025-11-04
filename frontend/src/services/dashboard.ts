import { api } from '../services/api';
import dayjs from 'dayjs';


const qp = (o: Record<string, any>) =>
  Object.fromEntries(Object.entries(o).filter(([,v]) => v !== undefined && v !== null
));

export type KpisDTO = {
  nps: number;
  totalFeedbacks: number;
  areasComAlerta: number;
  totalAreas: number;
};

export type SeriesPoint = { bucket: string; avg: number; count: number };
export type DistBin = { rating: number; total: number };
export type TopArea = { categoryId: number; area: string; media: number; alertas: number };

export async function getKpis(params?: { from?: string; to?: string }) {
  const { data } = await api.get<KpisDTO>('/dashboard/kpis', { params });
  return data;
}
/*export async function getSeries(params?: { categoryId?: number; interval?: 'day'|'week'; from?: string; to?: string }) {
  const { data } = await api.get<SeriesPoint[]>('/dashboard/series', { params });
  return data;
}*/
export async function getDistribution(params?: { from?: string; to?: string }) {
  const { data } = await api.get<DistBin[]>('/dashboard/distribution', { params });
  return data;
}
export async function getTopAreas(params?: { limit?: number; from?: string; to?: string }) {
  const { data } = await api.get<TopArea[]>('/dashboard/top-areas', { params });
  return data;
}

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

// ====== SERVICES NOVOS (rotas adicionais) ======

// NPS por período (linha)



// Heatmap Tópicos × Semana
/*export const getTopicsHeatmap = (p: { from: string; to: string; categoryId?: string; top?: number }) =>
  api.get('/dashboard/topics-heatmap', { params: { ...p, top: p.top ?? 6 } }).then(r => r.data);
*/
// Polaridade por tópico (barras empilhadas)
export function getTopicsPolarity(p: { from: string; to: string; signal?: AbortSignal }) {
  return api.get<TopicsPolarityRow[]>('/dashboard/topics-polarity', { params: p, signal: p.signal }).then(r => r.data);
}




// Boxplot — notas por Curso/Turno/Unidade
export function getBoxplotNotas(p: {
  groupBy: 'curso' | 'turno' | 'unidade';
  from: string; to: string;
  categoryId?: string; questionId?: string;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
  signal?: AbortSignal;
}) {
  return api.get<BoxplotRow[]>('/dashboard/boxplot-notas', { params: p, signal: p.signal }).then(r => r.data);
}

// Nuvem de Palavras (positivas/negativas)
export function getWordcloud(p: {
  polarity: 'pos' | 'neg';
  from: string; to: string;
  categoryId?: string; questionId?: string;
  curso?: string; turno?: string; unidade?: string;
  identified?: boolean;
  limit?: number; minLen?: number;
  signal?: AbortSignal;
}) {
  return api.get<WordcloudItem[]>('/dashboard/wordcloud', { params: p, signal: p.signal }).then(r => r.data);
}

// --- NOVOS SERVICES (cole no final de dashboard.ts) ---

// NPS (tendência)
export const getNpsSeries = (p: { interval: 'day' | 'week' | 'month'; from: string; to: string }) =>
  api.get('/dashboard/nps-series', { params: p }).then(r => r.data);

// Volume de feedbacks (por período)
export const getVolumeSeries = (p: { interval: 'day' | 'week' | 'month'; from: string; to: string }) =>
  api.get('/dashboard/volume-series', { params: p }).then(r => r.data);

// Alertas por área (críticos ≤3 vs ok ≥4)
export const getAreasAlerts = (p: { limit?: number; from: string; to: string; categoryId?: string }) =>
  api.get('/dashboard/areas-alerts', { params: p }).then(r => r.data);

// Participação por horário (00..23)
export const getHourly = (p: { from: string; to: string; categoryId?: string }) =>
  api.get('/dashboard/hourly', { params: p }).then(r => r.data);

// Piores perguntas (Top N por menor média)
/*export const getWorstQuestions = (p: { limit?: number; from: string; to: string; categoryId?: string }) =>
  api.get('/dashboard/questions-worst', { params: p }).then(r => r.data);*/

export const getWorstQuestions = (p: {
  limit?: number;
  from?: string | Date;
  to?: string | Date;
  categoryId?: string;
  categoryId2?: string;
  identified?: boolean;
}) =>
  api
    .get('/dashboard/questions-worst', {
      params: {
        limit: p.limit ?? 5,
        from: p.from ? toIso(p.from) : undefined,
        to: p.to ? toIso(p.to) : undefined,
        categoryId: p.categoryId,
        categoryId2: p.categoryId2,
        identified: p.identified,
      },
    })
    .then((r) => r.data);

  // Série por período (linha)
export const getSeries = (p: {
  interval: 'day' | 'week' | 'month';
  from: string;
  to: string;
  categoryId?: string;
  categoryId2?: string;
  identified?: boolean;
}) => api.get('/dashboard/series', { params: p }).then(r => r.data);

// Heatmap tópicos × semana
export const getTopicsHeatmap = (p: {
  from: string;
  to: string;
  categoryId?: string;
  limit?: number;
}) => api.get('/dashboard/topics-heatmap', { params: p }).then(r => r.data);
