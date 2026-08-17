const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { migrate, pool } = require('./db');

// Sem fallback fraco — se faltar, o servidor nem sobe (lição da auditoria do ERP).
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não definida. Configure essa variável de ambiente antes de subir o servidor.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// CORS restrito só aos domínios da loja (não aberto pra qualquer site).
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .concat(['http://localhost:5173', 'http://127.0.0.1:5173']);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Origem não permitida por CORS.'));
  },
}));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'erro', error: 'Banco indisponível.' });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/produtos', require('./routes/produtos'));
app.use('/api/pedidos', require('./routes/pedidos'));

app.use((err, _req, res, _next) => {
  if (err?.message === 'Origem não permitida por CORS.') {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Erro interno.' });
});

const PORT = process.env.PORT || 3001;

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`Bella Arte loja — servidor no ar na porta ${PORT}`));
  })
  .catch(err => {
    console.error('Falha ao migrar o banco de dados:', err);
    process.exit(1);
  });
