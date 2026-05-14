import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import ConfirmModal from '@/components/ui/ConfirmModal';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import { CheckCircle, ShieldOff, ShieldCheck, Trash2, Plus, X } from 'lucide-react';

const ROLES = ['Administrador', 'Gestor', 'Comercial', 'Assistente', 'Visualização'];

export default function GerenciamentoUsuarios() {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Comercial');
  const [isInviting, setIsInviting] = useState(false);

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
    return matchSearch && matchStatus;
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

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole === 'Administrador' ? 'admin' : 'user');
      toast.success(`Convite enviado para ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('Comercial');
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao convidar usuário.');
    } finally {
      setIsInviting(false);
    }
  };

  const columns = [
    {
      key: 'full_name', label: 'Usuário', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-3">
          {row.foto_google
            ? <img src={row.foto_google} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
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
    {
      key: 'role', label: 'Perfil', sortable: true,
      render: (v, row) => (
        <Select
          value={v || 'Comercial'}
          onValueChange={async (newRole) => {
            await base44.entities.User.update(row.id, { role: newRole });
            toast.success('Perfil atualizado.');
            load();
          }}
          disabled={row.email === currentUser?.email}
        >
          <SelectTrigger className="h-7 text-xs w-36 border-0 bg-transparent hover:bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      )
    },
    {
      key: 'status_acesso', label: 'Status',
      render: v => <StatusBadge value={v} />
    },
    {
      key: 'provider', label: 'Provedor',
      render: v => <span className="text-xs text-muted-foreground">{v === 'google' ? 'Google' : 'E-mail'}</span>
    },
    {
      key: 'actions', label: '', render: (_, row) => {
        const isSelf = row.email === currentUser?.email;
        return (
          <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
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
      {/* Filtros e botão convidar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={v => setSearch(v)}
          placeholder="Buscar por nome ou e-mail..."
          className="flex-1 min-w-[200px] max-w-xs"
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
        <Button size="sm" className="gap-1.5" onClick={() => setShowInvite(v => !v)}>
          {showInvite ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showInvite ? 'Cancelar' : 'Convidar Usuário'}
        </Button>
      </div>

      {/* Formulário de convite */}
      {showInvite && (
        <form onSubmit={handleInvite} className="flex flex-wrap gap-3 mb-4 p-4 rounded-lg bg-muted/40 border border-border">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs mb-1 block">E-mail</Label>
            <Input
              type="email"
              placeholder="usuario@empresa.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              required
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Perfil</Label>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" size="sm" disabled={isInviting} className="h-9">
              {isInviting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
          <p className="w-full text-xs text-muted-foreground">
            O usuário receberá um e-mail de convite. Novos usuários ficam com status <strong>Bloqueado</strong> até que você libere o acesso.
          </p>
        </form>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="Nenhum usuário encontrado."
      />

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