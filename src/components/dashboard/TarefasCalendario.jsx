import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckSquare, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const PRIORIDADE_DOT = {
  Urgente: 'bg-red-500',
  Alta: 'bg-orange-500',
  Média: 'bg-blue-500',
  Baixa: 'bg-slate-400',
};

export default function TarefasCalendario({ tarefas, isAdmin, usuarios, currentUserEmail, isLoading }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [filtroUsuario, setFiltroUsuario] = useState('__me__'); // '__me__' | '__all__' | email

  /* ─── filtro ─── */
  const tarefasFiltradas = useMemo(() => {
    let list = tarefas.filter(t => t.status === 'Pendente' || t.status === 'Em Andamento');
    if (filtroUsuario === '__me__') {
      list = list.filter(t => t.created_by === currentUserEmail || t.responsavel_id === currentUserEmail);
    } else if (filtroUsuario !== '__all__') {
      list = list.filter(t => t.created_by === filtroUsuario || t.responsavel_id === filtroUsuario);
    }
    return list;
  }, [tarefas, filtroUsuario, currentUserEmail]);

  /* ─── dias do calendário ─── */
  const calStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const calEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  /* ─── indexar tarefas por dia ─── */
  const tarefasPorDia = useMemo(() => {
    const map = {};
    tarefasFiltradas.forEach(t => {
      if (!t.data_vencimento) return;
      const key = format(parseISO(t.data_vencimento), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tarefasFiltradas]);

  /* ─── tarefas do dia selecionado ─── */
  const tarefasDoDia = selectedDay
    ? (tarefasPorDia[format(selectedDay, 'yyyy-MM-dd')] || [])
    : [];

  /* ─── sem data ─── */
  const tarefasSemData = tarefasFiltradas.filter(t => !t.data_vencimento);

  const prev = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const next = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-foreground">Calendário de Tarefas</h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtro admin */}
          {isAdmin && (
            <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue placeholder="Filtrar por usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__me__">Minhas tarefas</SelectItem>
                <SelectItem value="__all__">Todos os usuários</SelectItem>
                {usuarios.map(u => (
                  <SelectItem key={u.email} value={u.email}>
                    {u.nickname ? `@${u.nickname}` : (u.full_name || u.email)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Navegação do mês */}
          <div className="flex items-center gap-1">
            <button onClick={prev} className="p-1 rounded hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground w-36 text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button onClick={next} className="p-1 rounded hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Grade do calendário */}
            <div className="grid grid-cols-7 mb-1">
              {weekDays.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {days.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const dayTasks = tarefasPorDia[key] || [];
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      "bg-card min-h-[56px] p-1 flex flex-col items-start transition-colors relative",
                      !isCurrentMonth && "opacity-40",
                      isSelected && "bg-primary/10",
                      !isSelected && "hover:bg-muted/40"
                    )}
                  >
                    <span className={cn(
                      "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full mb-0.5",
                      today ? "bg-primary text-white" : "text-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>

                    {/* Dots para até 3 tarefas */}
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {dayTasks.slice(0, 3).map((t, i) => (
                        <span
                          key={i}
                          className={cn("w-1.5 h-1.5 rounded-full", PRIORIDADE_DOT[t.prioridade] || 'bg-slate-400')}
                          title={t.titulo}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[9px] text-muted-foreground leading-none mt-0.5">+{dayTasks.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legenda de prioridade */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {Object.entries(PRIORIDADE_DOT).map(([p, cls]) => (
                <span key={p} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className={cn("w-2 h-2 rounded-full", cls)} />
                  {p}
                </span>
              ))}
            </div>

            {/* Tarefas do dia selecionado */}
            {selectedDay && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })} — {tarefasDoDia.length === 0 ? 'sem tarefas' : `${tarefasDoDia.length} tarefa(s)`}
                </p>
                {tarefasDoDia.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa neste dia.</p>
                ) : (
                  <div className="space-y-2">
                    {tarefasDoDia.map(t => (
                      <Link key={t.id} to={`/tarefas/${t.id}/editar`} className="flex items-center justify-between bg-muted/30 hover:bg-muted/60 rounded-lg px-3 py-2 transition-colors">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">{t.titulo}</p>
                          <p className="text-xs text-muted-foreground">{t.tipo || '—'}</p>
                        </div>
                        <StatusBadge value={t.prioridade} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tarefas sem data */}
            {tarefasSemData.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Sem data de vencimento ({tarefasSemData.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {tarefasSemData.slice(0, 5).map(t => (
                    <Link key={t.id} to={`/tarefas/${t.id}/editar`} className="flex items-center justify-between bg-muted/30 hover:bg-muted/60 rounded-lg px-3 py-2 transition-colors">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-sm font-medium text-foreground truncate">{t.titulo}</p>
                        <p className="text-xs text-muted-foreground">{t.tipo || '—'}</p>
                      </div>
                      <StatusBadge value={t.prioridade} />
                    </Link>
                  ))}
                  {tarefasSemData.length > 5 && (
                    <Link to="/tarefas" className="block text-xs text-primary hover:underline text-center mt-1">
                      +{tarefasSemData.length - 5} mais → Ver todas
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}