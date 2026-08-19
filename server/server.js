const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { migrate, pool } = require('./db');
const { syncProdutosFromErp } = require('./erpSync');

// Sem fallback fraco — se faltar, o servidor nem sobe (lição da auditoria do ERP).
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não definida. Configure essa variável de ambiente antes de subir o servidor.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
// 40mb pra caber pedidos com arte anexada do configurador de Adesivo/Cartão
// (arquivo até 10MB vira ~13MB em base64 — dá folga pra alguns itens juntos).
app.use(express.json({ limit: '40mb' }));

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
app.use('/api/configuracoes', require('./routes/configuracoes'));
app.use('/api/promocoes', require('./routes/promocoes'));

app.use((err, _req, res, _next) => {
  if (err?.message === 'Origem não permitida por CORS.') {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Erro interno.' });
});

const PORT = process.env.PORT || 3001;
const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`Bella Arte loja — servidor no ar na porta ${PORT}`));

    // Sincroniza produtos do ERP ao subir e depois a cada 30min — não trava
    // o servidor se o ERP estiver fora do ar, só loga e tenta de novo depois.
    const rodarSync = () => {
      syncProdutosFromErp()
        .then(r => console.log('Sync de produtos do ERP:', r))
        .catch(err => console.error('Falha na sincronização de produtos do ERP:', err.message));
    };
    rodarSync();
    setInterval(rodarSync, SYNC_INTERVAL_MS);
  })
  .catch(err => {
    console.error('Falha ao migrar o banco de dados:', err);
    process.exit(1);
  });
