import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Retorna funções para resolver a hierarquia de um usuário.
 * Dado o email de um responsável, retorna os campos gestor e comercial
 * para serem salvos nos registros de dados.
 *
 * IMPORTANTE: resolverHierarquiaAsync busca os dados frescos do servidor,
 * garantindo que a hierarquia seja sempre resolvida corretamente,
 * mesmo que o mapa local ainda não tenha carregado.
 */
export function useHierarquia() {
  const [usuariosMap, setUsuariosMap] = useState({});
  const usuariosMapRef = useRef({});

  useEffect(() => {
    base44.entities.User.list().then(res => {
      const map = {};
      res.forEach(u => { map[u.email] = u; });
      usuariosMapRef.current = map;
      setUsuariosMap(map);
    }).catch(() => {});
  }, []);

  /**
   * Versão SÍNCRONA — só funciona se o mapa já carregou.
   * Use resolverHierarquiaAsync nos submits de formulários.
   */
  const resolverHierarquia = (responsavelEmail) => {
    return _resolver(responsavelEmail, usuariosMapRef.current);
  };

  /**
   * Versão ASSÍNCRONA — busca dados frescos do servidor antes de resolver.
   * Use esta versão em onSubmit para garantir dados atualizados.
   * @param responsavelEmail - email do responsável a resolver
   * @param selfProfile - (opcional) objeto com os dados do próprio usuário logado (ex: userProfile do AuthContext),
   *   usado como fallback quando ele não tem permissão para listar todos os usuários (ex: role Comercial)
   */
  const resolverHierarquiaAsync = async (responsavelEmail, selfProfile = null) => {
    if (!responsavelEmail) return { responsavel_gestor_id: null, responsavel_comercial_id: null };
    try {
      // Busca dados frescos para garantir que gestor_id/comercial_id estejam atualizados
      const usuarios = await base44.entities.User.list();
      const map = {};
      usuarios.forEach(u => { map[u.email] = u; });
      usuariosMapRef.current = map;
      setUsuariosMap(map);
      return _resolver(responsavelEmail, map);
    } catch {
      // Se não tiver permissão para listar usuários (ex: Comercial), usa o mapa local já carregado.
      // Se o mapa local também estiver vazio, tenta resolver com selfProfile como fallback.
      const localMap = { ...usuariosMapRef.current };
      if (selfProfile && !localMap[responsavelEmail]) {
        localMap[responsavelEmail] = selfProfile;
      }
      return _resolver(responsavelEmail, localMap);
    }
  };

  return { resolverHierarquia, resolverHierarquiaAsync, usuariosMap };
}

function _resolver(responsavelEmail, map) {
  if (!responsavelEmail) return { responsavel_gestor_id: null, responsavel_comercial_id: null };

  const responsavel = map[responsavelEmail];
  if (!responsavel) return { responsavel_gestor_id: null, responsavel_comercial_id: null };

  // Comercial → gestor_id aponta para o gestor ao qual é subordinado
  if (responsavel.role === 'Comercial') {
    return {
      responsavel_gestor_id: responsavel.gestor_id || null,
      responsavel_comercial_id: null,
    };
  }

  // Assistente → comercial_id aponta para o comercial, e o comercial tem gestor_id
  if (responsavel.role === 'Assistente') {
    const comercial = responsavel.comercial_id ? map[responsavel.comercial_id] : null;
    return {
      responsavel_gestor_id: comercial?.gestor_id || null,
      responsavel_comercial_id: responsavel.comercial_id || null,
    };
  }

  // Gestor → responsavel_gestor_id é o próprio email (RLS permite acesso)
  if (responsavel.role === 'Gestor') {
    return {
      responsavel_gestor_id: responsavel.email || responsavelEmail,
      responsavel_comercial_id: null,
    };
  }

  // Administrador, Visualização — sem hierarquia
  return { responsavel_gestor_id: null, responsavel_comercial_id: null };
}