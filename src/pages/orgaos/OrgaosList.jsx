import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Building2, Pencil, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export default function OrgaosList() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const res = await base44.entities.OrgaoPublico.list('-created_date');
    setData(res);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = data.filter(d =>
    [d.nome, d.cnpj, d.cidade, d.estado, d.esfera].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

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
    { key: 'cidade', label: 'Cidade/UF', render: (_, row) => row.cidade ? `${row.cidade}/${row.estado || ''}` : '—' },
    { key: 'relacionamento_status', label: 'Status', render: (v) => <StatusBadge value={v} /> },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Link to={`/orgaos/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
          </Link>
          <Link to={`/orgaos/${row.id}/editar`}>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="w-3.5 h-3.5" /></Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(row)}>
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
          <Link to="/orgaos/novo">
            <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Órgão</Button>
          </Link>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Buscar por nome, CNPJ, cidade..." className="max-w-sm" />
      </div>

      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum órgão encontrado"
          description={search ? 'Tente ajustar sua busca.' : 'Cadastre o primeiro órgão público.'}
          action={!search && <Link to="/orgaos/novo"><Button className="gap-2"><Plus className="w-4 h-4" /> Novo Órgão</Button></Link>}
        />
      ) : (
        <>
          <DataTable columns={columns} data={paged} isLoading={isLoading} onRowClick={row => window.location.href = `/orgaos/${row.id}`} />
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
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
    </div>
  );
}