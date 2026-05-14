import { cn } from '@/lib/utils';

const variants = {
  // Relacionamento
  'Prospecto':    'bg-slate-100 text-slate-700 border-slate-200',
  'Em Contato':   'bg-blue-50 text-blue-700 border-blue-200',
  'Ativo':        'bg-green-50 text-green-700 border-green-200',
  'Inativo':      'bg-gray-100 text-gray-500 border-gray-200',
  'VIP':          'bg-purple-50 text-purple-700 border-purple-200',

  // Oportunidade status
  'Aberta':       'bg-blue-50 text-blue-700 border-blue-200',
  'Em Andamento': 'bg-amber-50 text-amber-700 border-amber-200',
  'Ganha':        'bg-green-50 text-green-700 border-green-200',
  'Perdida':      'bg-red-50 text-red-700 border-red-200',
  'Cancelada':    'bg-gray-100 text-gray-500 border-gray-200',

  // Etapa pipeline
  'Prospecção':   'bg-slate-100 text-slate-700 border-slate-200',
  'Qualificação': 'bg-blue-50 text-blue-700 border-blue-200',
  'Proposta':     'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Negociação':   'bg-amber-50 text-amber-700 border-amber-200',
  'Fechamento':   'bg-green-50 text-green-700 border-green-200',

  // Tarefa
  'Pendente':     'bg-amber-50 text-amber-700 border-amber-200',
  'Concluída':    'bg-green-50 text-green-700 border-green-200',

  // Prioridade
  'Baixa':   'bg-slate-100 text-slate-600 border-slate-200',
  'Média':   'bg-blue-50 text-blue-700 border-blue-200',
  'Alta':    'bg-orange-50 text-orange-700 border-orange-200',
  'Urgente': 'bg-red-50 text-red-700 border-red-200',

  // Status de usuário
  'Pendente':     'bg-amber-50 text-amber-700 border-amber-200',
  'Ativo':        'bg-green-50 text-green-700 border-green-200',
  'Bloqueado':    'bg-red-50 text-red-700 border-red-200',

  // BANT
  'Frio':         'bg-slate-100 text-slate-600 border-slate-200',
  'Morno':        'bg-amber-50 text-amber-700 border-amber-200',
  'Quente':       'bg-orange-50 text-orange-700 border-orange-200',
  'Muito Quente': 'bg-red-50 text-red-700 border-red-200',
};

export default function StatusBadge({ value, className }) {
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
      variants[value] || 'bg-muted text-muted-foreground border-border',
      className
    )}>
      {value}
    </span>
  );
}