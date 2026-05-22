import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useUsuariosMap } from '@/hooks/useUsuariosMap';
import { Plus, CheckSquare, Pencil, Trash2, CheckCircle2, Download, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ExportModal from '@/components/exportacao/ExportModal';

const buildExportFields = (getLabel) => [
  { key: 'titulo', label: 'Título' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'status', label: 'Status' },
  { key: 'prioridade', label: 'Prioridade' },
  { key: 'data_vencimento', label: 'Vencimento' },
  { key: 'responsavel_id', label: 'Responsável', transform: v => getLabel(v) },
  { key: 'created_by', label: 'Criador', transform: v => getLabel(v) },
  { key: 'concluida_em', label: 'Concluída em' },
];
import { Link } from 'react-router-dom';
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

const PAGE_SIZE = 10;

export default function TarefasList() {
  const { user, isAdmin, isGestor } = useAuth();
  const { usuarios, getLabel } = useUsuariosMap();
  const [subordinadosEmails, setSubordinadosEmails] = useState([]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrioridade, setFilterPrioridade] = useState('all');
  const [filterCriador, setFilterCriador] = useState('all');
  const [filterResponsavel, setFilterResponsavel] = useState('all');
  const [filterDataDe, setFilterDataDe] = useState('');
  const [filterDataAte, setFilterDataAte] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const load = async () => {
    if (!user) return;
    setIsLoading(true);

    let tarefas = [];
    if (isAdmin()) {
      // Admin: vê tudo
      tarefas = await base44.entities.Tarefa.list('-created_date');
    } else if (isGestor && isGestor()) {
      // Gestor: carrega subordinados e busca tarefas dele + equipe
      const res = await base44.functions.invoke('getSubordinados', {});
      const subs = res.data?.subordinados || [];
      const emails = [...new Set([user.email, ...subs.map(s => s.email)])];
      setSubordinadosEmails(emails);
      tarefas = await base44.entities.Tarefa.list('-created_date');
      tarefas = tarefas.filter(t =>
        emails.includes(t.responsavel_id) ||
        emails.includes(t.responsavel_gestor_id) ||
        emails.includes(t.created_by)
      );
    } else {
      // Comercial/outros: apenas as tarefas onde é responsável
      tarefas = await base44.entities.Tarefa.list('-created_date');
      tarefas = tarefas.filter(t => t.responsavel_id === user.email || t.created_by === user.email);
    }

    setData(tarefas);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = data.filter(d => {
    const matchSearch = [d.titulo, d.tipo].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchPrioridade = filterPrioridade === 'all' || d.prioridade === filterPrioridade;
    const matchCriador = filterCriador === 'all' || d.created_by === filterCriador;
    const matchResponsavel = filterResponsavel === 'all' || d.responsavel_id === filterResponsavel;
    const venc = d.data_vencimento ? new Date(d.data_vencimento) : null;
    const matchDe = !filterDataDe || (venc && venc >= new Date(filterDataDe + 'T00:00:00'));
    const matchAte = !filterDataAte || (venc && venc <= new Date(filterDataAte + 'T23:59:59'));
    return matchSearch && matchStatus && matchPrioridade && matchCriador && matchResponsavel && matchDe && matchAte;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleConcluir = async (tarefa) => {
    const hoje = new Date();
    const concluida_em = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}T${String(hoje.getHours()).padStart(2,'0')}:${String(hoje.getMinutes()).padStart(2,'0')}`;
    await base44.entities.Tarefa.update(tarefa.id, { status: 'Concluída', concluida_em });
    toast.success('Tarefa concluída!');
    load();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await base44.entities.Tarefa.delete(deleteTarget.id);
    toast.success('Tarefa excluída.');
    setDeleteTarget(null);
    setIsDeleting(false);
    load();
  };

  const columns = [
    { key: 'titulo', label: 'Título', sortable: true },
    { key: 'tipo', label: 'Tipo' },
    { key: 'data_vencimento', label: 'Vencimento', render: v => v ? new Date(v).toLocaleDateString('pt-BR') : '—', sortable: true },
    { key: 'status', label: 'Status', render: v => <StatusBadge value={v} /> },
    { key: 'prioridade', label: 'Prioridade', render: v => <StatusBadge value={v} /> },
    {
      key: 'created_by', label: 'Criador',
      render: v => <span className="text-xs text-muted-foreground">{getLabel(v)}</span>
    },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {row.status !== 'Concluída' && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:text-success" title="Concluir" onClick={() => handleConcluir(row)}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <Link to={`/tarefas/${row.id}/editar`}>
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
        title="Tarefas"
        subtitle={`${data.filter(t => t.status === 'Pendente').length} pendentes`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowExport(true)}>
              <Download className="w-4 h-4" /> Exportar
            </Button>
            <Link to="/tarefas/nova"><Button className="gap-2"><Plus className="w-4 h-4" /> Nova Tarefa</Button></Link>
          </div>
        }
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Buscar tarefa..." className="max-w-xs" />
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {['Pendente', 'Em Andamento', 'Concluída', 'Cancelada'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPrioridade} onValueChange={v => { setFilterPrioridade(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {['Baixa', 'Média', 'Alta', 'Urgente'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            type="date"
            value={filterDataDe}
            onChange={e => { setFilterDataDe(e.target.value); setPage(1); }}
            className="w-36 h-9"
            title="Vencimento a partir de"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input
            type="date"
            value={filterDataAte}
            onChange={e => { setFilterDataAte(e.target.value); setPage(1); }}
            className="w-36 h-9"
            title="Vencimento até"
          />
        </div>
        {(isAdmin() || (isGestor && isGestor())) && usuarios.length > 0 && (
          <>
            <Select value={filterCriador} onValueChange={v => { setFilterCriador(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Criador" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Criadores</SelectItem>
                {usuarios.map(u => (
                  <SelectItem key={u.email} value={u.email}>{getLabel(u.email)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterResponsavel} onValueChange={v => { setFilterResponsavel(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Responsáveis</SelectItem>
                {usuarios.map(u => (
                  <SelectItem key={u.email} value={u.email}>{getLabel(u.email)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>
      {!isLoading && filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Nenhuma tarefa encontrada" description={search ? 'Ajuste sua busca.' : 'Crie a primeira tarefa.'} action={!search && <Link to="/tarefas/nova"><Button className="gap-2"><Plus className="w-4 h-4" /> Nova Tarefa</Button></Link>} />
      ) : (
        <>
          <DataTable columns={columns} data={paged} isLoading={isLoading} />
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isLoading={isDeleting} title="Excluir Tarefa" description={`Excluir "${deleteTarget?.titulo}"?`} confirmLabel="Excluir" />
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        data={filtered}
        fields={buildExportFields(getLabel)}
        title="Tarefas"
      />
    </div>
  );
}