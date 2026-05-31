import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const fetchAsAdmin = async (entity) => {
  const res = await base44.functions.invoke('getAdminData', { entity });
  return res.data?.data || [];
};
import { Plus, FileText, Trash2, ExternalLink, Download } from 'lucide-react';
import ExportModal from '@/components/exportacao/ExportModal';

const EXPORT_FIELDS = [
  { key: 'nome', label: 'Nome' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'versao', label: 'Versão' },
  { key: 'validade', label: 'Validade' },
  { key: 'tamanho_kb', label: 'Tamanho (KB)' },
  { key: 'arquivo_url', label: 'URL do Arquivo' },
];
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const PAGE_SIZE = 10;
const TIPOS = ['Edital', 'Proposta', 'Contrato', 'Ata', 'Certidão', 'Habilitação', 'Termo de Referência', 'Nota Fiscal', 'Outro'];

export default function DocumentosList() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const res = isAdmin() ? await fetchAsAdmin('Documento') : await base44.entities.Documento.list('-created_date');
    setData(res);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = data.filter(d => {
    const matchSearch = [d.nome, d.tipo].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchTipo = filterTipo === 'all' || d.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    setIsDeleting(true);
    await base44.entities.Documento.delete(deleteTarget.id);
    toast.success('Documento excluído.');
    setDeleteTarget(null);
    setIsDeleting(false);
    load();
  };

  const columns = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'validade', label: 'Validade', render: v => v ? new Date(v).toLocaleDateString('pt-BR') : '—' },
    { key: 'versao', label: 'Versão' },
    {
      key: 'arquivo_url', label: 'Arquivo', render: v => v
        ? <a href={v} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline text-xs" onClick={e => e.stopPropagation()}><ExternalLink className="w-3 h-3" /> Abrir</a>
        : '—'
    },
    {
      key: 'actions', label: '', render: (_, row) => (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); setDeleteTarget(row); }}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )
    },
  ];

  return (
    <div>
      <PageHeader
        title="Documentos"
        subtitle={`${data.length} documento(s)`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowExport(true)}>
              <Download className="w-4 h-4" /> Exportar
            </Button>
            <Link to="/documentos/novo"><Button className="gap-2"><Plus className="w-4 h-4" /> Novo Documento</Button></Link>
          </div>
        }
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Buscar documento..." className="max-w-xs" />
        <Select value={filterTipo} onValueChange={v => { setFilterTipo(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {TIPOS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {!isLoading && filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum documento encontrado" />
      ) : (
        <>
          <DataTable columns={columns} data={paged} isLoading={isLoading} />
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isLoading={isDeleting} title="Excluir Documento" description={`Excluir "${deleteTarget?.nome}"?`} confirmLabel="Excluir" />
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        data={filtered}
        fields={EXPORT_FIELDS}
        title="Documentos"
      />
    </div>
  );
}