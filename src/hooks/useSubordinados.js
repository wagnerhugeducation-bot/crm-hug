import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

/**
 * Retorna a lista de usuários que o usuário atual pode atribuir como responsável:
 * - Admin: todos os usuários
 * - Gestor: ele mesmo + seus subordinados diretos (Comerciais com gestor_id = gestor.email)
 *           + Assistentes cujo comercial supervisor é subordinado do gestor
 * - Outros: lista vazia (não podem atribuir)
 */
export function useSubordinados() {
  const { user, userProfile, isAdmin, isGestor } = useAuth();
  const [subordinados, setSubordinados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    base44.entities.User.list()
      .then(todos => {
        if (isAdmin()) {
          // Admin vê todos
          setSubordinados(todos);
        } else if (isGestor()) {
          const gestorEmail = user.email;

          // Comerciais cujo gestor_id é este gestor
          const comerciaisDoGestor = todos.filter(
            u => u.role === 'Comercial' && u.gestor_id === gestorEmail
          );
          const emailsComerciais = comerciaisDoGestor.map(u => u.email);

          // Assistentes cujo comercial_id é um dos comerciais do gestor
          const assistentesDoGestor = todos.filter(
            u => u.role === 'Assistente' && emailsComerciais.includes(u.comercial_id)
          );

          // O próprio gestor + subordinados
          const gestorUser = todos.find(u => u.email === gestorEmail);
          const lista = [
            ...(gestorUser ? [gestorUser] : []),
            ...comerciaisDoGestor,
            ...assistentesDoGestor,
          ];

          setSubordinados(lista);
        } else {
          setSubordinados([]);
        }
        setIsLoading(false);
      })
      .catch(() => {
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