import { useState } from 'react';
import {
  Badge, Button, Group, Paper, Pagination, Select, Table, Text, TextInput, Title, rem,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useAdminTitle } from '../../components/Layout/AdminTitleContext';
import classes from './Admin.module.css';
import { listFeedbacks, type FeedbackListItem } from '../../services/feedback.service';
import { listCategories } from '../../services/categories';

export default function AdminFeedbacks() {
  useAdminTitle('Feedbacks');

  // filtros
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // categorias ativas para filtro
  const qCats = useQuery({
    queryKey: ['categories', { search: '', page: 1, pageSize: 1000, onlyActive: true }],
    queryFn: () => listCategories({ search: '', page: 1, pageSize: 1000, onlyActive: true }),
  });
  const catOptions = (qCats.data?.items ?? []).map((c: any) => ({ value: c.id, label: c.nome }));

  // feedbacks
  const q = useQuery({
    queryKey: ['feedbacks', { search, page, pageSize, categoriaId: categoriaId ?? undefined, sort }],
    queryFn: () => listFeedbacks({ search, page, pageSize, categoriaId: categoriaId ?? undefined, sort }),
    keepPreviousData: true,
  });

  const items: FeedbackListItem[] = q.data?.items ?? [];
  const total = q.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Paper p="lg" radius="md" className={classes.panel}>
      <Group justify="space-between" mb="sm">
        <Title order={4}>Feedbacks</Title>
        <Button variant="light">Exportar CSV</Button>
      </Group>

      {/* filtros */}
      <Group justify="space-between" mb="sm">
        <Group gap="sm">
          <TextInput
            placeholder="Buscar por texto/categoria…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.currentTarget.value); }}
            w={300}
          />
          <Select
            placeholder="Filtrar por categoria"
            data={catOptions}
            value={categoriaId}
            onChange={(v) => { setPage(1); setCategoriaId(v); }}
            searchable
            clearable
            w={260}
          />
          <Select
            data={[
              { value: 'desc', label: 'Mais recentes' },
              { value: 'asc', label: 'Mais antigos' },
            ]}
            value={sort}
            onChange={(v) => { setPage(1); setSort((v as 'asc' | 'desc') ?? 'desc'); }}
            w={160}
          />
        </Group>

        <Select
          w={120}
          data={['5', '10', '20', '50', '100']}
          value={String(pageSize)}
          onChange={(v) => { const n = Number(v ?? 10); setPage(1); setPageSize(n); }}
          label="Itens/pág."
          allowDeselect={false}
        />
      </Group>

      {/* tabela */}
      <Table striped withColumnBorders highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Data</Table.Th>
            <Table.Th>Categoria</Table.Th>
            <Table.Th>Resumo</Table.Th>
            <Table.Th style={{ width: rem(120), textAlign: 'center' }}>Resp.</Table.Th>
            <Table.Th style={{ width: rem(140), textAlign: 'center' }}>Nota média</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((f) => (
            <Table.Tr key={f.id}>
              <Table.Td>{new Date(f.criadoEm).toLocaleString()}</Table.Td>
              <Table.Td>{f.categoriaNome}</Table.Td>
              <Table.Td>{f.resumo ?? <Text c="dimmed">—</Text>}</Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <Badge variant="light">{f.qtdRespostas}</Badge>
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                {Number.isFinite(f.notaMedia as any) ? f.notaMedia?.toFixed(2) : <Text c="dimmed">—</Text>}
              </Table.Td>
            </Table.Tr>
          ))}

          {!q.isFetching && items.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" ta="center">Nenhum feedback encontrado.</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Group justify="center" mt="md">
        <Pagination value={page} onChange={setPage} total={totalPages} disabled={q.isFetching} />
      </Group>
    </Paper>
  );
}
