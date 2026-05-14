import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/': 'Dashboard',
  '/orgaos': 'Órgãos Públicos',
  '/contatos': 'Contatos',
  '/oportunidades': 'Oportunidades',
  '/tarefas': 'Tarefas',
  '/documentos': 'Documentos',
  '/configuracoes': 'Configurações',
  '/usuarios': 'Usuários',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] ||
    Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path) && path !== '/')?.[1] ||
    'GovCRM Brasil';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <Header onMenuToggle={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}