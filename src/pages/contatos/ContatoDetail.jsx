import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Pencil, Phone, Mail, Linkedin, Building2, Target, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}

export default function ContatoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contato, setContato] = useState(null);
  const [orgao, setOrgao] = useState(null);
  const [oportunidades, setOportunidades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.Contato.list();
      const found = all.find(r => r.id === id);
      setContato(found || null);
      if (found?.orgao_id) {
        const orgList = await base44.entities.OrgaoPublico.list();
        setOrgao(orgList.find(o => o.id === found.orgao_id) || null);
        const ops = await base44.entities.Oportunidade.list();
        setOportunidades(ops.filter(o => o.orgao_id === found.orgao_id));
      }
      setIsLoading(false);
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    await base44.entities.Contato.delete(id);
    toast.success('Contato excluído.');
    navigate('/contatos');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!contato) {
    return <div className="text-center py-12 text-muted-foreground">Contato não encontrado.</div>;
  }

  const initials = contato.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title={contato.nome}
        subtitle={[contato.cargo, orgao?.nome].filter(Boolean).join(' · ')}
        actions={
          <div className="flex gap-2">
            <Link to="/contatos">
              <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button>
            </Link>
            <Link to={`/contatos/${id}/editar`}>
              <Button variant="outline" className="gap-2"><Pencil className="w-4 h-4" /> Editar</Button>
            </Link>
            <Button variant="destructive" className="gap-2" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4" /> Excluir
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Card principal */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary-foreground">{initials}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{contato.nome}</p>
                {contato.cargo && <p className="text-sm text-muted-foreground">{contato.cargo}</p>}
                {contato.departamento && <p className="text-xs text-muted-foreground">{contato.departamento}</p>}
              </div>
            </div>

            <div className="space-y-3">
              {contato.influencia_compra && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Influência na Compra</p>
                  <StatusBadge value={contato.influencia_compra} />
                </div>
              )}
              <InfoRow label="Órgão" value={orgao?.nome} />
              <InfoRow label="Departamento" value={contato.departamento} />

              {contato.telefone && (
                <a href={`tel:${contato.telefone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" /> {contato.telefone}
                </a>
              )}
              {contato.whatsapp && (
                <a
                  href={`https://wa.me/55${contato.whatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-green-600 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" /> {contato.whatsapp}
                </a>
              )}
              {contato.email && (
                <a href={`mailto:${contato.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {contato.email}
                </a>
              )}
              {contato.linkedin && (
                <a href={contato.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Linkedin className="w-3.5 h-3.5 flex-shrink-0" /> Ver LinkedIn
                </a>
              )}
            </div>

            {contato.notas && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{contato.notas}</p>
              </div>
            )}
          </div>

          {/* Link para o órgão */}
          {orgao && (
            <Link to={`/orgaos/${orgao.id}`} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:bg-muted/30 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Órgão vinculado</p>
                <p className="text-sm font-medium text-foreground truncate">{orgao.nome}</p>
                {orgao.esfera && <p className="text-xs text-muted-foreground">{orgao.esfera}</p>}
              </div>
            </Link>
          )}
        </div>

        {/* Oportunidades do órgão */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">
                  Oportunidades do Órgão ({oportunidades.length})
                </h3>
              </div>
              {orgao && (
                <Link to={`/oportunidades/nova?orgao_id=${orgao.id}`}>
                  <Button size="sm" variant="outline" className="text-xs">+ Nova</Button>
                </Link>
              )}
            </div>
            <DataTable
              columns={[
                { key: 'nome', label: 'Nome', sortable: true },
                { key: 'etapa_pipeline', label: 'Etapa', render: v => <StatusBadge value={v} /> },
                { key: 'status', label: 'Status', render: v => <StatusBadge value={v} /> },
                {
                  key: 'valor_estimado', label: 'Valor',
                  render: v => v ? `R$ ${Number(v).toLocaleString('pt-BR')}` : '—'
                },
              ]}
              data={oportunidades}
              onRowClick={row => navigate(`/oportunidades/${row.id}`)}
              emptyMessage="Nenhuma oportunidade vinculada ao órgão deste contato."
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Excluir Contato"
        description={`Tem certeza que deseja excluir "${contato.nome}"?`}
        confirmLabel="Excluir"
      />
    </div>
  );
}