import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Building2, Pencil, Trash2, Eye, Download } from 'lucide-react';
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
  { key: 'cnpj', label: 'CNPJ' },
  { key: 'esfera', label: 'Esfera' },
  { key: 'poder', label: 'Poder' },
  { key: 'secretaria', label: 'Secretaria' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'estado', label: 'Estado' },
  { key: 'cep', label: 'CEP' },
  { key: 'endereco', label: 'Endereço' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'email_institucional', label: 'E-mail' },
  { key: 'site', label: 'Site' },
  { key: 'relacionamento_status', label: 'Status' },
  { key: 'orcamento_anual', label: 'Orçamento Anual' },
  { key: 'notas', label: 'Notas' },
];

const PAGE_SIZE = 10;

export default function OrgaosList() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEsfera, setFilterEsfera] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const res = await base44.entities.OrgaoPublico.list('-created_date');
    setData(res);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = data.filter(d => {
    const matchSearch = [d.nome, d.cnpj, d.cidade, d.estado, d.secretaria].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    );
    const matchEsfera = filterEsfera === 'all' || d.esfera === filterEsfera;
    const matchStatus = filterStatus === 'all' || d.relacionamento_status === filterStatus;
    return matchSearch && matchEsfera && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    setIsDeleting(true);
    await base44.entities.OrgaoPublico.delete(deleteTarget.id);
    toast.success('Órgão excluído com sucesso.');
    setDeleteTarget(null);
    setIsDeleting(false);
    load();
  };

  const columns = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'esfera', label: 'Esfera', sortable: true },
    { key: 'secretaria', label: 'Secretaria' },
    {
      key: 'cidade', label: 'Cidade/UF',
      render: (_, row) => row.cidade ? `${row.cidade}${row.estado ? `/${row.estado}` : ''}` : '—'
    },
    {
      key: 'relacionamento_status', label: 'Status',
      render: (v) => <StatusBadge value={v} />
    },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar" onClick={() => navigate(`/orgaos/${row.id}`)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => navigate(`/orgaos/${row.id}/editar`)}>
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
        title="Órgãos Públicos"
        subtitle={`${data.length} órgão(s) cadastrado(s)`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowExport(true)}>
              <Download className="w-4 h-4" /> Exportar
            </Button>
            <Link to="/orgaos/novo">
              <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Órgão</Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={v => { setSearch(v); setPage(1); }}
          placeholder="Buscar por nome, CNPJ, cidade..."
          className="flex-1 min-w-[200px] max-w-sm"
        />
        <Select value={filterEsfera} onValueChange={v => { setFilterEsfera(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Esfera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Esferas</SelectItem>
            {['Federal', 'Estadual', 'Municipal'].map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {['Prospecto', 'Em Contato', 'Ativo', 'Inativo', 'VIP'].map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum órgão encontrado"
          description={search ? 'Tente ajustar sua busca ou filtros.' : 'Cadastre o primeiro órgão público.'}
          action={!search && (
            <Link to="/orgaos/novo">
              <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Órgão</Button>
            </Link>
          )}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paged}
            isLoading={isLoading}
            onRowClick={row => navigate(`/orgaos/${row.id}`)}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Excluir Órgão"
        description={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Todos os dados relacionados serão perdidos.`}
        confirmLabel="Excluir"
      />
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        data={filtered}
        fields={EXPORT_FIELDS}
        title="Órgãos Públicos"
      />
    </div>
  );
}