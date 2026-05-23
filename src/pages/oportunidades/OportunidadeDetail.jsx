import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Pencil, CheckSquare, FileText, Star, Clock, CheckCircle2 } from 'lucide-react';
import BANTGauge from '@/components/bant/BANTGauge';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import LinhaDoTempo from '@/components/oportunidades/LinhaDoTempo';
import { useUsuariosMap } from '@/hooks/useUsuariosMap';

// Tabela com altura fixa (~5 linhas) e scroll interno, com linhas clicáveis
function ScrollableTable({ columns, data, emptyMessage, onRowClick }) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-6">{emptyMessage}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
      </table>
      <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {data.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-primary/5' : 'hover:bg-muted/30'}`}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-2.5 text-foreground">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function BANTScore({ bant }) {
  if (!bant) return <div className="text-sm text-muted-foreground py-4 text-center">Score BANT não preenchido.</div>;
  const scores = [
    { label: 'Budget (Orçamento)', score: bant.budget_score, notas: bant.budget_notas },
    { label: 'Authority (Autoridade)', score: bant.authority_score, notas: bant.authority_notas },
    { label: 'Need (Necessidade)', score: bant.need_score, notas: bant.need_notas },
    { label: 'Timing (Timing)', score: bant.timing_score, notas: bant.timing_notas },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-1 pb-2">
        <BANTGauge score={bant.total_score ?? null} size="md" />
        <StatusBadge value={bant.classificacao} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Score Total: <span className="text-primary">{bant.total_score || '—'}</span></p>
      </div>
      {scores.map(s => (
        <div key={s.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-medium">{s.score ?? '—'}/10</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(s.score || 0) * 10}%` }} />
          </div>
          {s.notas && <p className="text-xs text-muted-foreground mt-1">{s.notas}</p>}
        </div>
      ))}
    </div>
  );
}

export default function OportunidadeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getLabel } = useUsuariosMap();
  const [op, setOp] = useState(null);
  const [orgao, setOrgao] = useState(null);
  const [tarefas, setTarefas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [bant, setBant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortAtivas, setSortAtivas] = useState({ key: null, dir: 'asc' });
  const [sortConcluidas, setSortConcluidas] = useState({ key: null, dir: 'asc' });

  const toggleSort = (current, key, setter) => {
    if (current.key === key) setter({ key, dir: current.dir === 'asc' ? 'desc' : 'asc' });
    else setter({ key, dir: 'asc' });
  };

  const sortData = (data, { key, dir }) => {
    if (!key) return data;
    return [...data].sort((a, b) => {
      const va = a[key] ?? '';
      const vb = b[key] ?? '';
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return dir === 'asc' ? cmp : -cmp;
    });
  };

  useEffect(() => {
    const load = async () => {
      const [ops, tafs, docs, bants] = await Promise.all([
        base44.entities.Oportunidade.filter({ id }),
        base44.entities.Tarefa.filter({ oportunidade_id: id }),
        base44.entities.Documento.filter({ oportunidade_id: id }),
        base44.entities.ScoreBANT.filter({ oportunidade_id: id }),
      ]);
      const foundOp = ops[0];
      setOp(foundOp || null);
      setTarefas(tafs);
      setDocumentos(docs);
      setBant(bants[0] || null);
      if (foundOp?.orgao_id) {
        const orgs = await base44.entities.OrgaoPublico.filter({ id: foundOp.orgao_id });
        setOrgao(orgs[0] || null);
      }
      setIsLoading(false);
    };
    load();
  }, [id]);

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!op) return <div className="text-center py-12 text-muted-foreground">Oportunidade não encontrada.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={op.nome}
        subtitle={orgao?.nome}
        actions={
          <div className="flex gap-2">
            <Link to="/oportunidades"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button></Link>
            <Link to={`/oportunidades/${id}/editar`}><Button className="gap-2"><Pencil className="w-4 h-4" /> Editar</Button></Link>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <StatusBadge value={op.status} />
              <StatusBadge value={op.etapa_pipeline} />
            </div>
            <InfoRow label="Modalidade" value={op.tipo_licitacao} />
            <InfoRow label="Nº Edital" value={op.numero_edital} />
            <InfoRow label="Valor Estimado" value={op.valor_estimado ? `R$ ${Number(op.valor_estimado).toLocaleString('pt-BR')}` : null} />
            <InfoRow label="Potencial da Oportunidade" value={op.potencial_oportunidade ? `R$ ${Number(op.potencial_oportunidade).toLocaleString('pt-BR')}` : null} />
            <InfoRow label="Data Abertura" value={op.data_abertura} />
            <InfoRow label="Prazo Proposta" value={op.data_entrega_proposta} />
            <InfoRow label="Concorrentes" value={op.concorrentes} />
            <InfoRow label="Responsável" value={getLabel(op.responsavel_id)} />
            <InfoRow label="Criado por" value={getLabel(op.created_by)} />
            {op.notas && <InfoRow label="Observações" value={op.notas} />}
          </div>

          {/* BANT */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Score BANT</h3>
              </div>
              <Link to={`/oportunidades/${id}/bant`}><Button size="sm" variant="outline" className="text-xs">Editar</Button></Link>
            </div>
            <BANTScore bant={bant} />
          </div>
        </div>

        {/* Tarefas + Tarefas Concluídas + Documentos + Linha do Tempo */}
        <div className="lg:col-span-2 space-y-5">
        {/* Tarefas pendentes/em andamento */}
        {(() => {
          const tarefasAtivas = sortData(tarefas.filter(t => t.status !== 'Concluída' && t.status !== 'Cancelada'), sortAtivas);
          const SortIcon = ({ col }) => {
            if (sortAtivas.key !== col) return <span className="text-muted-foreground/40 ml-1">↕</span>;
            return <span className="text-primary ml-1">{sortAtivas.dir === 'asc' ? '↑' : '↓'}</span>;
          };
          return (
            <div className="bg-card rounded-xl border border-border">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Tarefas ({tarefasAtivas.length})</h3>
                </div>
                <Link to={`/tarefas/nova?oportunidade_id=${id}`}>
                  <Button size="sm" variant="outline" className="text-xs">+ Tarefa</Button>
                </Link>
              </div>
              <ScrollableTable
                columns={[
                  { key: 'titulo', label: 'Título' },
                  { key: 'tipo', label: <span className="cursor-pointer select-none" onClick={() => toggleSort(sortAtivas, 'tipo', setSortAtivas)}>Tipo<SortIcon col="tipo" /></span> },
                  { key: 'data_vencimento', label: <span className="cursor-pointer select-none" onClick={() => toggleSort(sortAtivas, 'data_vencimento', setSortAtivas)}>Vencimento<SortIcon col="data_vencimento" /></span>, render: v => v ? new Date(v).toLocaleDateString('pt-BR') : '—' },
                  { key: 'status', label: <span className="cursor-pointer select-none" onClick={() => toggleSort(sortAtivas, 'status', setSortAtivas)}>Status<SortIcon col="status" /></span>, render: v => <StatusBadge value={v} /> },
                  { key: 'prioridade', label: 'Prioridade', render: v => <StatusBadge value={v} /> },
                ]}
                data={tarefasAtivas}
                emptyMessage="Nenhuma tarefa pendente."
                onRowClick={row => navigate(`/tarefas/${row.id}/editar?origem=/oportunidades/${id}`)}
              />
            </div>
          );
        })()}

        {/* Tarefas Concluídas */}
        {(() => {
          const base = tarefas.filter(t => t.status === 'Concluída');
          const concluidas = sortConcluidas.key
            ? sortData(base, sortConcluidas)
            : [...base].sort((a, b) => new Date(b.concluida_em || b.updated_date) - new Date(a.concluida_em || a.updated_date));
          const SortIcon = ({ col }) => {
            if (sortConcluidas.key !== col) return <span className="text-muted-foreground/40 ml-1">↕</span>;
            return <span className="text-primary ml-1">{sortConcluidas.dir === 'asc' ? '↑' : '↓'}</span>;
          };
          return (
            <div className="bg-card rounded-xl border border-border">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-semibold">Tarefas Concluídas ({concluidas.length})</h3>
              </div>
              <ScrollableTable
                columns={[
                  { key: 'titulo', label: 'Título' },
                  { key: 'tipo', label: <span className="cursor-pointer select-none" onClick={() => toggleSort(sortConcluidas, 'tipo', setSortConcluidas)}>Tipo<SortIcon col="tipo" /></span> },
                  { key: 'resultado', label: 'Resultado', render: v => v ? <div className="text-xs text-muted-foreground overflow-y-auto" style={{ maxHeight: '5.5rem', lineHeight: '1.375rem' }}>{v}</div> : '—' },
                  { key: 'concluida_em', label: <span className="cursor-pointer select-none" onClick={() => toggleSort(sortConcluidas, 'concluida_em', setSortConcluidas)}>Concluída em<SortIcon col="concluida_em" /></span>, render: (v, row) => {
                    const dt = v || row.updated_date;
                    return dt ? new Date(dt).toLocaleDateString('pt-BR') : '—';
                  }},
                ]}
                data={concluidas}
                emptyMessage="Nenhuma tarefa concluída ainda."
                onRowClick={row => navigate(`/tarefas/${row.id}/editar?origem=/oportunidades/${id}`)}
              />
            </div>
          );
        })()}

        {/* Documentos */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Documentos ({documentos.length})</h3>
            </div>
            <Link to={`/documentos/novo?oportunidade_id=${id}`}>
              <Button size="sm" variant="outline" className="text-xs">+ Documento</Button>
            </Link>
          </div>
          <ScrollableTable
            columns={[
              { key: 'nome', label: 'Nome' },
              { key: 'tipo', label: 'Tipo' },
              { key: 'validade', label: 'Validade', render: v => v ? new Date(v).toLocaleDateString('pt-BR') : '—' },
              { key: 'arquivo_url', label: 'Arquivo', render: (v, row) => (
                <div className="flex items-center gap-2">
                  {v ? <a href={v} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-primary hover:underline text-xs">Abrir</a> : '—'}
                </div>
              )},
            ]}
            data={documentos}
            emptyMessage="Nenhum documento vinculado."
            onRowClick={row => navigate(`/documentos/${row.id}/editar?origem=/oportunidades/${id}`)}
          />
        </div>

        {/* Linha do Tempo */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Histórico de Atividades</h3>
          </div>
          <div className="p-5 overflow-y-auto" style={{ maxHeight: '380px' }}>
            <LinhaDoTempo oportunidadeId={id} />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}