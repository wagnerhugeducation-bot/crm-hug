import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Clock, ShieldOff, TrendingUp } from 'lucide-react';

export default function AcessoBloqueado() {
  const { userProfile, logout } = useAuth();
  const isPendente = userProfile?.status_acesso === 'Pendente';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-xl tracking-wide">GovCRM</span>
            <span className="text-blue-300 font-medium text-xl"> Brasil</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isPendente ? 'bg-amber-100' : 'bg-red-100'}`}>
            {isPendente
              ? <Clock className="w-8 h-8 text-amber-600" />
              : <ShieldOff className="w-8 h-8 text-red-600" />
            }
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {isPendente ? 'Aguardando aprovação' : 'Acesso bloqueado'}
          </h2>

          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            {isPendente
              ? 'Seu cadastro foi recebido e está aguardando liberação do administrador.'
              : 'Seu acesso está bloqueado. Entre em contato com o administrador.'
            }
          </p>

          <Button variant="outline" className="w-full" onClick={() => logout()}>
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}