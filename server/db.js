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
  `);
}

module.exports = { pool, migrate };
