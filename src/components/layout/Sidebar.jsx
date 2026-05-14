import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Target, CheckSquare,
  FileText, Settings, ChevronRight, X, TrendingUp, UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Building2, label: 'Órgãos Públicos', path: '/orgaos' },
  { icon: Users, label: 'Contatos', path: '/contatos' },
  { icon: Target, label: 'Oportunidades', path: '/oportunidades' },
  { icon: CheckSquare, label: 'Tarefas', path: '/tarefas' },
  { icon: FileText, label: 'Documentos', path: '/documentos' },
];

const bottomItems = [
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { isAdmin, userProfile } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300",
        "bg-sidebar border-r border-sidebar-border",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-mid flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-wide">GovCRM</span>
              <span className="block text-sidebar-muted text-xs">Brasil</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          <p className="text-sidebar-muted text-xs font-semibold uppercase tracking-wider px-3 mb-3">Menu Principal</p>
          {navItems.map((item) => {
            const active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  active
                    ? "bg-primary-mid/20 text-white border border-primary-mid/30"
                    : "text-sidebar-muted hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary-mid" : "text-sidebar-muted group-hover:text-white")} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-primary-mid" />}
              </Link>
            );
          })}

          {/* Admin-only: Usuários */}
          {isAdmin() && (
            <>
              <p className="text-sidebar-muted text-xs font-semibold uppercase tracking-wider px-3 mt-4 mb-2">Administração</p>
              {(() => {
                const active = location.pathname.startsWith('/usuarios');
                return (
                  <Link
                    to="/usuarios"
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                      active
                        ? "bg-primary-mid/20 text-white border border-primary-mid/30"
                        : "text-sidebar-muted hover:text-white hover:bg-white/5"
                    )}
                  >
                    <UserCog className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary-mid" : "text-sidebar-muted group-hover:text-white")} />
                    <span className="flex-1">Usuários</span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-primary-mid" />}
                  </Link>
                );
              })()}
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-sidebar-border pt-3 space-y-1">
          {bottomItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active ? "bg-primary-mid/20 text-white" : "text-sidebar-muted hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* User info */}
          {userProfile && (
            <div className="px-3 py-2.5 mt-2 rounded-lg bg-white/5">
              <p className="text-white text-xs font-medium truncate">{userProfile.full_name || userProfile.email}</p>
              <p className="text-sidebar-muted text-xs truncate">{userProfile.role}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}