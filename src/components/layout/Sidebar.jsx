import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Target, CheckSquare,
  FileText, Settings, ChevronRight, X } from
'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
{ icon: LayoutDashboard, label: 'Dashboard', path: '/' },
{ icon: Building2, label: 'Órgãos Públicos', path: '/orgaos' },
{ icon: Users, label: 'Contatos', path: '/contatos' },
{ icon: Target, label: 'Oportunidades', path: '/oportunidades' },
{ icon: CheckSquare, label: 'Tarefas', path: '/tarefas' },
{ icon: FileText, label: 'Documentos', path: '/documentos' }];


const bottomItems = [
{ icon: Settings, label: 'Configurações', path: '/configuracoes' }];


export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { isAdmin, userProfile } = useAuth();

  return (
    <>
      {open &&
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      }

      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300",
        "bg-sidebar border-r border-sidebar-border",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src="https://media.base44.com/images/public/6a04a29ba55526e1615839e1/049c47ac0_elementohug.png"
              alt="HUG elemento"
              className="w-12 h-12 object-contain flex-shrink-0" />
            
            <div className="min-w-0">
              <span className="text-white tracking-wide leading-none font-black text-2xl">HUG</span>
              <span className="block text-sidebar-muted leading-tight mt-0.5 text-xs">life skills education</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-muted hover:text-white ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          <p className="text-sidebar-muted text-xs font-semibold uppercase tracking-wider px-3 mb-3">Menu Principal</p>
          {navItems.map((item) => {
            const active = location.pathname === item.path ||
            item.path !== '/' && location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  active ?
                  "bg-primary-mid/20 text-white border border-primary-mid/30" :
                  "text-sidebar-muted hover:text-white hover:bg-white/5"
                )}>
                
                <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary-mid" : "text-sidebar-muted group-hover:text-white")} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-primary-mid" />}
              </Link>);

          })}


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
                )}>
                
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>);

          })}

          {/* User info */}
          {userProfile &&
          <div className="px-3 py-2.5 mt-2 rounded-lg bg-white/5">
              <p className="text-white text-xs font-medium truncate">{userProfile.full_name || userProfile.email}</p>
              <p className="text-sidebar-muted text-xs truncate">{userProfile.role}</p>
            </div>
          }
        </div>
      </aside>
    </>);

}