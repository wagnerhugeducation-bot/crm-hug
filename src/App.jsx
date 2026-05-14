import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Toaster as Sonner } from 'sonner';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Layout
import AppLayout from '@/components/layout/AppLayout';
import AcessoBloqueado from '@/components/AcessoBloqueado';

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
import Relatorios from '@/pages/Relatorios';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, userProfile, navigateToLogin, user } = useAuth();

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

  if (authError?.type === 'user_not_registered') return <UserNotRegisteredError />;

  // Rotas públicas de autenticação
  const publicRoutes = (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  // Usuário não autenticado → login
  if (!isAuthenticated) return publicRoutes;

  // Usuário autenticado mas pendente/bloqueado (admins do sistema nunca bloqueados)
  if (userProfile && user?.role !== 'admin' && (userProfile.status_acesso === 'Pendente' || userProfile.status_acesso === 'Bloqueado')) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<AcessoBloqueado />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Rotas públicas (caso já logado, redireciona) */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />

        <Route path="/orgaos" element={<OrgaosList />} />
        <Route path="/orgaos/novo" element={<OrgaoForm />} />
        <Route path="/orgaos/:id" element={<OrgaoDetail />} />
        <Route path="/orgaos/:id/editar" element={<OrgaoForm />} />

        <Route path="/contatos" element={<ContatosList />} />
        <Route path="/contatos/novo" element={<ContatoForm />} />
        <Route path="/contatos/:id" element={<ContatoDetail />} />
        <Route path="/contatos/:id/editar" element={<ContatoForm />} />

        <Route path="/oportunidades" element={<OportunidadesList />} />
        <Route path="/oportunidades/nova" element={<OportunidadeForm />} />
        <Route path="/oportunidades/:id" element={<OportunidadeDetail />} />
        <Route path="/oportunidades/:id/editar" element={<OportunidadeForm />} />
        <Route path="/oportunidades/:id/bant" element={<BANTForm />} />

        <Route path="/tarefas" element={<TarefasList />} />
        <Route path="/tarefas/nova" element={<TarefaForm />} />
        <Route path="/tarefas/:id/editar" element={<TarefaForm />} />

        <Route path="/documentos" element={<DocumentosList />} />
        <Route path="/documentos/novo" element={<DocumentoForm />} />
        <Route path="/documentos/:id/editar" element={<DocumentoForm />} />

        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/relatorios" element={<Relatorios />} />
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