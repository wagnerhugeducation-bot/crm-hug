import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, Plus, ArrowRight, DollarSign, FileText, Tag, Edit3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIPO_CONFIG = {
  criacao:      { icon: Plus,       color: 'bg-green-100 text-green-600',  border: 'border-green-200' },
  status:       { icon: Tag,        color: 'bg-blue-100 text-blue-600',    border: 'border-blue-200' },
  etapa:        { icon: ArrowRight, color: 'bg-purple-100 text-purple-600', border: 'border-purple-200' },
  valor:        { icon: DollarSign, color: 'bg-amber-100 text-amber-600',  border: 'border-amber-200' },
  notas:        { icon: FileText,   color: 'bg-gray-100 text-gray-600',    border: 'border-gray-200' },
  edicao_geral: { icon: Edit3,      color: 'bg-orange-100 text-orange-600', border: 'border-orange-200' },
};

function AtividadeItem({ atividade }) {
  const config = TIPO_CONFIG[atividade.tipo] || TIPO_CONFIG.edicao_geral;
  const Icon = config.icon;

  const dataRelativa = atividade.created_date
    ? formatDistanceToNow(new Date(atividade.created_date), { addSuffix: true, locale: ptBR })
    : '';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className={`pb-4 flex-1 min-w-0`}>
        <div className={`bg-card border ${config.border} rounded-lg px-3 py-2`}>
          <p className="text-sm text-foreground">{atividade.descricao}</p>
          {atividade.valor_anterior && atividade.valor_novo && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
              <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded line-through">{atividade.valor_anterior}</span>
              <ArrowRight className="w-3 h-3" />
              <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">{atividade.valor_novo}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{dataRelativa}</span>
            {atividade.usuario_nome && (
              <span className="text-xs text-muted-foreground">· {atividade.usuario_nome}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LinhaDoTempo({ oportunidadeId }) {
  const [atividades, setAtividades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!oportunidadeId) return;
    base44.entities.AtividadeLog.filter({ oportunidade_id: oportunidadeId }, '-created_date', 50)
      .then(res => {
        setAtividades(res);
        setIsLoading(false);
      });
  }, [oportunidadeId]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1 h-14 bg-muted rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (atividades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhuma atividade registrada ainda.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {atividades.map((a, i) => (
        <div key={a.id} className={i === atividades.length - 1 ? '[&_.w-px]:hidden' : ''}>
          <AtividadeItem atividade={a} />
        </div>
      ))}
    </div>
  );
}