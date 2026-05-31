import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Função que retorna dados completos para o administrador (bypassa RLS via service role)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = user?.data?.role || user?.role;
    const isAdmin = user.role === 'admin' || userRole === 'Administrador';

    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { entity } = body;

    const entityMap = {
      Oportunidade: base44.asServiceRole.entities.Oportunidade,
      OrgaoPublico: base44.asServiceRole.entities.OrgaoPublico,
      Contato: base44.asServiceRole.entities.Contato,
      Tarefa: base44.asServiceRole.entities.Tarefa,
      Documento: base44.asServiceRole.entities.Documento,
      ScoreBANT: base44.asServiceRole.entities.ScoreBANT,
      AtividadeLog: base44.asServiceRole.entities.AtividadeLog,
    };

    if (!entity || !entityMap[entity]) {
      return Response.json({ error: 'Entidade inválida' }, { status: 400 });
    }

    const data = await entityMap[entity].list('-created_date');
    return Response.json({ data });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});