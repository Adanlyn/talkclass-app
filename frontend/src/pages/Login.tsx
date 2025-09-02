import {
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  Checkbox,
  Anchor,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import classes from './Login.module.css';
import { login } from '../services/auth.service';

type FormValues = {
  cpf: string;
  password: string;
  remember: boolean;
};

export default function Login() {
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    initialValues: { cpf: '', password: '', remember: true },
    validate: {
      cpf: (v) =>
        /^\d{11}$/.test(v.replace(/\D/g, ''))
          ? null
          : 'Informe um CPF válido com 11 dígitos',
      password: (v) =>
        v.length >= 6 ? null : 'Senha deve ter no mínimo 6 caracteres',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const cpf = values.cpf.replace(/\D/g, ''); // remove pontos e traços

      await login(cpf, values.password);
      if (values.remember) {
        // token já salvo pelo serviço de login
      }

      navigate('/admin');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        alert('CPF ou senha inválidos.');
      } else {
        alert('Falha ao autenticar. Tente novamente.');
      }
    }
  };

  return (
    <div className={classes.page}>
      <Header />

      <main className={classes.main}>
        <Container size="xs">
          <Paper radius="lg" p="xl" className={classes.card} withBorder>
            <Stack gap="sm">
              <Title order={3} ta="center" className={classes.title}>
                Acesso Administrativo
              </Title>
              <Text ta="center" c="dimmed" fz="sm">
                Insira suas credenciais para entrar no painel.
              </Text>

              <form onSubmit={form.onSubmit(onSubmit)}>
                <Stack gap="md" mt="sm">
                  <TextInput
                    label="CPF"
                    placeholder="000.000.000-00"
                    withAsterisk
                    {...form.getInputProps('cpf')}
                  />

                  <PasswordInput
                    label="Senha"
                    placeholder="••••••••"
                    withAsterisk
                    {...form.getInputProps('password')}
                  />

                  <Group justify="space-between" align="center">
                    <Checkbox
                      label="Lembrar-me"
                      {...form.getInputProps('remember', { type: 'checkbox' })}
                    />
                    <Anchor component={Link} to="/redefinir-senha" fz="sm">
                      Esqueci minha senha
                    </Anchor>
                  </Group>

                  <Button
                    type="submit"
                    fullWidth
                    color="orange"
                    radius="md"
                    size="md"
                  >
                    Entrar
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Paper>

          <Text ta="center" mt="md" fz="sm" className={classes.notice}>
            * Somente usuários autorizados pela administração têm credenciais de
            acesso.
          </Text>
        </Container>
      </main>

      <footer className={classes.footer}>
        <Container size="lg">
          <Text size="sm">
            ©{new Date().getFullYear()} TalkClass. Todos os direitos reservados.
          </Text>
        </Container>
      </footer>
    </div>
  );
}
