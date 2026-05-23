import { useMemo, useState, useCallback } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, Filter, X, ExternalLink, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link } from 'react-router-dom';

const LS_KEY = 'modalidades_padrao_graus';

const ETAPA_SCORE = {
  'Prospecção': 10, 'Qualificação': 20, 'Proposta': 30, 'Negociação': 40, 'Fechamento': 50
};

const MODALIDADE_GRAU_TO_SCORE = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };

function getSaude(oportunidadeId, ultimaTarefaMap) {
  const ultima = ultimaTarefaMap[oportunidadeId];
  if (!ultima) return { dias: null, pontos: 0, cor: 'vermelho', label: 'Sem interação' };
  const dias = Math.floor((Date.now() - new Date(ultima).getTime()) / (1000 * 60 * 60 * 24));
  if (dias <= 15) return { dias, pontos: 15, cor: 'verde', label: `${dias}d atrás` };
  if (dias <= 30) return { dias, pontos: 8, cor: 'amarelo', label: `${dias}d atrás` };
  return { dias, pontos: 0, cor: 'vermelho', label: `${dias}d atrás` };
}

const COR_MAP = { verde: '#22c55e', amarelo: '#eab308', vermelho: '#ef4444' };
const COR_GLOW = { verde: 'rgba(34,197,94,0.35)', amarelo: 'rgba(234,179,8,0.25)', vermelho: 'rgba(239,68,68,0.2)' };

function CustomDot(props) {
  const { cx, cy, payload, onClick } = props;
  if (cx == null || cy == null) return null;
  const r = payload.raio;
  const cor = COR_MAP[payload.saude.cor];
  const glow = COR_GLOW[payload.saude.cor];
  const isQuente = payload.saude.cor === 'verde';
  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onClick && onClick(payload)}>
      {isQuente && <circle cx={cx} cy={cy} r={r + 7} fill={glow} />}
      <circle
        cx={cx} cy={cy} r={r}
        fill={cor}
        fillOpacity={0.85}
        stroke="#fff"
        strokeWidth={1.5}
        style={{ filter: isQuente ? `drop-shadow(0 0 6px ${cor})` : 'none' }}
      />
    </g>
  );
}

function PainelDetalhe({ ponto, orgaosMap, getLabel, tarefasDetalheMap, onClose }) {
  if (!ponto) return null;
  const { saude, bant, etapa_pipeline, tipo_licitacao, valor_estimado, orgao_id, responsavel_id, nome, id } = ponto;
  const tarefas = tarefasDetalheMap[id] || { agendadas: 0, concluidas: 0, total: 0 };
  const saudeLabel = saude.cor === 'verde' ? '🟢 Ativa' : saude.cor === 'amarelo' ? '🟡 Atenção' : '🔴 Inativa';

  const Row = ({ label, value }) => (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs text-foreground font-medium text-right">{value || '—'}</span>
    </div>
  );

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">{nome}</p>
          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: COR_MAP[saude.cor] + '22', color: COR_MAP[saude.cor] }}>
            {saudeLabel}
          </span>
        </div>
        <button onClick={onClose} className="shrink-0 mt-0.5 p-0.5 rounded hover:bg-muted transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Dados */}
      <div className="flex-1 overflow-y-auto px-4 py-1">
        <Row label="Órgão" value={orgaosMap[orgao_id]} />
        <Row label="Valor Estimado" value={valor_estimado ? `R$ ${Number(valor_estimado).toLocaleString('pt-BR')}` : null} />
        <Row label="Etapa" value={etapa_pipeline} />
        <Row label="BANT" value={`${bant}/40`} />
        <Row label="Modalidade" value={tipo_licitacao} />
        <Row label="Última interação" value={saude.label} />
        <Row label="Dias sem interação" value={saude.dias != null ? `${saude.dias} dias` : 'Sem interações'} />

        {/* Tarefas */}
        <div className="py-2 border-b border-border">
          <p className="text-xs text-muted-foreground mb-1.5">Tarefas</p>
          <div className="space-y-1 pl-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-xs font-semibold text-foreground">{tarefas.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Agendadas
              </span>
              <span className="text-xs font-semibold text-blue-600">{tarefas.agendadas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Concluídas
              </span>
              <span className="text-xs font-semibold text-green-600">{tarefas.concluidas}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-4 py-3 border-t border-border">
        <Link
          to={`/oportunidades/${id}`}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> Ver oportunidade
        </Link>
      </div>
    </div>
  );
}

export default function MatrizPrioridade({ oportunidades, bantScores, tarefas, orgaos, usuarios, getLabel, isLoading }) {
  const [filtroResponsavel, setFiltroResponsavel] = useState('all');
  const [filtroEtapa, setFiltroEtapa] = useState('all');
  const [filtroModalidade, setFiltroModalidade] = useState('all');
  const [filtroSaude, setFiltroSaude] = useState('all');
  const [pontoSelecionado, setPontoSelecionado] = useState(null);

  const grausPadrao = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
  }, []);

  const orgaosMap = useMemo(() => {
    const m = {};
    (orgaos || []).forEach(o => { m[o.id] = o.nome; });
    return m;
  }, [orgaos]);

  const bantMap = useMemo(() => {
    const m = {};
    (bantScores || []).forEach(b => { m[b.oportunidade_id] = b.total_score || 0; });
    return m;
  }, [bantScores]);

  const ultimaTarefaMap = useMemo(() => {
    const m = {};
    (tarefas || []).forEach(t => {
      if (!t.oportunidade_id) return;
      const dt = t.concluida_em || (t.status === 'Concluída' ? t.updated_date : null);
      if (!dt) return;
      if (!m[t.oportunidade_id] || new Date(dt) > new Date(m[t.oportunidade_id])) {
        m[t.oportunidade_id] = dt;
      }
    });
    return m;
  }, [tarefas]);

  // Tarefas agendadas e concluídas por oportunidade
  const tarefasDetalheMap = useMemo(() => {
    const m = {};
    (tarefas || []).forEach(t => {
      if (!t.oportunidade_id) return;
      if (!m[t.oportunidade_id]) m[t.oportunidade_id] = { agendadas: 0, concluidas: 0, total: 0 };
      m[t.oportunidade_id].total += 1;
      if (t.status === 'Concluída') m[t.oportunidade_id].concluidas += 1;
      else if (t.status === 'Pendente' || t.status === 'Em Andamento') m[t.oportunidade_id].agendadas += 1;
    });
    return m;
  }, [tarefas]);

  const maxValor = useMemo(() => Math.max(...(oportunidades || []).map(o => o.valor_estimado || 0), 1), [oportunidades]);

  const getModalidadeScore = useCallback((tipo) => {
    const grau = grausPadrao[tipo];
    return grau ? (MODALIDADE_GRAU_TO_SCORE[grau] || 60) : 60;
  }, [grausPadrao]);

  const pontos = useMemo(() => {
    return (oportunidades || []).map(op => {
      const bant = bantMap[op.id] || 0;
      const etapaScore = ETAPA_SCORE[op.etapa_pipeline] || 10;
      const saude = getSaude(op.id, ultimaTarefaMap);
      const maturidade = etapaScore + bant + saude.pontos;
      const valorNorm = ((op.valor_estimado || 0) / maxValor) * 100;
      const modScore = getModalidadeScore(op.tipo_licitacao);
      const potencial = (valorNorm * 0.7) + (modScore * 0.3);
      const xNorm = Math.min((maturidade / 105) * 100, 100);
      const yNorm = Math.min(potencial, 100);
      const raio = op.valor_estimado ? Math.max(6, Math.min(22, 6 + (op.valor_estimado / maxValor) * 16)) : 7;
      return {
        id: op.id, nome: op.nome, orgao_id: op.orgao_id, valor_estimado: op.valor_estimado,
        responsavel_id: op.responsavel_id, etapa_pipeline: op.etapa_pipeline, tipo_licitacao: op.tipo_licitacao,
        bant, saude, x: Math.round(xNorm * 10) / 10, y: Math.round(yNorm * 10) / 10, raio,
      };
    });
  }, [oportunidades, bantMap, ultimaTarefaMap, maxValor, getModalidadeScore]);

  const pontosFiltrados = useMemo(() => pontos.filter(p => {
    if (filtroResponsavel !== 'all' && p.responsavel_id !== filtroResponsavel) return false;
    if (filtroEtapa !== 'all' && p.etapa_pipeline !== filtroEtapa) return false;
    if (filtroModalidade !== 'all' && p.tipo_licitacao !== filtroModalidade) return false;
    if (filtroSaude !== 'all' && p.saude.cor !== filtroSaude) return false;
    return true;
  }), [pontos, filtroResponsavel, filtroEtapa, filtroModalidade, filtroSaude]);

  const resumoQuadrantes = useMemo(() => {
    const quadrantes = {
      prioridade_maxima: { label: '🔥 Prioridade Máxima', count: 0, valor: 0, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
      grande_potencial: { label: '⚠️ Grande Potencial', count: 0, valor: 0, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
      ganhos_rapidos: { label: '⚡ Ganhos Rápidos', count: 0, valor: 0, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
      baixa_prioridade: { label: '⏳ Baixa Prioridade', count: 0, valor: 0, color: 'text-muted-foreground', bg: 'bg-muted/40 border-border' },
    };
    pontosFiltrados.forEach(p => {
      const altaMaturidade = p.x >= 50;
      const altoPotencial = p.y >= 50;
      const key = altaMaturidade && altoPotencial ? 'prioridade_maxima'
        : !altaMaturidade && altoPotencial ? 'grande_potencial'
        : altaMaturidade && !altoPotencial ? 'ganhos_rapidos'
        : 'baixa_prioridade';
      quadrantes[key].count += 1;
      quadrantes[key].valor += p.valor_estimado || 0;
    });
    const totalValor = Object.values(quadrantes).reduce((s, q) => s + q.valor, 0);
    return { quadrantes, totalValor };
  }, [pontosFiltrados]);

  const modalidades = useMemo(() => {
    const set = new Set((oportunidades || []).map(o => o.tipo_licitacao).filter(Boolean));
    return [...set];
  }, [oportunidades]);

  const handleDotClick = useCallback((payload) => {
    setPontoSelecionado(prev => prev?.id === payload.id ? null : payload);
  }, []);

  const ShapeWithClick = useCallback((props) => <CustomDot {...props} onClick={handleDotClick} />, [handleDotClick]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Matriz de Prioridade Comercial</h2>
        </div>
        <div className="h-[420px] bg-muted animate-pulse rounded-b-xl" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Matriz de Prioridade Comercial</h2>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{pontosFiltrados.length} oport.</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-0.5 rounded-full hover:bg-muted transition-colors" title="Como funciona?">
                <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" className="w-80 text-xs p-4 space-y-3">
              <p className="font-bold text-sm text-foreground">Como a Matriz funciona?</p>
              <p className="text-muted-foreground">Cada bolha representa uma oportunidade posicionada em dois eixos:</p>

              <div className="space-y-2">
                <div className="rounded-lg bg-muted/60 px-3 py-2">
                  <p className="font-semibold text-foreground mb-1">→ Eixo X — Maturidade Comercial</p>
                  <p className="text-muted-foreground leading-snug">Soma de três fatores:<br />
                    <span className="text-foreground">• Etapa do pipeline</span> (Prospecção=10 … Fechamento=50)<br />
                    <span className="text-foreground">• Score BANT</span> (0–40 pontos)<br />
                    <span className="text-foreground">• Saúde de interações</span>: ≤15d=+15 / 16–30d=+8 / +30d=0
                  </p>
                </div>
                <div className="rounded-lg bg-muted/60 px-3 py-2">
                  <p className="font-semibold text-foreground mb-1">↑ Eixo Y — Potencial Estratégico</p>
                  <p className="text-muted-foreground leading-snug">
                    <span className="text-foreground">70%</span> do valor estimado (normalizado)<br />
                    <span className="text-foreground">30%</span> do grau de facilidade da modalidade de licitação
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold text-foreground">Quadrantes:</p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div className="bg-orange-50 border border-orange-200 rounded px-2 py-1.5">
                    <p className="font-semibold text-orange-700">🔥 Prioridade Máxima</p>
                    <p className="text-orange-600">Alta maturidade + alto potencial</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5">
                    <p className="font-semibold text-yellow-700">⚠️ Grande Potencial</p>
                    <p className="text-yellow-600">Baixa maturidade + alto potencial</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5">
                    <p className="font-semibold text-blue-700">⚡ Ganhos Rápidos</p>
                    <p className="text-blue-600">Alta maturidade + baixo potencial</p>
                  </div>
                  <div className="bg-muted border border-border rounded px-2 py-1.5">
                    <p className="font-semibold text-muted-foreground">⏳ Baixa Prioridade</p>
                    <p className="text-muted-foreground">Baixa maturidade + baixo potencial</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">Cor da bolha — Saúde:</p>
                <div className="flex gap-3 text-[11px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>≤ 15 dias</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"/>16–30 dias</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>&gt; 30 dias</span>
                </div>
                <p className="text-muted-foreground text-[11px]">Tamanho da bolha = valor estimado da oportunidade.</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
            <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="Responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Responsáveis</SelectItem>
              {(usuarios || []).map(u => (
                <SelectItem key={u.email} value={u.email}>{getLabel(u.email)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
            <SelectTrigger className="h-7 text-xs w-32"><SelectValue placeholder="Etapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Etapas</SelectItem>
              {['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'].map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroModalidade} onValueChange={setFiltroModalidade}>
            <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="Modalidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Modalidades</SelectItem>
              {modalidades.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroSaude} onValueChange={setFiltroSaude}>
            <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Saúde" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda Saúde</SelectItem>
              <SelectItem value="verde">🟢 Ativa</SelectItem>
              <SelectItem value="amarelo">🟡 Atenção</SelectItem>
              <SelectItem value="vermelho">🔴 Inativa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Corpo: gráfico + painel lateral */}
      <div className="flex">
        {/* Gráfico */}
        <div className="flex-1 min-w-0 relative px-2 pb-4 pt-2">
          {pontosFiltrados.length === 0 ? (
            <div className="h-[380px] flex items-center justify-center text-sm text-muted-foreground">
              Nenhuma oportunidade encontrada com os filtros selecionados.
            </div>
          ) : (
            <div className="relative">
              {/* Labels dos quadrantes */}
              <div className="absolute inset-0 pointer-events-none" style={{ left: 58, right: 16, top: 8, bottom: 40 }}>
                <div className="absolute top-1 right-2 text-[10px] font-semibold text-orange-500/70">🔥 Prioridade Máxima</div>
                <div className="absolute top-1 left-2 text-[10px] font-semibold text-yellow-600/70">⚠️ Grande Potencial</div>
                <div className="absolute bottom-8 right-2 text-[10px] font-semibold text-blue-500/70">⚡ Ganhos Rápidos</div>
                <div className="absolute bottom-8 left-2 text-[10px] font-semibold text-muted-foreground/50">⏳ Baixa Prioridade</div>
              </div>
              <ResponsiveContainer width="100%" height={380}>
                <ScatterChart margin={{ top: 16, right: 24, bottom: 40, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    type="number" dataKey="x" domain={[0, 100]}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false}
                    label={{ value: 'Maturidade Comercial →', position: 'insideBottom', offset: -28, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    type="number" dataKey="y" domain={[0, 100]}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false}
                    label={{ value: 'Potencial Estratégico →', angle: -90, position: 'insideLeft', offset: 16, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ReferenceLine x={50} stroke="hsl(var(--border))" strokeDasharray="6 3" strokeWidth={1.5} />
                  <ReferenceLine y={50} stroke="hsl(var(--border))" strokeDasharray="6 3" strokeWidth={1.5} />
                  <Scatter data={pontosFiltrados} shape={ShapeWithClick} isAnimationActive={true}>
                    {pontosFiltrados.map((p) => (
                      <Cell key={p.id} fill={COR_MAP[p.saude.cor]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Painel de detalhe ao clicar */}
        {pontoSelecionado && (
          <PainelDetalhe
            ponto={pontoSelecionado}
            orgaosMap={orgaosMap}
            getLabel={getLabel}
            tarefasDetalheMap={tarefasDetalheMap}
            onClose={() => setPontoSelecionado(null)}
          />
        )}
      </div>

      {/* Legenda dos Quadrantes */}
      <div className="border-t border-border px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.values(resumoQuadrantes.quadrantes).map((q) => {
            const pct = resumoQuadrantes.totalValor > 0
              ? Math.round((q.valor / resumoQuadrantes.totalValor) * 100)
              : 0;
            return (
              <div key={q.label} className={`rounded-lg border px-4 py-3 ${q.bg}`}>
                <p className={`text-xs font-semibold mb-2 ${q.color}`}>{q.label}</p>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Oportunidades</p>
                    <p className={`text-lg font-bold leading-tight ${q.color}`}>{q.count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">Valor total</p>
                    <p className="text-xs font-semibold text-foreground">
                      {q.valor > 0 ? `R$ ${Number(q.valor).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '—'}
                    </p>
                    <p className={`text-xs font-bold ${q.color}`}>{pct > 0 ? `${pct}%` : '—'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}