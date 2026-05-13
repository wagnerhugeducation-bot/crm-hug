import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const defaultForm = {
  nome: '', cnpj: '', esfera: '', poder: '', secretaria: '',
  cidade: '', estado: '', cep: '', endereco: '', telefone: '',
  email_institucional: '', site: '', portal_compras: '',
  relacionamento_status: 'Prospecto', notas: ''
};

export default function OrgaoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'novo';
  const [form, setForm] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      base44.entities.OrgaoPublico.filter({ id }).then(res => {
        if (res[0]) setForm({ ...defaultForm, ...res[0] });
        setIsFetching(false);
      });
    }
  }, [id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error('Nome é obrigatório.'); return; }
    if (!form.esfera) { toast.error('Esfera é obrigatória.'); return; }
    setIsLoading(true);
    if (isEdit) {
      await base44.entities.OrgaoPublico.update(id, form);
      toast.success('Órgão atualizado com sucesso.');
    } else {
      await base44.entities.OrgaoPublico.create(form);
      toast.success('Órgão cadastrado com sucesso.');
    }
    navigate('/orgaos');
  };

  if (isFetching) return <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar Órgão' : 'Novo Órgão Público'}
        subtitle="Preencha os dados do órgão público"
        actions={<Link to="/orgaos"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button></Link>}
      />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          {/* Informações básicas */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">Informações Básicas</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Nome do Órgão *</Label>
                <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Prefeitura Municipal de São Paulo" className="mt-1" />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" className="mt-1" />
              </div>
              <div>
                <Label>Esfera *</Label>
                <Select value={form.esfera} onValueChange={v => set('esfera', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['Federal', 'Estadual', 'Municipal'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Poder</Label>
                <Select value={form.poder} onValueChange={v => set('poder', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['Executivo', 'Legislativo', 'Judiciário', 'Ministério Público'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
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
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">Localização</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Ex: São Paulo" className="mt-1" />
              </div>
              <div>
                <Label>Estado (UF)</Label>
                <Select value={form.estado} onValueChange={v => set('estado', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{ESTADOS_BR.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
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

          {/* Contato */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">Contato & Links</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 0000-0000" className="mt-1" />
              </div>
              <div>
                <Label>E-mail Institucional</Label>
                <Input type="email" value={form.email_institucional} onChange={e => set('email_institucional', e.target.value)} placeholder="contato@orgao.gov.br" className="mt-1" />
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

          {/* Status */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">Relacionamento</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Status do Relacionamento</Label>
                <Select value={form.relacionamento_status} onValueChange={v => set('relacionamento_status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Prospecto', 'Em Contato', 'Ativo', 'Inativo', 'VIP'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Observações</Label>
                <Textarea value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Anotações sobre o órgão..." className="mt-1 resize-none" rows={3} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Link to="/orgaos"><Button variant="outline" type="button">Cancelar</Button></Link>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : 'Salvar Órgão'}
          </Button>
        </div>
      </form>
    </div>
  );
}