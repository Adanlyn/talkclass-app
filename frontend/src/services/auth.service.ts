import api from "./api";

export async function login(cpf: string, senha: string) {
  const { data } = await api.post("/auth/login", { cpf, senha });

  // salva token + expiração
  localStorage.setItem("talkclass.jwt", data.token);
  const exp = Math.floor(Date.now() / 1000) + data.expiresIn - 30;
  localStorage.setItem("talkclass.jwt_exp", String(exp));

  return data;
}

export async function getMe() {
  const { data } = await api.get("/user/me");
  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXP_KEY);
}