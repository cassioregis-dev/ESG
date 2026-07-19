require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const { pool, initDb } = require('./db/init');
const {
  QUESTIONS, ESCALA, PILARES_ORDEM, classificar, PONTUACAO_MAXIMA,
} = require('./data/questions');
const {
  QUESTIONS_CIDADE, ESCALA_CIDADE, PILARES_ORDEM_CIDADE, classificarCidade, PONTUACAO_MAXIMA_CIDADE,
} = require('./data/cidades-questions');

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

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Não autenticado' });
}

function normalizarTipo(tipo) {
  return tipo === 'cidade' ? 'cidade' : 'empresa';
}

function getQuestionSet(tipo) {
  if (tipo === 'cidade') {
    return {
      questions: QUESTIONS_CIDADE,
      escala: ESCALA_CIDADE,
      pilaresOrdem: PILARES_ORDEM_CIDADE,
      classificar: classificarCidade,
      pontuacaoMaxima: PONTUACAO_MAXIMA_CIDADE,
    };
  }
  return {
    questions: QUESTIONS,
    escala: ESCALA,
    pilaresOrdem: PILARES_ORDEM,
    classificar,
    pontuacaoMaxima: PONTUACAO_MAXIMA,
  };
}

function computeScore(respostas, tipo) {
  const { questions, pilaresOrdem, classificar: classificarFn, pontuacaoMaxima } = getQuestionSet(tipo);

  const pilaresAgg = {};
  let pontosObtidos = 0;

  const respostasDetalhadas = questions.map(q => {
    const respostaRaw = respostas[q.id];
    const resposta = Number.isFinite(Number(respostaRaw)) ? Math.max(0, Math.min(5, Number(respostaRaw))) : 0;
    const pontos = resposta * q.peso;
    pontosObtidos += pontos;

    if (!pilaresAgg[q.pilar]) pilaresAgg[q.pilar] = { obtidos: 0, maximo: 0 };
    pilaresAgg[q.pilar].obtidos += pontos;
    pilaresAgg[q.pilar].maximo += q.peso * 5;

    return { id: q.id, pilar: q.pilar, pergunta: q.pergunta, peso: q.peso, resposta, pontos };
  });

  const pilares = pilaresOrdem.map(nome => {
    const agg = pilaresAgg[nome] || { obtidos: 0, maximo: 0 };
    const percentual = agg.maximo > 0 ? (agg.obtidos / agg.maximo) * 100 : 0;
    return { pilar: nome, obtidos: agg.obtidos, maximo: agg.maximo, percentual: Math.round(percentual * 10) / 10 };
  });

  const notaFinal = Math.round((pontosObtidos / pontuacaoMaxima) * 1000) / 10;
  const classificacao = classificarFn(notaFinal);

  return {
    pontosObtidos,
    pontosMaximo: pontuacaoMaxima,
    notaFinal,
    classificacao,
    pilares,
    respostas: respostasDetalhadas,
  };
}

// ---------- Public API ----------

app.get('/api/questions', (req, res) => {
  const tipo = normalizarTipo(req.query.tipo);
  const { questions, escala, pilaresOrdem } = getQuestionSet(tipo);
  res.json({ tipo, questions, escala, pilares: pilaresOrdem });
});

app.post('/api/leads', async (req, res) => {
  try {
    const tipo = normalizarTipo(req.body && req.body.tipo);
    const body = req.body || {};

    if (tipo === 'cidade') {
      const { municipio, razao_social, cnpj, respondente, cargo, email, telefone, estado } = body;
      const required = { municipio, razao_social, cnpj, respondente, cargo, email, telefone, estado };
      for (const [key, val] of Object.entries(required)) {
        if (!val || String(val).trim() === '') {
          return res.status(400).json({ error: `Campo obrigatório ausente: ${key}` });
        }
      }

      const result = await pool.query(
        `INSERT INTO leads (tipo, municipio, razao_social, cnpj, respondente, cargo, email, telefone, estado)
         VALUES ('cidade', $1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [municipio, razao_social, cnpj, respondente, cargo, email, telefone, estado]
      );
      return res.json({ leadId: result.rows[0].id, tipo });
    }

    // tipo === 'empresa'
    const { empresa, razao_social, cnpj, respondente, email, telefone, cidade, estado, segmento } = body;
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

    const result = await pool.query(
      `INSERT INTO leads (tipo, empresa, razao_social, cnpj, respondente, email, telefone, cidade, estado, segmento)
       VALUES ('empresa', $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [empresa, razao_social, cnpj, respondente, email, telefone, cidade, estado, segmento]
    );
    res.json({ leadId: result.rows[0].id, tipo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao salvar lead' });
  }
});

app.post('/api/submit', async (req, res) => {
  try {
    const { leadId, respostas } = req.body || {};
    if (!leadId) return res.status(400).json({ error: 'leadId é obrigatório' });

    const leadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    const lead = leadResult.rows[0];
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

    const tipo = normalizarTipo(lead.tipo);
    const { questions } = getQuestionSet(tipo);

    if (!respostas || typeof respostas !== 'object') {
      return res.status(400).json({ error: 'respostas é obrigatório' });
    }
    const faltando = questions.filter(q => !(q.id in respostas));
    if (faltando.length > 0) {
      return res.status(400).json({ error: 'Existem perguntas não respondidas', faltando: faltando.map(q => q.id) });
    }

    const resultado = computeScore(respostas, tipo);

    const insertResult = await pool.query(
      `INSERT INTO submissions (lead_id, pontos_obtidos, pontos_maximo, nota_final, classificacao, pilares_json, respostas_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        leadId,
        resultado.pontosObtidos,
        resultado.pontosMaximo,
        resultado.notaFinal,
        resultado.classificacao,
        JSON.stringify(resultado.pilares),
        JSON.stringify(resultado.respostas),
      ]
    );

    res.json({ submissionId: insertResult.rows[0].id, resultado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao salvar respostas' });
  }
});

app.get('/api/result/:id', async (req, res) => {
  try {
    const subResult = await pool.query('SELECT * FROM submissions WHERE id = $1', [req.params.id]);
    const submission = subResult.rows[0];
    if (!submission) return res.status(404).json({ error: 'Resultado não encontrado' });

    const leadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [submission.lead_id]);
    const lead = leadResult.rows[0];
    const tipo = lead ? normalizarTipo(lead.tipo) : 'empresa';

    let leadInfo = null;
    if (lead) {
      leadInfo = tipo === 'cidade'
        ? { tipo, nome: lead.municipio, estado: lead.estado }
        : { tipo, nome: lead.empresa, segmento: lead.segmento, cidade: lead.cidade, estado: lead.estado };
    }

    res.json({
      tipo,
      lead: leadInfo,
      pontosObtidos: Number(submission.pontos_obtidos),
      pontosMaximo: Number(submission.pontos_maximo),
      notaFinal: Number(submission.nota_final),
      classificacao: submission.classificacao,
      pilares: JSON.parse(submission.pilares_json),
      createdAt: submission.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao buscar resultado' });
  }
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

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const tipo = normalizarTipo(req.query.tipo);
    const { pilaresOrdem } = getQuestionSet(tipo);

    const { rows } = await pool.query(`
      SELECT s.id as submission_id, s.nota_final, s.classificacao, s.pontos_obtidos, s.pontos_maximo,
             s.pilares_json, s.created_at as submitted_at,
             l.id as lead_id, l.tipo, l.empresa, l.municipio, l.razao_social, l.cnpj, l.respondente, l.cargo,
             l.email, l.telefone, l.cidade, l.estado, l.segmento, l.created_at as lead_created_at
      FROM submissions s
      JOIN leads l ON l.id = s.lead_id
      WHERE l.tipo = $1
      ORDER BY s.created_at DESC
    `, [tipo]);

    const submissions = rows.map(r => ({
      submissionId: r.submission_id,
      notaFinal: Number(r.nota_final),
      classificacao: r.classificacao,
      pontosObtidos: Number(r.pontos_obtidos),
      pontosMaximo: Number(r.pontos_maximo),
      pilares: JSON.parse(r.pilares_json),
      submittedAt: r.submitted_at,
      lead: {
        id: r.lead_id, tipo: r.tipo, empresa: r.empresa, municipio: r.municipio,
        razaoSocial: r.razao_social, cnpj: r.cnpj, respondente: r.respondente, cargo: r.cargo,
        email: r.email, telefone: r.telefone, cidade: r.cidade, estado: r.estado, segmento: r.segmento,
        createdAt: r.lead_created_at,
      },
    }));

    const totalRespondentes = submissions.length;
    const mediaNotaFinal = totalRespondentes > 0
      ? Math.round((submissions.reduce((s, x) => s + x.notaFinal, 0) / totalRespondentes) * 10) / 10
      : 0;

    const mediaPorPilar = pilaresOrdem.map(nome => {
      const valores = submissions.map(s => {
        const p = s.pilares.find(p => p.pilar === nome);
        return p ? p.percentual : 0;
      });
      const media = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
      return { pilar: nome, media: Math.round(media * 10) / 10 };
    });

    // agrupamento auxiliar: por segmento (empresas) ou por estado (cidades)
    const agrupamentoChave = tipo === 'cidade' ? 'estado' : 'segmento';
    const porGrupo = {};
    for (const s of submissions) {
      const chave = s.lead[agrupamentoChave] || '—';
      if (!porGrupo[chave]) porGrupo[chave] = { count: 0, somaNota: 0 };
      porGrupo[chave].count += 1;
      porGrupo[chave].somaNota += s.notaFinal;
    }
    const resumoGrupo = Object.entries(porGrupo).map(([grupo, v]) => ({
      grupo, total: v.count, mediaNota: Math.round((v.somaNota / v.count) * 10) / 10,
    }));

    const porClassificacao = {};
    for (const s of submissions) {
      porClassificacao[s.classificacao] = (porClassificacao[s.classificacao] || 0) + 1;
    }

    res.json({
      tipo,
      totalRespondentes,
      mediaNotaFinal,
      mediaPorPilar,
      resumoGrupo,
      agrupamentoChave,
      porClassificacao,
      submissions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao buscar estatísticas' });
  }
});

app.get('/api/admin/export.csv', requireAdmin, async (req, res) => {
  try {
    const tipo = normalizarTipo(req.query.tipo);
    const { pilaresOrdem } = getQuestionSet(tipo);

    const { rows } = await pool.query(`
      SELECT l.empresa, l.municipio, l.razao_social, l.cnpj, l.respondente, l.cargo, l.email, l.telefone,
             l.cidade, l.estado, l.segmento,
             s.nota_final, s.classificacao, s.pilares_json, s.created_at
      FROM submissions s JOIN leads l ON l.id = s.lead_id
      WHERE l.tipo = $1
      ORDER BY s.created_at DESC
    `, [tipo]);

    const temaHeaders = pilaresOrdem.map(nome => `${nome} (%)`);
    const header = tipo === 'cidade'
      ? ['Município', 'Estado', 'Razao Social', 'CNPJ', 'Respondente', 'Cargo', 'Email', 'Telefone', 'Nota Final (%)', 'Classificacao', ...temaHeaders, 'Data']
      : ['Empresa', 'Razao Social', 'CNPJ', 'Respondente', 'Email', 'Telefone', 'Cidade', 'Estado', 'Segmento', 'Nota Final (%)', 'Classificacao', ...temaHeaders, 'Data'];

    const csvLines = [header.join(';')];
    for (const r of rows) {
      const temasArr = JSON.parse(r.pilares_json);
      const percentualPorTema = Object.fromEntries(temasArr.map(t => [t.pilar, t.percentual]));
      const temaValores = pilaresOrdem.map(nome => (percentualPorTema[nome] !== undefined ? percentualPorTema[nome] : ''));

      const linha = tipo === 'cidade'
        ? [r.municipio, r.estado, r.razao_social, r.cnpj, r.respondente, r.cargo, r.email, r.telefone, r.nota_final, r.classificacao, ...temaValores, r.created_at]
        : [r.empresa, r.razao_social, r.cnpj, r.respondente, r.email, r.telefone, r.cidade, r.estado, r.segmento, r.nota_final, r.classificacao, ...temaValores, r.created_at];

      csvLines.push(linha.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="diagnostico_${tipo}_leads.csv"`);
    res.send('﻿' + csvLines.join('\n'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao exportar CSV' });
  }
});

// ---------- Static frontend ----------
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Startup ----------
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Diagnóstico ESG rodando em http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Falha ao iniciar banco de dados:', err);
    process.exit(1);
  });
