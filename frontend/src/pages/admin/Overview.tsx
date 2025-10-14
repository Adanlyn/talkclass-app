// src/pages/admin/Overview.tsx
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
} from '@mantine/core';
import { IconChartHistogram, IconSchool, IconBuilding, IconAlertTriangle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAdminTitle } from '../../components/Layout/AdminTitleContext'; // se estiver usando o contexto de título
import classes from '../admin/Admin.module.css';

const kpis = [
  { label: 'NPS Acadêmico', value: '+34', delta: '+4', icon: IconChartHistogram },
  { label: 'Feedbacks (30d)', value: '1.284', delta: '+12%', icon: IconSchool },
  { label: 'Áreas com alerta', value: '5', delta: '-2', icon: IconAlertTriangle, tone: 'red' as const },
  { label: 'Prédios avaliados', value: '18', delta: '+1', icon: IconBuilding },
];

const linhas = [
  { area: 'Biblioteca',   media: 4.2, tendencia: '↑', alertas: 0 },
  { area: 'Laboratórios', media: 3.6, tendencia: '→', alertas: 2 },
  { area: 'Secretaria',   media: 3.1, tendencia: '↑', alertas: 1 },
  { area: 'Limpeza',      media: 2.8, tendencia: '↓', alertas: 2 },
  { area: 'Wi-Fi',        media: 2.5, tendencia: '↓', alertas: 3 },
];

export default function Overview() {
  useAdminTitle('Visão geral'); // remove se não estiver usando AdminTitleContext
  const nav = useNavigate();

  return (
    <>

      {/* KPIs */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        {kpis.map(({ label, value, delta, icon: Icon, tone }) => (
          <Paper key={label} p="md" radius="md" className={classes.cardKpi}>
            <Group justify="space-between" align="flex-start">
              <Box>
                <Text c="dimmed" fz="sm">{label}</Text>
                <Title order={2} mt={6}>{value}</Title>
              </Box>
              <div className={classes.kpiIcon}><Icon size={22} /></div>
            </Group>
            <Text mt="xs" fz="sm" className={tone === 'red' ? classes.deltaDown : classes.deltaUp}>
              {delta} vs. período anterior
            </Text>
          </Paper>
        ))}
      </SimpleGrid>

      {/* GRÁFICOS (placeholders) */}
      <Grid mt="xl" gutter="lg" align="stretch">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" radius="md" className={classes.panel}>
            <Group justify="space-between" mb="xs">
              <Title order={4}>Satisfação por área</Title>
              <Text c="dimmed" fz="sm">média móvel (12 semanas)</Text>
            </Group>
            <div className={classes.chartPlaceholder} aria-label="Gráfico de linhas">
              <Text c="dimmed" ta="center">[gráfico de linhas]</Text>
            </div>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="md" className={classes.panel}>
            <Group justify="space-between" mb="xs">
              <Title order={4}>Distribuição de notas</Title>
              <Text c="dimmed" fz="sm">últimos 30 dias</Text>
            </Group>
            <div className={classes.chartPlaceholder} aria-label="Gráfico de barras/pizza">
              <Text c="dimmed" ta="center">[gráfico de barras/pizza]</Text>
            </div>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* TABELA */}
      <Paper p="md" radius="md" mt="xl" className={classes.panel}>
        <Group justify="space-between" mb="xs" align="center">
          <Title order={4}>Áreas com maior impacto</Title>
          <Button variant="light" size="xs" onClick={() => nav('/admin/relatorios')}>
            Ver todos
          </Button>
        </Group>

        <Table verticalSpacing="sm" highlightOnHover stickyHeader className={classes.table}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Área</Table.Th>
              <Table.Th>Média</Table.Th>
              <Table.Th>Tendência</Table.Th>
              <Table.Th>Alertas</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {linhas.map((r) => (
              <Table.Tr key={r.area}>
                <Table.Td>{r.area}</Table.Td>
                <Table.Td>{r.media.toFixed(1)}</Table.Td>
                <Table.Td>{r.tendencia}</Table.Td>
                <Table.Td>
                  {r.alertas > 0 ? (
                    <Badge color="red" variant="filled">{r.alertas}</Badge>
                  ) : (
                    <Badge color="teal" variant="light">OK</Badge>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </>
  );
}
