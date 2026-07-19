const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString && connectionString.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      tipo TEXT NOT NULL DEFAULT 'empresa',
      empresa TEXT,
      municipio TEXT,
      razao_social TEXT NOT NULL,
      cnpj TEXT NOT NULL,
      respondente TEXT NOT NULL,
      cargo TEXT,
      email TEXT NOT NULL,
      telefone TEXT NOT NULL,
      cidade TEXT,
      estado TEXT NOT NULL,
      segmento TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Migração compatível com bancos criados antes do recurso de Cidades
  await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'empresa';`);
  await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS municipio TEXT;`);
  await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS cargo TEXT;`);
  await pool.query(`ALTER TABLE leads ALTER COLUMN empresa DROP NOT NULL;`);
  await pool.query(`ALTER TABLE leads ALTER COLUMN cidade DROP NOT NULL;`);
  await pool.query(`ALTER TABLE leads ALTER COLUMN segmento DROP NOT NULL;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER NOT NULL REFERENCES leads(id),
      pontos_obtidos REAL NOT NULL,
      pontos_maximo REAL NOT NULL,
      nota_final REAL NOT NULL,
      classificacao TEXT NOT NULL,
      pilares_json TEXT NOT NULL,
      respostas_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

module.exports = { pool, initDb };
