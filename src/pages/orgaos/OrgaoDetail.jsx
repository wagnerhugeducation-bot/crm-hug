import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Pencil, Phone, Mail, Globe, Users, Target, CheckSquare, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { useUsuariosMap } from '@/hooks/useUsuariosMap';

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

export default function OrgaoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getLabel } = useUsuariosMap();
  const [orgao, setOrgao] = useState(null);
  const [contatos, setContatos] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [orgaos, cts, ops, tafs] = await Promise.all([
        base44.entities.OrgaoPublico.filter({ id }),
        base44.entities.Contato.filter({ orgao_id: id }),
        base44.entities.Oportunidade.filter({ orgao_id: id }),
        base44.entities.Tarefa.filter({ orgao_id: id }),
      ]);
      setOrgao(orgaos[0] || null);
      setContatos(cts);
      setOportunidades(ops);
      setTarefas(tafs);
      setIsLoading(false);
    };
    load();
  }, [id]);

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!orgao) return <div className="text-center py-12 text-muted-foreground">Órgão não encontrado.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={orgao.nome}
        subtitle={`${orgao.esfera || ''} ${orgao.secretaria ? '· ' + orgao.secretaria : ''}`}
        actions={
          <div className="flex gap-2">
            <Link to="/orgaos"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button></Link>
            <Link to={`/orgaos/${id}/editar`}><Button className="gap-2"><Pencil className="w-4 h-4" /> Editar</Button></Link>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Info card — largura total */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Informações</h3>
            <StatusBadge value={orgao.relacionamento_status} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoRow label="CNPJ" value={orgao.cnpj} />
            <InfoRow label="Esfera" value={orgao.esfera} />
            <InfoRow label="Poder" value={orgao.poder} />
            <InfoRow label="Cidade / Estado" value={orgao.cidade ? `${orgao.cidade} / ${orgao.estado}` : null} />
            <InfoRow label="Potencial do Órgão" value={orgao.potencial_orgao ? `R$ ${Number(orgao.potencial_orgao).toLocaleString('pt-BR')}` : null} />
            <InfoRow label="Responsável Interno" value={orgao.responsavel_id ? getLabel(orgao.responsavel_id) : null} />
            <InfoRow label="Endereço" value={orgao.endereco} />
            <div className="flex flex-col gap-1.5">
              {orgao.telefone && (
                <a href={`tel:${orgao.telefone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Phone className="w-3.5 h-3.5" /> {orgao.telefone}
                </a>
              )}
              {orgao.email_institucional && (
                <a href={`mailto:${orgao.email_institucional}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Mail className="w-3.5 h-3.5" /> {orgao.email_institucional}
                </a>
              )}
              {orgao.site && (
                <a href={orgao.site} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe className="w-3.5 h-3.5" /> Site oficial
                </a>
              )}
              {orgao.portal_compras && (
                <a href={orgao.portal_compras} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe className="w-3.5 h-3.5" /> Portal de Compras
                </a>
              )}
            </div>
          </div>
          {orgao.notas && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Observações</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{orgao.notas}</p>
            </div>
          )}
        </div>

        {/* Contatos + Oportunidades */}
        <div className="space-y-5">
          <div className="bg-card rounded-xl border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Contatos ({contatos.length})</h3>
              </div>
              <Link to={`/contatos/novo?orgao_id=${id}`}>
                <Button size="sm" variant="outline" className="text-xs gap-1">+ Adicionar</Button>
              </Link>
            </div>
            <DataTable
              columns={[
                { key: 'nome', label: 'Nome', sortable: true },
                { key: 'cargo', label: 'Cargo' },
                { key: 'influencia_compra', label: 'Influência', render: v => <StatusBadge value={v} /> },
                { key: 'email', label: 'E-mail' },
              ]}
              data={contatos}
              emptyMessage="Nenhum contato cadastrado para este órgão."
            />
          </div>

          <div className="bg-card rounded-xl border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Oportunidades ({oportunidades.length})</h3>
              </div>
              <Link to={`/oportunidades/nova?orgao_id=${id}`}>
                <Button size="sm" variant="outline" className="text-xs gap-1">+ Adicionar</Button>
              </Link>
            </div>
            <DataTable
              columns={[
                { key: 'nome', label: 'Nome', sortable: true },
                { key: 'etapa_pipeline', label: 'Etapa', render: v => <StatusBadge value={v} /> },
                { key: 'status', label: 'Status', render: v => <StatusBadge value={v} /> },
                { key: 'valor_estimado', label: 'Valor', render: v => v ? `R$ ${Number(v).toLocaleString('pt-BR')}` : '—' },
              ]}
              data={oportunidades}
              emptyMessage="Nenhuma oportunidade vinculada."
            />
          </div>

          {/* Tarefas Pendentes/Em Andamento */}
          {(() => {
            const tarefasAtivas = tarefas
              .filter(t => t.status !== 'Concluída' && t.status !== 'Cancelada')
              .sort((a, b) => new Date(a.data_vencimento || 0) - new Date(b.data_vencimento || 0));
            return (
              <div className="bg-card rounded-xl border border-border">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold">Tarefas ({tarefasAtivas.length})</h3>
                  </div>
                  <Link to={`/tarefas/nova?orgao_id=${id}`}>
                    <Button size="sm" variant="outline" className="text-xs">+ Tarefa</Button>
                  </Link>
                </div>
                <ScrollableTable
                  columns={[
                    { key: 'titulo', label: 'Título' },
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'data_vencimento', label: 'Vencimento', render: v => v ? new Date(v).toLocaleDateString('pt-BR') : '—' },
                    { key: 'status', label: 'Status', render: v => <StatusBadge value={v} /> },
                    { key: 'prioridade', label: 'Prioridade', render: v => <StatusBadge value={v} /> },
                  ]}
                  data={tarefasAtivas}
                  emptyMessage="Nenhuma tarefa pendente."
                  onRowClick={row => navigate(`/tarefas/${row.id}/editar?origem=/orgaos/${id}`)}
                />
              </div>
            );
          })()}

          {/* Tarefas Concluídas */}
          {(() => {
            const concluidas = tarefas
              .filter(t => t.status === 'Concluída')
              .sort((a, b) => new Date(b.concluida_em || b.updated_date) - new Date(a.concluida_em || a.updated_date));
            return (
              <div className="bg-card rounded-xl border border-border">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <h3 className="text-sm font-semibold">Tarefas Concluídas ({concluidas.length})</h3>
                </div>
                <ScrollableTable
                  columns={[
                    { key: 'titulo', label: 'Título' },
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'resultado', label: 'Resultado', render: v => v ? <span className="text-xs text-muted-foreground">{v}</span> : '—' },
                    { key: 'concluida_em', label: 'Concluída em', render: (v, row) => {
                      const dt = v || row.updated_date;
                      return dt ? new Date(dt).toLocaleDateString('pt-BR') : '—';
                    }},
                  ]}
                  data={concluidas}
                  emptyMessage="Nenhuma tarefa concluída ainda."
                  onRowClick={row => navigate(`/tarefas/${row.id}/editar?origem=/orgaos/${id}`)}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}