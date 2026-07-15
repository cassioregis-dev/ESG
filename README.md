# Diagnóstico ESG — Autoavaliação de Sustentabilidade

Site completo para autodiagnóstico de sustentabilidade/ESG voltado a empresas de
**Comércio, Serviços e Turismo**, construído a partir do questionário em anexo
(`Questionario_Autodiagnostico_Sustentabilidade.xlsx`).

## O que o site faz

1. **Landing page** explicando o diagnóstico e os 10 pilares avaliados.
2. **Captura de lead** obrigatória antes da autoavaliação: Nome da Empresa, Razão
   Social, CNPJ, Nome do Respondente, e-mail, telefone, cidade, estado e segmento
   (Comércio / Serviços / Turismo).
3. **Questionário** com as 33 perguntas originais, organizadas pelos 10 pilares
   (Governança, Comunidade, Pessoas, Energia, Água, Resíduos, Compras, Natureza,
   Cultura, Poluição), usando a mesma escala de 0 a 5 da planilha.
4. **Resultado**: nota geral (%), classificação (Iniciante → Excelência ESG,
   com os mesmos limites da planilha) e o percentual de cada pilar, com gráfico
   radar.
5. **Painel do Administrador** (protegido por login): estatísticas agregadas de
   todas as empresas que responderam — nota média geral, média por pilar,
   distribuição por segmento e por classificação, tabela completa com busca, e
   exportação em CSV.

O cálculo da nota reproduz exatamente a lógica da planilha original: cada
resposta (0–5) é multiplicada pelo peso da pergunta; a nota final é a soma
obtida dividida pela pontuação máxima possível (675 pontos).

## Requisitos

- Node.js **22.5 ou superior** (o projeto usa o módulo nativo `node:sqlite`,
  incluído no Node — não é necessário instalar nem compilar nenhum banco de
  dados separado).

## Como rodar localmente

```bash
cd diagnostico-esg
npm install
cp .env.example .env
# edite o .env e troque ADMIN_USER, ADMIN_PASSWORD e SESSION_SECRET
npm start
```

Acesse `http://localhost:3000` no navegador. O painel do administrador fica em
`http://localhost:3000/admin/login.html`, com o usuário/senha definidos no `.env`.

O banco de dados (SQLite) é criado automaticamente em `db/diagnostico.db` na
primeira execução — todas as respostas ficam salvas ali.

## Como publicar o site na internet

Qualquer serviço que rode Node.js funciona. Sugestões simples e com plano
gratuito:

- **Render.com**: crie um "Web Service", aponte para este repositório,
  build command `npm install`, start command `npm start`, e configure as
  variáveis de ambiente (ADMIN_USER, ADMIN_PASSWORD, SESSION_SECRET) na aba
  Environment. Ative um "Disk" (armazenamento persistente) apontando para a
  pasta `db/` para que os dados não se percam a cada deploy.
- **Railway.app**: mesmo princípio — importe o projeto, defina as variáveis de
  ambiente, e ative um volume persistente para a pasta `db/`.

Importante: como os dados ficam em um arquivo SQLite local, é necessário que o
serviço escolhido ofereça um disco/volume persistente (a maioria dos free tiers
sem volume apaga o arquivo a cada novo deploy).

## Estrutura do projeto

```
diagnostico-esg/
├── server.js              # servidor Express (rotas da API)
├── data/questions.js       # as 33 perguntas, pesos e lógica de classificação
├── db/init.js              # criação do banco SQLite (leads e submissions)
├── public/                 # frontend (HTML/CSS/JS puro, sem build step)
│   ├── index.html           # landing page
│   ├── lead.html             # formulário de captura de lead
│   ├── assessment.html       # questionário
│   ├── result.html           # página de resultado
│   ├── css/style.css
│   └── admin/
│       ├── login.html
│       └── dashboard.html
├── .env.example
└── package.json
```

## Segurança

- O painel do administrador usa autenticação simples por sessão (usuário/senha
  definidos no `.env`). Troque a senha padrão antes de publicar o site.
- Nunca versione o arquivo `.env` real (já está no `.gitignore`).
- Todos os dados exibidos no painel são tratados contra HTML injection.

## Personalização

- Cores, fontes e identidade visual: `public/css/style.css` (variáveis CSS no
  topo do arquivo).
- Texto da landing page e descrição dos pilares: `public/index.html`.
- Perguntas, pesos e faixas de classificação: `data/questions.js` (se a
  planilha original mudar, basta atualizar este arquivo).
