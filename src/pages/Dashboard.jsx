import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Target, Filter } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import TarefasCalendario from '@/components/dashboard/TarefasCalendario';
import KanbanBANT from '@/components/dashboard/KanbanBANT';
import MatrizPrioridade from '@/components/dashboard/MatrizPrioridade';
import { useUsuariosMap } from '@/hooks/useUsuariosMap';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin: isAdminFn, isGestor: isGestorFn, userProfile } = useAuth();
  const { getLabel } = useUsuariosMap();
  const isAdmin = isAdminFn();
  const isGestor = isGestorFn?.() || false;
  const podesFiltrar = isAdmin || isGestor;

  // Admin → todos; Gestor/Comercial → equipe; outros → próprio
  const defaultFiltro = isAdmin ? '__all__' : (isGestor ? '__all__' : '__me__');

  const [allOportunidades, setAllOportunidades] = useState([]);
  const [allOrgaos, setAllOrgaos] = useState([]);
  const [allContatos, setAllContatos] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [bantScores, setBantScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroUsuario, setFiltroUsuario] = useState(defaultFiltro);
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

  const ETAPAS = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'];
  const ETAPA_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];

  const OBJETOS = ['Vivências', 'Met.completa com PcD', 'Met.Tradicional', 'Met.Inclusiva', 'Prog.Especiais'];
  const OBJETO_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];

  const pizzaData = useMemo(() => {
    const items = ETAPAS.map((etapa, i) => {
      const ops = oportunidades.filter(o => o.etapa_pipeline === etapa);
      const total = ops.reduce((acc, o) => acc + (o.valor_estimado || 0), 0);
      return { name: etapa, value: total, count: ops.length, color: ETAPA_COLORS[i] };
    }).filter(d => d.value > 0);
    const totalGeral = items.reduce((acc, d) => acc + d.value, 0);
    return items.map(d => ({ ...d, pct: totalGeral > 0 ? ((d.value / totalGeral) * 100).toFixed(1) : '0' }));
  }, [oportunidades]);

  const pizzaObjetoData = useMemo(() => {
    const items = OBJETOS.map((obj, i) => {
      const ops = oportunidades.filter(o => o.objeto_contratado === obj);
      const total = ops.reduce((acc, o) => acc + (o.valor_estimado || 0), 0);
      return { name: obj, value: total, count: ops.length, color: OBJETO_COLORS[i] };
    }).filter(d => d.count > 0);
    const totalGeral = items.reduce((acc, d) => acc + d.value, 0);
    return items.map(d => ({ ...d, pct: totalGeral > 0 ? ((d.value / totalGeral) * 100).toFixed(1) : '0' }));
  }, [oportunidades]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
        <p className="font-semibold text-foreground mb-1">{d.name}</p>
        <p className="text-muted-foreground">Valor: <span className="text-foreground font-medium">R$ {Number(d.value).toLocaleString('pt-BR')}</span></p>
        <p className="text-muted-foreground">Oportunidades: <span className="text-foreground font-medium">{d.count}</span></p>
        <p className="text-muted-foreground">Participação: <span className="text-foreground font-medium">{d.pct}%</span></p>
      </div>
    );
  };

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

      {/* Matriz de Prioridade Comercial */}
      <MatrizPrioridade
        oportunidades={oportunidades}
        bantScores={bantScores}
        tarefas={tarefas}
        orgaos={allOrgaos}
        usuarios={usuarios}
        getLabel={getLabel}
        isLoading={isLoading}
      />

      {/* Kanban BANT */}
      <KanbanBANT oportunidades={oportunidades} bantScores={bantScores} isLoading={isLoading} />

      {/* Gráficos de Pizza */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Valor por Etapa do Pipeline */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Valor por Etapa do Pipeline</h2>
            </div>
            <Link to="/oportunidades" className="text-xs text-primary hover:underline font-medium">Ver todas</Link>
          </div>
          <div className="px-4 pt-4 pb-2">
            {isLoading ? (
              <div className="w-full h-[280px] bg-muted animate-pulse rounded-lg" />
            ) : pizzaData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">Nenhuma oportunidade com valor cadastrado</p>
            ) : (
              <>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pizzaData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value" cursor="pointer" onClick={(entry) => navigate(`/oportunidades?etapa=${encodeURIComponent(entry.name)}`)}>
                        {pizzaData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 border-t border-border pt-3 space-y-1.5">
                  <div className="grid grid-cols-4 gap-1 px-1 mb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase col-span-2">Etapa</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase text-right">Valor</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase text-right">Oport. / %</span>
                  </div>
                  {pizzaData.map((d) => (
                    <div key={d.name} className="grid grid-cols-4 gap-1 items-center px-1 py-0.5 rounded hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/oportunidades?etapa=${encodeURIComponent(d.name)}`)}>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-foreground truncate">{d.name}</span>
                      </div>
                      <span className="text-xs text-foreground text-right font-medium">R$ {Number(d.value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                      <span className="text-xs text-muted-foreground text-right">{d.count} / <span className="font-semibold text-foreground">{d.pct}%</span></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Valor por Objeto Contratado */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Valor por Objeto Contratado</h2>
            </div>
            <Link to="/oportunidades" className="text-xs text-primary hover:underline font-medium">Ver todas</Link>
          </div>
          <div className="px-4 pt-4 pb-2">
            {isLoading ? (
              <div className="w-full h-[280px] bg-muted animate-pulse rounded-lg" />
            ) : pizzaObjetoData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">Nenhuma oportunidade com objeto contratado cadastrado</p>
            ) : (
              <>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pizzaObjetoData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value" cursor="pointer">
                        {pizzaObjetoData.map((entry, index) => (<Cell key={`cell-obj-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 border-t border-border pt-3 space-y-1.5">
                  <div className="grid grid-cols-4 gap-1 px-1 mb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase col-span-2">Objeto</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase text-right">Valor</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase text-right">Oport. / %</span>
                  </div>
                  {pizzaObjetoData.map((d) => (
                    <div key={d.name} className="grid grid-cols-4 gap-1 items-center px-1 py-0.5 rounded hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-1.5 col-span-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-foreground truncate">{d.name}</span>
                      </div>
                      <span className="text-xs text-foreground text-right font-medium">R$ {Number(d.value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                      <span className="text-xs text-muted-foreground text-right">{d.count} / <span className="font-semibold text-foreground">{d.pct}%</span></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
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
  );
}