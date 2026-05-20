import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { ArrowLeft, Save, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const ROLES = ['Administrador', 'Gestor', 'Comercial', 'Assistente', 'Visualização'];

export default function UsuarioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEdit = !!id && id !== 'novo';
  const [form, setForm] = useState({ role: 'Comercial', status_acesso: 'Pendente' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);
  const [gestores, setGestores] = useState([]);
  const [comerciais, setComerciais] = useState([]);

  useEffect(() => {
    if (!isAdmin()) { navigate('/'); return; }
    base44.entities.User.list().then(res => {
      setGestores(res.filter(u => u.role === 'Gestor'));
      setComerciais(res.filter(u => u.role === 'Comercial'));
      if (isEdit) {
        const found = res.find(r => r.id === id);
        if (found) setForm(found);
        setIsFetching(false);
      }
    });
    if (!isEdit) setIsFetching(false);
  }, [id]);

  const handleRoleChange = (role) => {
    // Limpa os campos de hierarquia ao trocar de role
    setForm(f => ({ ...f, role, gestor_id: undefined, comercial_id: undefined }));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsLoading(true);
    try {
      await base44.users.inviteUser(inviteEmail, form.role === 'Administrador' ? 'admin' : 'user');
      toast.success(`Convite enviado para ${inviteEmail}.`);
      navigate('/usuarios');
    } catch (err) {
      toast.error(err.message || 'Falha ao enviar convite.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        role: form.role,
        status_acesso: form.status_acesso,
        gestor_id: form.role === 'Comercial' ? (form.gestor_id || null) : null,
        comercial_id: form.role === 'Assistente' ? (form.comercial_id || null) : null,
      };
      await base44.entities.User.update(id, payload);
      toast.success('Usuário atualizado com sucesso.');
      navigate('/usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar Usuário' : 'Convidar Usuário'}
        subtitle={isEdit ? 'Altere perfil, status e hierarquia' : 'Envie um convite por e-mail'}
        actions={
          <Link to="/usuarios">
            <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button>
          </Link>
        }
      />

      <div className="max-w-lg">
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          {isEdit ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label>E-mail</Label>
                <Input value={form.email || ''} disabled className="mt-1 bg-muted" />
              </div>
              <div>
                <Label>Nome</Label>
                <Input value={form.full_name || ''} disabled className="mt-1 bg-muted" />
              </div>
              <div>
                <Label>Perfil de Acesso</Label>
                <Select value={form.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Comercial → selecionar Gestor */}
              {form.role === 'Comercial' && (
                <div>
                  <Label>Gestor Responsável</Label>
                  <Select value={form.gestor_id || ''} onValueChange={v => setForm(f => ({ ...f, gestor_id: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o gestor" /></SelectTrigger>
                    <SelectContent>
                      {gestores.length === 0
                        ? <SelectItem value="_none" disabled>Nenhum gestor cadastrado</SelectItem>
                        : gestores.map(g => (
                          <SelectItem key={g.email} value={g.email}>
                            {g.nickname || g.full_name || g.email}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Este comercial faz parte da equipe deste gestor.</p>
                </div>
              )}

              {/* Assistente → selecionar Comercial */}
              {form.role === 'Assistente' && (
                <div>
                  <Label>Comercial Supervisor</Label>
                  <Select value={form.comercial_id || ''} onValueChange={v => setForm(f => ({ ...f, comercial_id: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o comercial" /></SelectTrigger>
                    <SelectContent>
                      {comerciais.length === 0
                        ? <SelectItem value="_none" disabled>Nenhum comercial cadastrado</SelectItem>
                        : comerciais.map(c => (
                          <SelectItem key={c.email} value={c.email}>
                            {c.nickname || c.full_name || c.email}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Este assistente é subordinado a este comercial.</p>
                </div>
              )}

              <div>
                <Label>Status de Acesso</Label>
                <Select value={form.status_acesso} onValueChange={v => setForm(f => ({ ...f, status_acesso: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Link to="/usuarios"><Button variant="outline" type="button">Cancelar</Button></Link>
                <Button type="submit" disabled={isLoading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 border border-blue-100">
                O usuário receberá um e-mail de convite. Após aceitar, o acesso fica como <strong>Pendente</strong> até aprovação.
              </div>
              <div>
                <Label>E-mail do Convidado</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="usuario@email.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Perfil de Acesso</Label>
                <Select value={form.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Link to="/usuarios"><Button variant="outline" type="button">Cancelar</Button></Link>
                <Button type="submit" disabled={isLoading} className="gap-2">
                  <Mail className="w-4 h-4" />
                  {isLoading ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}