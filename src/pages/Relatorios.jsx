import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList,
} from 'recharts';
import { TrendingUp, DollarSign, Target, Users } from 'lucide-react';

const ETAPAS = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'];
const COLORS = ['#ff7700', '#f5a623', '#7bc043', '#00aab5', '#1a6e7e'];

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
  const [oportunidades, setOportunidades] = useState([]);
  const [contatos, setContatos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Oportunidade.list(),
      base44.entities.Contato.list(),
    ]).then(([ops, cts]) => {
      setOportunidades(ops);
      setContatos(cts);
      setIsLoading(false);
    });
  }, []);

  /* ── 1. Volume por etapa do pipeline ── */
  const volumeEtapa = ETAPAS.map((etapa) => {
    const items = oportunidades.filter((o) => o.etapa_pipeline === etapa);
    return {
      etapa: etapa.replace('ção', 'ção').substring(0, 12),
      label: etapa,
      quantidade: items.length,
      valor: items.reduce((s, o) => s + (o.valor_estimado || 0), 0),
    };
  });

  /* ── 2. Valor total por status ── */
  const statusMap = {};
  oportunidades.forEach((o) => {
    const s = o.status || 'Aberta';
    if (!statusMap[s]) statusMap[s] = { status: s, valor: 0, qtd: 0 };
    statusMap[s].valor += o.valor_estimado || 0;
    statusMap[s].qtd += 1;
  });
  const valorStatus = Object.values(statusMap);
  const statusColors = {
    Aberta: '#00aab5',
    'Em Andamento': '#f5a623',
    Ganha: '#7bc043',
    Perdida: '#e85d04',
    Cancelada: '#aaa',
  };

  /* ── 3. Taxa de conversão ── */
  const total = oportunidades.length || 1;
  const ganhas = oportunidades.filter((o) => o.status === 'Ganha').length;
  const perdidas = oportunidades.filter((o) => o.status === 'Perdida').length;
  const emAndamento = oportunidades.filter((o) => o.status === 'Em Andamento').length;
  const taxaConversao = ((ganhas / total) * 100).toFixed(1);

  const convData = [
    { name: 'Ganhas', value: ganhas, color: '#7bc043' },
    { name: 'Em Andamento', value: emAndamento, color: '#f5a623' },
    { name: 'Perdidas', value: perdidas, color: '#e85d04' },
    { name: 'Abertas', value: oportunidades.filter((o) => o.status === 'Aberta').length, color: '#00aab5' },
    { name: 'Canceladas', value: oportunidades.filter((o) => o.status === 'Cancelada').length, color: '#bbb' },
  ].filter((d) => d.value > 0);

  /* ── 4. Contatos por influência ── */
  const influMap = {};
  contatos.forEach((c) => {
    const k = c.influencia_compra || 'Não definido';
    influMap[k] = (influMap[k] || 0) + 1;
  });
  const influData = Object.entries(influMap).map(([name, value]) => ({ name, value }));

  const totalValor = oportunidades.reduce((s, o) => s + (o.valor_estimado || 0), 0);

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
      <PageHeader title="Relatórios" subtitle="Análise do pipeline comercial" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Oportunidades', value: oportunidades.length, icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Valor Total Negociado', value: fmt(totalValor), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Taxa de Conversão', value: `${taxaConversao}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total de Contatos', value: contatos.length, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
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

        {/* Volume por etapa */}
        <SectionCard title="Volume de Oportunidades por Etapa" icon={Target}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={volumeEtapa} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="etapa" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v, name) => [v, name === 'quantidade' ? 'Qtd.' : 'Valor']}
                labelFormatter={(l) => volumeEtapa.find((e) => e.etapa === l)?.label || l}
              />
              <Bar dataKey="quantidade" name="Quantidade" radius={[4, 4, 0, 0]}>
                {volumeEtapa.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Valor por etapa */}
        <SectionCard title="Valor Estimado por Etapa (R$)" icon={DollarSign}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={volumeEtapa} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="etapa" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [fmt(v), 'Valor Estimado']} labelFormatter={(l) => volumeEtapa.find((e) => e.etapa === l)?.label || l} />
              <Bar dataKey="valor" name="Valor" radius={[4, 4, 0, 0]}>
                {volumeEtapa.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Distribuição por status (pizza) */}
        <SectionCard title="Taxa de Conversão por Status" icon={TrendingUp}>
          <div className="flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-3xl font-bold text-green-600">{taxaConversao}%</span>
              <p className="text-xs text-muted-foreground mt-0.5">oportunidades ganhas</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={convData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {convData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Contatos por influência */}
        <SectionCard title="Contatos por Nível de Influência" icon={Users}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={influData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v) => [v, 'Contatos']} />
              <Bar dataKey="value" name="Contatos" radius={[0, 4, 4, 0]}>
                {influData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
    </div>
  );
}