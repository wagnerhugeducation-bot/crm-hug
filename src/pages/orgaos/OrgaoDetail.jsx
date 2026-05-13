import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Pencil, Phone, Mail, Globe, Building2, MapPin, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';

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
  const [orgao, setOrgao] = useState(null);
  const [contatos, setContatos] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [orgaos, cts, ops] = await Promise.all([
        base44.entities.OrgaoPublico.filter({ id }),
        base44.entities.Contato.filter({ orgao_id: id }),
        base44.entities.Oportunidade.filter({ orgao_id: id }),
      ]);
      setOrgao(orgaos[0] || null);
      setContatos(cts);
      setOportunidades(ops);
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Informações</h3>
            <StatusBadge value={orgao.relacionamento_status} />
          </div>
          <InfoRow label="CNPJ" value={orgao.cnpj} />
          <InfoRow label="Esfera" value={orgao.esfera} />
          <InfoRow label="Poder" value={orgao.poder} />
          <InfoRow label="Cidade / Estado" value={orgao.cidade ? `${orgao.cidade} / ${orgao.estado}` : null} />
          <InfoRow label="Endereço" value={orgao.endereco} />
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
          {orgao.notas && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Observações</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{orgao.notas}</p>
            </div>
          )}
        </div>

        {/* Contatos + Oportunidades */}
        <div className="lg:col-span-2 space-y-5">
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
        </div>
      </div>
    </div>
  );
}