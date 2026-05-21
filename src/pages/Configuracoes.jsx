import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { Save, User, Shield, Users, KeyRound, AtSign, Gavel } from 'lucide-react';
import GerenciamentoUsuarios from '@/components/usuarios/GerenciamentoUsuarios';
import ModalidadesLicitacao from '@/components/configuracoes/ModalidadesLicitacao';

export default function Configuracoes() {
  const { user, isAdmin } = useAuth();
  const [nickname, setNickname] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaConfirm, setSenhaConfirm] = useState('');
  const [isSavingSenha, setIsSavingSenha] = useState(false);

  const isEmailProvider = user?.provider === 'email' || !user?.provider;

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
    }
  }, [user]);

  const handleSaveNickname = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) { toast.error('O nickname não pode ser vazio.'); return; }
    setIsSavingNickname(true);
    await base44.auth.updateMe({ nickname: nickname.trim() });
    toast.success('Nickname atualizado!');
    setIsSavingNickname(false);
  };

  const handleSaveSenha = async (e) => {
    e.preventDefault();
    if (!senhaAtual || !senhaNova || !senhaConfirm) { toast.error('Preencha todos os campos.'); return; }
    if (senhaNova !== senhaConfirm) { toast.error('A nova senha e a confirmação não coincidem.'); return; }
    if (senhaNova.length < 6) { toast.error('A nova senha deve ter ao menos 6 caracteres.'); return; }
    setIsSavingSenha(true);
    await base44.auth.updateMe({ current_password: senhaAtual, new_password: senhaNova });
    toast.success('Senha alterada com sucesso!');
    setSenhaAtual('');
    setSenhaNova('');
    setSenhaConfirm('');
    setIsSavingSenha(false);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Configurações" subtitle="Gerencie seu perfil e preferências" />

      {/* Meu Perfil */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Meu Perfil</h2>
        </div>
        <div className="space-y-3 max-w-md mb-5">
          <div>
            <Label>Nome Completo</Label>
            <Input value={user?.full_name || ''} disabled className="mt-1 bg-muted/50" />
            <p className="text-xs text-muted-foreground mt-1">O nome é gerenciado pelo sistema de autenticação.</p>
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={user?.email || ''} disabled className="mt-1 bg-muted/50" />
          </div>
        </div>

        {/* Nickname */}
        <form onSubmit={handleSaveNickname} className="max-w-md space-y-3 border-t border-border pt-5">
          <div className="flex items-center gap-2 mb-1">
            <AtSign className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Nickname</h3>
          </div>
          <div>
            <Label>Nickname (nome de exibição)</Label>
            <Input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="ex: joaosilva"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Será exibido no lugar do e-mail em listas e relatórios.</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSavingNickname} className="gap-2">
              <Save className="w-4 h-4" />
              {isSavingNickname ? 'Salvando...' : 'Salvar Nickname'}
            </Button>
          </div>
        </form>
      </div>

      {/* Alterar Senha — somente para usuários com login por e-mail */}
      {isEmailProvider && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <KeyRound className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Alterar Senha</h2>
          </div>
          <form onSubmit={handleSaveSenha} className="space-y-4 max-w-md">
            <div>
              <Label>Senha Atual</Label>
              <Input
                type="password"
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={senhaNova}
                onChange={e => setSenhaNova(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                value={senhaConfirm}
                onChange={e => setSenhaConfirm(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSavingSenha} className="gap-2">
                <Save className="w-4 h-4" />
                {isSavingSenha ? 'Salvando...' : 'Alterar Senha'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Níveis de Acesso */}
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
              <div className="w-28 flex-shrink-0">
                <span className="text-xs font-semibold text-primary">{r.role}</span>
              </div>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modalidades de Licitação — somente admin */}
      {isAdmin() && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Gavel className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Modalidades de Licitação</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Adicione modalidades personalizadas além das opções padrão do sistema. Elas ficarão disponíveis no cadastro de oportunidades.
          </p>
          <ModalidadesLicitacao />
        </div>
      )}

      {/* Gerenciamento de Usuários — somente admin */}
      {isAdmin() && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Gerenciamento de Usuários</h2>
          </div>
          <GerenciamentoUsuarios />
        </div>
      )}
    </div>
  );
}