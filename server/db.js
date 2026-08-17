// Conexão com o Postgres do Railway + migração automática (cria as tabelas
// se ainda não existirem, toda vez que o servidor sobe — idempotente, não
// apaga nem sobrescreve dado nenhum já existente).
const { Pool } = require('pg');

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
      criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );

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
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

module.exports = { pool, migrate };
