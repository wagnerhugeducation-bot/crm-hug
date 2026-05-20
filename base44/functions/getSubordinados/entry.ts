import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = user?.data?.role || user?.role;

    // Admin retorna todos os usuários ativos
    if (user.role === 'admin' || userRole === 'Administrador') {
      const todos = await base44.asServiceRole.entities.User.list();
      return Response.json({ subordinados: todos });
    }

    // Gestor: retorna ele mesmo + seus Comerciais + Assistentes desses Comerciais
    if (userRole === 'Gestor') {
      const todos = await base44.asServiceRole.entities.User.list();
      const gestorEmail = user.email;

      const comerciaisDoGestor = todos.filter(
        u => u.role === 'Comercial' && u.gestor_id === gestorEmail
      );
      const emailsComerciais = comerciaisDoGestor.map(u => u.email);

      const assistentesDoGestor = todos.filter(
        u => u.role === 'Assistente' && emailsComerciais.includes(u.comercial_id)
      );

      const gestorUser = todos.find(u => u.email === gestorEmail);
      const subordinados = [
        ...(gestorUser ? [gestorUser] : []),
        ...comerciaisDoGestor,
        ...assistentesDoGestor,
      ];

      return Response.json({ subordinados });
    }

    // Outros roles: sem subordinados
    return Response.json({ subordinados: [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});