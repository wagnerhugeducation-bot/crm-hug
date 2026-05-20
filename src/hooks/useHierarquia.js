import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Retorna funções para resolver a hierarquia de um usuário.
 * Dado o email de um responsável, retorna os campos gestor e comercial
 * para serem salvos nos registros de dados.
 */
export function useHierarquia() {
  const [usuariosMap, setUsuariosMap] = useState({});

  useEffect(() => {
    base44.entities.User.list().then(res => {
      const map = {};
      res.forEach(u => { map[u.email] = u; });
      setUsuariosMap(map);
    }).catch(() => {});
  }, []);

  /**
   * Dado o email do responsável selecionado, retorna:
   * { responsavel_gestor_id, responsavel_comercial_id }
   */
  const resolverHierarquia = (responsavelEmail) => {
    if (!responsavelEmail) return { responsavel_gestor_id: null, responsavel_comercial_id: null };

    const responsavel = usuariosMap[responsavelEmail];
    if (!responsavel) return { responsavel_gestor_id: null, responsavel_comercial_id: null };

    // Comercial → gestor_id aponta para o gestor
    // Assistente → comercial_id aponta para o comercial, e o comercial tem gestor_id
    if (responsavel.role === 'Comercial') {
      return {
        responsavel_gestor_id: responsavel.gestor_id || null,
        responsavel_comercial_id: null,
      };
    }

    if (responsavel.role === 'Assistente') {
      const comercial = responsavel.comercial_id ? usuariosMap[responsavel.comercial_id] : null;
      return {
        responsavel_gestor_id: comercial?.gestor_id || null,
        responsavel_comercial_id: responsavel.comercial_id || null,
      };
    }

    // Gestor, Administrador, Visualização — sem campos de hierarquia abaixo
    return { responsavel_gestor_id: null, responsavel_comercial_id: null };
  };

  return { resolverHierarquia, usuariosMap };
}