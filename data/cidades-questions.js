// Perguntas do Autodiagnóstico Municipal de Sustentabilidade (Green Destinations)
// Extraído de: Autodiagnostico_Municipal_Green_Destinations.xlsx
// 75 indicadores em 6 temas. Mesmo padrão de pontuação ponderada do questionário de Empresas.

const QUESTIONS_CIDADE = [
  { id: '1.1', pilar: 'Gestão do Destino', pergunta: 'Coordenador de sustentabilidade', peso: 5 },
  { id: '1.2', pilar: 'Gestão do Destino', pergunta: 'Estrutura de gestão', peso: 5 },
  { id: '1.3', pilar: 'Gestão do Destino', pergunta: 'Capacitação da equipe', peso: 5 },
  { id: '1.4', pilar: 'Gestão do Destino', pergunta: 'Governança participativa', peso: 4 },
  { id: '1.5', pilar: 'Gestão do Destino', pergunta: 'Inventário turístico', peso: 4 },
  { id: '1.6', pilar: 'Gestão do Destino', pergunta: 'Avaliação de impactos', peso: 4 },
  { id: '1.7', pilar: 'Gestão do Destino', pergunta: 'Estratégia de destino', peso: 4 },
  { id: '1.8', pilar: 'Gestão do Destino', pergunta: 'Plano de ação', peso: 4 },
  { id: '1.9', pilar: 'Gestão do Destino', pergunta: 'Transparência', peso: 4 },
  { id: '1.10', pilar: 'Gestão do Destino', pergunta: 'Monitoramento de visitantes', peso: 4 },
  { id: '1.11', pilar: 'Gestão do Destino', pergunta: 'Satisfação dos visitantes', peso: 4 },
  { id: '1.12', pilar: 'Gestão do Destino', pergunta: 'Gestão da pressão turística', peso: 4 },
  { id: '1.13', pilar: 'Gestão do Destino', pergunta: 'Indicadores de sustentabilidade', peso: 4 },
  { id: '1.14', pilar: 'Gestão do Destino', pergunta: 'Revisão e avaliação', peso: 4 },
  { id: '1.15', pilar: 'Gestão do Destino', pergunta: 'Relatório de sustentabilidade', peso: 4 },
  { id: '2.1', pilar: 'Natureza & Paisagem', pergunta: 'Conservação da natureza', peso: 5 },
  { id: '2.2', pilar: 'Natureza & Paisagem', pergunta: 'Impacto do turismo sobre a natureza', peso: 5 },
  { id: '2.3', pilar: 'Natureza & Paisagem', pergunta: 'Proteção dos recursos naturais', peso: 5 },
  { id: '2.4', pilar: 'Natureza & Paisagem', pergunta: 'Espécies invasoras', peso: 4 },
  { id: '2.5', pilar: 'Natureza & Paisagem', pergunta: 'Proteção da paisagem', peso: 4 },
  { id: '2.6', pilar: 'Natureza & Paisagem', pergunta: 'Proteção da vida silvestre', peso: 4 },
  { id: '2.7', pilar: 'Natureza & Paisagem', pergunta: 'Interação responsável com fauna', peso: 4 },
  { id: '2.8', pilar: 'Natureza & Paisagem', pergunta: 'Bem-estar animal', peso: 4 },
  { id: '2.9', pilar: 'Natureza & Paisagem', pergunta: 'Educação ambiental', peso: 4 },
  { id: '2.10', pilar: 'Natureza & Paisagem', pergunta: 'Restauração ecológica', peso: 4 },
  { id: '3.1', pilar: 'Meio Ambiente & Clima', pergunta: 'Controle de ruído', peso: 5 },
  { id: '3.2', pilar: 'Meio Ambiente & Clima', pergunta: 'Poluição luminosa', peso: 5 },
  { id: '3.3', pilar: 'Meio Ambiente & Clima', pergunta: 'Planejamento territorial', peso: 5 },
  { id: '3.4', pilar: 'Meio Ambiente & Clima', pergunta: 'Gestão hídrica', peso: 4 },
  { id: '3.5', pilar: 'Meio Ambiente & Clima', pergunta: 'Redução consumo água', peso: 4 },
  { id: '3.6', pilar: 'Meio Ambiente & Clima', pergunta: 'Qualidade da água', peso: 4 },
  { id: '3.7', pilar: 'Meio Ambiente & Clima', pergunta: 'Tratamento de esgoto', peso: 4 },
  { id: '3.8', pilar: 'Meio Ambiente & Clima', pergunta: 'Redução de resíduos', peso: 4 },
  { id: '3.9', pilar: 'Meio Ambiente & Clima', pergunta: 'Coleta seletiva', peso: 4 },
  { id: '3.10', pilar: 'Meio Ambiente & Clima', pergunta: 'Destinação final', peso: 4 },
  { id: '3.11', pilar: 'Meio Ambiente & Clima', pergunta: 'Combate ao lixo', peso: 4 },
  { id: '3.12', pilar: 'Meio Ambiente & Clima', pergunta: 'Inventário GEE', peso: 4 },
  { id: '3.13', pilar: 'Meio Ambiente & Clima', pergunta: 'Mitigação climática', peso: 4 },
  { id: '3.14', pilar: 'Meio Ambiente & Clima', pergunta: 'Mobilidade sustentável', peso: 4 },
  { id: '3.15', pilar: 'Meio Ambiente & Clima', pergunta: 'Transporte público', peso: 4 },
  { id: '3.16', pilar: 'Meio Ambiente & Clima', pergunta: 'Eficiência energética', peso: 4 },
  { id: '3.17', pilar: 'Meio Ambiente & Clima', pergunta: 'Energia renovável', peso: 4 },
  { id: '3.18', pilar: 'Meio Ambiente & Clima', pergunta: 'Compensação carbono', peso: 4 },
  { id: '3.19', pilar: 'Meio Ambiente & Clima', pergunta: 'Adaptação climática', peso: 4 },
  { id: '3.20', pilar: 'Meio Ambiente & Clima', pergunta: 'Comunicação climática', peso: 4 },
  { id: '4.1', pilar: 'Cultura & Tradição', pergunta: 'Patrimônio material', peso: 5 },
  { id: '4.2', pilar: 'Cultura & Tradição', pergunta: 'Conservação patrimônio', peso: 5 },
  { id: '4.3', pilar: 'Cultura & Tradição', pergunta: 'Impacto do turismo na cultura', peso: 5 },
  { id: '4.4', pilar: 'Cultura & Tradição', pergunta: 'Proteção de artefatos', peso: 4 },
  { id: '4.5', pilar: 'Cultura & Tradição', pergunta: 'Patrimônio imaterial', peso: 4 },
  { id: '4.6', pilar: 'Cultura & Tradição', pergunta: 'Valorização das tradições', peso: 4 },
  { id: '4.7', pilar: 'Cultura & Tradição', pergunta: 'Identidade cultural', peso: 4 },
  { id: '4.8', pilar: 'Cultura & Tradição', pergunta: 'Participação comunitária', peso: 4 },
  { id: '4.9', pilar: 'Cultura & Tradição', pergunta: 'Eventos culturais', peso: 4 },
  { id: '4.10', pilar: 'Cultura & Tradição', pergunta: 'Autenticidade cultural', peso: 4 },
  { id: '5.1', pilar: 'Bem-estar Social', pergunta: 'Empreendedorismo local', peso: 5 },
  { id: '5.2', pilar: 'Bem-estar Social', pergunta: 'Emprego local', peso: 5 },
  { id: '5.3', pilar: 'Bem-estar Social', pergunta: 'Qualificação profissional', peso: 5 },
  { id: '5.4', pilar: 'Bem-estar Social', pergunta: 'Inclusão social', peso: 4 },
  { id: '5.5', pilar: 'Bem-estar Social', pergunta: 'Acessibilidade', peso: 4 },
  { id: '5.6', pilar: 'Bem-estar Social', pergunta: 'Qualidade de vida', peso: 4 },
  { id: '5.7', pilar: 'Bem-estar Social', pergunta: 'Percepção da comunidade', peso: 4 },
  { id: '5.8', pilar: 'Bem-estar Social', pergunta: 'Participação cidadã', peso: 4 },
  { id: '5.9', pilar: 'Bem-estar Social', pergunta: 'Redução desigualdades', peso: 4 },
  { id: '5.10', pilar: 'Bem-estar Social', pergunta: 'Retenção de renda local', peso: 4 },
  { id: '6.1', pilar: 'Negócios & Comunicação', pergunta: 'Práticas sustentáveis', peso: 5 },
  { id: '6.2', pilar: 'Negócios & Comunicação', pergunta: 'Empresas certificadas', peso: 5 },
  { id: '6.3', pilar: 'Negócios & Comunicação', pergunta: 'Capacitação empresarial', peso: 5 },
  { id: '6.4', pilar: 'Negócios & Comunicação', pergunta: 'Compras locais', peso: 4 },
  { id: '6.5', pilar: 'Negócios & Comunicação', pergunta: 'Comunicação da sustentabilidade', peso: 4 },
  { id: '6.6', pilar: 'Negócios & Comunicação', pergunta: 'Satisfação dos clientes', peso: 4 },
  { id: '6.7', pilar: 'Negócios & Comunicação', pergunta: 'Turismo responsável', peso: 4 },
  { id: '6.8', pilar: 'Negócios & Comunicação', pergunta: 'Comunicação de resultados', peso: 4 },
  { id: '6.9', pilar: 'Negócios & Comunicação', pergunta: 'Canais de comunicação', peso: 4 },
  { id: '6.10', pilar: 'Negócios & Comunicação', pergunta: 'Inovação sustentável', peso: 4 },
];

// Reaproveita a mesma escala de resposta (0 a 5) do questionário de Empresas
const ESCALA_CIDADE = [
  { valor: 0, label: 'Não existe' },
  { valor: 1, label: 'Existe informalmente' },
  { valor: 2, label: 'Parcial' },
  { valor: 3, label: 'Implementado' },
  { valor: 4, label: 'Implementado e monitorado' },
  { valor: 5, label: 'Referência do setor' },
];

const PILARES_ORDEM_CIDADE = [
  'Gestão do Destino', 'Natureza & Paisagem', 'Meio Ambiente & Clima',
  'Cultura & Tradição', 'Bem-estar Social', 'Negócios & Comunicação',
];

function classificarCidade(percentual) {
  if (percentual <= 20) return 'Inicial';
  if (percentual <= 40) return 'Básico';
  if (percentual <= 60) return 'Em Desenvolvimento';
  if (percentual <= 80) return 'Sustentável';
  if (percentual <= 90) return 'Avançado';
  return 'Destino de Excelência';
}

const PONTUACAO_MAXIMA_CIDADE = QUESTIONS_CIDADE.reduce((sum, q) => sum + q.peso * 5, 0);

module.exports = {
  QUESTIONS_CIDADE, ESCALA_CIDADE, PILARES_ORDEM_CIDADE,
  classificarCidade, PONTUACAO_MAXIMA_CIDADE,
};
