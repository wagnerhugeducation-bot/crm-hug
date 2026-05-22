import { useMemo, useState, useCallback } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

const LICITACOES_PADRAO = [
  'Pregão Eletrônico', 'Pregão Presencial', 'Concorrência',
  'Tomada de Preços', 'Convite', 'Dispensa', 'Inexigibilidade', 'RDC', 'Leilão'
];

const LS_KEY = 'modalidades_padrao_graus';

const ETAPA_SCORE = {
  'Prospecção': 10, 'Qualificação': 20, 'Proposta': 30, 'Negociação': 40, 'Fechamento': 50
};

const MODALIDADE_GRAU_TO_SCORE = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };

function getSaudeDias(oportunidadeId, ultimaTarefaMap) {
  const ultima = ultimaTarefaMap[oportunidadeId];
  if (!ultima) return { dias: null, pontos: 0, cor: 'vermelho', label: 'Sem interação' };
  const dias = Math.floor((Date.now() - new Date(ultima).getTime()) / (1000 * 60 * 60 * 24));
  if (dias <= 15) return { dias, pontos: 15, cor: 'verde', label: `${dias}d atrás` };
  if (dias <= 30) return { dias, pontos: 8, cor: 'amarelo', label: `${dias}d atrás` };
  return { dias, pontos: 0, cor: 'vermelho', label: `${dias}d atrás` };
}

const COR_MAP = {
  verde: '#22c55e',
  amarelo: '#eab308',
  vermelho: '#ef4444',
};

const COR_GLOW = {
  verde: 'rgba(34,197,94,0.35)',
  amarelo: 'rgba(234,179,8,0.25)',
  vermelho: 'rgba(239,68,68,0.2)',
};

const QUADRANTE_INFO = [
  { pos: 'topo-direito', emoji: '🔥', nome: 'Prioridade Máxima', desc: 'Grandes e avançadas', x: 80, y: 80 },
  { pos: 'topo-esquerdo', emoji: '⚠️', nome: 'Grande Potencial', desc: 'Frias, mas estratégicas', x: 15, y: 80 },
  { pos: 'baixo-direito', emoji: '⚡', nome: 'Ganhos Rápidos', desc: 'Pequenas, alta chance', x: 80, y: 15 },
  { pos: 'baixo-esquerdo', emoji: '⏳', nome: 'Baixa Prioridade', desc: 'Frias e pouco estratégicas', x: 15, y: 15 },
];

function CustomDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const r = payload.raio;
  const cor = COR_MAP[payload.saude.cor];
  const glow = COR_GLOW[payload.saude.cor];
  const isQuente = payload.saude.cor === 'verde';
  return (
    <g>
      {isQuente && <circle cx={cx} cy={cy} r={r + 6} fill={glow} />}
      <circle
        cx={cx} cy={cy} r={r}
        fill={cor}
        fillOpacity={0.85}
        stroke="#fff"
        strokeWidth={1.5}
        style={{ cursor: 'pointer', filter: isQuente ? `drop-shadow(0 0 6px ${cor})` : 'none', transition: 'r 0.2s' }}
      />
    </g>
  );
}

function CustomTooltip({ active, payload, orgaosMap, getLabel, ultimaTarefaMap, tarefasMap }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const { dias, label: saudeLabel } = d.saude;
  const qtdTarefas = tarefasMap[d.id] || 0;
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl px-4 py-3 text-xs max-w-[260px] z-50 pointer-events-none">
      <p className="font-bold text-sm text-foreground mb-2 leading-tight">{d.nome}</p>
      <div className="space-y-1 text-muted-foreground">
        <p><span className="text-foreground font-medium">Órgão:</span> {orgaosMap[d.orgao_id] || '—'}</p>
        <p><span className="text-foreground font-medium">Valor Est.:</span> R$ {d.valor_estimado ? Number(d.valor_estimado).toLocaleString('pt-BR') : '—'}</p>
        <p><span className="text-foreground font-medium">Responsável:</span> {getLabel(d.responsavel_id)}</p>
        <p><span className="text-foreground font-medium">Etapa:</span> {d.etapa_pipeline}</p>
        <p><span className="text-foreground font-medium">BANT:</span> {d.bant ?? '—'}/40</p>
        <p><span className="text-foreground font-medium">Modalidade:</span> {d.tipo_licitacao || '—'}</p>
        <p><span className="text-foreground font-medium">Última interação:</span> {saudeLabel}</p>
        <p><span className="text-foreground font-medium">Tarefas:</span> {qtdTarefas}</p>
        <p>
          <span className="text-foreground font-medium">Saúde:</span>{' '}
          <span style={{ color: COR_MAP[d.saude.cor] }} className="font-semibold capitalize">{d.saude.cor === 'verde' ? '🟢 Ativa' : d.saude.cor === 'amarelo' ? '🟡 Atenção' : '🔴 Inativa'}</span>
        </p>
      </div>
    </div>
  );
}

export default function MatrizPrioridade({ oportunidades, bantScores, tarefas, orgaos, usuarios, getLabel, isLoading }) {
  const [filtroResponsavel, setFiltroResponsavel] = useState('all');
  const [filtroEtapa, setFiltroEtapa] = useState('all');
  const [filtroModalidade, setFiltroModalidade] = useState('all');
  const [filtroSaude, setFiltroSaude] = useState('all');
  const [filtroValorMin, setFiltroValorMin] = useState('');
  const [activePoint, setActivePoint] = useState(null);

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

  // Última tarefa concluída por oportunidade
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

  // Quantidade de tarefas por oportunidade
  const tarefasMap = useMemo(() => {
    const m = {};
    (tarefas || []).forEach(t => {
      if (!t.oportunidade_id) return;
      m[t.oportunidade_id] = (m[t.oportunidade_id] || 0) + 1;
    });
    return m;
  }, [tarefas]);

  // Valor max para normalização
  const maxValor = useMemo(() => {
    return Math.max(...(oportunidades || []).map(o => o.valor_estimado || 0), 1);
  }, [oportunidades]);

  const getModalidadeScore = useCallback((tipo) => {
    const grau = grausPadrao[tipo];
    if (grau) return MODALIDADE_GRAU_TO_SCORE[grau] || 60;
    return 60; // padrão médio
  }, [grausPadrao]);

  const pontos = useMemo(() => {
    return (oportunidades || []).map(op => {
      const bant = bantMap[op.id] || 0;
      const etapaScore = ETAPA_SCORE[op.etapa_pipeline] || 10;
      const saude = getSaudeDias(op.id, ultimaTarefaMap);
      const maturidade = etapaScore + bant + saude.pontos; // max: 50+40+15 = 105

      const valorNorm = ((op.valor_estimado || 0) / maxValor) * 100;
      const modScore = getModalidadeScore(op.tipo_licitacao);
      const potencial = (valorNorm * 0.7) + (modScore * 0.3);

      // x = maturidade (0–105), y = potencial (0–100)
      const xNorm = Math.min((maturidade / 105) * 100, 100);
      const yNorm = Math.min(potencial, 100);

      // Raio da bolha
      const raio = op.valor_estimado
        ? Math.max(6, Math.min(22, 6 + (op.valor_estimado / maxValor) * 16))
        : 7;

      return {
        id: op.id,
        nome: op.nome,
        orgao_id: op.orgao_id,
        valor_estimado: op.valor_estimado,
        responsavel_id: op.responsavel_id,
        etapa_pipeline: op.etapa_pipeline,
        tipo_licitacao: op.tipo_licitacao,
        bant,
        saude,
        x: Math.round(xNorm * 10) / 10,
        y: Math.round(yNorm * 10) / 10,
        raio,
      };
    });
  }, [oportunidades, bantMap, ultimaTarefaMap, maxValor, getModalidadeScore]);

  const pontosFiltrados = useMemo(() => {
    return pontos.filter(p => {
      if (filtroResponsavel !== 'all' && p.responsavel_id !== filtroResponsavel) return false;
      if (filtroEtapa !== 'all' && p.etapa_pipeline !== filtroEtapa) return false;
      if (filtroModalidade !== 'all' && p.tipo_licitacao !== filtroModalidade) return false;
      if (filtroSaude !== 'all' && p.saude.cor !== filtroSaude) return false;
      if (filtroValorMin && (p.valor_estimado || 0) < Number(filtroValorMin)) return false;
      return true;
    });
  }, [pontos, filtroResponsavel, filtroEtapa, filtroModalidade, filtroSaude, filtroValorMin]);

  const modalidades = useMemo(() => {
    const set = new Set((oportunidades || []).map(o => o.tipo_licitacao).filter(Boolean));
    return [...set];
  }, [oportunidades]);

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

      {/* Legenda de quadrantes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 pt-3">
        {QUADRANTE_INFO.map(q => (
          <div key={q.pos} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">
            <span className="text-base leading-none">{q.emoji}</span>
            <div>
              <p className="font-semibold text-foreground leading-tight text-[11px]">{q.nome}</p>
              <p className="text-[10px] leading-tight">{q.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Legenda de saúde */}
      <div className="flex gap-4 px-5 pt-2 pb-1">
        {[['verde', '🟢', 'Ativa (≤15d)'], ['amarelo', '🟡', 'Atenção (16-30d)'], ['vermelho', '🔴', 'Inativa (>30d)']].map(([cor, emoji, label]) => (
          <div key={cor} className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COR_MAP[cor] }} />
            <span>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-2">
          <span className="text-xs">⚫→⚫</span>
          <span>Tamanho = Valor Est.</span>
        </div>
      </div>

      {/* Gráfico */}
      <div className="relative px-2 pb-4">
        {pontosFiltrados.length === 0 ? (
          <div className="h-[360px] flex items-center justify-center text-sm text-muted-foreground">
            Nenhuma oportunidade encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="relative">
            {/* Labels dos quadrantes no fundo */}
            <div className="absolute inset-0 pointer-events-none" style={{ left: 58, right: 16, top: 8, bottom: 40 }}>
              <div className="absolute top-1 right-2 text-[10px] font-semibold text-orange-500/60">🔥 Prioridade Máxima</div>
              <div className="absolute top-1 left-2 text-[10px] font-semibold text-yellow-500/60">⚠️ Grande Potencial</div>
              <div className="absolute bottom-8 right-2 text-[10px] font-semibold text-blue-500/60">⚡ Ganhos Rápidos</div>
              <div className="absolute bottom-8 left-2 text-[10px] font-semibold text-muted-foreground/50">⏳ Baixa Prioridade</div>
            </div>

            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 16, right: 24, bottom: 40, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  label={{ value: 'Maturidade Comercial →', position: 'insideBottom', offset: -28, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  label={{ value: 'Potencial Estratégico →', angle: -90, position: 'insideLeft', offset: 16, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                {/* Linhas divisoras de quadrante */}
                <ReferenceLine x={50} stroke="hsl(var(--border))" strokeDasharray="6 3" strokeWidth={1.5} />
                <ReferenceLine y={50} stroke="hsl(var(--border))" strokeDasharray="6 3" strokeWidth={1.5} />
                <Scatter
                  data={pontosFiltrados}
                  shape={<CustomDot />}
                  isAnimationActive={true}
                >
                  {pontosFiltrados.map((p) => (
                    <Cell key={p.id} fill={COR_MAP[p.saude.cor]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            {/* Tooltip customizado via hover manual */}
            {activePoint && (
              <div className="absolute z-50 pointer-events-none" style={{ top: 24, right: 32 }}>
                <CustomTooltip
                  active={true}
                  payload={[{ payload: activePoint }]}
                  orgaosMap={orgaosMap}
                  getLabel={getLabel}
                  ultimaTarefaMap={ultimaTarefaMap}
                  tarefasMap={tarefasMap}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista resumo das top oportunidades quentes */}
      {pontosFiltrados.filter(p => p.saude.cor === 'verde' && p.x >= 50).length > 0 && (
        <div className="border-t border-border px-5 py-3">
          <p className="text-xs font-semibold text-foreground mb-2">🔥 Destaques — Prioridade Máxima</p>
          <div className="flex flex-wrap gap-2">
            {pontosFiltrados
              .filter(p => p.saude.cor === 'verde' && p.x >= 50)
              .sort((a, b) => (b.x + b.y) - (a.x + a.y))
              .slice(0, 5)
              .map(p => (
                <Link
                  key={p.id}
                  to={`/oportunidades/${p.id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-xs text-green-700 hover:bg-green-100 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {p.nome.length > 28 ? p.nome.slice(0, 28) + '…' : p.nome}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}