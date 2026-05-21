import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useUsuariosMap } from '@/hooks/useUsuariosMap';
import { Plus, Target, Pencil, Trash2, Eye, Download } from 'lucide-react';
import ExportModal from '@/components/exportacao/ExportModal';

const buildExportFields = (getLabel, orgaos) => [
  { key: 'nome', label: 'Nome' },
  { key: 'orgao_id', label: 'Órgão', transform: v => orgaos[v] || v || '' },
  { key: 'status', label: 'Status' },
  { key: 'etapa_pipeline', label: 'Etapa Pipeline' },
  { key: 'tipo_licitacao', label: 'Modalidade' },
  { key: 'numero_edital', label: 'Nº Edital' },
  { key: 'valor_estimado', label: 'Valor Estimado' },
  { key: 'probabilidade', label: 'Probabilidade (%)' },
  { key: 'data_abertura', label: 'Data Abertura' },
  { key: 'data_fechamento', label: 'Previsão Fechamento' },
  { key: 'data_entrega_proposta', label: 'Prazo Proposta' },
  { key: 'responsavel_id', label: 'Responsável', transform: v => getLabel(v) },
  { key: 'concorrentes', label: 'Concorrentes' },
  { key: 'notas', label: 'Observações' },
];
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BANTGauge from '@/components/bant/BANTGauge';
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

export default function OportunidadesList() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { usuarios, getLabel } = useUsuariosMap();
  const [data, setData] = useState([]);
  const [orgaos, setOrgaos] = useState({});
  const [bantMap, setBantMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEtapa, setFilterEtapa] = useState('all');
  const [filterModalidade, setFilterModalidade] = useState('all');
  const [filterCriador, setFilterCriador] = useState('all');
  const [filterResponsavel, setFilterResponsavel] = useState('all');
  const [modalidades, setModalidades] = useState([]);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const LICITACOES_PADRAO = [
    'Pregão Eletrônico', 'Pregão Presencial', 'Concorrência',
    'Tomada de Preços', 'Convite', 'Dispensa', 'Inexigibilidade', 'RDC', 'Leilão'
  ];

  const load = async () => {
    if (!user) return;
    setIsLoading(true);
    const [ops, orgList, bantList, modList] = await Promise.all([
      base44.entities.Oportunidade.list('-created_date'),
      base44.entities.OrgaoPublico.list(),
      base44.entities.ScoreBANT.list(),
      base44.entities.ModalidadeLicitacao.list(),
    ]);
    setModalidades([...LICITACOES_PADRAO, ...modList.map(m => m.nome)]);
    const map = {};
    orgList.forEach(o => { map[o.id] = o.nome; });
    setOrgaos(map);
    const bm = {};
    bantList.forEach(b => { bm[b.oportunidade_id] = b; });
    setBantMap(bm);
    setData(ops);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = data.filter(d => {
    const matchSearch = [d.nome, orgaos[d.orgao_id], d.numero_edital, d.tipo_licitacao].some(
      f => f?.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchEtapa = filterEtapa === 'all' || d.etapa_pipeline === filterEtapa;
    const matchModalidade = filterModalidade === 'all' || d.tipo_licitacao === filterModalidade;
    const matchCriador = filterCriador === 'all' || d.created_by === filterCriador;
    const matchResponsavel = filterResponsavel === 'all' || d.responsavel_id === filterResponsavel;
    return matchSearch && matchStatus && matchEtapa && matchModalidade && matchCriador && matchResponsavel;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    setIsDeleting(true);
    await base44.entities.Oportunidade.delete(deleteTarget.id);
    toast.success('Oportunidade excluída com sucesso.');
    setDeleteTarget(null);
    setIsDeleting(false);
    load();
  };

  const columns = [
    { key: 'nome', label: 'Nome', sortable: true },
    {
      key: 'orgao_id', label: 'Órgão',
      render: v => <span className="truncate max-w-[160px] block">{orgaos[v] || '—'}</span>
    },
    { key: 'etapa_pipeline', label: 'Etapa', render: v => <StatusBadge value={v} /> },
    { key: 'status', label: 'Status', render: v => <StatusBadge value={v} /> },
    {
      key: 'valor_estimado', label: 'Valor Est.',
      render: v => v ? `R$ ${Number(v).toLocaleString('pt-BR')}` : '—',
      sortable: true
    },
    {
      key: 'probabilidade', label: '%',
      render: v => v ? `${v}%` : '—'
    },
    {
      key: 'id', label: 'BANT',
      render: (v) => {
        const b = bantMap[v];
        return <BANTGauge score={b?.total_score ?? null} size="sm" />;
      }
    },
    {
      key: 'created_by', label: 'Criador',
      render: v => <span className="text-xs text-muted-foreground">{getLabel(v)}</span>
    },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar" onClick={() => navigate(`/oportunidades/${row.id}`)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => navigate(`/oportunidades/${row.id}/editar`)}>
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
        title="Oportunidades"
        subtitle={`${data.length} oportunidade(s) cadastrada(s)`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowExport(true)}>
              <Download className="w-4 h-4" /> Exportar
            </Button>
            <Link to="/oportunidades/nova">
              <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Oportunidade</Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={v => { setSearch(v); setPage(1); }}
          placeholder="Buscar por nome, órgão, edital..."
          className="flex-1 min-w-[200px] max-w-sm"
        />
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {['Aberta', 'Em Andamento', 'Ganha', 'Perdida', 'Cancelada'].map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterEtapa} onValueChange={v => { setFilterEtapa(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Etapas</SelectItem>
            {['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'].map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterModalidade} onValueChange={v => { setFilterModalidade(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Modalidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Modalidades</SelectItem>
            {modalidades.map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin() && usuarios.length > 0 && (
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
        <EmptyState
          icon={Target}
          title="Nenhuma oportunidade encontrada"
          description={search ? 'Tente ajustar sua busca ou filtros.' : 'Cadastre a primeira oportunidade.'}
          action={!search && (
            <Link to="/oportunidades/nova">
              <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Oportunidade</Button>
            </Link>
          )}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paged}
            isLoading={isLoading}
            onRowClick={row => navigate(`/oportunidades/${row.id}`)}
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
        title="Excluir Oportunidade"
        description={`Tem certeza que deseja excluir "${deleteTarget?.nome}"?`}
        confirmLabel="Excluir"
      />
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        data={filtered}
        fields={buildExportFields(getLabel, orgaos)}
        title="Oportunidades"
      />
    </div>
  );
}