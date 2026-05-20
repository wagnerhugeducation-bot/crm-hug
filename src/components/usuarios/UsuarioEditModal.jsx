import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const ROLES = ['Administrador', 'Gestor', 'Comercial', 'Assistente', 'Visualização'];

export default function UsuarioEditModal({ usuario, onClose, onSaved }) {
  const [form, setForm] = useState({ role: '', status_acesso: '', nickname: '', gestor_id: '', comercial_id: '' });
  const [gestores, setGestores] = useState([]);
  const [comerciais, setComerciais] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    setForm({
      role: usuario.role || 'Comercial',
      status_acesso: usuario.status_acesso || 'Pendente',
      nickname: usuario.nickname || '',
      gestor_id: usuario.gestor_id || '',
      comercial_id: usuario.comercial_id || '',
    });
    base44.entities.User.list().then(res => {
      setGestores(res.filter(u => u.role === 'Gestor'));
      setComerciais(res.filter(u => u.role === 'Comercial'));
    });
  }, [usuario]);

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      role: form.role,
      status_acesso: form.status_acesso,
      nickname: form.nickname.trim() || null,
      gestor_id: form.role === 'Comercial' ? (form.gestor_id || null) : null,
      comercial_id: form.role === 'Assistente' ? (form.comercial_id || null) : null,
    };
    await base44.entities.User.update(usuario.id, payload);
    toast.success('Usuário atualizado com sucesso.');
    setIsSaving(false);
    onSaved();
  };

  return (
    <Dialog open={!!usuario} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Nome</Label>
            <Input value={usuario?.full_name || '—'} disabled className="mt-1 bg-muted/50" />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={usuario?.email || ''} disabled className="mt-1 bg-muted/50" />
          </div>
          <div>
            <Label>Apelido (nickname)</Label>
            <Input
              value={form.nickname}
              onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
              placeholder="ex: joaosilva"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Perfil de Acesso</Label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v, gestor_id: '', comercial_id: '' }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}