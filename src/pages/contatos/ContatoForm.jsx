import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { cn } from '@/lib/utils';

const defaultForm = {
  orgao_id: '', nome: '', cargo: '', departamento: '',
  telefone: '', whatsapp: '', email: '', influencia_compra: '',
  linkedin: '', ativo: true, notas: ''
};

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

export default function ContatoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id && id !== 'novo';
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
      base44.entities.Contato.list().then(res => {
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
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'E-mail inválido.';
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
        await base44.entities.Contato.update(id, form);
        toast.success('Contato atualizado com sucesso.');
      } else {
        await base44.entities.Contato.create(form);
        toast.success('Contato cadastrado com sucesso.');
      }
      navigate('/contatos');
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
        title={isEdit ? 'Editar Contato' : 'Novo Contato'}
        subtitle="Preencha os dados do contato"
        actions={
          <Link to="/contatos">
            <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold pb-2 border-b border-border">Dados Principais</h3>
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
              <Label>Nome Completo <span className="text-destructive">*</span></Label>
              <Input
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
                placeholder="Nome completo do contato"
                className={cn("mt-1", errors.nome && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError msg={errors.nome} />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ex: Secretário de TI" className="mt-1" />
            </div>
            <div>
              <Label>Departamento</Label>
              <Input value={form.departamento} onChange={e => set('departamento', e.target.value)} placeholder="Ex: Tecnologia da Informação" className="mt-1" />
            </div>
            <div>
              <Label>Influência na Compra</Label>
              <Select value={form.influencia_compra} onValueChange={v => set('influencia_compra', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {['Decisor', 'Influenciador', 'Técnico', 'Usuário Final', 'Bloqueador'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-sm font-semibold pb-2 border-b border-border">Informações de Contato</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 0000-0000" className="mt-1" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(00) 00000-0000" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="contato@email.com"
                className={cn("mt-1", errors.email && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError msg={errors.email} />
            </div>
            <div className="sm:col-span-2">
              <Label>LinkedIn</Label>
              <Input value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/usuario" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Anotações sobre o contato..." className="mt-1 resize-none" rows={3} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/contatos">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : isEdit ? 'Atualizar Contato' : 'Cadastrar Contato'}
          </Button>
        </div>
      </form>
    </div>
  );
}