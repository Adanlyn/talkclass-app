// src/pages/admin/Categorias.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Pagination,
  Select,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  rem,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconX, IconListDetails  } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminTitle } from '../../components/Layout/AdminTitleContext';
import classes from '../admin/Admin.module.css';
import { Link } from 'react-router-dom';



import {
  listCategories,
  createCategory,
  updateCategory,
  toggleCategory,
  deleteCategory,
} from '../../services/categories';
import type { Category } from '../../services/categories';
import { notifySuccess, notifyError } from '../../services/notifications';
import { useNavigate } from 'react-router-dom';


export default function Categorias() {
  const nav = useNavigate();

  // estado do form
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nome: string } | null>(null);

  // filtros/paginação simples
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const qc = useQueryClient();

  // QUERY: lista categorias
  const { data, isFetching } = useQuery({
    queryKey: ['categories', { search, page, pageSize, onlyActive: false }],
    queryFn: () => listCategories({ search, page, pageSize, onlyActive: false }),
    keepPreviousData: true,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // MUTATIONS
  const mCreate = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      notifySuccess('Categoria criada com sucesso.');
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else qc.invalidateQueries({ queryKey: ['categories'] });
      setConfirmDelete(null);
      resetForm();
    },
    onError: (err: any) =>
      notifyError(String(err?.response?.data ?? 'Erro ao criar categoria')),
  });

  const mUpdate = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { nome: string; descricao?: string | null } }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      notifySuccess('Categoria atualizada com sucesso.');
      qc.invalidateQueries({ queryKey: ['categories'] });
      resetForm();
    },
    onError: (err: any) =>
      notifyError(String(err?.response?.data ?? 'Erro ao atualizar categoria')),
  });

  const mToggle = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) => toggleCategory(id, ativa),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      notifySuccess('Categoria excluída com sucesso.');
      qc.invalidateQueries({ queryKey: ['categories'] });
      setConfirmDelete(null);
    },
    onError: (err: any) => notifyError(String(err?.response?.data ?? 'Falha ao excluir.')),
  });

  // ações
  function resetForm() {
    setNome('');
    setDescricao('');
    setEditingId(null);
  }

  function onEdit(c: Category) {
    setEditingId(c.id);
    setNome(c.nome);
    setDescricao(c.descricao ?? '');
  }

  function onSubmit() {
    const payload = { nome: nome.trim(), descricao: descricao.trim() || undefined };
    if (!payload.nome) {
      notifications.show({ color: 'red', icon: <IconX />, message: 'Informe o nome da categoria.' });
      return;
    }
    if (editingId) mUpdate.mutate({ id: editingId, payload });
    else mCreate.mutate(payload);
  }

  // UI (somente conteúdo; layout é do AdminLayout)
  return (
    <>
      <Paper p="lg" radius="md" className={classes.panel}>
        <Stack gap="sm" maw={640}>
          <Group grow>
            <TextInput
              label="Nome da categoria"
              placeholder="Ex.: Atendimento"
              value={nome}
              onChange={(e) => setNome(e.currentTarget.value)}
            />
            <TextInput
              label="Descrição (opcional)"
              placeholder="Breve descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.currentTarget.value)}
            />
          </Group>
          <Group>
            <Button color="orange" onClick={onSubmit} loading={mCreate.isPending || mUpdate.isPending}>
              {editingId ? 'Atualizar' : 'Salvar'}
            </Button>
            <Button variant="light" onClick={resetForm}>Limpar</Button>
          </Group>
        </Stack>

        <Group justify="space-between" my="md">
          <Text c="dimmed" fz="sm">
            {isFetching ? 'Carregando…' : `Total: ${total}`}
          </Text>

          <Group>
            <TextInput
              placeholder="Buscar…"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.currentTarget.value); }}
              w={280}
            />
            <Select
              w={120}
              data={['5', '10', '20', '50', '100']}
              value={String(pageSize)}
              onChange={(v) => { const n = Number(v ?? 10); setPage(1); setPageSize(n); }}
              label="Itens/pág."
              allowDeselect={false}
            />
          </Group>
        </Group>

        <Table striped withColumnBorders highlightOnHover>
          <Table.Thead>
  <Table.Tr>
    <Table.Th>Nome</Table.Th>
    <Table.Th>Descrição</Table.Th>
    <Table.Th style={{ width: rem(110), textAlign: 'center' }}>Perguntas</Table.Th>
    <Table.Th style={{ width: rem(110), textAlign: 'center' }}>Ativa</Table.Th>
    <Table.Th style={{ width: rem(140), textAlign: 'right' }}>Ações</Table.Th>
  </Table.Tr>
</Table.Thead>
          <Table.Tbody>
  {items.map((c) => {
    const qnt = c.perguntasCount ?? 0;
    const hasPerg = qnt > 0;

    return (
      <Table.Tr key={c.id}>
        <Table.Td>{c.nome}</Table.Td>
        <Table.Td>{c.descricao ?? '—'}</Table.Td>

        {/* Perguntas: badge clicável e centralizado */}
        <Table.Td style={{ textAlign: 'center' }}>
<Badge
    component={Link}
    to={`/admin/perguntas?categoriaId=${c.id}`}
    variant="light"
    color={(c.perguntasCount ?? 0) > 0 ? 'teal' : 'gray'}
    style={{ cursor: 'pointer' }}
    title={(c.perguntasCount ?? 0) > 0 ? 'Ver perguntas desta categoria' : 'Sem perguntas'}
  >
    {c.perguntasCount ?? 0}
  </Badge>
        </Table.Td>

        {/* Ativa: centralizado */}
        <Table.Td style={{ textAlign: 'center' }}>
          <Switch
            checked={c.ativa}
            onChange={(e) => mToggle.mutate({ id: c.id, ativa: e.currentTarget.checked })}
          />
        </Table.Td>

        {/* Ações: só ícones, alinhado à direita */}
        <Table.Td>
          <Group gap={6} justify="flex-end" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              title="Editar"
              onClick={() => onEdit(c)}
            >
              <IconEdit size={18} />
            </ActionIcon>

            <ActionIcon
              color="red"
              variant="subtle"
              title="Excluir"
              onClick={() => setConfirmDelete({ id: c.id, nome: c.nome })}
            >
              <IconTrash size={18} />
            </ActionIcon>

            {/* Gerir perguntas (ícone) */}
            <ActionIcon
  component={Link}
  to={`/admin/perguntas?categoriaId=${c.id}`}
  variant="light"
  title="Ver perguntas"
>
  <IconListDetails size={18} />
</ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  })}

            {!isFetching && items.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center">Nenhuma categoria encontrada.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <Group justify="center" mt="md">
          <Pagination value={page} onChange={setPage} total={totalPages} disabled={isFetching} />
        </Group>
      </Paper>

      {/* Modal de confirmação de exclusão */}
      <Modal
        opened={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Confirmar exclusão"
        centered
      >
        <Stack>
          <Text>
            Tem certeza que deseja excluir a categoria <b>{confirmDelete?.nome}</b>?
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              color="red"
              onClick={() => confirmDelete && mDelete.mutate(confirmDelete.id)}
              loading={mDelete.isPending}
            >
              Excluir
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
