import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Users, Pencil, Trash2, Eye } from 'lucide-react';
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

export default function ContatosList() {
  const [data, setData] = useState([]);
  const [orgaos, setOrgaos] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const filtered = data.filter(d =>
    [d.nome, d.cargo, d.email, d.telefone, orgaos[d.orgao_id]].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    setIsDeleting(true);
    await base44.entities.Contato.delete(deleteTarget.id);
    toast.success('Contato excluído.');
    setDeleteTarget(null);
    setIsDeleting(false);
    load();
  };

  const columns = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'orgao_id', label: 'Órgão', render: (v) => orgaos[v] || '—' },
    { key: 'cargo', label: 'Cargo', sortable: true },
    { key: 'influencia_compra', label: 'Influência', render: v => <StatusBadge value={v} /> },
    { key: 'email', label: 'E-mail' },
    { key: 'whatsapp', label: 'WhatsApp' },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Link to={`/contatos/${row.id}/editar`}>
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
        title="Contatos"
        subtitle={`${data.length} contato(s) cadastrado(s)`}
        actions={<Link to="/contatos/novo"><Button className="gap-2"><Plus className="w-4 h-4" /> Novo Contato</Button></Link>}
      />
      <div className="mb-4">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Buscar por nome, cargo, e-mail..." className="max-w-sm" />
      </div>
      {!isLoading && filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum contato encontrado" description={search ? 'Ajuste sua busca.' : 'Adicione o primeiro contato.'} action={!search && <Link to="/contatos/novo"><Button className="gap-2"><Plus className="w-4 h-4" /> Novo Contato</Button></Link>} />
      ) : (
        <>
          <DataTable columns={columns} data={paged} isLoading={isLoading} />
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isLoading={isDeleting} title="Excluir Contato" description={`Excluir "${deleteTarget?.nome}"?`} confirmLabel="Excluir" />
    </div>
  );
}