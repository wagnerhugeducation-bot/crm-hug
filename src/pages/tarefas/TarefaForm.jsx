import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import AudioRecorder from '@/components/tarefas/AudioRecorder';

const defaultForm = {
  oportunidade_id: '', orgao_id: '', titulo: '', descricao: '', resultado: '',
  tipo: '', data_vencimento: '', status: 'Pendente', prioridade: 'Média', concluida_em: ''
};

export default function TarefaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, userProfile } = useAuth();
  const { usuarios, getLabel } = useUsuariosMap();
  const { resolverHierarquiaAsync } = useHierarquia();
  const { subordinados, getLabel: getSubLabel, podeAtribuir } = useSubordinados();
  const isEdit = !!id && id !== 'nova';
  const [form, setForm] = useState(defaultForm);
  const [oportunidades, setOportunidades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  const params = new URLSearchParams(location.search);
  const origemUrl = params.get('origem') || '/tarefas';

  useEffect(() => {
    const opId = params.get('oportunidade_id');
    const loadOps = user
      ? base44.functions.invoke('getOportunidadesHierarquia', {}).then(res => res.data?.oportunidades || [])
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

  const set = (field, value) => {
    if (field === 'status' && value === 'Concluída') {
      const hoje = new Date();
      const concluida_em = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}T${String(hoje.getHours()).padStart(2,'0')}:${String(hoje.getMinutes()).padStart(2,'0')}`;
      setForm(f => ({ ...f, [field]: value, concluida_em: f.concluida_em || concluida_em }));
    } else {
      setForm(f => ({ ...f, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) { toast.error('Título é obrigatório.'); return; }
    setIsLoading(true);
    const responsavelFinal = podeAtribuir ? (form.responsavel_id || user?.email) : user?.email;
    const hierarquia = await resolverHierarquiaAsync(responsavelFinal, userProfile);
    const payload = isEdit ? {
      ...form,
      ...(await resolverHierarquiaAsync(form.responsavel_id || user?.email, userProfile)),
    } : {
      ...form,
      created_by_user_id: user?.id,
      responsavel_id: responsavelFinal,
      responsavel_gestor_id: hierarquia.responsavel_gestor_id,
      responsavel_comercial_id: hierarquia.responsavel_comercial_id,
    };
    if (isEdit) {
      await base44.entities.Tarefa.update(id, payload);
      toast.success('Tarefa atualizada.');
    } else {
      await base44.entities.Tarefa.create(payload);
      toast.success('Tarefa criada.');
    }
    navigate(origemUrl);
  };

  if (isFetching) return <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
        actions={<Button variant="outline" className="gap-2" onClick={() => navigate(origemUrl)}><ArrowLeft className="w-4 h-4" /> Voltar</Button>}
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
            {form.status === 'Concluída' && (
              <div className="sm:col-span-2">
                <Label>Data de Conclusão</Label>
                <Input type="datetime-local" value={form.concluida_em} onChange={e => set('concluida_em', e.target.value)} className="mt-1" />
              </div>
            )}
          </div>
          {form.status === 'Concluída' && (
            <div className="border border-green-200 bg-green-50/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-green-800 font-semibold">Resultado da Tarefa</Label>
                <AudioRecorder onTranscription={text => set('resultado', form.resultado ? form.resultado + ' ' + text : text)} />
              </div>
              <Textarea
                value={form.resultado}
                onChange={e => set('resultado', e.target.value)}
                placeholder="Descreva o resultado desta tarefa... ou use o microfone para gravar."
                className="resize-none bg-white"
                rows={4}
              />
            </div>
          )}
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} className="mt-1 resize-none" rows={3} />
          </div>
          {podeAtribuir && subordinados.length > 0 && (
            <div>
              <Label>Responsável</Label>
              <Select value={form.responsavel_id || ''} onValueChange={v => set('responsavel_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                <SelectContent>
                  {subordinados.map(u => <SelectItem key={u.email} value={u.email}>{getSubLabel(u.email)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" type="button" onClick={() => navigate(origemUrl)}>Cancelar</Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : 'Salvar Tarefa'}
          </Button>
        </div>
      </form>
    </div>
  );
}