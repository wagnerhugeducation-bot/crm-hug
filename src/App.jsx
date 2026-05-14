import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Toaster as Sonner } from 'sonner';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import Dashboard from '@/pages/Dashboard';
import OrgaosList from '@/pages/orgaos/OrgaosList';
import OrgaoForm from '@/pages/orgaos/OrgaoForm';
import OrgaoDetail from '@/pages/orgaos/OrgaoDetail';
import ContatosList from '@/pages/contatos/ContatosList';
import ContatoForm from '@/pages/contatos/ContatoForm';
import ContatoDetail from '@/pages/contatos/ContatoDetail';
import OportunidadesList from '@/pages/oportunidades/OportunidadesList';
import OportunidadeForm from '@/pages/oportunidades/OportunidadeForm';
import OportunidadeDetail from '@/pages/oportunidades/OportunidadeDetail';
import BANTForm from '@/pages/oportunidades/BANTForm';
import TarefasList from '@/pages/tarefas/TarefasList';
import TarefaForm from '@/pages/tarefas/TarefaForm';
import DocumentosList from '@/pages/documentos/DocumentosList';
import DocumentoForm from '@/pages/documentos/DocumentoForm';
import Configuracoes from '@/pages/Configuracoes';
import UsuariosList from '@/pages/usuarios/UsuariosList';
import UsuarioForm from '@/pages/usuarios/UsuarioForm';
import AcessoBloqueado from '@/components/AcessoBloqueado';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated, userProfile } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  // Bloqueia usuários não-ativos após autenticação
  if (isAuthenticated && userProfile) {
    if (userProfile.status_acesso === 'Pendente' || userProfile.status_acesso === 'Bloqueado') {
      return <AcessoBloqueado />;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Órgãos */}
        <Route path="/orgaos" element={<OrgaosList />} />
        <Route path="/orgaos/novo" element={<OrgaoForm />} />
        <Route path="/orgaos/:id" element={<OrgaoDetail />} />
        <Route path="/orgaos/:id/editar" element={<OrgaoForm />} />

        {/* Contatos */}
        <Route path="/contatos" element={<ContatosList />} />
        <Route path="/contatos/novo" element={<ContatoForm />} />
        <Route path="/contatos/:id" element={<ContatoDetail />} />
        <Route path="/contatos/:id/editar" element={<ContatoForm />} />

        {/* Oportunidades */}
        <Route path="/oportunidades" element={<OportunidadesList />} />
        <Route path="/oportunidades/nova" element={<OportunidadeForm />} />
        <Route path="/oportunidades/:id" element={<OportunidadeDetail />} />
        <Route path="/oportunidades/:id/editar" element={<OportunidadeForm />} />
        <Route path="/oportunidades/:id/bant" element={<BANTForm />} />

        {/* Tarefas */}
        <Route path="/tarefas" element={<TarefasList />} />
        <Route path="/tarefas/nova" element={<TarefaForm />} />
        <Route path="/tarefas/:id/editar" element={<TarefaForm />} />

        {/* Documentos */}
        <Route path="/documentos" element={<DocumentosList />} />
        <Route path="/documentos/novo" element={<DocumentoForm />} />
        <Route path="/documentos/:id/editar" element={<DocumentoForm />} />

        {/* Configurações */}
        <Route path="/configuracoes" element={<Configuracoes />} />

        {/* Usuários (admin only) */}
        <Route path="/usuarios" element={<UsuariosList />} />
        <Route path="/usuarios/novo" element={<UsuarioForm />} />
        <Route path="/usuarios/:id/editar" element={<UsuarioForm />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <Sonner richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;