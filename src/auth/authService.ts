// Autenticação local de teste (mock) — guarda usuários no localStorage.
//
// Isso NÃO é seguro pra produção (senha em texto puro, tudo no navegador).
// É só pra você validar o fluxo de login de cliente/admin enquanto o
// sistema real não está integrado. Quando a integração acontecer, troque
// só o corpo destas funções por chamadas à API — o resto do app (Context,
// telas) não precisa mudar.

export type Role = 'cliente' | 'admin';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: Role;
}

interface StoredUser extends User {
  senha: string;
}

const USERS_KEY = 'bellaarte_users';
const SESSION_KEY = 'bellaarte_session';
const ADMIN_SEED_EMAIL = 'admin@bellaarte.com';
const ADMIN_SEED_SENHA = 'admin123';

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) as StoredUser[] : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Garante que sempre exista um admin de teste pra você entrar em /admin/login.
function seedAdmin() {
  const users = readUsers();
  if (users.some(u => u.email === ADMIN_SEED_EMAIL)) return;
  users.push({
    id: 'seed-admin',
    nome: 'Administrador',
    email: ADMIN_SEED_EMAIL,
    senha: ADMIN_SEED_SENHA,
    role: 'admin',
  });
  writeUsers(users);
}
seedAdmin();

function toPublicUser(u: StoredUser): User {
  const { senha: _senha, ...rest } = u;
  return rest;
}

export function register(nome: string, email: string, senha: string): User {
  const emailNorm = email.trim().toLowerCase();
  if (!nome.trim() || !emailNorm || !senha) throw new Error('Preencha nome, e-mail e senha.');
  const users = readUsers();
  if (users.some(u => u.email === emailNorm)) throw new Error('Já existe uma conta com esse e-mail.');
  const user: StoredUser = { id: crypto.randomUUID(), nome: nome.trim(), email: emailNorm, senha, role: 'cliente' };
  users.push(user);
  writeUsers(users);
  saveSession(user);
  return toPublicUser(user);
}

export function login(email: string, senha: string): User {
  const emailNorm = email.trim().toLowerCase();
  const users = readUsers();
  const found = users.find(u => u.email === emailNorm && u.senha === senha);
  if (!found) throw new Error('E-mail ou senha inválidos.');
  saveSession(found);
  return toPublicUser(found);
}

function saveSession(u: StoredUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(toPublicUser(u)));
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as User : null;
  } catch {
    return null;
  }
}

// Só pra o painel admin mostrar quantos clientes já se cadastraram no teste.
export function listCustomers(): User[] {
  return readUsers().filter(u => u.role === 'cliente').map(toPublicUser);
}
