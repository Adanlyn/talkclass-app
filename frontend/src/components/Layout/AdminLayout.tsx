// src/components/layout/AdminLayout.tsx
import { ActionIcon, Button, Container, Drawer, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { IconMenu2, IconChevronRight } from '@tabler/icons-react';

import HeaderAdmin from '../../components/HeaderAdmin';
import ProfileModal, { loadProfile, type ProfileData } from '../../components/ProfileModal';
import { logoutAndReload } from '../../utils/auth';
import { AdminTitleContext } from './AdminTitleContext';
import classes from '../../pages/admin/Admin.module.css';

function getInitials(name: string) {
    const parts = (name || '').trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
    return (first + last).toUpperCase() || 'US';
}

export default function AdminLayout() {
    const [menuOpened, menu] = useDisclosure(false);
    const [profileOpened, profile] = useDisclosure(false);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [title, setTitle] = useState('');              // título global
    const initials = useMemo(() => getInitials(profileData?.name || ''), [profileData?.name]);
    const loc = useLocation();

    useEffect(() => { setProfileData(loadProfile()); }, []);

    const isActive = (path: string) => (loc.pathname === path || loc.pathname.startsWith(path + '/'));

    const handleLogout = () => logoutAndReload('/login');

    return (
        <AdminTitleContext.Provider value={{ title, setTitle }}>
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
                                <Link to="/admin" className={`${classes.navItem} ${isActive('/admin') ? classes.navItemActive : ''}`}>
                                    <span>Visão geral</span>
                                    <IconChevronRight size={16} />
                                </Link>

                                <Link to="/admin/categorias" className={`${classes.navItem} ${isActive('/admin/categorias') ? classes.navItemActive : ''}`}>
                                    <span>Categorias</span>
                                    <IconChevronRight size={16} />
                                </Link>

                                <Link to="/admin/perguntas" className={`${classes.navItem} ${isActive('/admin/perguntas') ? classes.navItemActive : ''}`}>
                                    <span>Perguntas</span>
                                    <IconChevronRight size={16} />
                                </Link>

                                <Link to="/admin/feedbacks" className={`${classes.navItem} ${isActive('/admin/feedbacks') ? classes.navItemActive : ''}`}>
                                    <span>Feedbacks</span>
                                    <IconChevronRight size={16} />
                                </Link>

                                <Link to="/admin/usuarios" className={`${classes.navItem} ${isActive('/admin/usuarios') ? classes.navItemActive : ''}`}>
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
                                title={title}
                                initials={initials}
                                onLogout={handleLogout}
                                onProfile={profile.open}
                            />
                        </div>

                        {/* CONTEÚDO */}
                        <section className={classes.content}>
                            <div className={classes.contentInner}>
                                <Outlet />
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
                            <Button variant="light" component={Link} to="/admin/categorias" onClick={menu.close}>Categorias</Button>
                            <Button variant="light" component={Link} to="/admin/perguntas" onClick={menu.close}>Perguntas</Button>
                            <Button variant="light" component={Link} to="/admin/feedbacks" onClick={menu.close}>Feedbacks</Button>
                            <Button variant="light" component={Link} to="/admin/usuarios" onClick={menu.close}>Usuários</Button>
                            <Button variant="light" component={Link} to="/admin/alertas" onClick={menu.close}>Alertas</Button>
                            <Button variant="light" component={Link} to="/admin/relatorios" onClick={menu.close}>Relatórios</Button>
                            <Button color="orange" onClick={menu.close}>Exportar</Button>
                        </Stack>
                    </Drawer>
                </main>

                {/* Modal de perfil */}
                <ProfileModal opened={profileOpened} onClose={profile.close} />

                
            </div>
        </AdminTitleContext.Provider>
    );
}
