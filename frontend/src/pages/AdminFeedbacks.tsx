import { Button, Container, Group, Paper, Table, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import HeaderAdmin from '../components/HeaderAdmin';
import classes from './Admin.module.css';

export default function AdminFeedbacks() {
  return (
    <div className={classes.page}>
      <main className={classes.main}>
        <div className={classes.shell}>
          <aside className={classes.sidebar}>
            <div className={classes.brand}>
              <Title order={4} c="white" fw={900}>Admin</Title>
              <Text c="#e8dbd2" fz="xs">Painel TalkClass</Text>
            </div>
            <nav className={classes.nav}>
              <Link to="/admin" className={classes.navItem}><span>Visão geral</span></Link>
              <Link to="/admin/categorias" className={classes.navItem}><span>Cadastro de categorias</span></Link>
              <Link to="/admin/feedbacks" className={`${classes.navItem} ${classes.navItemActive}`}><span>Feedbacks</span></Link>
              <Link to="/admin/usuarios" className={classes.navItem}><span>Usuários</span></Link>
              <Link to="/admin/alertas" className={classes.navItem}><span>Alertas</span></Link>
              <Link to="/admin/relatorios" className={classes.navItem}><span>Relatórios</span></Link>
              <div className={classes.navFoot}><Button fullWidth color="orange">Exportar</Button></div>
            </nav>
          </aside>

          <div className={classes.topbar}>
            <HeaderAdmin title="Feedbacks" />
          </div>

          <section className={classes.content}>
            <div className={classes.contentInner}>
              <Paper p="lg" radius="md" className={classes.panel}>
                <Group justify="space-between" mb="sm">
                  <Title order={4}>Lista de feedbacks</Title>
                  <Button variant="light">Exportar CSV</Button>
                </Group>

                <Table highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Data</Table.Th>
                      <Table.Th>Categoria</Table.Th>
                      <Table.Th>Sentimento</Table.Th>
                      <Table.Th>Resumo</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>2025-08-28</Table.Td>
                      <Table.Td>Atendimento</Table.Td>
                      <Table.Td>Positivo</Table.Td>
                      <Table.Td>“Equipe muito atenciosa…”</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>

                <Container mt="sm" p={0}>
                  <Text c="dimmed" fz="sm">Substituir por tabela paginada real depois.</Text>
                </Container>
              </Paper>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
