import {
  Avatar,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useMemo } from 'react';
import classes from './ProfileModal.module.css';

export type ProfileData = {
  cpf: string;
  name: string;
  email: string;
  phone?: string;
};

const STORAGE_KEY = 'tc_profile';

/** Carrega o perfil do storage (mock para TCC). */
export function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProfileData;
      // sanity fallback
      return {
        cpf: parsed.cpf || '000.000.000-00',
        name: parsed.name || 'Admin TalkClass',
        email: parsed.email || 'admin@talkclass.edu',
        phone: parsed.phone || '',
      };
    }
  } catch {}
  // defaults para validar o front
  return {
    cpf: '000.000.000-00',
    name: 'Admin TalkClass',
    email: 'admin@talkclass.edu',
    phone: '',
  };
}

/** Iniciais do primeiro e último nome. */
function getInitials(name: string) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length === 0) return 'US';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase() || 'US';
}

type Props = {
  opened: boolean;
  onClose: () => void;
};

export default function ProfileModal({ opened, onClose }: Props) {
  const profile = useMemo(() => loadProfile(), []);
  const initials = useMemo(() => getInitials(profile.name), [profile.name]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Meu perfil</Text>}
      centered
      radius="md"
      size="lg"
      overlayProps={{ opacity: 0.35, blur: 2 }}
      classNames={{ body: classes.modalBody, header: classes.modalHeader }}
    >
      <Stack gap="md">
        {/* Avatar de iniciais (sem upload) */}
        <Group align="center" gap="md">
          <Avatar
            size={72}
            radius="xl"
            bg="var(--mantine-color-orange-6)"
            color="white"
            className={classes.avatar}
            aria-label="Avatar do usuário"
          >
            {initials}
          </Avatar>
          <Text c="dimmed" fz="sm">
            Dados gerenciados pela administração. Edição direta desabilitada.
          </Text>
        </Group>

        {/* Campos SOMENTE LEITURA */}
        <TextInput
          label="CPF"
          value={profile.cpf}
          readOnly
          radius="md"
        />
        <TextInput
          label="Nome"
          value={profile.name}
          readOnly
          radius="md"
        />
        <TextInput
          label="E-mail"
          value={profile.email}
          readOnly
          radius="md"
        />
        <TextInput
          label="Celular"
          value={profile.phone || ''}
          readOnly
          radius="md"
        />

        <Group justify="flex-end" mt="xs">
          <Button onClick={onClose} color="orange">
            Fechar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
