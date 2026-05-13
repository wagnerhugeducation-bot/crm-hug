import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Users, Target, CheckSquare, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [stats, setStats] = useState({ orgaos: 0, contatos: 0, oportunidades: 0, tarefas: 0 });
  const [recentOps, setRecentOps] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [orgaos, contatos, oportunidades, tarefas] = await Promise.all([
        base44.entities.OrgaoPublico.list(),
        base44.entities.Contato.list(),
        base44.entities.Oportunidade.list(),
        base44.entities.Tarefa.list(),
      ]);
      setStats({
        orgaos: orgaos.length,
        contatos: contatos.length,
        oportunidades: oportunidades.length,
        tarefas: tarefas.filter(t => t.status === 'Pendente').length,
      });
      setRecentOps(oportunidades.slice(0, 5));
      setPendingTasks(tarefas.filter(t => t.status === 'Pendente').slice(0, 5));
      setIsLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do CRM"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Órgãos Públicos"
          value={isLoading ? '...' : stats.orgaos}
          icon={Building2}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          title="Contatos"
          value={isLoading ? '...' : stats.contatos}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Oportunidades"
          value={isLoading ? '...' : stats.oportunidades}
          icon={Target}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Tarefas Pendentes"
          value={isLoading ? '...' : stats.tarefas}
          icon={CheckSquare}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Opportunities */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Oportunidades Recentes</h2>
            </div>
            <Link to="/oportunidades" className="text-xs text-primary hover:underline font-medium">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex gap-3">
                  <div className="h-4 bg-muted animate-pulse rounded flex-1" />
                </div>
              ))
            ) : recentOps.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhuma oportunidade cadastrada
              </div>
            ) : (
              recentOps.map(op => (
                <Link key={op.id} to={`/oportunidades/${op.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-foreground truncate">{op.nome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{op.etapa_pipeline || '—'}</p>
                  </div>
                  <StatusBadge value={op.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-foreground">Tarefas Pendentes</h2>
            </div>
            <Link to="/tarefas" className="text-xs text-primary hover:underline font-medium">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex gap-3">
                  <div className="h-4 bg-muted animate-pulse rounded flex-1" />
                </div>
              ))
            ) : pendingTasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhuma tarefa pendente
              </div>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-foreground truncate">{task.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.tipo || '—'}</p>
                  </div>
                  <StatusBadge value={task.prioridade} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}