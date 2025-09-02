import {
  Button, Container, Group, SegmentedControl, Stack, Text, Title, Textarea, Radio, Paper, Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import Header from '../components/Header';
import classes from './Feedback.module.css';

const CATEGORIES = ['Infraestrutura','Atendimento','Aulas','Serviços','Biblioteca','Tecnologia'];

type FormValues = {
  categoria: string; q1: string; q2: string; q3: string;
  freq: 'sempre' | 'maioria' | 'raramente' | '';
  comentario: string;
};

function Likert({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void; }) {
  return (
    <Stack gap={8} className={classes.block}>
      <Title order={4} ta="center" c="#2b231f">{label}</Title>
      <SegmentedControl
        fullWidth radius="md" size="md"
        classNames={{ root: classes.likertRoot, indicator: classes.likertIndicator, label: classes.likertLabel }}
        value={value} onChange={onChange}
        data={[{label:'1',value:'1'},{label:'2',value:'2'},{label:'3',value:'3'},{label:'4',value:'4'},{label:'5',value:'5'}]}
      />
    </Stack>
  );
}

export default function Feedback() {
  const [categoria, setCategoria] = useState(CATEGORIES[0]);

  const form = useForm<FormValues>({
    initialValues: { categoria: CATEGORIES[0], q1:'3', q2:'3', q3:'3', freq:'', comentario:'' },
    validate: { freq: (v) => (!v ? 'Selecione uma opção' : null) },
  });

  const onSubmit = async (values: FormValues) => {
    const payload = { ...values, categoria };
    try {
      const res = await fetch('/feedbacks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Falha ao enviar');
      form.reset();
      alert('Feedback enviado!');
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar. Tente novamente.');
    }
  };

  return (
    <div className={classes.page}>
      <Header />

      <main className={classes.main}>
        {/* HERO */}
        <section className={classes.hero}>
          <Container size="lg">
            <div className={classes.heroInner}>
              <Title className={classes.heroTitle} c="white" fw={800} lh={1.1}>
                Sua voz <Text span c="orange.5" fw={900} inherit>transforma</Text> a universidade
              </Title>
              <Text c="#d6c9c0" fz="sm" className={classes.subtitle}>
                Participe do nosso sistema de feedback anônimo e ajude a melhorar a experiência acadêmica.
              </Text>
            </div>
          </Container>
        </section>

        {/* TABS / CATEGORIAS */}
        <div className={classes.tabsBar}>
          <Container size="lg">
            <div className={classes.tabsScroll}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`${classes.tab} ${form.values.categoria === cat ? classes.tabActive : ''}`}
                  onClick={() => { setCategoria(cat); form.setFieldValue('categoria', cat); }}
                  type="button"
                >
                  {cat}
                </button>
              ))}
            </div>
          </Container>
        </div>

        {/* FORM */}
        <section className={classes.formSection}>
          <Container size="lg">
            <form onSubmit={form.onSubmit((vals) => onSubmit({ ...vals, categoria }))} className={classes.formWrap}>
              <Paper p="lg" radius="md" className={classes.formCard}>
                <Stack gap={28}>
                  <Likert label="Lorem ipsum dolor sit amet, consectetur adipiscing elit?" value={form.values.q1} onChange={(v) => form.setFieldValue('q1', v)} />
                  <Likert label="Lorem ipsum dolor sit amet, consectetur adipiscing elit?" value={form.values.q2} onChange={(v) => form.setFieldValue('q2', v)} />
                  <Likert label="Lorem ipsum dolor sit amet, consectetur adipiscing elit?" value={form.values.q3} onChange={(v) => form.setFieldValue('q3', v)} />

                  <Box>
                    <Title order={4} ta="center" mb={10} c="#2b231f">Lorem ipsum dolor sit amet, consectetur adipiscing elit?</Title>
                    <Radio.Group {...form.getInputProps('freq')} className={classes.radioGroup}>
                      <div className={classes.radioScroll}>
                        <div className={classes.radioRow}>
                          <Radio value="sempre" label="Sempre" />
                          <Radio value="maioria" label="Na maioria das vezes" />
                          <Radio value="raramente" label="Raramente" />
                        </div>
                      </div>
                    </Radio.Group>
                  </Box>

                  <Box>
                    <Title order={4} ta="center" mb={10} c="#2b231f">Lorem ipsum dolor sit amet, consectetur adipiscing elit?</Title>
                    <Textarea
                      placeholder="Se quiser, descreva detalhes que possam ajudar a melhorar."
                      minRows={3} autosize classNames={{ input: classes.textarea }}
                      {...form.getInputProps('comentario')}
                    />
                  </Box>

                  <Group justify="center" mt={8}>
                    <Button type="submit" color="orange" size="lg" radius="md" px="xl">Enviar</Button>
                  </Group>
                </Stack>
              </Paper>
            </form>
          </Container>
        </section>
      </main>

      {/* FOOTER fora do conteúdo */}
      <footer className={classes.footer}>
        <Container size="lg">
          <Text size="sm">©{new Date().getFullYear()} TalkClass. Todos os direitos reservados.</Text>
        </Container>
      </footer>
    </div>
  );
}
