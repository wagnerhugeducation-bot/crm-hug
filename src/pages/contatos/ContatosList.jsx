import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Users, Pencil, Trash2, Eye, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import ExportModal from '@/components/exportacao/ExportModal';

const EXPORT_FIELDS = [
  { key: 'nome', label: 'Nome' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'email', label: 'E-mail' },
  { key: 'influencia_compra', label: 'Influência' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'ativo', label: 'Ativo' },
  { key: 'notas', label: 'Notas' },
];

const PAGE_SIZE = 10;

export default function ContatosList() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [orgaos, setOrgaos] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterInfluencia, setFilterInfluencia] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const [contatos, orgaosList] = await Promise.all([
      base44.entities.Contato.list('-created_date'),
      base44.entities.OrgaoPublico.list(),
    ]);
    const map = {};
    orgaosList.forEach(o => { map[o.id] = o.nome; });
    setOrgaos(map);
    setData(contatos);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = data.filter(d => {
    const matchSearch = [d.nome, d.cargo, d.email, d.telefone, d.whatsapp, orgaos[d.orgao_id]].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    );
    const matchInfluencia = filterInfluencia === 'all' || d.influencia_compra === filterInfluencia;
    return matchSearch && matchInfluencia;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    setIsDeleting(true);
    await base44.entities.Contato.delete(deleteTarget.id);
    toast.success('Contato excluído com sucesso.');
    setDeleteTarget(null);
    setIsDeleting(false);
    load();
  };

  const columns = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'orgao_id', label: 'Órgão', render: (v) => <span className="truncate max-w-[180px] block">{orgaos[v] || '—'}</span> },
    { key: 'cargo', label: 'Cargo', sortable: true },
    { key: 'influencia_compra', label: 'Influência', render: v => <StatusBadge value={v} /> },
    { key: 'email', label: 'E-mail', render: v => v ? <a href={`mailto:${v}`} onClick={e => e.stopPropagation()} className="text-primary hover:underline">{v}</a> : '—' },
    { key: 'whatsapp', label: 'WhatsApp' },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar" onClick={() => navigate(`/contatos/${row.id}`)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => navigate(`/contatos/${row.id}/editar`)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            title="Excluir"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contatos"
        subtitle={`${data.length} contato(s) cadastrado(s)`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowExport(true)}>
              <Download className="w-4 h-4" /> Exportar
            </Button>
            <Link to="/contatos/novo">
              <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Contato</Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={v => { setSearch(v); setPage(1); }}
          placeholder="Buscar por nome, cargo, e-mail, órgão..."
          className="flex-1 min-w-[200px] max-w-sm"
        />
        <Select value={filterInfluencia} onValueChange={v => { setFilterInfluencia(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Influência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Influências</SelectItem>
            {['Decisor', 'Influenciador', 'Técnico', 'Usuário Final', 'Bloqueador'].map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum contato encontrado"
          description={search ? 'Tente ajustar sua busca ou filtros.' : 'Adicione o primeiro contato.'}
          action={!search && (
            <Link to="/contatos/novo">
              <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Contato</Button>
            </Link>
          )}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paged}
            isLoading={isLoading}
            onRowClick={row => navigate(`/contatos/${row.id}`)}
          />
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Excluir Contato"
        description={`Tem certeza que deseja excluir "${deleteTarget?.nome}"?`}
        confirmLabel="Excluir"
      />
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        data={filtered}
        fields={EXPORT_FIELDS}
        title="Contatos"
      />
    </div>
  );
}