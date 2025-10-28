import {
  Badge, Box, Button, Grid, Group, Paper, SimpleGrid, Table, Text, Title, Loader, Alert
} from '@mantine/core';
import { IconChartHistogram, IconSchool, IconBuilding, IconAlertTriangle, IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAdminTitle } from '../../components/Layout/AdminTitleContext';
import classes from '../admin/Admin.module.css';
import { useQuery } from '@tanstack/react-query';
import { getKpis, getSeries, getDistribution, getTopAreas } from '../../services/dashboard';
import { Line as LineChart, Bar as BarChart } from 'react-chartjs-2';
import { useMemo, useRef } from 'react';
import '../../chart';


function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Alert color="red" icon={<IconAlertCircle size={16} />} mt="xs">
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" c="red.9" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {message || 'Falha ao carregar dados.'}
        </Text>
        <Button size="xs" leftSection={<IconRefresh size={14} />} variant="light" color="red" onClick={onRetry}>
          Tentar novamente
        </Button>
      </Group>
    </Alert>
  );
}

export default function Overview() {
  useAdminTitle('Visão geral');
  const nav = useNavigate();

  // ===== Datas estáveis (calculadas uma única vez)
  const nowRef = useRef(new Date());
  const nowIso = useMemo(() => nowRef.current.toISOString(), []);
  const from30 = useMemo(() => new Date(nowRef.current.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), []);
  const from12w = useMemo(() => new Date(nowRef.current.getTime() - 84 * 24 * 60 * 60 * 1000).toISOString(), []);

  // ===== Opções padrão das queries
  const commonOpts = { retry: 0, refetchOnWindowFocus: false as const, staleTime: 60_000 };

  // KPIs
  const {
    data: kpis, isLoading: loadingKpis, isError: errorKpis, error: kpisErr, refetch: refetchKpis
  } = useQuery({
    queryKey: ['kpis', from30, nowIso],
    queryFn: () => getKpis({ from: from30, to: nowIso }),
    ...commonOpts,
  });

  // Série temporal
  const {
    data: series, isLoading: loadingSeries, isError: errorSeries, error: seriesErr, refetch: refetchSeries
  } = useQuery({
    queryKey: ['series', 'week', from12w, nowIso],
    queryFn: () => getSeries({ interval: 'week', from: from12w, to: nowIso }),
    ...commonOpts,
  });

  // Distribuição de notas
  const {
    data: dist, isLoading: loadingDist, isError: errorDist, error: distErr, refetch: refetchDist
  } = useQuery({
    queryKey: ['distribution', from30, nowIso],
    queryFn: () => getDistribution({ from: from30, to: nowIso }),
    ...commonOpts,
  });

  // Top áreas
  const {
    data: topAreas, isLoading: loadingTop, isError: errorTop, error: topErr, refetch: refetchTop
  } = useQuery({
    queryKey: ['top-areas', 5, from30, nowIso],
    queryFn: () => getTopAreas({ limit: 5, from: from30, to: nowIso }),
    ...commonOpts,
  });

  // ===== Dados para os gráficos
  const kpiCards = [
    { label: 'NPS Acadêmico', value: kpis ? (kpis.nps > 0 ? `+${kpis.nps}` : `${kpis.nps}`) : '--', icon: IconChartHistogram },
    { label: 'Feedbacks (30d)', value: kpis?.totalFeedbacks?.toLocaleString('pt-BR') ?? '--', icon: IconSchool },
    { label: 'Áreas com alerta', value: kpis?.areasComAlerta?.toString() ?? '--', icon: IconAlertTriangle },
    { label: 'Áreas cadastradas', value: kpis?.totalAreas?.toString() ?? '--', icon: IconBuilding },
  ];

  const lineData = useMemo(() => {
    const labels = (series ?? []).map((p) => p.bucket);
    const dataset = (series ?? []).map((p) => Number(p.avg.toFixed(2)));
    return { labels, datasets: [{ label: 'Média semanal', data: dataset, tension: 0.3 }] };
  }, [series]);

  const barData = useMemo(() => {
    const labels = (dist ?? []).map((b) => b.rating.toString());
    const dataset = (dist ?? []).map((b) => b.total);
    return { labels, datasets: [{ label: 'Quantidade', data: dataset }] };
  }, [dist]);

  const noSeries = !loadingSeries && !errorSeries && (series?.length ?? 0) === 0;
  const noDist = !loadingDist && !errorDist && (dist?.reduce((s, b) => s + b.total, 0) ?? 0) === 0;
  const noTop = !loadingTop && !errorTop && (topAreas?.length ?? 0) === 0;

  return (
    <>
      {/* KPIs */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        {kpiCards.map(({ label, value, icon: Icon }) => (
          <Paper key={label} p="md" radius="md" className={classes.cardKpi}>
            <Group justify="space-between" align="flex-start">
              <Box style={{ minWidth: 0 }}>
                <Text c="dimmed" fz="sm">{label}</Text>
                <Title order={2} mt={6}>
                  {loadingKpis ? <Loader size="sm" /> : (errorKpis ? '—' : value)}
                </Title>
                {errorKpis && (
                  <ErrorState message={(kpisErr as any)?.message} onRetry={refetchKpis} />
                )}
              </Box>
              <div className={classes.kpiIcon}><Icon size={22} /></div>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      {/* GRÁFICOS */}
      <Grid mt="xl" gutter="lg" align="stretch">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" radius="md" className={classes.panel}>
            <Group justify="space-between" mb="xs">
              <Title order={4}>Satisfação por área</Title>
              <Text c="dimmed" fz="sm">média móvel (12 semanas)</Text>
            </Group>

            {loadingSeries && <Group justify="center" h={260}><Loader /></Group>}
            {errorSeries && <ErrorState message={(seriesErr as any)?.message} onRetry={refetchSeries} />}

            {!loadingSeries && !errorSeries && noSeries && (
              <Group justify="center" h={200}><Text c="dimmed">Sem dados para o período.</Text></Group>
            )}

            {!loadingSeries && !errorSeries && !noSeries && (
              <div aria-label="Gráfico de linhas">
                <LineChart
                  data={lineData}
                  options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 10 } } }}
                  height={260}
                />
              </div>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="md" className={classes.panel}>
            <Group justify="space-between" mb="xs">
              <Title order={4}>Distribuição de notas</Title>
              <Text c="dimmed" fz="sm">últimos 30 dias</Text>
            </Group>

            {loadingDist && <Group justify="center" h={260}><Loader /></Group>}
            {errorDist && <ErrorState message={(distErr as any)?.message} onRetry={refetchDist} />}

            {!loadingDist && !errorDist && noDist && (
              <Group justify="center" h={200}><Text c="dimmed">Sem dados para o período.</Text></Group>
            )}

            {!loadingDist && !errorDist && !noDist && (
              <div aria-label="Gráfico de barras">
                <BarChart
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { title: { display: true, text: 'Nota (1–10)' } },
                      y: { title: { display: true, text: 'Qtd' }, beginAtZero: true },
                    },
                  }}
                  height={260}
                />
              </div>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* TABELA */}
      <Paper p="md" radius="md" mt="xl" className={classes.panel}>
        <Group justify="space-between" mb="xs" align="center">
          <Title order={4}>Áreas com maior impacto</Title>
          <Button variant="light" size="xs" onClick={() => nav('/admin/relatorios')}>Ver todos</Button>
        </Group>

        {loadingTop && <Group justify="center" p="lg"><Loader /></Group>}
        {errorTop && <ErrorState message={(topErr as any)?.message} onRetry={refetchTop} />}

        {!loadingTop && !errorTop && noTop && (
          <Group justify="center" p="lg"><Text c="dimmed">Sem dados.</Text></Group>
        )}

        {!loadingTop && !errorTop && !noTop && (
          <Table verticalSpacing="sm" highlightOnHover stickyHeader className={classes.table}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Área</Table.Th>
                <Table.Th>Média</Table.Th>
                <Table.Th>Alertas</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(topAreas ?? []).map((r) => (
                <Table.Tr key={`${r.categoryId ?? 'none'}-${r.area}`}>
                  <Table.Td>{r.area}</Table.Td>
                  <Table.Td>{r.media.toFixed(1)}</Table.Td>
                  <Table.Td>
                    {r.alertas > 0
                      ? <Badge color="red" variant="filled">{r.alertas}</Badge>
                      : <Badge color="teal" variant="light">OK</Badge>}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </>
  );
}
