import { useState } from 'react';
import {
  Badge, Button, Divider, Drawer, Group, Paper, Pagination, Select, Table, Text, Title, rem, TextInput
} from '@mantine/core';
import dayjs from 'dayjs';
import { DatePickerInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { useAdminTitle } from '../../components/Layout/AdminTitleContext';
import classes from './Admin.module.css';
import { listCategories } from '../../services/categories';
import { listFeedbacks, getFeedbackDetail } from '../../services/feedback.service';
import { IconArrowsSort, IconArrowUp, IconArrowDown } from '@tabler/icons-react';

function IdentBadge({ v }: { v: boolean }) {
  return <Badge variant="light" color={v ? 'orange' : 'gray'}>{v ? 'Identificado' : 'Anônimo'}</Badge>;
}

export default function AdminFeedbacks() {
  useAdminTitle('Feedbacks');

  // filtros
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<[Date | null, Date | null]>([null, null]); // [inicio, fim]

  const toYMD = (d: Date) => d.toISOString().slice(0, 10);


  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [curso, setCurso] = useState('');
  const [identificado, setIdentificado] = useState<'all' | 'true' | 'false'>('all');

  const [opened, setOpened] = useState(false);
  const [detail, setDetail] = useState<any>(null); // sem interface
  async function openDetail(id: string) {
    const d = await getFeedbackDetail(id);
    setDetail(d);
    setOpened(true);
  }

  // categorias ativas para filtro
  const qCats = useQuery({
    queryKey: ['categories', { search: '', page: 1, pageSize: 1000, onlyActive: true }],
    queryFn: () => listCategories({ search: '', page: 1, pageSize: 1000, onlyActive: true }),
  });
  const catOptions = (qCats.data?.items ?? []).map((c: any) => ({ value: c.id, label: c.nome }));

  // feedbacks
  const q = useQuery({
    queryKey: ['feedbacks', {
      page, pageSize,
      categoriaId: categoriaId ?? undefined,
      sort,
      dateStart: periodo?.[0] ? toYMD(periodo[0] as Date) : undefined,
      dateEnd: periodo?.[1] ? toYMD(periodo[1] as Date) : undefined,
      courseName: (curso || undefined),
      identified: identificado === 'all' ? undefined : identificado === 'true',
    }],
    queryFn: () => listFeedbacks({
      page, pageSize,
      categoriaId: categoriaId ?? undefined,
      sort,
      dateStart: periodo?.[0] ? toYMD(periodo[0] as Date) : undefined,
      dateEnd: periodo?.[1] ? toYMD(periodo[1] as Date) : undefined,
      courseName: (curso || undefined),
      identified: identificado === 'all' ? undefined : identificado === 'true',
    }),
    keepPreviousData: true,
  });

  const items = (q.data?.items ?? []) as any[];
  const total = q.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function toggleSort() {
    setPage(1);
    setSort((s) => (s === 'desc' ? 'asc' : 'desc'));
  }
  const respostasComNota = (detail?.respostas ?? []).some((r: any) => r.nota != null);

  return (
    <Paper p="lg" radius="md" className={classes.panel}>
      <Group justify="space-between" mb="sm">
        <Title order={4}>Feedbacks</Title>
        <Button variant="light">Exportar CSV</Button>
      </Group>

      {/* filtros */}
      <Group justify="space-between" mb="sm">
        <Group gap="sm">
          <DatePickerInput
            type="range"
            placeholder="Período (início – fim)"
            value={periodo}
            onChange={(v) => { setPage(1); setPeriodo(v as [Date | null, Date | null]); }}
            w={255}
            valueFormat="DD/MM/YYYY"
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
          <TextInput
            placeholder="Filtrar por curso"
            value={curso}
            onChange={(e) => { setPage(1); setCurso(e.currentTarget.value); }}
            w={220}
          />
          <Select
            placeholder="Identificação"
            data={[
              { value: 'all', label: 'Todos' },
              { value: 'true', label: 'Identificado' },
              { value: 'false', label: 'Anônimo' },
            ]}
            value={identificado}
            onChange={(v) => { setPage(1); setIdentificado((v as any) ?? 'all'); }}
            w={160}
          />

        </Group>
        <Button
          variant="outline"
          onClick={() => {
            setPeriodo([null, null]);
            setCategoriaId(null);
            setCurso('');
            setIdentificado('all');
            setSort('desc');
            setPage(1);
          }}
        >
          Limpar filtros
        </Button>

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
            <Table.Th onClick={toggleSort} style={{ cursor: 'pointer' }}>
              <Group gap={6}>
                <span>Data/Hora</span>
                {sort === 'desc' ? <IconArrowDown size={16} /> : <IconArrowUp size={16} />}
              </Group>
            </Table.Th>
            <Table.Th>Categoria</Table.Th>
            <Table.Th>Curso</Table.Th>
            <Table.Th style={{ width: rem(120), textAlign: 'center' }}>Ident.</Table.Th>
            <Table.Th style={{ width: rem(100), textAlign: 'center' }}>Resp.</Table.Th>
            <Table.Th style={{ width: rem(120), textAlign: 'center' }}>Nota média</Table.Th>
            <Table.Th style={{ width: rem(90) }}></Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {items.map((f) => (
            <Table.Tr key={f.id}>
              <Table.Td>{dayjs(f.criadoEm).format('DD/MM/YYYY, HH:mm:ss')}</Table.Td>
              <Table.Td>{f.categoriaNome}</Table.Td>
              <Table.Td>{f.cursoOuTurma ?? <Text c="dimmed">—</Text>}</Table.Td>
              <Table.Td style={{ textAlign: 'center' }}><IdentBadge v={f.identificado} /></Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <Badge variant="light">{f.qtdRespostas}</Badge>
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                {Number.isFinite(f.notaMedia as any) ? f.notaMedia?.toFixed(2) : <Text c="dimmed">—</Text>}
              </Table.Td>
              <Table.Td>
                <Button size="xs" variant="subtle" onClick={() => openDetail(f.id)}>Ver mais</Button>
              </Table.Td>
            </Table.Tr>
          ))}

          {!q.isFetching && items.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={7}><Text c="dimmed" ta="center">Nenhum feedback encontrado.</Text></Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Group justify="center" mt="md">
        <Pagination value={page} onChange={setPage} total={totalPages} disabled={q.isFetching} />
      </Group>

      <Drawer opened={opened} onClose={() => setOpened(false)} title="Feedback completo" position="right" size="lg">
        {!detail ? (
          <Text c="dimmed">Carregando…</Text>
        ) : (
          <>
            <Group justify="space-between" mb="xs">
              <Text fw={600}>{dayjs(detail.criadoEm).format('DD/MM/YYYY, HH:mm:ss')}</Text>
              <IdentBadge v={detail.identificado} />
            </Group>
            <Text size="sm">Categoria: <b>{detail.categoria}</b></Text>
            <Text size="sm" mb="sm">Curso: <b>{detail.curso ?? '—'}</b></Text>
            {detail.identificado && (detail.nome || detail.contato) && (
              <Paper p="sm" withBorder mb="sm">
                {detail.nome && <Text size="sm">Nome: <b>{detail.nome}</b></Text>}
                {detail.contato && <Text size="sm">Contato: <b>{detail.contato}</b></Text>}
              </Paper>
            )}
            <Divider label="Perguntas & Respostas" mb="sm" />
            {((detail.respostas ?? []).filter((r: any) =>
              r.nota != null ||
              (typeof r.texto === 'string' && r.texto.trim() !== '') ||
              (typeof r.opcao === 'string' && r.opcao.trim() !== '')
            )).map((r: any, i: number) => (
              <Paper key={i} p="sm" withBorder mb="sm">
                <Text fw={600}>{r.pergunta}</Text>

                {/* Se for texto, mostra só o texto */}
                {typeof r.texto === 'string' && r.texto.trim() !== '' ? (
     <Text mt={4}>{r.texto}</Text>
                ) : (
                  (r.nota != null || (r.opcao && r.opcao.trim() !== '')) && (
                    <Text size="sm" mt={2}>
                      {r.nota != null ? `Nota: ${r.nota}` : ''}
                      {r.nota != null && r.opcao ? ' | ' : ''}
                      {r.opcao ? `Opção: ${r.opcao}` : ''}
                    </Text>
                  )
                )}
              </Paper>
            ))}
            <Divider mb="sm" />
           {respostasComNota && (
   <Group gap="xs">
     <Text>Nota média:</Text>
     <Badge>{Number.isFinite(detail.notaMedia as any) ? Number(detail.notaMedia).toFixed(2) : '—'}</Badge>
   </Group>
 )}
          </>
        )}
      </Drawer>

    </Paper>
  );

}
