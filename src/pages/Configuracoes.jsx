import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { Save, User, Shield } from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'assistente', label: 'Assistente' },
  { value: 'visualizacao', label: 'Visualização' },
];

export default function Configuracoes() {
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: '', role: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name || '', role: user.role || 'comercial' });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await base44.auth.updateMe({ role: form.role });
    toast.success('Perfil atualizado!');
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Configurações" subtitle="Gerencie seu perfil e preferências" />

      <div className="space-y-5">
        {/* Profile */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Meu Perfil</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome Completo</Label>
              <Input value={form.full_name} disabled className="mt-1 bg-muted/50" />
              <p className="text-xs text-muted-foreground mt-1">O nome é gerenciado pelo sistema de autenticação.</p>
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={user?.email || ''} disabled className="mt-1 bg-muted/50" />
            </div>
            <div>
              <Label>Perfil de Acesso</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="gap-2">
                <Save className="w-4 h-4" />
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </div>

        {/* Roles info */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Níveis de Acesso</h2>
          </div>
          <div className="space-y-3">
            {[
              { role: 'Administrador', desc: 'Acesso total ao sistema. Gerencia usuários e configurações.' },
              { role: 'Gestor', desc: 'Visualiza e edita todos os dados. Gerencia a equipe comercial.' },
              { role: 'Comercial', desc: 'Gerencia suas oportunidades, contatos e tarefas.' },
              { role: 'Assistente', desc: 'Suporte ao time comercial. Pode criar e editar registros.' },
              { role: 'Visualização', desc: 'Apenas leitura. Não pode criar ou editar registros.' },
            ].map(r => (
              <div key={r.role} className="flex gap-3 p-3 rounded-lg bg-muted/40">
                <div className="w-24 flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">{r.role}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}