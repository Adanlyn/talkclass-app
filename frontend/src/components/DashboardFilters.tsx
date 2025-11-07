//frontend\src\components\DashboardFilters.tsx
import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Group, Select, SegmentedControl } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDashboardFilters } from '../state/dashboardFilters';
import { getPublicCategories } from '../services/categories';

import { IconAdjustments, IconX } from '@tabler/icons-react';

export default function DashboardFilters() {
  const { value, set, reset } = useDashboardFilters();
  
  const [range, setRange] = useState<[Date | null, Date | null]>([
    new Date(value.from), new Date(value.to)
  ]);
  const [preset, setPreset] = useState<'7'|'30'|'90'|'custom'>('30');
const [cats, setCats] = useState<{ value: string; label: string }[]>([]);



  // aplica preset -> datas
  useEffect(() => {
    if (preset === 'custom') return;
    const days = preset === '7' ? 7 : preset === '30' ? 30 : 90;
    const now = new Date();
    const from = new Date(now.getTime() - days*24*60*60*1000);
    setRange([from, now]);
    set({ from: from.toISOString(), to: now.toISOString() });
  }, [preset]);

  // datas custom
  useEffect(() => {
    if (!range[0] || !range[1]) return;
    if (preset !== 'custom') return;
    set({ from: range[0].toISOString(), to: range[1].toISOString() });
  }, [range]);

useEffect(() => {
  let mounted = true;

  getPublicCategories()
    .then(list => {
      if (!mounted) return;

      const opts = list.map(c => ({ value: String(c.id), label: c.nome }));
      console.debug('CATS OPTIONS =>', opts); // agora existe
      setCats(opts);
    })
    .catch(err => {
      console.error('PUBLIC CATS ERR:', err);
      if (mounted) setCats([]);
    });

  return () => { mounted = false; };
}, []);



  const clearCompare = () => set({ compareCategoryId: null });

  return (
    <Group gap="md" mt="xs" wrap="wrap">
      <IconAdjustments size={18} />

      <SegmentedControl
        data={[
          { label: '7d', value: '7' },
          { label: '30d', value: '30' },
          { label: '90d', value: '90' },
          { label: 'Custom', value: 'custom' },
        ]}
        value={preset}
        onChange={(v) => setPreset(v as any)}
      />

      <DatePickerInput
        type="range"
        value={range}
        onChange={(v) => { setPreset('custom'); setRange(v as any); }}
        popoverProps={{ withinPortal: true }} 
        maw={380}
      />

<Select
  label="Categoria"
  placeholder={`Todas${cats.length ? ` • ${cats.length}` : ''}`}
  data={cats}                             // [{ value, label }]
  value={value.categoryId ?? null}
  onChange={(v) => set({ categoryId: v ?? null, compareCategoryId: null })}
  searchable
  clearable
  nothingFoundMessage={cats.length ? 'Sem resultados' : 'Carregando...'}
  comboboxProps={{ withinPortal: true, zIndex: 10000 }}
  w={240}
/>

<Select
  label="Comparar com"
  placeholder="(opcional)"
  data={cats}
  value={value.compareCategoryId ?? null}
  onChange={(v) => set({ compareCategoryId: v ?? null })}
  searchable
  clearable
  disabled={!value.categoryId}
  nothingFoundMessage={cats.length ? 'Sem resultados' : 'Carregando...'}
  comboboxProps={{ withinPortal: true, zIndex: 10000 }}
  w={240}
/>



      {/* Campos extras (habilite quando tiver dados) */}
      {/* <Select label="Pergunta" .../> */}
      {/* <Select label="Curso" .../> */}
      {/* <Select label="Turno" .../> */}
      {/* <Select label="Unidade" .../> */}

  <Checkbox
    label="Somente identificados"
    checked={!!value.identified}
    onChange={(e) => set({ identified: e.currentTarget.checked })}
    styles={{ root: { alignSelf: 'end' } }}
  />

      <Button variant="subtle" onClick={reset}>Limpar</Button>
    </Group>
  );
}
