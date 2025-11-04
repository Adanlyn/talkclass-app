// frontend/src/services/categories.ts
import api from '../services/api';

export type CategoryLite = { id: string; nome: string };
export async function getCategoriesLite() {
  const r = await api.get('/api/categories', { params: { onlyActive: true, pageSize: 200 }});
  // adapte ao seu shape de retorno
  return (r.data.items ?? r.data ?? []).map((c: any) => ({ id: c.id ?? c.Id, nome: c.nome ?? c.Nome })) as CategoryLite[];
}


export type Category = {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem: number;
  ativa: boolean;
  criadoEm: string;
  perguntasCount?: number;
};

export type Paged<T> = {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
};

export async function listCategories(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
  onlyActive?: boolean;
}): Promise<Paged<Category>> {
  const qp = {
    search: params?.search ?? '',
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 10,
    onlyActive: params?.onlyActive ?? false,
  };
  const { data } = await api.get<Paged<Category>>('/categories', { params: qp });
  return data;
}

export async function createCategory(payload: { nome: string; descricao?: string | null }) {
  const { data } = await api.post('/categories', payload);
  return data as { id: string };
}

export async function updateCategory(id: string, payload: { nome: string; descricao?: string | null; ordem?: number }) {
  await api.put(`/categories/${id}`, payload);
}

export async function toggleCategory(id: string, ativa: boolean) {
  await api.patch(`/categories/${id}/status`, { ativa });
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`);
}
