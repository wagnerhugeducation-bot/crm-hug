import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Users, Target, CheckSquare, Filter } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import TarefasCalendario from '@/components/dashboard/TarefasCalendario';
import KanbanBANT from '@/components/dashboard/KanbanBANT';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Dashboard() {
  const { user, isAdmin: isAdminFn, isGestor: isGestorFn, userProfile } = useAuth();
  const isAdmin = isAdminFn();
  const isGestor = isGestorFn?.() || false;
  const podesFiltrar = isAdmin || isGestor;

  const [allOportunidades, setAllOportunidades] = useState([]);
  const [allOrgaos, setAllOrgaos] = useState([]);
  const [allContatos, setAllContatos] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [bantScores, setBantScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroUsuario, setFiltroUsuario] = useState('__me__');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    const load = async () => {
      // Subordinados para o filtro (admin + gestor via backend function)
      const subordinadosPromise = podesFiltrar
        ? base44.functions.invoke('getSubordinados', {}).then(r => r.data?.subordinados || [])
        : Promise.resolve([]);

      const [orgaos, contatos, oportunidades, todasTarefas, listaSubordinados, scores] = await Promise.all([
        base44.entities.OrgaoPublico.list(),
        base44.entities.Contato.list(),
        base44.entities.Oportunidade.list(),
        base44.entities.Tarefa.list(),
        subordinadosPromise,
        base44.entities.ScoreBANT.list(),
      ]);
      setAllOrgaos(orgaos);
      setAllContatos(contatos);
      setAllOportunidades(oportunidades);
      setTarefas(todasTarefas);
      setUsuarios(listaSubordinados);
      setBantScores(scores);
      setIsLoading(false);
    };
    load();
  }, []);

  /* ── Filtro ── */
  // Para admin/gestor: '__all__' = todos da equipe, '__me__' = próprio, ou email específico
  // Para outros: sempre '__me__'
  const emailFiltro = podesFiltrar ? filtroUsuario : '__me__';

  // Retorna lista de emails do filtro atual
  const emailsAtivos = useMemo(() => {
    if (emailFiltro === '__all__') return usuarios.map(u => u.email);
    const email = emailFiltro === '__me__' ? user?.email : emailFiltro;
    return [email];
  }, [emailFiltro, usuarios, user]);

  const oportunidades = useMemo(() => {
    if (emailFiltro === '__all__') return allOportunidades;
    return allOportunidades.filter(
      (o) => emailsAtivos.includes(o.responsavel_id) ||
             emailsAtivos.includes(o.responsavel_gestor_id) ||
             emailsAtivos.includes(o.created_by)
    );
  }, [allOportunidades, emailFiltro, emailsAtivos]);

  const tarefasFiltradas = useMemo(() => {
    if (emailFiltro === '__all__') return tarefas;
    return tarefas.filter(
      (t) => emailsAtivos.includes(t.responsavel_id) ||
             emailsAtivos.includes(t.responsavel_gestor_id) ||
             emailsAtivos.includes(t.created_by)
    );
  }, [tarefas, emailFiltro, emailsAtivos]);

  const recentOps = useMemo(() => oportunidades.slice(0, 5), [oportunidades]);

  const stats = useMemo(() => ({
    orgaos: new Set(oportunidades.map(o => o.orgao_id).filter(Boolean)).size,
    contatos: new Set(allContatos.filter(c => oportunidades.some(o => o.orgao_id === c.orgao_id)).map(c => c.id)).size,
    oportunidades: oportunidades.length,
    tarefas: tarefasFiltradas.filter(t => t.status === 'Pendente').length,
  }), [oportunidades, tarefasFiltradas, allContatos]);

  const usuarioLabel = (u) => u.nickname ? `@${u.nickname}` : (u.full_name || u.email);

  const subtitleLabel = useMemo(() => {
    if (!podesFiltrar) return `Olá, ${user?.full_name || user?.email}`;
    if (filtroUsuario === '__all__') return isAdmin ? 'Visão consolidada — todos os usuários' : 'Visão consolidada — minha equipe';
    if (filtroUsuario === '__me__') return `Minhas atividades`;
    const u = usuarios.find(u => u.email === filtroUsuario);
    return u ? `Atividades de ${usuarioLabel(u)}` : 'Visão geral do CRM';
  }, [podesFiltrar, filtroUsuario, usuarios, user, isAdmin]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={subtitleLabel}
        actions={
          podesFiltrar && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                <SelectTrigger className="h-8 text-xs w-52">
                  <SelectValue placeholder="Filtrar por usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__me__">Minhas atividades</SelectItem>
                  <SelectItem value="__all__">{isAdmin ? 'Todos os usuários' : 'Toda minha equipe'}</SelectItem>
                  {usuarios.filter(u => u.email !== user?.email).map((u) => (
                    <SelectItem key={u.email} value={u.email}>
                      {usuarioLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={emailFiltro === '__all__' ? 'Órgãos Públicos' : 'Órgãos Relacionados'}
          value={isLoading ? '...' : stats.orgaos}
          icon={Building2} iconColor="text-primary" iconBg="bg-primary/10"
        />
        <StatCard
          title={emailFiltro === '__all__' ? 'Contatos' : 'Contatos Relacionados'}
          value={isLoading ? '...' : stats.contatos}
          icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50"
        />
        <StatCard
          title="Oportunidades"
          value={isLoading ? '...' : stats.oportunidades}
          icon={Target} iconColor="text-emerald-600" iconBg="bg-emerald-50"
        />
        <StatCard
          title="Tarefas Pendentes"
          value={isLoading ? '...' : stats.tarefas}
          icon={CheckSquare} iconColor="text-amber-600" iconBg="bg-amber-50"
        />
      </div>

      {/* Kanban BANT */}
      <KanbanBANT oportunidades={oportunidades} bantScores={bantScores} isLoading={isLoading} />

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
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma oportunidade encontrada</div>
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
          tarefas={tarefasFiltradas}
          isAdmin={false}
          usuarios={usuarios}
          currentUserEmail={user?.email}
          isLoading={isLoading}
          filtroExterno={emailFiltro}
        />
      </div>
    </div>
  );
}