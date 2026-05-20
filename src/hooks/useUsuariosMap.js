import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Retorna um map { email: { nickname, full_name, id } } e a lista de usuários.
 * Usado para exibir o criador em oportunidades e tarefas.
 */
export function useUsuariosMap() {
  const [usuariosMap, setUsuariosMap] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    base44.entities.User.list().then(res => {
      const map = {};
      res.forEach(u => { map[u.email] = u; });
      setUsuariosMap(map);
      setUsuarios(res);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
      // Usuários sem permissão de listar (ex: Comercial) retornam lista vazia silenciosamente
    });
  }, []);

  const getLabel = (email) => {
    if (!email) return '—';
    const u = usuariosMap[email];
    if (!u) return email;
    return u.nickname || u.full_name || email;
  };

  return { usuariosMap, usuarios, isLoading, getLabel };
}