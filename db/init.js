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
      empresa TEXT NOT NULL,
      razao_social TEXT NOT NULL,
      cnpj TEXT NOT NULL,
      respondente TEXT NOT NULL,
      email TEXT NOT NULL,
      telefone TEXT NOT NULL,
      cidade TEXT NOT NULL,
      estado TEXT NOT NULL,
      segmento TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
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
