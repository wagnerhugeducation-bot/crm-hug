import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const defaultForm = {
  oportunidade_id: '', orgao_id: '', titulo: '', descricao: '',
  tipo: '', data_vencimento: '', status: 'Pendente', prioridade: 'Média'
};

export default function TarefaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const isEdit = !!id && id !== 'nova';
  const [form, setForm] = useState(defaultForm);
  const [oportunidades, setOportunidades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const opId = params.get('oportunidade_id');
    const loadOps = user
      ? (isAdmin()
          ? base44.entities.Oportunidade.list()
          : base44.entities.Oportunidade.filter({ created_by: user.email }))
      : Promise.resolve([]);
    loadOps.then(res => setOportunidades(res));
    if (isEdit) {
      base44.entities.Tarefa.filter({ id }).then(res => {
        if (res[0]) setForm({ ...defaultForm, ...res[0] });
        setIsFetching(false);
      });
    } else if (opId) {
      setForm(f => ({ ...f, oportunidade_id: opId }));
    }
  }, [id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) { toast.error('Título é obrigatório.'); return; }
    setIsLoading(true);
    if (isEdit) {
      await base44.entities.Tarefa.update(id, form);
      toast.success('Tarefa atualizada.');
    } else {
      await base44.entities.Tarefa.create({
        ...form,
        responsavel_id: user?.email,
        created_by_user_id: user?.id,
      });
      toast.success('Tarefa criada.');
    }
    navigate('/tarefas');
  };

  if (isFetching) return <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
        actions={<Link to="/tarefas"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button></Link>}
      />
      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Título da tarefa" className="mt-1" />
          </div>
          <div>
            <Label>Oportunidade Relacionada</Label>
            <Select value={form.oportunidade_id} onValueChange={v => set('oportunidade_id', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>{oportunidades.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{['Ligação', 'E-mail', 'Reunião', 'Visita', 'Proposta', 'Follow-up', 'Documento', 'Outro'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vencimento</Label>
              <Input type="datetime-local" value={form.data_vencimento} onChange={e => set('data_vencimento', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['Pendente', 'Em Andamento', 'Concluída', 'Cancelada'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={v => set('prioridade', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['Baixa', 'Média', 'Alta', 'Urgente'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} className="mt-1 resize-none" rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Link to="/tarefas"><Button variant="outline" type="button">Cancelar</Button></Link>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : 'Salvar Tarefa'}
          </Button>
        </div>
      </form>
    </div>
  );
}