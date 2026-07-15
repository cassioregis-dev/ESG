// Perguntas do Auto Diagnóstico de Sustentabilidade / ESG
// Extraído de: Questionario_Autodiagnostico_Sustentabilidade.xlsx
// Cada pergunta tem um peso (relevância) usado no cálculo ponderado da nota.

const QUESTIONS = [
  { id: 'G1', pilar: 'Governança', pergunta: 'Possui política formal de sustentabilidade?', peso: 5 },
  { id: 'G2', pilar: 'Governança', pergunta: 'Existem metas ESG definidas?', peso: 4 },
  { id: 'G3', pilar: 'Governança', pergunta: 'Divulga desempenho de sustentabilidade?', peso: 4 },
  { id: 'G4', pilar: 'Governança', pergunta: 'Sustentabilidade no planejamento estratégico?', peso: 5 },

  { id: 'S1', pilar: 'Comunidade', pergunta: 'Contribui para projetos sociais?', peso: 4 },
  { id: 'S2', pilar: 'Comunidade', pergunta: 'Prioriza contratação local?', peso: 4 },
  { id: 'S3', pilar: 'Comunidade', pergunta: 'Desenvolve empreendedores locais?', peso: 3 },
  { id: 'S4', pilar: 'Comunidade', pergunta: 'Oferece estágios?', peso: 2 },

  { id: 'P1', pilar: 'Pessoas', pergunta: 'Política contra assédio e discriminação?', peso: 5 },
  { id: 'P2', pilar: 'Pessoas', pergunta: 'Treinamentos regulares?', peso: 4 },
  { id: 'P3', pilar: 'Pessoas', pergunta: 'Programa de saúde e segurança?', peso: 5 },
  { id: 'P4', pilar: 'Pessoas', pergunta: 'Monitora clima organizacional?', peso: 3 },

  { id: 'E1', pilar: 'Energia', pergunta: 'Monitora consumo energético?', peso: 5 },
  { id: 'E2', pilar: 'Energia', pergunta: 'Possui metas de redução?', peso: 4 },
  { id: 'E3', pilar: 'Energia', pergunta: 'Utiliza energia renovável?', peso: 3 },
  { id: 'E4', pilar: 'Energia', pergunta: 'Conhece pegada de carbono?', peso: 5 },
  { id: 'E5', pilar: 'Energia', pergunta: 'Possui plano de descarbonização?', peso: 5 },

  { id: 'A1', pilar: 'Água', pergunta: 'Monitora consumo de água?', peso: 5 },
  { id: 'A2', pilar: 'Água', pergunta: 'Possui equipamentos economizadores?', peso: 4 },
  { id: 'A3', pilar: 'Água', pergunta: 'Trata adequadamente efluentes?', peso: 5 },

  { id: 'R1', pilar: 'Resíduos', pergunta: 'Mede geração de resíduos?', peso: 5 },
  { id: 'R2', pilar: 'Resíduos', pergunta: 'Realiza segregação?', peso: 5 },
  { id: 'R3', pilar: 'Resíduos', pergunta: 'Reduz descartáveis?', peso: 4 },
  { id: 'R4', pilar: 'Resíduos', pergunta: 'Ações de reciclagem?', peso: 3 },

  { id: 'C1', pilar: 'Compras', pergunta: 'Prioriza fornecedores locais?', peso: 4 },
  { id: 'C2', pilar: 'Compras', pergunta: 'Avalia critérios ESG de fornecedores?', peso: 5 },
  { id: 'C3', pilar: 'Compras', pergunta: 'Estimula comércio justo?', peso: 3 },

  { id: 'N1', pilar: 'Natureza', pergunta: 'Ações de conservação da biodiversidade?', peso: 4 },
  { id: 'N2', pilar: 'Natureza', pergunta: 'Evita impactos à fauna e flora?', peso: 5 },

  { id: 'CU1', pilar: 'Cultura', pergunta: 'Valoriza cultura local?', peso: 3 },
  { id: 'CU2', pilar: 'Cultura', pergunta: 'Apoia iniciativas culturais?', peso: 2 },

  { id: 'PL1', pilar: 'Poluição', pergunta: 'Controla ruído e poluição?', peso: 4 },
  { id: 'PL2', pilar: 'Poluição', pergunta: 'Reduz produtos químicos nocivos?', peso: 4 },
];

// Escala de resposta (0 a 5), igual à planilha original
const ESCALA = [
  { valor: 0, label: 'Não existe' },
  { valor: 1, label: 'Existe informalmente' },
  { valor: 2, label: 'Parcial' },
  { valor: 3, label: 'Implementado' },
  { valor: 4, label: 'Implementado e monitorado' },
  { valor: 5, label: 'Referência do setor' },
];

// Ordem fixa dos pilares (para exibição consistente)
const PILARES_ORDEM = [
  'Governança', 'Comunidade', 'Pessoas', 'Energia', 'Água',
  'Resíduos', 'Compras', 'Natureza', 'Cultura', 'Poluição',
];

function classificar(percentual) {
  if (percentual < 30) return 'Iniciante';
  if (percentual < 50) return 'Emergente';
  if (percentual < 70) return 'Comprometida';
  if (percentual < 85) return 'Sustentável';
  if (percentual < 95) return 'Referência';
  return 'Excelência ESG';
}

const PONTUACAO_MAXIMA = QUESTIONS.reduce((sum, q) => sum + q.peso * 5, 0);

module.exports = { QUESTIONS, ESCALA, PILARES_ORDEM, classificar, PONTUACAO_MAXIMA };
