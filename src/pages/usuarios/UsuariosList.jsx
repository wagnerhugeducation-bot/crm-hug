import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Pencil, Trash2, ShieldCheck, ShieldOff, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmModal from '@/components/ui/ConfirmModal';
import StatusBadge from '@/components/ui/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function UsuariosList() {
  const { isAdmin, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redireciona se não for admin
  useEffect(() => {
    if (!isAdmin()) navigate('/');
  }, []);

  const load = async () => {
    setIsLoading(true);
    const res = await base44.entities.User.list('-created_date');
    setData(res);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = data.filter(d => {
    const matchSearch = [d.full_name, d.email].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'all' || d.status_acesso === filterStatus;
    const matchRole = filterRole === 'all' || d.role === filterRole;
    return matchSearch && matchStatus && matchRole;
  });

  const handleLiberar = async (usuario) => {
    await base44.entities.User.update(usuario.id, { status_acesso: 'Ativo' });
    toast.success(`${usuario.full_name || usuario.email} liberado com sucesso.`);
    load();
  };

  const handleBloquear = async (usuario) => {
    await base44.entities.User.update(usuario.id, { status_acesso: 'Bloqueado' });
    toast.success(`${usuario.full_name || usuario.email} bloqueado.`);
    load();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await base44.entities.User.delete(deleteTarget.id);
    toast.success('Usuário excluído.');
    setDeleteTarget(null);
    setIsDeleting(false);
    load();
  };

  const columns = [
    {
      key: 'full_name', label: 'Nome', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-3">
          {row.foto_google
            ? <img src={row.foto_google} alt="" className="w-8 h-8 rounded-full object-cover" />
            : <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {(v || row.email || '?').charAt(0).toUpperCase()}
                </span>
              </div>
          }
          <div>
            <p className="text-sm font-medium">{v || '—'}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      )
    },
    { key: 'role', label: 'Perfil', sortable: true, render: v => v || '—' },
    {
      key: 'status_acesso', label: 'Status',
      render: v => <StatusBadge value={v} />
    },
    { key: 'provider', label: 'Provedor', render: v => v === 'google' ? 'Google' : 'E-mail' },
    {
      key: 'actions', label: '', render: (_, row) => {
        const isSelf = row.email === currentUser?.email;
        return (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {row.status_acesso === 'Pendente' && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600 hover:text-green-700 gap-1"
                onClick={() => handleLiberar(row)}>
                <CheckCircle className="w-3.5 h-3.5" /> Liberar
              </Button>
            )}
            {row.status_acesso === 'Ativo' && !isSelf && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-600 hover:text-amber-700 gap-1"
                onClick={() => handleBloquear(row)}>
                <ShieldOff className="w-3.5 h-3.5" /> Bloquear
              </Button>
            )}
            {row.status_acesso === 'Bloqueado' && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600 hover:text-green-700 gap-1"
                onClick={() => handleLiberar(row)}>
                <ShieldCheck className="w-3.5 h-3.5" /> Reativar
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => navigate(`/usuarios/${row.id}/editar`)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {!isSelf && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(row)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      }
    },
  ];

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle={`${data.length} usuário(s) cadastrado(s)`}
        actions={
          <Button className="gap-2" onClick={() => navigate('/usuarios/novo')}>
            <Plus className="w-4 h-4" /> Convidar Usuário
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={v => setSearch(v)}
          placeholder="Buscar por nome ou e-mail..."
          className="flex-1 min-w-[200px] max-w-sm"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Bloqueado">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Perfil" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Perfis</SelectItem>
            {['Administrador', 'Gestor', 'Comercial', 'Assistente', 'Visualização'].map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="Nenhum usuário encontrado." />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir "${deleteTarget?.full_name || deleteTarget?.email}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}