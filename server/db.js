// Conexão com o Postgres do Railway + migração automática (cria as tabelas
// se ainda não existirem, toda vez que o servidor sobe — idempotente, não
// apaga nem sobrescreve dado nenhum já existente).
const { Pool, types } = require('pg');

// NUMERIC volta como string por padrão no node-pg (evita perder precisão) —
// aqui a gente prefere número de verdade pro front-end não ter que converter.
types.setTypeParser(1700, val => (val === null ? null : parseFloat(val)));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida. Configure a variável de ambiente.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS produtos (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome          TEXT NOT NULL,
      categoria     TEXT NOT NULL DEFAULT 'Outros',
      preco         NUMERIC(10,2) NOT NULL DEFAULT 0,
      unidade       TEXT,
      ativo         BOOLEAN NOT NULL DEFAULT true,
      origem        TEXT NOT NULL DEFAULT 'manual',
      erp_id        TEXT UNIQUE,
      criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- A tabela produtos já existia antes dessa coluna — adiciona se ainda
    -- não existir, sem afetar nenhum produto já cadastrado manualmente.
    ALTER TABLE produtos ADD COLUMN IF NOT EXISTS erp_id TEXT UNIQUE;

    -- Foto do produto: pode vir do ERP (imagem_origem='erp', atualiza sozinha
    -- na sincronização) ou ser subida manual na loja (imagem_origem='manual',
    -- a sincronização NUNCA sobrescreve essa).
    ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem_url TEXT;
    ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem_origem TEXT NOT NULL DEFAULT 'nenhuma';

    -- Desconto individual do produto (ex: 10.00 = 10%) — não vem do ERP,
    -- é só da loja, a sincronização nunca mexe nisso.
    ALTER TABLE produtos ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC(5,2);

    CREATE TABLE IF NOT EXISTS clientes (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      senha_hash  TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'cliente',
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cliente_id  UUID REFERENCES clientes(id) ON DELETE SET NULL,
      nome        TEXT NOT NULL,
      telefone    TEXT NOT NULL,
      entrega     TEXT NOT NULL DEFAULT 'Retirar na Bella Arte',
      itens       JSONB NOT NULL DEFAULT '[]',
      total       NUMERIC(10,2) NOT NULL DEFAULT 0,
      status      TEXT NOT NULL DEFAULT 'novo',
      origem      TEXT NOT NULL DEFAULT 'site',
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
      enviado_erp BOOLEAN NOT NULL DEFAULT false,
      erp_numero  TEXT
    );

    -- A tabela pedidos já existia antes dessas duas colunas — adiciona se
    -- ainda não existirem, sem afetar nenhuma linha já salva.
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS enviado_erp BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS erp_numero TEXT;

    -- Preço do configurador de Adesivo, "casado" com o nome exato de um
    -- produto no ERP. Se não achar esse nome numa sincronização, o preço
    -- MANTÉM o último valor bom (nunca fica em branco pro cliente) e
    -- "sincronizado" vira false pra avisar o admin.
    CREATE TABLE IF NOT EXISTS adesivo_precos (
      material          TEXT NOT NULL,
      acabamento        TEXT NOT NULL,
      preco             NUMERIC(10,2),
      erp_nome_esperado TEXT NOT NULL,
      sincronizado      BOOLEAN NOT NULL DEFAULT false,
      atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (material, acabamento)
    );

    INSERT INTO adesivo_precos (material, acabamento, preco, erp_nome_esperado) VALUES
      ('UV',    'Recortado', 200, 'Adesivo UV Recortado'),
      ('UV',    'Refilado',  200, 'Adesivo UV Refilado'),
      ('UV',    'Laminado',  230, 'Adesivo UV Laminado'),
      ('Vinil', 'Recortado', 180, 'Adesivo Vinil Recortado'),
      ('Vinil', 'Refilado',  180, 'Adesivo Vinil Refilado'),
      ('Vinil', 'Laminado',  200, 'Adesivo Vinil Laminado')
    ON CONFLICT (material, acabamento) DO NOTHING;

    -- Configurações gerais da loja (chave/valor) — hoje só o WhatsApp, mas
    -- serve pra qualquer outro dado real (não visual) que precise ser igual
    -- pra todo mundo que visita, editável pelo admin.
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
    INSERT INTO configuracoes (chave, valor) VALUES ('whatsapp_numero', '5511948991616')
    ON CONFLICT (chave) DO NOTHING;

    -- Promoções gerais da loja (ex: "Dia dos Pais", 15%, 01/08 a 15/08) —
    -- valem pra loja inteira (produtos simples + todos os configuradores),
    -- com início/fim automáticos. "ativo" é um desliga-tudo manual, caso
    -- queira encerrar antes da data.
    CREATE TABLE IF NOT EXISTS promocoes (
      id          SERIAL PRIMARY KEY,
      nome        TEXT NOT NULL,
      percentual  NUMERIC(5,2) NOT NULL,
      data_inicio TIMESTAMPTZ NOT NULL,
      data_fim    TIMESTAMPTZ NOT NULL,
      ativo       BOOLEAN NOT NULL DEFAULT true,
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

module.exports = { pool, migrate };
