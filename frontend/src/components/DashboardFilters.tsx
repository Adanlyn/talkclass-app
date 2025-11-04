import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Group, Select, SegmentedControl } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDashboardFilters } from '../state/dashboardFilters';
import { getCategoriesLite } from '../services/categories';
import { IconAdjustments, IconX } from '@tabler/icons-react';

export default function DashboardFilters() {
  const { value, set, reset } = useDashboardFilters();
  const [range, setRange] = useState<[Date | null, Date | null]>([
    new Date(value.from), new Date(value.to)
  ]);
  const [preset, setPreset] = useState<'7'|'30'|'90'|'custom'>('30');
  const [cats, setCats] = useState<{value:string,label:string}[]>([]);

  useEffect(() => {
    getCategoriesLite().then(list =>
      setCats(list.map(c => ({ value: c.id, label: c.nome })))
    ).catch(() => setCats([]));
  }, []);

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

  const clearCompare = () => set({ compareCategoryId: null });

  return (
    <Group wrap="wrap" gap="md" mb="md">
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
        maw={380}
      />

      <Select
        label="Categoria"
        placeholder="Todas"
        data={cats}
        value={value.categoryId ?? null}
        onChange={(v) => set({ categoryId: v ?? null })}
        clearable
        maw={260}
      />

      <Select
        label="Comparar com"
        placeholder="(opcional)"
        data={cats.filter(c => c.value !== (value.categoryId ?? ''))}
        value={value.compareCategoryId ?? null}
        onChange={(v) => set({ compareCategoryId: v ?? null })}
        rightSection={value.compareCategoryId ? <IconX size={14} onClick={clearCompare} /> : null}
        clearable
        maw={260}
      />

      {/* Campos extras (habilite quando tiver dados) */}
      {/* <Select label="Pergunta" .../> */}
      {/* <Select label="Curso" .../> */}
      {/* <Select label="Turno" .../> */}
      {/* <Select label="Unidade" .../> */}

      <Checkbox
        label="Somente identificados"
        checked={!!value.identified}
        onChange={(e) => set({ identified: e.currentTarget.checked ? true : null })}
      />

      <Button variant="subtle" onClick={reset}>Limpar</Button>
    </Group>
  );
}
