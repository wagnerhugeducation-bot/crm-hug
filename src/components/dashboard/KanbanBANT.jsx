import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Thermometer } from 'lucide-react';

const COLUNAS = [
  {
    key: 'Frio',
    label: 'Frio',
    emoji: '🧊',
    headerClass: 'bg-slate-100 text-slate-600 border-slate-200',
    cardBorder: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  {
    key: 'Morno',
    label: 'Morno',
    emoji: '🌤️',
    headerClass: 'bg-amber-50 text-amber-700 border-amber-200',
    cardBorder: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  {
    key: 'Quente',
    label: 'Quente',
    emoji: '🔥',
    headerClass: 'bg-orange-50 text-orange-700 border-orange-200',
    cardBorder: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  {
    key: 'Muito Quente',
    label: 'Muito Quente',
    emoji: '🚀',
    headerClass: 'bg-red-50 text-red-700 border-red-200',
    cardBorder: 'border-red-200',
    dot: 'bg-red-500',
  },
];

const fmt = (v) =>
  v != null
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
    : null;

export default function KanbanBANT({ oportunidades = [], bantScores = [], isLoading = false }) {
  // Map oportunidade_id → classificacao
  const bantMap = useMemo(() => {
    const m = {};
    bantScores.forEach((s) => { if (s.oportunidade_id) m[s.oportunidade_id] = s.classificacao; });
    return m;
  }, [bantScores]);

  const colunas = useMemo(() => {
    const map = { Frio: [], Morno: [], Quente: [], 'Muito Quente': [] };
    oportunidades.forEach((op) => {
      const cls = bantMap[op.id];
      if (cls && map[cls] !== undefined) map[cls].push(op);
    });
    return map;
  }, [oportunidades, bantMap]);

  const totalComBANT = Object.values(colunas).reduce((a, c) => a + c.length, 0);

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Kanban BANT — Temperatura das Oportunidades</h2>
        </div>
        <Link to="/oportunidades" className="text-xs text-primary hover:underline font-medium">Ver todas</Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
          {COLUNAS.map((c) => (
            <div key={c.key} className="space-y-2">
              <div className="h-6 bg-muted animate-pulse rounded" />
              {[1, 2].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded" />)}
            </div>
          ))}
        </div>
      ) : totalComBANT === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma oportunidade com score BANT encontrada.
          <br />
          <Link to="/oportunidades" className="text-primary hover:underline text-xs mt-1 inline-block">Avaliar oportunidades →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
          {COLUNAS.map((col) => {
            const items = colunas[col.key];
            return (
              <div key={col.key} className="flex flex-col gap-2">
                {/* Header */}
                <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-semibold ${col.headerClass}`}>
                  <span>{col.emoji} {col.label}</span>
                  <span className="ml-2 bg-white/70 rounded-full px-1.5 py-0.5 text-xs font-bold">{items.length}</span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[60px]">
                  {items.length === 0 ? (
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-border h-12 text-xs text-muted-foreground">
                      Vazio
                    </div>
                  ) : (
                    items.map((op) => (
                      <Link
                        key={op.id}
                        to={`/oportunidades/${op.id}`}
                        className={`block bg-white rounded-lg border ${col.cardBorder} px-3 py-2 hover:shadow-md transition-shadow`}
                      >
                        <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">{op.nome}</p>
                        {op.valor_estimado && (
                          <p className="text-xs text-muted-foreground mt-1">{fmt(op.valor_estimado)}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                          <span className="text-[10px] text-muted-foreground">{op.etapa_pipeline || '—'}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}