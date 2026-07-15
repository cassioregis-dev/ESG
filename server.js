require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const db = require('./db/init');
const { QUESTIONS, ESCALA, PILARES_ORDEM, classificar, PONTUACAO_MAXIMA } = require('./data/questions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }, // 8h
}));

// ---------- Helpers ----------
const QUESTIONS_BY_ID = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Não autenticado' });
}

function computeScore(respostas) {
  // respostas: { [questionId]: 0..5 }
  const pilaresAgg = {}; // pilar -> { obtidos, maximo }
  let pontosObtidos = 0;

  const respostasDetalhadas = QUESTIONS.map(q => {
    const respostaRaw = respostas[q.id];
    const resposta = Number.isFinite(Number(respostaRaw)) ? Math.max(0, Math.min(5, Number(respostaRaw))) : 0;
    const pontos = resposta * q.peso;
    pontosObtidos += pontos;

    if (!pilaresAgg[q.pilar]) pilaresAgg[q.pilar] = { obtidos: 0, maximo: 0 };
    pilaresAgg[q.pilar].obtidos += pontos;
    pilaresAgg[q.pilar].maximo += q.peso * 5;

    return { id: q.id, pilar: q.pilar, pergunta: q.pergunta, peso: q.peso, resposta, pontos };
  });

  const pilares = PILARES_ORDEM.map(nome => {
    const agg = pilaresAgg[nome] || { obtidos: 0, maximo: 0 };
    const percentual = agg.maximo > 0 ? (agg.obtidos / agg.maximo) * 100 : 0;
    return { pilar: nome, obtidos: agg.obtidos, maximo: agg.maximo, percentual: Math.round(percentual * 10) / 10 };
  });

  const notaFinal = Math.round((pontosObtidos / PONTUACAO_MAXIMA) * 1000) / 10; // 1 casa decimal
  const classificacao = classificar(notaFinal);

  return {
    pontosObtidos,
    pontosMaximo: PONTUACAO_MAXIMA,
    notaFinal,
    classificacao,
    pilares,
    respostas: respostasDetalhadas,
  };
}

// ---------- Public API ----------

app.get('/api/questions', (req, res) => {
  res.json({ questions: QUESTIONS, escala: ESCALA, pilares: PILARES_ORDEM });
});

app.post('/api/leads', (req, res) => {
  const { empresa, razao_social, cnpj, respondente, email, telefone, cidade, estado, segmento } = req.body || {};

  const required = { empresa, razao_social, cnpj, respondente, email, telefone, cidade, estado, segmento };
  for (const [key, val] of Object.entries(required)) {
    if (!val || String(val).trim() === '') {
      return res.status(400).json({ error: `Campo obrigatório ausente: ${key}` });
    }
  }
  const segmentosValidos = ['Comércio', 'Serviços', 'Turismo'];
  if (!segmentosValidos.includes(segmento)) {
    return res.status(400).json({ error: 'Segmento inválido' });
  }

  const stmt = db.prepare(`
    INSERT INTO leads (empresa, razao_social, cnpj, respondente, email, telefone, cidade, estado, segmento)
    VALUES (@empresa, @razao_social, @cnpj, @respondente, @email, @telefone, @cidade, @estado, @segmento)
  `);
  const info = stmt.run({ empresa, razao_social, cnpj, respondente, email, telefone, cidade, estado, segmento });

  res.json({ leadId: info.lastInsertRowid });
});

app.post('/api/submit', (req, res) => {
  const { leadId, respostas } = req.body || {};
  if (!leadId) return res.status(400).json({ error: 'leadId é obrigatório' });
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
  if (!respostas || typeof respostas !== 'object') {
    return res.status(400).json({ error: 'respostas é obrigatório' });
  }
  // valida que todas as perguntas foram respondidas
  const faltando = QUESTIONS.filter(q => !(q.id in respostas));
  if (faltando.length > 0) {
    return res.status(400).json({ error: 'Existem perguntas não respondidas', faltando: faltando.map(q => q.id) });
  }

  const resultado = computeScore(respostas);

  const stmt = db.prepare(`
    INSERT INTO submissions (lead_id, pontos_obtidos, pontos_maximo, nota_final, classificacao, pilares_json, respostas_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    leadId,
    resultado.pontosObtidos,
    resultado.pontosMaximo,
    resultado.notaFinal,
    resultado.classificacao,
    JSON.stringify(resultado.pilares),
    JSON.stringify(resultado.respostas)
  );

  res.json({ submissionId: info.lastInsertRowid, resultado });
});

app.get('/api/result/:id', (req, res) => {
  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
  if (!submission) return res.status(404).json({ error: 'Resultado não encontrado' });
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(submission.lead_id);

  res.json({
    lead: lead ? { empresa: lead.empresa, segmento: lead.segmento, cidade: lead.cidade, estado: lead.estado } : null,
    pontosObtidos: submission.pontos_obtidos,
    pontosMaximo: submission.pontos_maximo,
    notaFinal: submission.nota_final,
    classificacao: submission.classificacao,
    pilares: JSON.parse(submission.pilares_json),
    createdAt: submission.created_at,
  });
});

// ---------- Admin auth ----------

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

  if (username === adminUser && password === adminPassword) {
    req.session.isAdmin = true;
    req.session.adminUser = username;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Usuário ou senha inválidos' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/admin/check', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// ---------- Admin data ----------

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT s.id as submission_id, s.nota_final, s.classificacao, s.pontos_obtidos, s.pontos_maximo,
           s.pilares_json, s.created_at as submitted_at,
           l.id as lead_id, l.empresa, l.razao_social, l.cnpj, l.respondente, l.email, l.telefone,
           l.cidade, l.estado, l.segmento, l.created_at as lead_created_at
    FROM submissions s
    JOIN leads l ON l.id = s.lead_id
    ORDER BY s.created_at DESC
  `).all();

  const submissions = rows.map(r => ({
    submissionId: r.submission_id,
    notaFinal: r.nota_final,
    classificacao: r.classificacao,
    pontosObtidos: r.pontos_obtidos,
    pontosMaximo: r.pontos_maximo,
    pilares: JSON.parse(r.pilares_json),
    submittedAt: r.submitted_at,
    lead: {
      id: r.lead_id, empresa: r.empresa, razaoSocial: r.razao_social, cnpj: r.cnpj,
      respondente: r.respondente, email: r.email, telefone: r.telefone,
      cidade: r.cidade, estado: r.estado, segmento: r.segmento, createdAt: r.lead_created_at,
    },
  }));

  // agregados
  const totalRespondentes = submissions.length;
  const mediaNotaFinal = totalRespondentes > 0
    ? Math.round((submissions.reduce((s, x) => s + x.notaFinal, 0) / totalRespondentes) * 10) / 10
    : 0;

  const mediaPorPilar = PILARES_ORDEM.map(nome => {
    const valores = submissions.map(s => {
      const p = s.pilares.find(p => p.pilar === nome);
      return p ? p.percentual : 0;
    });
    const media = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
    return { pilar: nome, media: Math.round(media * 10) / 10 };
  });

  const porSegmento = {};
  for (const s of submissions) {
    const seg = s.lead.segmento;
    if (!porSegmento[seg]) porSegmento[seg] = { count: 0, somaNota: 0 };
    porSegmento[seg].count += 1;
    porSegmento[seg].somaNota += s.notaFinal;
  }
  const resumoSegmento = Object.entries(porSegmento).map(([segmento, v]) => ({
    segmento, total: v.count, mediaNota: Math.round((v.somaNota / v.count) * 10) / 10,
  }));

  const porClassificacao = {};
  for (const s of submissions) {
    porClassificacao[s.classificacao] = (porClassificacao[s.classificacao] || 0) + 1;
  }

  res.json({
    totalRespondentes,
    mediaNotaFinal,
    mediaPorPilar,
    resumoSegmento,
    porClassificacao,
    submissions,
  });
});

app.get('/api/admin/export.csv', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT l.empresa, l.razao_social, l.cnpj, l.respondente, l.email, l.telefone, l.cidade, l.estado, l.segmento,
           s.nota_final, s.classificacao, s.created_at
    FROM submissions s JOIN leads l ON l.id = s.lead_id
    ORDER BY s.created_at DESC
  `).all();

  const header = ['Empresa', 'Razao Social', 'CNPJ', 'Respondente', 'Email', 'Telefone', 'Cidade', 'Estado', 'Segmento', 'Nota Final (%)', 'Classificacao', 'Data'];
  const csvLines = [header.join(';')];
  for (const r of rows) {
    csvLines.push([
      r.empresa, r.razao_social, r.cnpj, r.respondente, r.email, r.telefone, r.cidade, r.estado, r.segmento,
      r.nota_final, r.classificacao, r.created_at,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'));
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="diagnostico_esg_leads.csv"');
  res.send('﻿' + csvLines.join('\n'));
});

// ---------- Static frontend ----------
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Diagnóstico ESG rodando em http://localhost:${PORT}`);
});
