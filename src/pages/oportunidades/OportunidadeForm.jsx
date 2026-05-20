import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useUsuariosMap } from '@/hooks/useUsuariosMap';
import { useHierarquia } from '@/hooks/useHierarquia';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const defaultForm = {
  orgao_id: '', nome: '', descricao: '', valor_estimado: '',
  status: 'Aberta', etapa_pipeline: 'Prospecção', tipo_licitacao: '',
  numero_edital: '', data_abertura: '', data_fechamento: '',
  data_entrega_proposta: '', probabilidade: '', concorrentes: '', notas: ''
};

const LICITACOES = [
  'Pregão Eletrônico', 'Pregão Presencial', 'Concorrência',
  'Tomada de Preços', 'Convite', 'Dispensa', 'Inexigibilidade', 'RDC', 'Leilão'
];

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

export default function OportunidadeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { usuarios, getLabel } = useUsuariosMap();
  const { resolverHierarquiaAsync } = useHierarquia();
  const isEdit = !!id && id !== 'nova';
  const [form, setForm] = useState(defaultForm);
  const [orgaos, setOrgaos] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orgaoId = params.get('orgao_id');
    base44.entities.OrgaoPublico.list().then(res => setOrgaos(res));
    if (isEdit) {
      base44.entities.Oportunidade.list().then(res => {
        const found = res.find(r => r.id === id);
        if (found) setForm({ ...defaultForm, ...found });
        setIsFetching(false);
      });
    } else if (orgaoId) {
      setForm(f => ({ ...f, orgao_id: orgaoId }));
    }
  }, [id]);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nome.trim()) errs.nome = 'Nome da oportunidade é obrigatório.';
    if (form.valor_estimado && isNaN(Number(form.valor_estimado))) {
      errs.valor_estimado = 'Valor deve ser numérico.';
    }
    if (form.probabilidade) {
      const p = Number(form.probabilidade);
      if (isNaN(p) || p < 0 || p > 100) errs.probabilidade = 'Probabilidade deve ser entre 0 e 100.';
    }
    if (form.data_abertura && form.data_fechamento && form.data_abertura > form.data_fechamento) {
      errs.data_fechamento = 'Data de fechamento deve ser após a data de abertura.';
    }
    return errs;
  };

  const logAtividade = async (oportunidadeId, tipo, descricao, campo, valorAnterior, valorNovo) => {
    await base44.entities.AtividadeLog.create({
      oportunidade_id: oportunidadeId,
      tipo,
      campo: campo || null,
      valor_anterior: valorAnterior != null ? String(valorAnterior) : null,
      valor_novo: valorNovo != null ? String(valorNovo) : null,
      descricao,
      usuario_email: user?.email || null,
      usuario_nome: getLabel(user?.email) || user?.email || null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Corrija os campos destacados.');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        ...form,
        valor_estimado: form.valor_estimado !== '' ? Number(form.valor_estimado) : null,
        probabilidade: form.probabilidade !== '' ? Number(form.probabilidade) : null,
      };
      if (!isEdit) {
        payload.created_by_user_id = user?.id;
        const responsavelFinal = isAdmin() ? (form.responsavel_id || user?.email) : user?.email;
        payload.responsavel_id = responsavelFinal;
        const hierarquia = await resolverHierarquiaAsync(responsavelFinal);
        payload.responsavel_gestor_id = hierarquia.responsavel_gestor_id;
        payload.responsavel_comercial_id = hierarquia.responsavel_comercial_id;
        const nova = await base44.entities.Oportunidade.create(payload);
        await logAtividade(nova.id, 'criacao', `Oportunidade "${nova.nome}" criada.`);
        toast.success('Oportunidade cadastrada com sucesso.');
      } else {
        // Buscar estado anterior para detectar mudanças
        const [anterior] = await base44.entities.Oportunidade.filter({ id });
        if (payload.responsavel_id) {
          const hierarquia = await resolverHierarquiaAsync(payload.responsavel_id);
          payload.responsavel_gestor_id = hierarquia.responsavel_gestor_id;
          payload.responsavel_comercial_id = hierarquia.responsavel_comercial_id;
        }
        await base44.entities.Oportunidade.update(id, payload);

        const logs = [];
        if (anterior?.status !== payload.status) {
          logs.push(logAtividade(id, 'status', `Status alterado.`, 'Status', anterior?.status, payload.status));
        }
        if (anterior?.etapa_pipeline !== payload.etapa_pipeline) {
          logs.push(logAtividade(id, 'etapa', `Etapa do pipeline alterada.`, 'Etapa', anterior?.etapa_pipeline, payload.etapa_pipeline));
        }
        if (anterior?.valor_estimado !== payload.valor_estimado) {
          const fmtBRL = (v) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR')}` : '—';
          logs.push(logAtividade(id, 'valor', `Valor estimado alterado.`, 'Valor', fmtBRL(anterior?.valor_estimado), fmtBRL(payload.valor_estimado)));
        }
        if (anterior?.notas !== payload.notas && payload.notas) {
          logs.push(logAtividade(id, 'notas', `Observações atualizadas.`, 'Notas', null, null));
        }
        if (logs.length === 0) {
          logs.push(logAtividade(id, 'edicao_geral', `Oportunidade editada.`));
        }
        await Promise.all(logs);
        toast.success('Oportunidade atualizada com sucesso.');
      }
      navigate('/oportunidades');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar Oportunidade' : 'Nova Oportunidade'}
        subtitle="Preencha os dados da oportunidade comercial"
        actions={
          <Link to="/oportunidades">
            <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
        {/* Informações Gerais */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold pb-2 border-b border-border">Informações Gerais</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Órgão Público</Label>
              <Select value={form.orgao_id} onValueChange={v => set('orgao_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o órgão (opcional)" /></SelectTrigger>
                <SelectContent>
                  {orgaos.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Nome da Oportunidade <span className="text-destructive">*</span></Label>
              <Input
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
                placeholder="Ex: Fornecimento de Software de Gestão Tributária"
                className={cn("mt-1", errors.nome && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError msg={errors.nome} />
            </div>
            <div className="sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
                placeholder="Descreva a oportunidade em detalhes..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
            <div>
              <Label>Valor Estimado (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.valor_estimado}
                onChange={e => set('valor_estimado', e.target.value)}
                placeholder="0,00"
                className={cn("mt-1", errors.valor_estimado && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError msg={errors.valor_estimado} />
            </div>
            <div>
              <Label>Probabilidade de Fechamento (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.probabilidade}
                onChange={e => set('probabilidade', e.target.value)}
                placeholder="0 – 100"
                className={cn("mt-1", errors.probabilidade && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError msg={errors.probabilidade} />
            </div>
          </div>
        </div>

        {/* Pipeline & Status */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold pb-2 border-b border-border">Pipeline & Status</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Etapa do Pipeline</Label>
              <Select value={form.etapa_pipeline} onValueChange={v => set('etapa_pipeline', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Aberta', 'Em Andamento', 'Ganha', 'Perdida', 'Cancelada'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Dados da Licitação */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold pb-2 border-b border-border">Dados da Licitação</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Modalidade de Licitação</Label>
              <Select value={form.tipo_licitacao} onValueChange={v => set('tipo_licitacao', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {LICITACOES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número do Edital</Label>
              <Input
                value={form.numero_edital}
                onChange={e => set('numero_edital', e.target.value)}
                placeholder="Ex: 001/2025"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Data de Abertura</Label>
              <Input
                type="date"
                value={form.data_abertura}
                onChange={e => set('data_abertura', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Prazo para Entrega de Proposta</Label>
              <Input
                type="date"
                value={form.data_entrega_proposta}
                onChange={e => set('data_entrega_proposta', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Previsão de Fechamento</Label>
              <Input
                type="date"
                value={form.data_fechamento}
                onChange={e => set('data_fechamento', e.target.value)}
                className={cn("mt-1", errors.data_fechamento && "border-destructive")}
              />
              <FieldError msg={errors.data_fechamento} />
            </div>
            <div>
              <Label>Concorrentes Identificados</Label>
              <Input
                value={form.concorrentes}
                onChange={e => set('concorrentes', e.target.value)}
                placeholder="Ex: Empresa A, Empresa B"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={form.notas}
                onChange={e => set('notas', e.target.value)}
                placeholder="Informações adicionais sobre a oportunidade..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
            </div>
            </div>

            {isAdmin() && usuarios.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h3 className="text-sm font-semibold pb-2 border-b border-border">Atribuição</h3>
            <div>
              <Label>Responsável</Label>
              <Select value={form.responsavel_id || ''} onValueChange={v => set('responsavel_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                <SelectContent>
                  {usuarios.map(u => <SelectItem key={u.email} value={u.email}>{getLabel(u.email)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            </div>
            )}

            <div className="flex justify-end gap-3">
          <Link to="/oportunidades">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : isEdit ? 'Atualizar Oportunidade' : 'Cadastrar Oportunidade'}
          </Button>
        </div>
      </form>
    </div>
  );
}