import { useState,useEffect } from 'react';
import {
  ActionIcon, Button, Group, Modal, Paper, Select, Stack, Switch, Table, Text,
  TextInput, Title, rem, Pagination, NumberInput
} from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { IconEdit, IconTrash, IconX } from '@tabler/icons-react';
import { useAdminTitle } from '../../components/Layout/AdminTitleContext';
import classes from '../../pages/admin/Admin.module.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { listCategories } from '../../services/categories';
import { listQuestions, createQuestion, updateQuestion, toggleQuestion, deleteQuestion } from '../../services/questions';
import type { Pergunta, TipoAvaliacao, PerguntaOpcao } from '../../services/questions';
import { notifyError, notifySuccess } from '../../services/notifications';
import OptionEditor from '../../components/OptionEditor';


const TYPES: { value: TipoAvaliacao; label: string; needsOptions?: boolean }[] = [
  { value: 'Nota', label: 'Nota (1–5)' },
  { value: 'Multipla', label: 'Múltipla escolha', needsOptions: true },
  { value: 'Texto', label: 'Texto (resposta aberta)' },
];

export default function Perguntas() {
  useAdminTitle('Perguntas');

  const [sp] = useSearchParams();
const categoriaFromUrl = sp.get('categoriaId');

const [fCategoria, setFCategoria] = useState<string | null>(categoriaFromUrl);
const [categoriaId, setCategoriaId] = useState<string | null>(categoriaFromUrl);
const [fTipo, setFTipo] = useState<TipoAvaliacao | null>(null);


useEffect(() => {
  setFCategoria(categoriaFromUrl);
  setCategoriaId(categoriaFromUrl);
}, [categoriaFromUrl]);

  // filtros
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  

  // form
  const [editId, setEditId] = useState<string | null>(null);
  const [enunciado, setEnunciado] = useState('');
  const [tipo, setTipo] = useState<TipoAvaliacao>('Texto');
  const [obrigatoria, setObrigatoria] = useState(true);
  const [ordem, setOrdem] = useState<number>(0);
  const [opcoes, setOpcoes] = useState<PerguntaOpcao[]>([]);
  const [confirm, setConfirm] = useState<{ id: string; texto: string } | null>(null);

  const qc = useQueryClient();

  // categorias ativas
  const qCats = useQuery({
    queryKey: ['categories', { search: '', page: 1, pageSize: 1000, onlyActive: true }],
    queryFn: () => listCategories({ search: '', page: 1, pageSize: 1000, onlyActive: true }),
  });
  const catOptions = (qCats.data?.items ?? []).map((c: any) => ({ value: c.id, label: c.nome }));

  // perguntas
  const q = useQuery({
    queryKey: ['questions', { search, page, pageSize, categoriaId: fCategoria ?? undefined, tipo: fTipo ?? undefined, onlyActive: false }],
    queryFn: () => listQuestions({ search, page, pageSize, categoriaId: fCategoria ?? undefined, tipo: fTipo ?? undefined, onlyActive: false }),
    keepPreviousData: true,
  });

  const items: Pergunta[] = q.data?.items ?? [];
  const total = q.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const needsOptions = TYPES.find(t => t.value === tipo)?.needsOptions === true;

  function resetForm() {
    setEditId(null); setEnunciado(''); setTipo('Texto');
    setCategoriaId(null); setObrigatoria(true); setOrdem(0); setOpcoes([]);
  }
  function fillForm(p: Pergunta) {
    setEditId(p.id); setEnunciado(p.enunciado); setTipo(p.tipo);
    setCategoriaId(p.categoriaId); setObrigatoria(p.obrigatoria); setOrdem(p.ordem);
    setOpcoes(p.opcoes ?? []);
  }

  // mutations
  const mCreate = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => { notifySuccess('Pergunta criada com sucesso.'); qc.invalidateQueries({ queryKey: ['questions'] }); resetForm(); },
    onError: (err: any) => notifyError(String(err?.response?.data ?? 'Erro ao criar pergunta')),
  });
  const mUpdate = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateQuestion(id, payload),
    onSuccess: () => { notifySuccess('Pergunta atualizada com sucesso.'); qc.invalidateQueries({ queryKey: ['questions'] }); resetForm(); },
    onError: (err: any) => notifyError(String(err?.response?.data ?? 'Erro ao atualizar pergunta')),
  });
  const mToggle = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) => toggleQuestion(id, ativa),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions'] }),
  });
  const mDelete = useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: () => { notifySuccess('Pergunta excluída.'); qc.invalidateQueries({ queryKey: ['questions'] }); setConfirm(null); },
    onError: (err: any) => notifyError(String(err?.response?.data ?? 'Erro ao excluir pergunta')),
  });

  function onSubmit() {
    const payload: any = {
      categoriaId: categoriaId!,
      enunciado: enunciado.trim(),
      tipo, obrigatoria, ordem,
      opcoes: needsOptions ? opcoes.filter(o => o.texto.trim() !== '') : undefined,
    };
    if (!payload.enunciado) { notifications.show({ color: 'red', icon: <IconX />, message: 'Informe o enunciado.' }); return; }
    if (!payload.categoriaId) { notifications.show({ color: 'red', icon: <IconX />, message: 'Selecione uma categoria.' }); return; }
    if (needsOptions && (!payload.opcoes || payload.opcoes.length < 2)) {
      notifications.show({ color: 'red', icon: <IconX />, message: 'Informe ao menos 2 opções.' }); return;
    }
    editId ? mUpdate.mutate({ id: editId, payload }) : mCreate.mutate(payload);
  }

  return (
    <>
      {/* Formulário */}
      <Paper p="lg" radius="md" className={classes.panel}>
        <Stack gap="sm">
          <Title order={4}>Nova pergunta</Title>
          <Group grow>
            <TextInput label="Enunciado" value={enunciado} onChange={(e) => setEnunciado(e.currentTarget.value)} />
            <Select label="Categoria" data={catOptions} value={categoriaId} onChange={setCategoriaId} searchable />
          </Group>
          <Group grow>
            <Select label="Tipo" data={TYPES.map(t => ({ value: t.value, label: t.label }))} value={tipo} onChange={(v) => setTipo((v as TipoAvaliacao) ?? 'Texto')} />
            <NumberInput label="Ordem" value={ordem} onChange={(v) => setOrdem(Number(v ?? 0))} />
            <Group align="end">
              <Switch label="Obrigatória" checked={obrigatoria} onChange={(e) => setObrigatoria(e.currentTarget.checked)} />
            </Group>
          </Group>
          {needsOptions && (<><Text size="sm" c="dimmed">Opções (texto e valor):</Text><OptionEditor value={opcoes} onChange={setOpcoes} /></>)}
          <Group>
            <Button color="orange" onClick={onSubmit} loading={mCreate.isPending || mUpdate.isPending}>{editId ? 'Atualizar' : 'Salvar'}</Button>
            <Button variant="light" onClick={resetForm}>Limpar</Button>
          </Group>
        </Stack>
      </Paper>

      {/* Lista */}
      <Paper p="lg" radius="md" className={classes.panel} mt="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="sm">
              <TextInput placeholder="Buscar…" value={search} onChange={(e) => { setPage(1); setSearch(e.currentTarget.value); }} w={280} />
              <Select placeholder="Filtrar por categoria" data={catOptions} value={fCategoria} onChange={(v) => { setPage(1); setFCategoria(v); }} clearable w={240} />
              <Select placeholder="Filtrar por tipo" data={TYPES.map(t => ({ value: t.value, label: t.label }))} value={fTipo} onChange={(v) => { setPage(1); setFTipo((v as TipoAvaliacao) ?? null); }} clearable w={220} />
            </Group>
            <Select w={120} data={['5', '10', '20', '50', '100']} value={String(pageSize)} onChange={(v) => { const n = Number(v ?? 10); setPage(1); setPageSize(n); }} label="Itens/pág." allowDeselect={false} />
          </Group>

          <Table striped withColumnBorders highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Enunciado</Table.Th>
                <Table.Th>Categoria</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Obrig.</Table.Th>
                <Table.Th>Ordem</Table.Th>
                <Table.Th style={{ width: rem(120) }}>Ativa</Table.Th>
                <Table.Th style={{ width: rem(120) }}>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.enunciado}</Table.Td>
                  <Table.Td>{p.categoriaNome ?? <Text c="dimmed">—</Text>}</Table.Td>
                  <Table.Td>{p.tipo}</Table.Td>
                  <Table.Td>{p.obrigatoria ? 'Sim' : 'Não'}</Table.Td>
                  <Table.Td>{p.ordem}</Table.Td>
                  <Table.Td><Switch checked={p.ativa} onChange={(e) => mToggle.mutate({ id: p.id, ativa: e.currentTarget.checked })} /></Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="light" onClick={() => fillForm(p)} title="Editar"><IconEdit size={18} /></ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => setConfirm({ id: p.id, texto: p.enunciado })} title="Excluir"><IconTrash size={18} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {items.length === 0 && (
                <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Nenhuma pergunta encontrada.</Text></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <Group justify="center" mt="md">
            <Pagination value={page} onChange={setPage} total={totalPages} disabled={q.isFetching} />
          </Group>
        </Stack>
      </Paper>

      {/* Modal excluir */}
      <Modal opened={!!confirm} onClose={() => setConfirm(null)} title="Confirmar exclusão" centered>
        <Stack>
          <Text>Excluir a pergunta <b>{confirm?.texto}</b>?</Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setConfirm(null)}>Cancelar</Button>
            <Button color="red" onClick={() => confirm && mDelete.mutate(confirm.id)} loading={mDelete.isPending}>Excluir</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
