import { Button, Group, Paper, Stack, Switch, Table, Text, TextInput, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import HeaderAdmin from '../../components/HeaderAdmin';
import classes from './Admin.module.css';

export default function AdminUsers() {
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
              <Link to="/admin/feedbacks" className={classes.navItem}><span>Feedbacks</span></Link>
              <Link to="/admin/usuarios" className={`${classes.navItem} ${classes.navItemActive}`}><span>Usuários</span></Link>
              <Link to="/admin/alertas" className={classes.navItem}><span>Alertas</span></Link>
              <Link to="/admin/relatorios" className={classes.navItem}><span>Relatórios</span></Link>
              <div className={classes.navFoot}><Button fullWidth color="orange">Exportar</Button></div>
            </nav>
          </aside>

          <div className={classes.topbar}>
            <HeaderAdmin title="Usuários" />
          </div>

          <section className={classes.content}>
            <div className={classes.contentInner}>
              <Paper p="lg" radius="md" className={classes.panel}>
                <Title order={4} mb="md">Cadastro de usuários</Title>

                <Stack gap="sm" maw={520}>
                  <TextInput label="Nome" placeholder="Nome completo" />
                  <TextInput label="E-mail" placeholder="email@dominio.com" />
                  <Group>
                    <Switch label="Administrador" />
                    <Switch label="Ativo" defaultChecked />
                  </Group>
                  <Group>
                    <Button color="orange">Salvar</Button>
                    <Button variant="light">Limpar</Button>
                  </Group>
                </Stack>

                <Title order={5} mt="lg" mb="xs">Usuários cadastrados</Title>
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Nome</Table.Th>
                      <Table.Th>E-mail</Table.Th>
                      <Table.Th>Perfil</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>Admin Teste</Table.Td>
                      <Table.Td>admin@talkclass.com</Table.Td>
                      <Table.Td>Administrador</Table.Td>
                      <Table.Td>Ativo</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Paper>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
