// src/pages/admin/Perguntas.tsx
import { useState } from 'react';
import { Button, Group, Modal, Paper, Select, Stack, Table, Text, TextInput, Title, rem, Switch, ActionIcon } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useAdminTitle } from '../../components/Layout/AdminTitleContext';
import classes from '../admin/Admin.module.css';

// Ajuste depois com seus serviços reais
type Pergunta = { id: string; texto: string; categoria?: string; ativa: boolean };
const MOCK: Pergunta[] = [
  { id: '1', texto: 'Atendimento é cordial?', categoria: 'Secretaria', ativa: true },
  { id: '2', texto: 'Laboratórios têm equipamentos suficientes?', categoria: 'Laboratórios', ativa: true },
];

export default function Perguntas() {
  useAdminTitle('Perguntas');

  const [lista, setLista] = useState<Pergunta[]>(MOCK);
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Pergunta | null>(null);

  function reset() { setTexto(''); setCategoria(null); setEditId(null); }

  function salvar() {
    const payload = { texto: texto.trim(), categoria: categoria ?? undefined };
    if (!payload.texto) return;
    if (editId) {
      setLista((xs) => xs.map(p => p.id === editId ? { ...p, ...payload } : p));
    } else {
      setLista((xs) => [{ id: String(Date.now()), ativa: true, ...payload }, ...xs]);
    }
    reset();
  }

  function toggleAtiva(id: string, ativa: boolean) {
    setLista((xs) => xs.map(p => p.id === id ? { ...p, ativa } : p));
  }

  return (
    <>
      <Paper p="lg" radius="md" className={classes.panel}>
        <Stack gap="sm" maw={720}>
          <Group grow>
            <TextInput
              label="Texto da pergunta"
              placeholder="Ex.: A limpeza das salas está adequada?"
              value={texto}
              onChange={(e) => setTexto(e.currentTarget.value)}
            />
            <Select
              label="Categoria (opcional)"
              placeholder="Selecione"
              data={['Biblioteca','Laboratórios','Secretaria','Limpeza','Wi-Fi']}
              value={categoria}
              onChange={setCategoria}
              clearable
            />
          </Group>
          <Group>
            <Button color="orange" onClick={salvar}>{editId ? 'Atualizar' : 'Salvar'}</Button>
            <Button variant="light" onClick={reset}>Limpar</Button>
          </Group>
        </Stack>

        <Table striped withColumnBorders highlightOnHover mt="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Pergunta</Table.Th>
              <Table.Th>Categoria</Table.Th>
              <Table.Th style={{ width: rem(120) }}>Ativa</Table.Th>
              <Table.Th style={{ width: rem(120) }}>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {lista.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td>{p.texto}</Table.Td>
                <Table.Td>{p.categoria ?? <Text c="dimmed">—</Text>}</Table.Td>
                <Table.Td>
                  <Switch checked={p.ativa} onChange={(e) => toggleAtiva(p.id, e.currentTarget.checked)} />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon variant="light" onClick={() => { setEditId(p.id); setTexto(p.texto); setCategoria(p.categoria ?? null); }} title="Editar">
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => setConfirm(p)} title="Excluir">
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {lista.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}><Text c="dimmed" ta="center">Nenhuma pergunta cadastrada.</Text></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={!!confirm} onClose={() => setConfirm(null)} title="Confirmar exclusão" centered>
        <Stack>
          <Text>Excluir a pergunta <b>{confirm?.texto}</b>?</Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setConfirm(null)}>Cancelar</Button>
            <Button color="red" onClick={() => { if (!confirm) return; setLista((xs) => xs.filter(x => x.id !== confirm.id)); setConfirm(null); }}>
              Excluir
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
