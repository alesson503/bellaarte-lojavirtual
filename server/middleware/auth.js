const jwt = require('jsonwebtoken');

// Sem fallback fraco — se JWT_SECRET não estiver configurada, o servidor
// nem sobe (ver server.js). Aqui é seguro assumir que ela existe.
const JWT_SECRET = process.env.JWT_SECRET;

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
}

function authMiddleware(req, res, next) {
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

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Só administradores podem fazer isso.' });
  next();
}

module.exports = { signToken, authMiddleware, adminOnly };
