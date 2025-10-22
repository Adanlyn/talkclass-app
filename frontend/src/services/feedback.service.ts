// src/services/feedback.service.ts
import { api } from './api';

export type Categoria = {
  id: string;
  nome: string;
  descricao?: string | null;
  ativa?: boolean;
  ordem?: number;
};

export type PerguntaOpcao = { id: string; texto: string };
export enum TipoAvaliacao { Nota = 0, SimNao = 1, Multipla = 2, Texto = 3 }

export type Pergunta = {
  id: string;
  categoriaId: string;
  enunciado: string;
  tipo: TipoAvaliacao;
  ativa: boolean;
  ordem: number;
  opcoes?: PerguntaOpcao[];
};

export async function getCategorias() {
  const { data } = await api.get<Categoria[]>('/categorias/public'); // <- sem /api
  return data;
}

export async function getPerguntasDaCategoria(categoriaId: string) {
  const { data } = await api.get<Pergunta[]>(`/categorias/${categoriaId}/perguntas`);
  return data;
}

export type CreateFeedbackDto = {
  categoriaId: string;
  cursoOuTurma?: string;
  nomeIdentificado?: string;
  contatoIdentificado?: string;
  respostas: Array<{
    perguntaId: string;
    tipo: TipoAvaliacao;
    valorNota: number | null;
    valorBool: boolean | null;
    valorOpcao: string | null;
    valorTexto: string | null;
  }>;
};

export async function createFeedback(dto: CreateFeedbackDto) {
  await api.post('/feedbacks', dto);
}

export type FeedbackListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
  categoriaId?: string;
  sort?: 'asc' | 'desc';
};

export type FeedbackListItem = {
  id: string;
  criadoEm: string;          // ISO
  categoriaId: string;
  categoriaNome: string;
  cursoOuTurma?: string | null;
  resumo?: string | null;
  qtdRespostas: number;
  notaMedia?: number | null;
};

export async function listFeedbacks(p: FeedbackListParams) {
  const { data } = await api.get('/feedbacks', { params: p });
  return data as { items: FeedbackListItem[]; total: number };
}