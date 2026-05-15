import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/ui/PageHeader';
import QuadroEducacional from '@/components/orgaos/QuadroEducacional';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const defaultForm = {
  nome: '', cnpj: '', esfera: '', poder: '', secretaria: '',
  cidade: '', estado: '', cep: '', endereco: '', telefone: '',
  email_institucional: '', site: '', portal_compras: '',
  relacionamento_status: 'Prospecto', notas: '',
  mat_bercario1: null, mat_bercario2: null, mat_maternal1: null, mat_maternal2: null,
  mat_etapa1: null, mat_etapa2: null,
  mat_1ano: null, mat_2ano: null, mat_3ano: null, mat_4ano: null, mat_5ano: null,
  mat_6ano: null, mat_7ano: null, mat_8ano: null, mat_9ano: null,
  mat_em1: null, mat_em2: null, mat_em3: null,
  doc_bercario: null, doc_etapa1: null, doc_etapa2: null,
  doc_ef1: null, doc_ef2: null, doc_em: null,
  ideb_ef1: null, ideb_ef2: null, ideb_em: null, ideb_ano: null,
};

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

export default function OrgaoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'novo';
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

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
      if (isEdit) {
        await base44.entities.OrgaoPublico.update(id, form);
        toast.success('Órgão atualizado com sucesso.');
      } else {
        await base44.entities.OrgaoPublico.create(form);
        toast.success('Órgão cadastrado com sucesso.');
      }
      navigate('/orgaos');
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
              <Label>Observações</Label>
              <Textarea
                value={form.notas}
                onChange={e => set('notas', e.target.value)}
                placeholder="Anotações sobre o órgão..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Dados Educacionais */}
        <QuadroEducacional form={form} set={set} />

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