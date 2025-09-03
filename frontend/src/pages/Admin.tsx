// src/pages/Admin.tsx
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Drawer,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconMenu2,
  IconChevronRight,
  IconChartHistogram,
  IconSchool,
  IconBuilding,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import HeaderAdmin from '../components/HeaderAdmin';
import ProfileModal, { loadProfile, type ProfileData } from '../components/ProfileModal';
import { useEffect, useMemo, useState } from 'react';
import classes from './Admin.module.css';
import { logoutAndReload } from '../utils/auth';


const kpis = [
  { label: 'NPS Acadêmico', value: '+34', delta: '+4', icon: IconChartHistogram },
  { label: 'Feedbacks (30d)', value: '1.284', delta: '+12%', icon: IconSchool },
  { label: 'Áreas com alerta', value: '5', delta: '-2', tone: 'red', icon: IconAlertTriangle },
  { label: 'Prédios avaliados', value: '18', delta: '+1', icon: IconBuilding },
];

const linhas = [
  { area: 'Biblioteca', media: 4.2, tendencia: '↑', alertas: 0 },
  { area: 'Laboratórios', media: 3.6, tendencia: '→', alertas: 2 },
  { area: 'Secretaria', media: 3.1, tendencia: '↑', alertas: 1 },
  { area: 'Limpeza', media: 2.8, tendencia: '↓', alertas: 2 },
  { area: 'Wi-Fi', media: 2.5, tendencia: '↓', alertas: 3 },
];

function getInitials(name: string) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length === 0) return 'US';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase() || 'US';
}

export default function Admin() {
  const [menuOpened, menu] = useDisclosure(false);
  const [profileOpened, profile] = useDisclosure(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const nav = useNavigate();

  useEffect(() => { setProfileData(loadProfile()); }, []);
  const initials = useMemo(() => getInitials(profileData?.name || ''), [profileData?.name]);

  const handleLogout = () => logoutAndReload('/login');

  return (
    <div className={classes.page}>
      <main className={classes.main}>
        <div className={classes.shell}>
          {/* SIDEBAR */}
          <aside className={classes.sidebar} aria-label="Navegação de administração">
            <div className={classes.brand}>
              <Title order={4} c="white" fw={900}>Admin</Title>
              <Text c="#e8dbd2" fz="xs">Painel TalkClass</Text>
            </div>

            <nav className={classes.nav}>
              <Link to="/admin" className={`${classes.navItem} ${classes.navItemActive}`}>
                <span>Visão geral</span>
                <IconChevronRight size={16} />
              </Link>

              <Link to="/admin/categorias" className={classes.navItem}>
                <span>Cadastro de categorias</span>
                <IconChevronRight size={16} />
              </Link>

              <Link to="/admin/feedbacks" className={classes.navItem}>
                <span>Feedbacks</span>
                <IconChevronRight size={16} />
              </Link>

              <Link to="/admin/usuarios" className={classes.navItem}>
                <span>Usuários</span>
                <IconChevronRight size={16} />
              </Link>

              <Link to="/admin/alertas" className={classes.navItem} onClick={(e) => e.preventDefault()}>
                <span>Alertas</span>
                <IconChevronRight size={16} />
              </Link>

              <Link to="/admin/relatorios" className={classes.navItem} onClick={(e) => e.preventDefault()}>
                <span>Relatórios</span>
                <IconChevronRight size={16} />
              </Link>

              <div className={classes.navFoot}>
                <Button fullWidth color="orange" radius="sm">Exportar</Button>
              </div>
            </nav>
          </aside>

          {/* TOPBAR */}
          <div className={classes.topbar}>
            <ActionIcon
              variant="subtle"
              className={classes.burger}
              onClick={menu.open}
              aria-label="Abrir menu"
            >
              <IconMenu2 />
            </ActionIcon>

            <HeaderAdmin
              title="Visão geral"
              initials={initials}
              onLogout={handleLogout}
              onProfile={profile.open}
            />
          </div>

          {/* CONTEÚDO */}
          <section className={classes.content}>
            <div className={classes.contentInner}>
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
            </div>
          </section>
        </div>

        {/* DRAWER MOBILE */}
        <Drawer
          opened={menuOpened}
          onClose={menu.close}
          size="100%"
          padding="md"
          title={<Text fw={700}>Menu</Text>}
          className={classes.drawer}
          overlayProps={{ opacity: 0.35, blur: 2 }}
        >
          <Stack gap="sm" mt="sm">
            <Button variant="light" component={Link} to="/admin" onClick={menu.close}>Visão geral</Button>
            <Button variant="light" component={Link} to="/admin/categorias" onClick={menu.close}>Cadastro de categorias</Button>
            <Button variant="light" component={Link} to="/admin/feedbacks" onClick={menu.close}>Feedbacks</Button>
            <Button variant="light" component={Link} to="/admin/usuarios" onClick={menu.close}>Usuários</Button>
            <Button variant="light" component={Link} to="/admin/alertas" onClick={menu.close}>Alertas</Button>
            <Button variant="light" component={Link} to="/admin/relatorios" onClick={menu.close}>Relatórios</Button>
            <Button color="orange" onClick={menu.close}>Exportar</Button>
          </Stack>
        </Drawer>
      </main>

      {/* Modal de perfil (somente leitura) */}
      <ProfileModal opened={profileOpened} onClose={profile.close} />

      <footer className={classes.footer}>
        <Container size="lg">
          <Text size="sm">©{new Date().getFullYear()} TalkClass. Todos os direitos reservados.</Text>
        </Container>
      </footer>
    </div>
  );
}
