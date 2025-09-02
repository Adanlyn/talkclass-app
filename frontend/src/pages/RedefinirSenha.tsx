import {
  Alert,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import classes from './RedefinirSenha.module.css';

type FormValues = {
  password: string;
  confirm: string;
};

function validateStrength(pw: string) {
  // Regras básicas e objetivas
  const long = pw.length >= 8;
  const hasNumber = /\d/.test(pw);
  const hasLetter = /[A-Za-z]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const checks = [long, hasNumber, hasLetter, hasSymbol].filter(Boolean).length;
  return { ok: long && hasNumber && hasLetter, checks };
}

export default function RedefinirSenha() {
  const [params] = useSearchParams();
  const token = params.get('token') || ''; // ex.: /redefinir-senha?token=XYZ
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    initialValues: { password: '', confirm: '' },
    validate: {
      password: (v) =>
        validateStrength(v).ok
          ? null
          : 'Mínimo 8 caracteres, letras e números (símbolo opcional)',
      confirm: (v, vals) => (v === vals.password ? null : 'Senhas não conferem'),
    },
  });

  const onSubmit = async (values: FormValues) => {
    // Integração real:
    // const res = await fetch(`/auth/reset-password`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token, password: values.password })
    // });
    // if (!res.ok) { tratar erro (token inválido/expirado) }
    alert(`Senha redefinida (mock)\nToken: ${token}`);
    navigate('/login');
  };

  const tokenAusente = token.trim().length === 0;

  return (
    <div className={classes.page}>
      <Header />

      <main className={classes.main}>
        <Container size="xs">
          <Paper radius="lg" p="xl" className={classes.card} withBorder>
            <Stack gap="sm">
              <Title order={3} ta="center" className={classes.title}>
                Redefinir senha
              </Title>
              <Text ta="center" c="dimmed" fz="sm">
                Crie uma nova senha para sua conta.
              </Text>

              {tokenAusente && (
                <Alert
                  icon={<IconAlertTriangle size={16} />}
                  title="Link inválido ou incompleto"
                  color="red"
                >
                  Este link não possui um <b>token</b> válido. Solicite um novo em{' '}
                  <Link to="/recuperar-senha">Recuperar senha</Link>.
                </Alert>
              )}

              <form onSubmit={form.onSubmit(onSubmit)}>
                <Stack gap="md" mt="sm">
                  <PasswordInput
                    label="Nova senha"
                    placeholder="••••••••"
                    withAsterisk
                    {...form.getInputProps('password')}
                  />

                  <PasswordInput
                    label="Confirmar nova senha"
                    placeholder="••••••••"
                    withAsterisk
                    {...form.getInputProps('confirm')}
                  />

                  <Button
                    type="submit"
                    color="orange"
                    radius="md"
                    size="md"
                    disabled={tokenAusente}
                  >
                    Redefinir senha
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Paper>

          <Text ta="center" mt="md" fz="sm" className={classes.notice}>
            * Por segurança, o link de redefinição expira após curto período.
          </Text>
        </Container>
      </main>

      <footer className={classes.footer}>
        <Container size="lg">
          <Text size="sm">©{new Date().getFullYear()} TalkClass. Todos os direitos reservados.</Text>
        </Container>
      </footer>
    </div>
  );
}
