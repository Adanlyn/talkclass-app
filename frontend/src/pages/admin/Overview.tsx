import {
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Table,
  Text,
  Title,
  Loader,
  Alert
} from '@mantine/core';

import {
  IconChartHistogram,
  IconSchool,
  IconBuilding,
  IconAlertTriangle,
  IconRefresh,
  IconAlertCircle
} from '@tabler/icons-react';

import { useNavigate } from 'react-router-dom';
import { useAdminTitle } from '../../components/Layout/AdminTitleContext';
import classes from '../admin/Admin.module.css';
import { useQuery } from '@tanstack/react-query';

import {
  getKpis,
  getSeries,
  getDistribution,
  getTopAreas,
  getNpsSeries,
  getVolumeSeries,
  getTopicsHeatmap,
  getTopicsPolarity,
  getWorstQuestions,
  getAreasAlerts,
  getHourly,
  getBoxplotNotas,
  getWordcloud,
} from '../../services/dashboard';

import {
  Line as LineChart,
  Bar as BarChart
} from 'react-chartjs-2';

import {
  useMemo,
  useRef
} from 'react';

import '../../chart';
import { DashboardFiltersProvider } from '../../state/dashboardFilters';
import DashboardFilters from '../../components/DashboardFilters';
import { useDashboardFilters } from '../../state/dashboardFilters';
import type { ChartOptions } from 'chart.js';

// Alturas padronizadas para os cards de gráfico
const CH = {
  sm: 240,
  md: 300,
  lg: 360,
};

// Opções base para todos os charts
const baseChartOptions: ChartOptions<'line' | 'bar' | 'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false, // <- fundamental
  animation: { duration: 250 },
  plugins: {
    legend: { display: true, position: 'top' },
    tooltip: { intersect: false, mode: 'index' },
  },
  interaction: { intersect: false, mode: 'index' },
};



// Helpers
const toFixedSafe = (n: number | null | undefined, digits = 1) =>
  typeof n === 'number' && Number.isFinite(n) ? n.toFixed(digits) : '—';

const toNumSafe = (n: number | null | undefined, digits = 2) =>
  typeof n === 'number' && Number.isFinite(n) ? Number(n.toFixed(digits)) : null;

const asArray = <T,>(v: any): T[] =>
  Array.isArray(v) ? v
    : Array.isArray(v?.data) ? v.data
      : Array.isArray(v?.items) ? v.items
        : Array.isArray(v?.rows) ? v.rows
          : [];

function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Alert color="red" icon={<IconAlertCircle size={16} />} mt="xs" className={classes.alertCompact}>
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


function OverviewInner() {
  useAdminTitle('Visão geral');
  const nav = useNavigate();

  // ===== Filtros globais do dashboard =====
  const { value: F } = useDashboardFilters();

  // ===== Opções padrão das queries =====
  const qOpts = { retry: 0, refetchOnWindowFocus: false as const, staleTime: 60_000 };


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
    queryKey: ['kpis', F.from, F.to, F.categoryId ?? 'all'],
    queryFn: () => getKpis({ from: F.from, to: F.to, categoryId: F.categoryId ?? undefined }),
    ...commonOpts,
  });

  // Série temporal
  const {
    data: series, isLoading: loadingSeries, isError: errorSeries, error: seriesErr, refetch: refetchSeries
  } = useQuery({
    queryKey: ['series', 'week', F.from, F.to, F.categoryId ?? 'all'],
    queryFn: () => getSeries({ interval: 'week', from: F.from, to: F.to, categoryId: F.categoryId ?? undefined }),
    ...commonOpts,
  });

  // Distribuição de notas
  const {
    data: dist, isLoading: loadingDist, isError: errorDist, error: distErr, refetch: refetchDist
  } = useQuery({
    queryKey: ['distribution', F.from, F.to, F.categoryId ?? 'all'],
    queryFn: () => getDistribution({ from: F.from, to: F.to, categoryId: F.categoryId ?? undefined }),

    // Top áreas
    ...commonOpts,
  });

  // Top áreas
  const {
    data: topAreas, isLoading: loadingTop, isError: errorTop, error: topErr, refetch: refetchTop
  } = useQuery({
    queryKey: ['top-areas', 5, F.from, F.to],
    queryFn: () => getTopAreas({ limit: 5, from: F.from, to: F.to, categoryId: F.categoryId ?? undefined }),
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
    const dataset = (series ?? []).map((p) => toNumSafe(p.avg, 2));
    return { labels, datasets: [{ label: 'Média semanal', data: dataset, tension: 0.3 }] };
  }, [series]);

  const barData = useMemo(() => {
    const labels = (dist ?? []).map((b) => b.rating.toString());
    const dataset = (dist ?? []).map((b) => toNumSafe(b.total));
    return { labels, datasets: [{ label: 'Quantidade', data: dataset }] };
  }, [dist]);

  const noSeries = !loadingSeries && !errorSeries && (series?.length ?? 0) === 0;
  const noDist = !loadingDist && !errorDist && (dist?.reduce((s, b) => s + b.total, 0) ?? 0) === 0;
  const noTop = !loadingTop && !errorTop && (topAreas?.length ?? 0) === 0;

  // --- NPS série (linha) + Volume (linha)
  const qNpsA = useQuery({
    queryKey: ['nps-series', 'week', F.categoryId ?? 'all', F.from, F.to],
    queryFn: () => getNpsSeries({ interval: 'week', from: F.from, to: F.to }),
    ...qOpts,
  });
  const qNpsB = useQuery({
    queryKey: ['nps-series', 'week', F.compareCategoryId ?? 'none', F.from, F.to],
    queryFn: () => getNpsSeries({ interval: 'week', from: F.from, to: F.to }),
    enabled: !!F.compareCategoryId,
    ...qOpts,
  });

  const qVol = useQuery({
    queryKey: ['volume-series', 'day', F.from, F.to],
    queryFn: () => getVolumeSeries({ interval: 'day', from: F.from, to: F.to }),
    ...qOpts,
  });

  // --- Polaridade por tópico (barras empilhadas) + Heatmap (stacked por semana)
  const qPol = useQuery({
    queryKey: ['topics-polarity', F.from, F.to],
    queryFn: () => getTopicsPolarity({ from: F.from, to: F.to }),
    ...qOpts,
  });

  const qHeat = useQuery({
    queryKey: ['topics-heatmap', F.from, F.to],
    queryFn: () => getTopicsHeatmap({ from: F.from, to: F.to, categoryId: F.categoryId ?? undefined, top: 6 }),
    ...qOpts,
  });

  // --- Piores perguntas (tabela)
  const qWorst = useQuery({
    queryKey: ['questions-worst', 5, F.from, F.to],
    queryFn: () => getWorstQuestions({ limit: 5, from: F.from, to: F.to }),
    ...qOpts,
  });

  // --- Alertas por área (empilhado) + Horário (0..23)
  const qAlerts = useQuery({
    queryKey: ['areas-alerts', 8, F.from, F.to],
    queryFn: () => getAreasAlerts({ limit: 8, from: F.from, to: F.to }),
    ...qOpts,
  });
  const qHourly = useQuery({
    queryKey: ['hourly', F.from, F.to],
    queryFn: () => getHourly({ from: F.from, to: F.to }),
    ...qOpts,
  });

  // --- Boxplot (por curso/turno) e Wordcloud (tags)
  const qBox = useQuery({
    queryKey: ['boxplot', 'curso', F.from, F.to, F.categoryId, F.questionId, F.curso, F.turno, F.unidade, F.identified],
    queryFn: () => getBoxplotNotas({
      groupBy: 'curso',
      from: F.from, to: F.to,
      categoryId: F.categoryId ?? undefined,
      questionId: F.questionId ?? undefined,
      curso: F.curso ?? undefined,
      turno: F.turno ?? undefined,
      unidade: F.unidade ?? undefined,
      identified: F.identified ?? undefined,
    }),
    ...qOpts,
  });

  const qWCpos = useQuery({
    queryKey: ['wordcloud', 'pos', F.from, F.to, F.categoryId, F.questionId],
    queryFn: () => getWordcloud({ polarity: 'pos', from: F.from, to: F.to, categoryId: F.categoryId ?? undefined, questionId: F.questionId ?? undefined }),
    ...qOpts,
  });
  const qWCneg = useQuery({
    queryKey: ['wordcloud', 'neg', F.from, F.to, F.categoryId, F.questionId],
    queryFn: () => getWordcloud({ polarity: 'neg', from: F.from, to: F.to, categoryId: F.categoryId ?? undefined, questionId: F.questionId ?? undefined }),
    ...qOpts,
  });

  // NPS (A/B) — eixo -100..100
  const npsLabels = (qNpsA.data ?? []).map(d => d.bucket);
  const npsDatasets = [
    { label: 'NPS', data: (qNpsA.data ?? []).map(d => d.nps), tension: 0.3 },
  ];
  if (qNpsB.data && qNpsB.data.length) {
    const mapB = new Map(qNpsB.data.map(d => [d.bucket, d.nps]));
    npsDatasets.push({ label: 'NPS (comparação)', data: npsLabels.map(b => mapB.get(b) ?? null), tension: 0.3 });
  }
  const npsData = { labels: npsLabels, datasets: npsDatasets };

  // Volume
  const volData = {
    labels: (qVol.data ?? []).map(d => d.bucket),
    datasets: [{ label: 'Feedbacks/dia', data: (qVol.data ?? []).map(d => d.total) }]
  };

  // Polaridade por tópico — stacked
  const polLabels = (qPol.data ?? []).map(r => r.topic);
  const polData = {
    labels: polLabels,
    datasets: [
      { label: 'Neg', data: (qPol.data ?? []).map(r => r.neg), stack: 'pol' },
      { label: 'Neu', data: (qPol.data ?? []).map(r => r.neu), stack: 'pol' },
      { label: 'Pos', data: (qPol.data ?? []).map(r => r.pos), stack: 'pol' },
    ],
  };

  // --- Heatmap por semana (stacked: top 6 tópicos)
  type HeatRow = { week: string; topic: string; total: number };
  const heat = asArray<HeatRow>(qHeat.data);

  const weeks = Array.from(new Set(heat.map(x => x.week))).sort();
  const topicsSorted = Array.from(new Set(heat.map(x => x.topic)));
  const topTopics = topicsSorted.slice(0, 6);

  const heatDatasets = topTopics.map(topic => ({
    label: topic,
    data: weeks.map(w => heat.find(x => x.week === w && x.topic === topic)?.total ?? 0),
    stack: 'heat',
  }));

  const heatData = { labels: weeks, datasets: heatDatasets };


  // Alertas por área — stacked
  const alertsLabels = (qAlerts.data ?? []).map(r => r.area);
  const alertsData = {
    labels: alertsLabels,
    datasets: [
      { label: 'Críticos (≤3)', data: (qAlerts.data ?? []).map(r => r.crit), stack: 'a' },
      { label: 'OK (≥4)', data: (qAlerts.data ?? []).map(r => r.ok), stack: 'a' },
    ],
  };

  // Horário
  const hoursData = {
    labels: (qHourly.data ?? []).map(r => r.hour.toString().padStart(2, '0')),
    datasets: [{ label: 'Feedbacks por hora', data: (qHourly.data ?? []).map(r => r.total) }]
  };


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
                <div className={classes.chart260}>
                  <LineChart
                    data={lineData}
                    options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 10 } } }}
                  />
                </div>
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
                <div className={classes.chart260}>
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
                  />
                </div>
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
                  <Table.Td>{toFixedSafe(r.media, 1)}</Table.Td>
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

        {/* ====== BLOCO 1: NPS (linha) + Volume (linha) ====== */}
        <Grid mt="xl" gutter="lg" align="stretch">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper p="md" radius="md" className={classes.panel}>
              <Group justify="space-between" mb="xs">
                <Title order={4}>NPS (tendência)</Title>
                <Text c="dimmed" fz="sm">{new Date(F.from).toLocaleDateString()} – {new Date(F.to).toLocaleDateString()}</Text>
              </Group>
              {(qNpsA.isLoading || qNpsB.isLoading) && <Group justify="center" h={260}><Loader /></Group>}
              {(qNpsA.isError || qNpsB.isError) && <ErrorState message="Falha ao carregar NPS" onRetry={() => { qNpsA.refetch(); qNpsB.refetch(); }} />}
              {!qNpsA.isLoading && !qNpsA.isError && (
                <div className={classes.chart260}>
                  <LineChart
                    data={npsData}
                    options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: -100, max: 100 } } }}
                  />
                </div>
              )}
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="md" radius="md" className={classes.panel}>
              <Group justify="space-between" mb="xs">
                <Title order={4}>Volume de feedbacks</Title>
                <Text c="dimmed" fz="sm">por dia</Text>
              </Group>
              {qVol.isLoading && <Group justify="center" h={260}><Loader /></Group>}
              {qVol.isError && <ErrorState message="Falha ao carregar volume" onRetry={qVol.refetch} />}
              {!qVol.isLoading && !qVol.isError && (
                <div className={classes.chart260}>
                  <LineChart data={volData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>

              )}
            </Paper>
          </Grid.Col>
        </Grid>

        {/* ====== BLOCO 2: Polaridade por Tópico (empilhado) + Heatmap semanal ====== */}
        <Grid mt="xl" gutter="lg" align="stretch">
         
        <Grid.Col span={{ base: 12, md: 6 }}>
  <Paper p="md" radius="md" className={classes.panel}>
    <Group justify="space-between" mb="xs">
      <Title order={4}>Polaridade por tópico</Title>
      <Text c="dimmed" fz="sm">ordenado por % negativo</Text>
    </Group>

    {qPol.isLoading && <Group justify="center" h={300}><Loader /></Group>}
    {qPol.isError && <ErrorState message="Falha ao carregar polaridade" onRetry={qPol.refetch} />}

    {!qPol.isLoading && !qPol.isError && (qPol.data?.length ?? 0) === 0 && (
      <Group justify="center" h={200}><Text c="dimmed">Sem dados.</Text></Group>
    )}

    {!qPol.isLoading && !qPol.isError && (qPol.data?.length ?? 0) > 0 && (
      <div className={classes.chart300}>
        <BarChart
          data={(() => {
            // ← Top N para caber bem (ajuste se quiser)
            const TOP_N = 8;

            // labels originais (já vêm ordenadas no service)
            const labelsAll = polData.labels;
            const labels = labelsAll.slice(0, TOP_N);

            // mapeia índices para alinhar datasets ao slice
            const idxMap = new Map(labelsAll.map((l, i) => [l, i]));
            const mapData = (arr: number[]) => labels.map(l => arr[idxMap.get(l) ?? -1] ?? 0);

            return {
              labels,
              datasets: [
                {
                  label: 'Neg',
                  data: mapData(polData.datasets[0].data as number[]),
                  stack: 'pol',
                  borderWidth: 0,
                  barThickness: 18,
                  maxBarThickness: 22,
                },
                {
                  label: 'Neu',
                  data: mapData(polData.datasets[1].data as number[]),
                  stack: 'pol',
                  borderWidth: 0,
                  barThickness: 18,
                  maxBarThickness: 22,
                },
                {
                  label: 'Pos',
                  data: mapData(polData.datasets[2].data as number[]),
                  stack: 'pol',
                  borderWidth: 0,
                  barThickness: 18,
                  maxBarThickness: 22,
                },
              ],
            };
          })()}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // ← barras horizontais
            layout: { padding: { left: 4, right: 8, top: 6, bottom: 6 } },
            scales: {
              x: {
                stacked: true,
                beginAtZero: true,
                grid: { display: true },
                ticks: { precision: 0 },
              },
              y: {
                stacked: true,
                grid: { display: false },
                ticks: {
                  autoSkip: false,
                  // corta label longa para não invadir o chart
                  callback: (value) => {
                    const s = String(value);
                    return s.length > 40 ? s.slice(0, 40) + '…' : s;
                  },
                },
              },
            },
            plugins: {
              legend: { position: 'top' },
              tooltip: {
                callbacks: {
                  title: (items) => {
                    const s = items?.[0]?.label ?? '';
                    return s.length > 90 ? s.slice(0, 90) + '…' : s;
                  },
                },
              },
            },
          }}
        />
      </div>
    )}
  </Paper>
</Grid.Col>


          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" radius="md" className={classes.panel}>
              <Group justify="space-between" mb="xs">
                <Title order={4}>Tópicos × Semana</Title>
                <Text c="dimmed" fz="sm">picos visuais (top 6 tópicos)</Text>
              </Group>
              {qHeat.isLoading && <Group justify="center" h={300}><Loader /></Group>}
              {qHeat.isError && <ErrorState message="Falha ao carregar heatmap" onRetry={qHeat.refetch} />}
              {!qHeat.isLoading && !qHeat.isError && asArray(qHeat.data).length === 0 && (
                <Group justify="center" h={200}><Text c="dimmed">Sem dados.</Text></Group>
              )}

              {!qHeat.isLoading && !qHeat.isError && asArray(qHeat.data).length > 0 && (
                <div className={classes.chart300}>
                  <BarChart
                    data={heatData}
                    options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }}
                  />
                </div>

              )}
            </Paper>
          </Grid.Col>
        </Grid>

        {/* ====== BLOCO 3: Alertas por área + Horário ====== */}
        <Grid mt="xl" gutter="lg" align="stretch">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper p="md" radius="md" className={classes.panel}>
              <Group justify="space-between" mb="xs">
                <Title order={4}>Alertas por área</Title>
                <Text c="dimmed" fz="sm">críticos (≤3) vs ok (≥4)</Text>
              </Group>
              {qAlerts.isLoading && <Group justify="center" h={300}><Loader /></Group>}
              {qAlerts.isError && <ErrorState message="Falha ao carregar alertas" onRetry={qAlerts.refetch} />}
              {!qAlerts.isLoading && !qAlerts.isError && (qAlerts.data?.length ?? 0) > 0 && (
                <div className={classes.chart300}>
                  <BarChart
                    data={alertsData}
                    options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }}
                  />
                </div>

              )}
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper p="md" radius="md" className={classes.panel}>
              <Group justify="space-between" mb="xs">
                <Title order={4}>Participação por horário</Title>
                <Text c="dimmed" fz="sm">00–23h</Text>
              </Group>
              {qHourly.isLoading && <Group justify="center" h={300}><Loader /></Group>}
              {qHourly.isError && <ErrorState message="Falha ao carregar horários" onRetry={qHourly.refetch} />}
              {!qHourly.isLoading && !qHourly.isError && (
                <div className={classes.chart300}>
                  <BarChart data={hoursData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>

              )}
            </Paper>
          </Grid.Col>
        </Grid>

        {/* ====== BLOCO 4: Piores perguntas (tabela) ====== */}
        <Paper p="md" radius="md" mt="xl" className={classes.panel}>
          <Group justify="space-between" mb="xs" align="center">
            <Title order={4}>Piores perguntas (Top 5)</Title>
          </Group>
          {qWorst.isLoading && <Group justify="center" p="lg"><Loader /></Group>}
          {qWorst.isError && <ErrorState message="Falha ao carregar perguntas" onRetry={qWorst.refetch} />}
          {!qWorst.isLoading && !qWorst.isError && (
            <Table verticalSpacing="sm" highlightOnHover stickyHeader className={classes.table}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Pergunta</Table.Th>
                  <Table.Th>Média</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(qWorst.data ?? []).map(r => (
                  <Table.Tr key={r.questionId}>
                    <Table.Td>{r.pergunta}</Table.Td>
                    <Table.Td>{toFixedSafe(r.media, 2)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>

        {/* ====== BLOCO 5: Boxplot (fallback tabela) + Wordcloud (tags) ====== */}
        <Grid mt="xl" gutter="lg" align="stretch">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper p="md" radius="md" className={classes.panel}>
              <Group justify="space-between" mb="xs">
                <Title order={4}>Boxplot — notas por curso</Title>
                <Text c="dimmed" fz="sm">quartis e outliers</Text>
              </Group>
              {qBox.isLoading && <Group justify="center" h={300}><Loader /></Group>}
              {qBox.isError && <ErrorState message="Falha ao carregar boxplot" onRetry={qBox.refetch} />}
              {!qBox.isLoading && !qBox.isError && (
                <Table verticalSpacing="sm" highlightOnHover stickyHeader className={classes.table}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Grupo</Table.Th>
                      <Table.Th>Min</Table.Th>
                      <Table.Th>Q1</Table.Th>
                      <Table.Th>Mediana</Table.Th>
                      <Table.Th>Q3</Table.Th>
                      <Table.Th>Max</Table.Th>
                      <Table.Th>Outliers</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(qBox.data ?? []).map(r => (
                      <Table.Tr key={r.group}>
                        <Table.Td>{r.group}</Table.Td>
                        <Table.Td>{r.min}</Table.Td>
                        <Table.Td>{r.q1}</Table.Td>
                        <Table.Td>{r.median}</Table.Td>
                        <Table.Td>{r.q3}</Table.Td>
                        <Table.Td>{r.max}</Table.Td>
                        <Table.Td>{r.outliers.join(', ') || '—'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper p="md" radius="md" className={classes.panel}>
              <Group justify="space-between" mb="xs">
                <Title order={4}>Nuvem de Palavras</Title>
                <Text c="dimmed" fz="sm">positivas × negativas</Text>
              </Group>
              {(qWCpos.isLoading || qWCneg.isLoading) && <Group justify="center" h={300}><Loader /></Group>}
              {(qWCpos.isError || qWCneg.isError) && <ErrorState message="Falha ao carregar nuvem" onRetry={() => { qWCpos.refetch(); qWCneg.refetch(); }} />}
              {!qWCpos.isLoading && !qWCpos.isError && !qWCneg.isLoading && !qWCneg.isError && (
                <Group wrap="wrap" gap="xs">
                  {(qWCpos.data ?? []).slice(0, 40).map(w => (
                    <Text key={`p-${w.word}`} fw={600} style={{ fontSize: 12 + Math.min(28, w.count) }}>
                      {w.word}
                    </Text>
                  ))}
                  {(qWCneg.data ?? []).slice(0, 40).map(w => (
                    <Text key={`n-${w.word}`} c="red.8" fw={600} style={{ fontSize: 12 + Math.min(28, w.count) }}>
                      {w.word}
                    </Text>
                  ))}
                </Group>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Paper>
    </>

  );
}
export default function Overview() {
  return (
    <DashboardFiltersProvider>
      <DashboardFilters />
      <OverviewInner />
    </DashboardFiltersProvider>
  );
}