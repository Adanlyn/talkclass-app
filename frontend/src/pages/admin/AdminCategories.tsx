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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminTitle } from '../../components/Layout/AdminTitleContext';
import classes from '../admin/Admin.module.css';

import {
  listCategories,
  createCategory,
  updateCategory,
  toggleCategory,
  deleteCategory,
} from '../../services/categories';
import type { Category } from '../../services/categories';
import { notifySuccess, notifyError } from '../../services/notifications';

export default function Categorias() {
  useAdminTitle('Categorias');

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
              data={['5','10','20','50','100']}
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
              <Table.Th style={{ width: rem(120) }}>Ativa</Table.Th>
              <Table.Th style={{ width: rem(120) }}>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.nome}</Table.Td>
                <Table.Td>{c.descricao ?? '—'}</Table.Td>
                <Table.Td>
                  <Switch
                    checked={c.ativa}
                    onChange={(e) => mToggle.mutate({ id: c.id, ativa: e.currentTarget.checked })}
                  />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon variant="light" onClick={() => onEdit(c)} title="Editar">
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => setConfirmDelete({ id: c.id, nome: c.nome })}
                      title="Excluir"
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}

            {!isFetching && items.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
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
