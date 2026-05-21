import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = user?.data?.role || user?.role;

    // Admin: todas as oportunidades
    if (user.role === 'admin' || userRole === 'Administrador') {
      const todas = await base44.asServiceRole.entities.Oportunidade.list();
      return Response.json({ oportunidades: todas });
    }

    // Gestor: oportunidades onde ele é gestor OU onde seus comerciais são responsáveis
    if (userRole === 'Gestor') {
      const gestorEmail = user.email;
      const todos = await base44.asServiceRole.entities.User.list();

      const comerciaisDoGestor = todos
        .filter(u => u.role === 'Comercial' && u.gestor_id === gestorEmail)
        .map(u => u.email);

      const assistentesDoGestor = todos
        .filter(u => u.role === 'Assistente' && comerciaisDoGestor.includes(u.comercial_id))
        .map(u => u.email);

      const emailsEquipe = [gestorEmail, ...comerciaisDoGestor, ...assistentesDoGestor];

      const todas = await base44.asServiceRole.entities.Oportunidade.list();
      const filtradas = todas.filter(o =>
        emailsEquipe.includes(o.responsavel_id) ||
        emailsEquipe.includes(o.responsavel_gestor_id) ||
        emailsEquipe.includes(o.created_by)
      );
      return Response.json({ oportunidades: filtradas });
    }

    // Comercial / Assistente / outros: oportunidades onde é responsável ou criador
    const email = user.email;
    const todas = await base44.asServiceRole.entities.Oportunidade.list();
    const filtradas = todas.filter(o =>
      o.responsavel_id === email ||
      o.responsavel_gestor_id === email ||
      o.created_by === email
    );
    return Response.json({ oportunidades: filtradas });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});