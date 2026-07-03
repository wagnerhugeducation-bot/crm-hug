import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useUsuariosMap } from '@/hooks/useUsuariosMap';
import { useHierarquia } from '@/hooks/useHierarquia';
import { useSubordinados } from '@/hooks/useSubordinados';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/ui/PageHeader';
import QuadroEducacional from '@/components/orgaos/QuadroEducacional';
import { toast } from 'sonner';
import { ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const defaultForm = {
  nome: '', cnpj: '', esfera: '', poder: '', secretaria: '',
  cidade: '', estado: '', cep: '', endereco: '', telefone: '',
  email_institucional: '', site: '', portal_compras: '',
  relacionamento_status: 'Prospecto', notas: '',
  mat_etapa1: null, mat_etapa2: null,
  mat_1ano: null, mat_2ano: null, mat_3ano: null, mat_4ano: null, mat_5ano: null,
  mat_6ano: null, mat_7ano: null, mat_8ano: null, mat_9ano: null,
  mat_em1: null, mat_em2: null, mat_em3: null,
  turmas_etapa1: null, turmas_etapa2: null,
  turmas_1ano: null, turmas_2ano: null, turmas_3ano: null, turmas_4ano: null, turmas_5ano: null,
  turmas_6ano: null, turmas_7ano: null, turmas_8ano: null, turmas_9ano: null,
  turmas_em1: null, turmas_em2: null, turmas_em3: null,
  doc_etapa1: null, doc_etapa2: null,
  doc_ef1: null, doc_ef2: null, doc_em: null,
  esc_infantil: null, esc_fundamental: null, esc_medio: null,
  ideb_ef1: null, ideb_ef2: null, ideb_em: null, ideb_ano: null,
  profissionais_aee: null,
  nec_visual: null, nec_auditiva: null, nec_motora: null,
  nec_intelectual: null, nec_tea: null, nec_outros: null,
  modalidades_ensino: [],
  potencial_orgao: null,
};

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

export default function OrgaoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, userProfile } = useAuth();
  const { usuarios, getLabel } = useUsuariosMap();
  const { resolverHierarquiaAsync } = useHierarquia();
  const { subordinados, getLabel: getSubLabel, podeAtribuir } = useSubordinados();
  const isEdit = !!id && id !== 'novo';
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGerarIA = async () => {
    if (!form.cidade && !form.nome) {
      toast.error('Preencha pelo menos o nome do órgão ou a cidade para gerar as observações.');
      return;
    }
    setIsGeneratingAI(true);
    const cidadeRef = form.cidade ? `${form.cidade}${form.estado ? ' - ' + form.estado : ''}` : form.nome;
    const prompt = `Você é um especialista em gestão pública municipal brasileira. Gere um relatório detalhado e atualizado sobre o município de "${cidadeRef}" para uso em um CRM de vendas para o setor público educacional.

Inclua obrigatoriamente as seguintes seções, de forma clara e organizada:

1. **GESTÃO ATUAL**
   - Nome do prefeito(a) atual e mandato
   - Partido político do prefeito(a)
   - Vice-prefeito(a)

2. **INFLUÊNCIA POLÍTICA**
   - Deputado(a) estadual/federal com maior influência na cidade
   - Partido e breve contexto de sua atuação na região

3. **INDICADORES MUNICIPAIS**
   - População estimada
   - PIB per capita ou IDH
   - Principais atividades econômicas

4. **SECRETARIA DE EDUCAÇÃO**
   - Nome do(a) Secretário(a) Municipal de Educação
   - Principais projetos e iniciativas em andamento na educação

5. **INDICADORES EDUCACIONAIS**
   - IDEB mais recente (anos iniciais, anos finais e ensino médio, se disponível)
   - Número aproximado de escolas municipais
   - Taxa de alfabetização / aprovação
   - Programas federais ou estaduais de educação ativos no município

6. **RESUMO DA ADMINISTRAÇÃO**
   - Principais prioridades e projetos da atual gestão
   - Pontos de atenção para abordagem comercial

Formato: use texto corrido com marcadores, seja objetivo e direto. Escreva em português do Brasil.`;

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
    });
    set('notas', resultado);
    setIsGeneratingAI(false);
    toast.success('Observações geradas com sucesso!');
  };

  useEffect(() => {
    if (isEdit) {
      base44.entities.OrgaoPublico.list().then(res => {
        const found = res.find(r => r.id === id);
        if (found) setForm({ ...defaultForm, ...found });
        setIsFetching(false);
      });
    }
  }, [id]);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório.';
    if (!form.esfera) errs.esfera = 'Esfera é obrigatória.';
    if (form.email_institucional && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_institucional)) {
      errs.email_institucional = 'E-mail inválido.';
    }
    if (form.cnpj && form.cnpj.replace(/\D/g, '').length !== 14) {
      errs.cnpj = 'CNPJ deve ter 14 dígitos.';
    }
    return errs;
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
      const responsavelFinal = podeAtribuir ? (form.responsavel_id || user?.email) : user?.email;
      const hierarquia = await resolverHierarquiaAsync(responsavelFinal, userProfile);
      const payload = {
        ...form,
        responsavel_id: responsavelFinal,
        responsavel_gestor_id: hierarquia.responsavel_gestor_id,
        responsavel_comercial_id: hierarquia.responsavel_comercial_id,
      };
      if (isEdit) {
        await base44.entities.OrgaoPublico.update(id, payload);
        toast.success('Órgão atualizado com sucesso.');
      } else {
        await base44.entities.OrgaoPublico.create(payload);
        toast.success('Órgão cadastrado com sucesso.');
      }
      navigate('/orgaos');
    } catch (err) {
      toast.error('Erro ao salvar: ' + (err?.message || 'Tente novamente.'));
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
        title={isEdit ? 'Editar Órgão Público' : 'Novo Órgão Público'}
        subtitle="Preencha os dados do órgão público"
        actions={
          <Link to="/orgaos">
            <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
        {/* Informações básicas */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Informações Básicas</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nome do Órgão <span className="text-destructive">*</span></Label>
              <Input
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
                placeholder="Ex: Prefeitura Municipal de São Paulo"
                className={cn("mt-1", errors.nome && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError msg={errors.nome} />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input
                value={form.cnpj}
                onChange={e => set('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
                className={cn("mt-1", errors.cnpj && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError msg={errors.cnpj} />
            </div>
            <div>
              <Label>Esfera <span className="text-destructive">*</span></Label>
              <Select value={form.esfera} onValueChange={v => set('esfera', v)}>
                <SelectTrigger className={cn("mt-1", errors.esfera && "border-destructive")}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {['Federal', 'Estadual', 'Municipal'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError msg={errors.esfera} />
            </div>
            <div>
              <Label>Poder</Label>
              <Select value={form.poder} onValueChange={v => set('poder', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {['Executivo', 'Legislativo', 'Judiciário', 'Ministério Público'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Secretaria / Departamento</Label>
              <Input value={form.secretaria} onChange={e => set('secretaria', e.target.value)} placeholder="Ex: Secretaria de Saúde" className="mt-1" />
            </div>
          </div>
        </div>

        {/* Localização */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Localização</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Ex: São Paulo" className="mt-1" />
            </div>
            <div>
              <Label>Estado (UF)</Label>
              <Select value={form.estado} onValueChange={v => set('estado', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_BR.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>CEP</Label>
              <Input value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="00000-000" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Endereço Completo</Label>
              <Input value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, complemento" className="mt-1" />
            </div>
          </div>
        </div>

        {/* Contato & Links */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Contato & Links</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 0000-0000" className="mt-1" />
            </div>
            <div>
              <Label>E-mail Institucional</Label>
              <Input
                type="email"
                value={form.email_institucional}
                onChange={e => set('email_institucional', e.target.value)}
                placeholder="contato@orgao.gov.br"
                className={cn("mt-1", errors.email_institucional && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError msg={errors.email_institucional} />
            </div>
            <div>
              <Label>Site Oficial</Label>
              <Input value={form.site} onChange={e => set('site', e.target.value)} placeholder="https://www.orgao.gov.br" className="mt-1" />
            </div>
            <div>
              <Label>Portal de Compras</Label>
              <Input value={form.portal_compras} onChange={e => set('portal_compras', e.target.value)} placeholder="https://compras.orgao.gov.br" className="mt-1" />
            </div>
          </div>
        </div>

        {/* Relacionamento */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Relacionamento</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Potencial do Órgão (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.potencial_orgao ?? ''}
                onChange={e => set('potencial_orgao', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="0,00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Status do Relacionamento</Label>
              <Select value={form.relacionamento_status} onValueChange={v => set('relacionamento_status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Prospecto', 'Em Contato', 'Ativo', 'Inativo', 'VIP'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <Label>Observações</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGerarIA}
                  disabled={isGeneratingAI}
                  className="gap-1.5 text-xs h-7 px-2.5 border-primary/40 text-primary hover:bg-primary/5"
                >
                  {isGeneratingAI
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Gerando...</>
                    : <><Sparkles className="w-3 h-3" /> Geração por IA</>
                  }
                </Button>
              </div>
              <Textarea
                value={form.notas}
                onChange={e => set('notas', e.target.value)}
                placeholder="Anotações sobre o órgão..."
                className="resize-none"
                rows={isGeneratingAI ? 6 : 5}
              />
            </div>
          </div>
        </div>

        {/* Dados Educacionais */}
        <QuadroEducacional form={form} set={set} />

        {/* Atribuição */}
        {podeAtribuir && subordinados.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Atribuição</h3>
            <div>
              <Label>Responsável</Label>
              <Select value={form.responsavel_id || ''} onValueChange={v => set('responsavel_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                <SelectContent>
                  {subordinados.map(u => <SelectItem key={u.email} value={u.email}>{getSubLabel(u.email)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link to="/orgaos">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : isEdit ? 'Atualizar Órgão' : 'Cadastrar Órgão'}
          </Button>
        </div>
      </form>
    </div>
  );
}