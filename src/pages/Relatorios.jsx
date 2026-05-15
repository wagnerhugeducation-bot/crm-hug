import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, DollarSign, Target, Users, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';

const ETAPAS = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'];
const COLORS = ['#ff7700', '#f5a623', '#7bc043', '#00aab5', '#1a6e7e'];

const BANT_COLORS = {
  Frio: '#94a3b8',
  Morno: '#f5a623',
  Quente: '#ff7700',
  'Muito Quente': '#e53e3e',
};

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v);

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Relatorios() {
  const { isAdmin, user, userProfile } = useAuth();
  const adminMode = isAdmin();
  const [oportunidades, setOportunidades] = useState([]);
  const [bantScores, setBantScores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroUsuario, setFiltroUsuario] = useState('__all__');

  useEffect(() => {
    Promise.all([
      base44.entities.Oportunidade.list(),
      base44.entities.ScoreBANT.list(),
      adminMode ? base44.entities.User.list() : Promise.resolve([]),
    ]).then(([ops, bants, users]) => {
      setOportunidades(ops);
      setBantScores(bants);
      setUsuarios(users);
      setIsLoading(false);
    });
  }, [adminMode]);

  /* ── Filtro por usuário ── */
  const opsFiltradas = useMemo(() => {
    // Não-admin: mostra apenas as suas próprias oportunidades
    if (!adminMode) {
      return oportunidades.filter(
        (o) => o.responsavel_id === user?.email || o.created_by === user?.email
      );
    }
    if (filtroUsuario === '__all__') return oportunidades;
    return oportunidades.filter(
      (o) => o.responsavel_id === filtroUsuario || o.created_by === filtroUsuario
    );
  }, [oportunidades, filtroUsuario, adminMode, user]);

  /* ── 1. Volume por etapa do pipeline ── */
  const volumeEtapa = ETAPAS.map((etapa) => {
    const items = opsFiltradas.filter((o) => o.etapa_pipeline === etapa);
    return {
      etapa: etapa.substring(0, 12),
      label: etapa,
      quantidade: items.length,
      valor: items.reduce((s, o) => s + (o.valor_estimado || 0), 0),
    };
  });

  /* ── 2. Taxa de conversão ── */
  const total = opsFiltradas.length || 1;
  const ganhas = opsFiltradas.filter((o) => o.status === 'Ganha').length;
  const perdidas = opsFiltradas.filter((o) => o.status === 'Perdida').length;
  const emAndamento = opsFiltradas.filter((o) => o.status === 'Em Andamento').length;
  const taxaConversao = ((ganhas / total) * 100).toFixed(1);

  const convData = [
    { name: 'Ganhas', value: ganhas, color: '#7bc043' },
    { name: 'Em Andamento', value: emAndamento, color: '#f5a623' },
    { name: 'Perdidas', value: perdidas, color: '#e85d04' },
    { name: 'Abertas', value: opsFiltradas.filter((o) => o.status === 'Aberta').length, color: '#00aab5' },
    { name: 'Canceladas', value: opsFiltradas.filter((o) => o.status === 'Cancelada').length, color: '#bbb' },
  ].filter((d) => d.value > 0);

  /* ── 3. Valor estimado por nível BANT ── */
  const bantMap = {};
  bantScores.forEach((b) => { bantMap[b.oportunidade_id] = b.classificacao; });

  const bantValorMap = { Frio: 0, Morno: 0, Quente: 0, 'Muito Quente': 0 };
  const bantQtdMap   = { Frio: 0, Morno: 0, Quente: 0, 'Muito Quente': 0 };
  opsFiltradas.forEach((o) => {
    const nivel = bantMap[o.id];
    if (nivel && bantValorMap[nivel] !== undefined) {
      bantValorMap[nivel] += o.valor_estimado || 0;
      bantQtdMap[nivel] += 1;
    }
  });
  const bantData = Object.keys(bantValorMap).map((nivel) => ({
    nivel,
    valor: bantValorMap[nivel],
    quantidade: bantQtdMap[nivel],
  }));

  const totalValor = opsFiltradas.reduce((s, o) => s + (o.valor_estimado || 0), 0);

  const usuarioLabel = (u) => u.nickname ? `@${u.nickname}` : (u.full_name || u.email);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Relatórios" subtitle="Análise comercial" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle="Análise do pipeline comercial"
        actions={
          adminMode && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                <SelectTrigger className="h-8 text-xs w-48">
                  <SelectValue placeholder="Filtrar por usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os usuários</SelectItem>
                  {usuarios.map((u) => (
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Oportunidades', value: opsFiltradas.length, icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Valor Total Negociado', value: fmt(totalValor), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Taxa de Conversão', value: `${taxaConversao}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Oportunidades Ganhas', value: ganhas, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              <p className="text-xl font-bold text-foreground truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Volume de Oportunidades por Etapa" icon={Target}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={volumeEtapa} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="etapa" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => [v, 'Quantidade']}
                labelFormatter={(l) => volumeEtapa.find((e) => e.etapa === l)?.label || l}
              />
              <Bar dataKey="quantidade" name="Quantidade" radius={[4, 4, 0, 0]}>
                {volumeEtapa.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Valor Estimado por Etapa (R$)" icon={DollarSign}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={volumeEtapa} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="etapa" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [fmt(v), 'Valor Estimado']} labelFormatter={(l) => volumeEtapa.find((e) => e.etapa === l)?.label || l} />
              <Bar dataKey="valor" name="Valor" radius={[4, 4, 0, 0]}>
                {volumeEtapa.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Taxa de conversão */}
        <SectionCard title="Taxa de Conversão por Status" icon={TrendingUp}>
          <div className="flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-3xl font-bold text-green-600">{taxaConversao}%</span>
              <p className="text-xs text-muted-foreground mt-0.5">oportunidades ganhas</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={convData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {convData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Valor estimado por nível BANT */}
        <SectionCard title="Valor Estimado por Nível BANT" icon={Target}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bantData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="nivel" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v, name) => [name === 'valor' ? fmt(v) : v, name === 'valor' ? 'Valor Estimado' : 'Qtd.']}
              />
              <Bar dataKey="valor" name="valor" radius={[4, 4, 0, 0]}>
                {bantData.map((entry) => (
                  <Cell key={entry.nivel} fill={BANT_COLORS[entry.nivel] || '#aaa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* legenda BANT */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {Object.entries(BANT_COLORS).map(([nivel, cor]) => (
              <span key={nivel} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: cor }} />
                {nivel}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}