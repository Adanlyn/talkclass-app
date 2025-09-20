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
