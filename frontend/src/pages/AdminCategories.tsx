import { Button, Container, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import HeaderAdmin from '../components/HeaderAdmin';
import classes from './Admin.module.css';

export default function AdminCategories() {
  return (
    <div className={classes.page}>
      <main className={classes.main}>
        <div className={classes.shell}>
          {/* Sidebar reaproveitando a mesma de Admin */}
          <aside className={classes.sidebar}>
            <div className={classes.brand}>
              <Title order={4} c="white" fw={900}>Admin</Title>
              <Text c="#e8dbd2" fz="xs">Painel TalkClass</Text>
            </div>
            <nav className={classes.nav}>
              <Link to="/admin" className={classes.navItem}><span>Visão geral</span></Link>
              <Link to="/admin/categorias" className={`${classes.navItem} ${classes.navItemActive}`}><span>Cadastro de categorias</span></Link>
              <Link to="/admin/feedbacks" className={classes.navItem}><span>Feedbacks</span></Link>
              <Link to="/admin/usuarios" className={classes.navItem}><span>Usuários</span></Link>
              <Link to="/admin/alertas" className={classes.navItem}><span>Alertas</span></Link>
              <Link to="/admin/relatorios" className={classes.navItem}><span>Relatórios</span></Link>
              <div className={classes.navFoot}><Button fullWidth color="orange">Exportar</Button></div>
            </nav>
          </aside>

          {/* Topbar */}
          <div className={classes.topbar}>
            <HeaderAdmin title="Cadastro de categorias" />
          </div>

          {/* Conteúdo */}
          <section className={classes.content}>
            <div className={classes.contentInner}>
              <Paper p="lg" radius="md" className={classes.panel}>
                <Title order={4} mb="md">Categorias</Title>

                {/* Esqueleto simples para CRUD futuro */}
                <Stack gap="sm" maw={520}>
                  <TextInput label="Nome da categoria" placeholder="Ex.: Atendimento" />
                  <TextInput label="Descrição (opcional)" placeholder="Breve descrição" />
                  <Group>
                    <Button color="orange">Salvar</Button>
                    <Button variant="light">Limpar</Button>
                  </Group>
                </Stack>

                <Container mt="lg" p={0}>
                  <Text c="dimmed" fz="sm">
                    Aqui entra a tabela/listagem de categorias cadastradas.
                  </Text>
                </Container>
              </Paper>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
