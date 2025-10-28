import { api } from '../services/api';

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
export async function getSeries(params?: { categoryId?: number; interval?: 'day'|'week'; from?: string; to?: string }) {
  const { data } = await api.get<SeriesPoint[]>('/dashboard/series', { params });
  return data;
}
export async function getDistribution(params?: { from?: string; to?: string }) {
  const { data } = await api.get<DistBin[]>('/dashboard/distribution', { params });
  return data;
}
export async function getTopAreas(params?: { limit?: number; from?: string; to?: string }) {
  const { data } = await api.get<TopArea[]>('/dashboard/top-areas', { params });
  return data;
}
