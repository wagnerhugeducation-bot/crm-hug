import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Users, Target, CheckSquare } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import TarefasCalendario from '@/components/dashboard/TarefasCalendario';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({ orgaos: 0, contatos: 0, oportunidades: 0, tarefas: 0 });
  const [recentOps, setRecentOps] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [orgaos, contatos, oportunidades, todasTarefas, listaUsuarios] = await Promise.all([
        base44.entities.OrgaoPublico.list(),
        base44.entities.Contato.list(),
        base44.entities.Oportunidade.list(),
        base44.entities.Tarefa.list(),
        isAdmin ? base44.entities.User.list() : Promise.resolve([]),
      ]);
      setStats({
        orgaos: orgaos.length,
        contatos: contatos.length,
        oportunidades: oportunidades.length,
        tarefas: todasTarefas.filter(t => t.status === 'Pendente').length,
      });
      setRecentOps(oportunidades.slice(0, 5));
      setTarefas(todasTarefas);
      setUsuarios(listaUsuarios);
      setIsLoading(false);
    };
    load();
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Visão geral do CRM" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Órgãos Públicos" value={isLoading ? '...' : stats.orgaos} icon={Building2} iconColor="text-primary" iconBg="bg-primary/10" />
        <StatCard title="Contatos" value={isLoading ? '...' : stats.contatos} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Oportunidades" value={isLoading ? '...' : stats.oportunidades} icon={Target} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Tarefas Pendentes" value={isLoading ? '...' : stats.tarefas} icon={CheckSquare} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Oportunidades Recentes */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Oportunidades Recentes</h2>
            </div>
            <Link to="/oportunidades" className="text-xs text-primary hover:underline font-medium">Ver todas</Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></div>
              ))
            ) : recentOps.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma oportunidade cadastrada</div>
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

        {/* Calendário de Tarefas */}
        <TarefasCalendario
          tarefas={tarefas}
          isAdmin={isAdmin}
          usuarios={usuarios}
          currentUserEmail={user?.email}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}