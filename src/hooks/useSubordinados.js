import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

/**
 * Retorna a lista de usuários que o usuário atual pode atribuir como responsável.
 * Usa backend function para contornar a restrição de RLS do User.list().
 * - Admin: todos os usuários
 * - Gestor: ele mesmo + Comerciais subordinados + Assistentes desses Comerciais
 * - Outros: lista vazia
 */
export function useSubordinados() {
  const { user, userProfile, isAdmin, isGestor } = useAuth();
  const [subordinados, setSubordinados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || (!isAdmin() && !isGestor())) {
      setSubordinados([]);
      setIsLoading(false);
      return;
    }

    base44.functions.invoke('getSubordinados', {})
      .then(res => {
        setSubordinados(res.data?.subordinados || []);
        setIsLoading(false);
      })
      .catch(() => {
        setSubordinados([]);
        setIsLoading(false);
      });
  }, [user?.email, userProfile?.role]);

  const getLabel = (email) => {
    if (!email) return '—';
    const u = subordinados.find(s => s.email === email);
    if (!u) return email;
    return u.nickname || u.full_name || email;
  };

  const podeAtribuir = isAdmin() || isGestor();

  return { subordinados, isLoading, getLabel, podeAtribuir };
}