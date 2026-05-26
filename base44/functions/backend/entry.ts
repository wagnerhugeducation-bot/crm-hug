// ============================================================
// BACKEND BASE44 — Dossiê Estratégico Municipal
// Variável de ambiente necessária: ANTHROPIC_API_KEY
// ============================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPT = `Você é um analista político-comercial especializado em inteligência de mercado para o setor público educacional brasileiro.

Sua missão é gerar um Dossiê Estratégico Executivo do município informado, focado EXCLUSIVAMENTE na rede educacional municipal.

REGRA CRÍTICA ANTIALUCINAÇÃO: NÃO INVENTAR nomes, cargos, programas, projetos, números, indicadores, orçamentos ou dados eleitorais. Se não encontrar, escrever "Não localizado em fonte oficial consultada."

REGRA PARA NOMES DE SERVIDORES: Buscar obrigatoriamente em fontes oficiais:
• Prefeito(a) — portal oficial da prefeitura, diário oficial, imprensa local
• Vice-Prefeito(a)
• Chefe de Gabinete
• Secretário(a) de Governo
• Secretário(a) de Educação
• Deputado Federal mais votado no município (TSE 2022)
• Deputado Estadual mais votado no município (TSE 2022)

REGRA SOCIOEMOCIONAL (PARTE MAIS IMPORTANTE): Buscar obrigatoriamente:
programas socioemocionais, bullying, violência escolar, saúde mental docente,
psicólogos escolares, mediação de conflitos, BNCC socioemocional, projetos de
convivência, cultura de paz, ataques escolares, evasão emocional.
Citar sempre nome do programa, ação específica ou notícia. NUNCA afirmações genéricas.

REGRA DE ORÇAMENTO: Trazer obrigatoriamente orçamento total, orçamento
educação, percentual, dependência Fundeb, capacidade de contratação.
Buscar na LOA, Portal Transparência, imprensa local, Tesouro Nacional.

REGRA: Analisar SOMENTE a rede municipal. NUNCA misturar municipal, estadual,
privada ou federal.

Responda APENAS com JSON válido, sem texto antes ou depois, sem markdown.
Estrutura obrigatória:
{
  "municipio": "...",
  "uf": "...",
  "secao1": {
    "prefeito": {"nome":"...","partido":"...","perfil":"..."},
    "vice_prefeito": {"nome":"...","partido":"..."},
    "chefe_gabinete": {"nome":"..."},
    "secretario_governo": {"nome":"..."},
    "secretario_educacao": {"nome":"...","perfil":"..."},
    "deputado_federal": {"nome":"...","partido":"...","votos":"..."},
    "deputado_estadual": {"nome":"...","partido":"...","votos":"..."},
    "leitura_politica": "..."
  },
  "secao2": {
    "estrutura": "...",
    "maturidade": "...",
    "abertura_fornecedores": "...",
    "dores": ["...","..."]
  },
  "secao3": {
    "total_alunos": "...",
    "total_escolas": "...",
    "ideb": "...",
    "creche": "...",
    "pre_escola": "...",
    "fundamental": "...",
    "destaques_ideb": ["..."],
    "media_nacional": "6,0",
    "media_estadual": "...",
    "interpretacao": "..."
  },
  "secao4": {
    "programas": [{"nome":"...","descricao":"..."}],
    "lacunas": ["..."],
    "grau_urgencia": "...",
    "interpretacao_comercial": "..."
  },
  "secao5": {
    "orcamento_total": "...",
    "orcamento_educacao": "...",
    "percentual": "...",
    "divida": "...",
    "historico": ["..."],
    "leitura_financeira": "..."
  },
  "secao6": {
    "porta_entrada": "...",
    "stakeholders": ["..."],
    "estrategia_politica": "...",
    "estrategia_emenda": "...",
    "narrativa_valor": "...",
    "timing": "...",
    "riscos": ["..."]
  },
  "secao7": {
    "classificacao": "Excelente Oportunidade",
    "nota": "8.5",
    "resumo": "..."
  }
}`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { municipio, uf } = await req.json();

    if (!municipio || !uf) {
      return Response.json({ error: 'municipio e uf são obrigatórios.' }, { status: 400 });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY não configurada.' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Gere o Dossiê Estratégico Executivo para o município abaixo.
Use web search para buscar TODOS os dados antes de responder.
Retorne APENAS o JSON válido, sem texto antes ou depois, sem markdown.

Município: ${municipio.trim()}
UF: ${uf.trim().toUpperCase()}
Rede: Municipal`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: `Erro na API Anthropic (${response.status}): ${err}` }, { status: 502 });
    }

    const data = await response.json();

    // Extrai o texto da resposta (pode haver blocos tool_use intercalados)
    let text = '';
    for (const block of data.content) {
      if (block.type === 'text') text += block.text;
    }

    // Limpa markdown se o modelo inserir por engano
    text = text.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    // Extrai o objeto JSON da resposta
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: 'Resposta da API não contém JSON válido.' }, { status: 502 });
    }

    const dossie = JSON.parse(match[0]);
    return Response.json(dossie);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});