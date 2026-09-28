const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// Sem fallback fraco — se JWT_SECRET não estiver configurada, o servidor
// nem sobe (ver server.js). Aqui é seguro assumir que ela existe.
const JWT_SECRET = process.env.JWT_SECRET;

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
}

// O painel "Loja Virtual" do ERP chama as mesmas rotas de admin daqui,
// identificado pela senha compartilhada da integração (ERP_API_SECRET) —
// assim as regras (validação, sincronização, fotos) são as mesmas nos dois
// painéis, sem duplicar nada.
function veioDoErp(req) {
  const segredo = process.env.ERP_API_SECRET;
  return !!segredo && req.headers['x-loja-secret'] === segredo;
}

function authMiddleware(req, res, next) {
  if (veioDoErp(req)) {
    req.user = { id: null, role: 'admin', viaErp: true };
    return next();
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
}

// Chave "Painel admin antigo da loja" (liga/desliga pelo ERP). Guardada em
// configuracoes.admin_antigo_ativo ('sim' | 'nao'); sem valor = ligado.
// Cache curto pra não consultar o banco em toda requisição de admin.
let cacheAdminAntigo = { valor: true, ate: 0 };
async function adminAntigoLigado() {
  if (Date.now() < cacheAdminAntigo.ate) return cacheAdminAntigo.valor;
  try {
    const { rows } = await pool.query("SELECT valor FROM configuracoes WHERE chave = 'admin_antigo_ativo'");
    cacheAdminAntigo = { valor: rows[0]?.valor !== 'nao', ate: Date.now() + 15000 };
  } catch {
    cacheAdminAntigo = { valor: true, ate: Date.now() + 5000 };
  }
  return cacheAdminAntigo.valor;
}
function limparCacheAdminAntigo() { cacheAdminAntigo.ate = 0; }

const MSG_ADMIN_DESLIGADO = 'O painel admin da loja foi desligado. Agora tudo é feito pela Loja Virtual, dentro do ERP.';

async function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Só administradores podem fazer isso.' });
  if (!req.user.viaErp && !(await adminAntigoLigado())) return res.status(403).json({ error: MSG_ADMIN_DESLIGADO });
  next();
}

module.exports = { signToken, authMiddleware, adminOnly, veioDoErp, adminAntigoLigado, limparCacheAdminAntigo, MSG_ADMIN_DESLIGADO };
