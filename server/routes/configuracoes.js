const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminOnly, limparCacheAdminAntigo } = require('../middleware/auth');

const router = express.Router();

// Chaves que não saem no GET público: 'aparencia' é grande (fotos) e tem
// rota própria; o resto é só configuração interna.
const CHAVES_PRIVADAS = ['aparencia'];

// GET /api/configuracoes — público, a loja usa pra montar os links de WhatsApp etc.
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT chave, valor FROM configuracoes WHERE NOT (chave = ANY($1))', [CHAVES_PRIVADAS]);
    const config = Object.fromEntries(rows.map(r => [r.chave, r.valor]));
    res.json({ config });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
});

// ── Aparência do site (textos da home, cores, logo, banner, fundo, carrossel)
// Antes ficava salva só no navegador de quem editava; agora fica aqui e vale
// pra todo mundo que abre a loja.
const TEXTOS = ['heroEyebrow', 'heroTitleLine1', 'heroTitleEm', 'heroTitleLine2', 'heroLede'];
const CORES = ['colorPrimary', 'colorPrimaryDeep', 'colorAccent'];
const IMAGENS = ['logoUrl', 'heroPhotoUrl', 'fundoUrl'];
const ehImagem = v => typeof v === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/.test(v);

function limparAparencia(entrada) {
  const a = {};
  for (const k of TEXTOS) if (typeof entrada?.[k] === 'string') a[k] = entrada[k].slice(0, k === 'heroLede' ? 600 : 120);
  for (const k of CORES) if (typeof entrada?.[k] === 'string' && /^#[0-9a-f]{6}$/i.test(entrada[k])) a[k] = entrada[k];
  for (const k of IMAGENS) {
    if (entrada?.[k] === null) a[k] = null;
    else if (ehImagem(entrada?.[k])) a[k] = entrada[k];
  }
  if (Array.isArray(entrada?.carrosselFotos)) a.carrosselFotos = entrada.carrosselFotos.filter(ehImagem).slice(0, 12);
  return a;
}

// GET /api/configuracoes/aparencia — público (a loja inteira usa)
router.get('/aparencia', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT valor FROM configuracoes WHERE chave = 'aparencia'");
    let aparencia = {};
    try { aparencia = rows[0] ? JSON.parse(rows[0].valor) : {}; } catch { aparencia = {}; }
    res.json({ aparencia });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar a aparência.' });
  }
});

// PUT /api/configuracoes/aparencia — admin. Recebe o objeto inteiro ({} = tudo padrão).
router.put('/aparencia', authMiddleware, adminOnly, async (req, res) => {
  const aparencia = limparAparencia(req.body?.aparencia);
  const valor = JSON.stringify(aparencia);
  if (valor.length > 15 * 1024 * 1024) return res.status(413).json({ error: 'Imagens grandes demais. Tente fotos menores ou menos fotos no carrossel.' });
  await pool.query(
    `INSERT INTO configuracoes (chave, valor) VALUES ('aparencia', $1)
     ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`,
    [valor]
  );
  res.json({ aparencia });
});

// PUT /api/configuracoes/:chave — só admin.
router.put('/:chave', authMiddleware, adminOnly, async (req, res) => {
  const { chave } = req.params;
  if (CHAVES_PRIVADAS.includes(chave)) return res.status(400).json({ error: 'Use a rota própria dessa configuração.' });
  // Ligar/desligar o painel admin antigo só pelo ERP (o próprio painel
  // antigo não consegue se religar depois de desligado).
  if (chave === 'admin_antigo_ativo') {
    if (!req.user.viaErp) return res.status(403).json({ error: 'Isso só pode ser mudado pela Loja Virtual no ERP.' });
    if (!['sim', 'nao'].includes(req.body?.valor)) return res.status(400).json({ error: "Valor precisa ser 'sim' ou 'nao'." });
  }
  const { valor } = req.body || {};
  if (typeof valor !== 'string' || !valor.trim()) return res.status(400).json({ error: 'Valor é obrigatório.' });
  await pool.query(
    `INSERT INTO configuracoes (chave, valor) VALUES ($1, $2)
     ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`,
    [chave, valor.trim()]
  );
  if (chave === 'admin_antigo_ativo') limparCacheAdminAntigo();
  res.json({ ok: true });
});

module.exports = router;
