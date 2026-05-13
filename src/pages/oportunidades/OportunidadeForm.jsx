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

const defaultForm = {
  orgao_id: '', nome: '', descricao: '', valor_estimado: '',
  status: 'Aberta', etapa_pipeline: 'Prospecção', tipo_licitacao: '',
  numero_edital: '', data_abertura: '', data_fechamento: '',
  data_entrega_proposta: '', probabilidade: '', concorrentes: '', notas: ''
};

const LICITACOES = ['Pregão Eletrônico', 'Pregão Presencial', 'Concorrência', 'Tomada de Preços', 'Convite', 'Dispensa', 'Inexigibilidade', 'RDC', 'Leilão'];

export default function OportunidadeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id && id !== 'nova';
  const [form, setForm] = useState(defaultForm);
  const [orgaos, setOrgaos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orgaoId = params.get('orgao_id');
    base44.entities.OrgaoPublico.list().then(res => setOrgaos(res));
    if (isEdit) {
      base44.entities.Oportunidade.filter({ id }).then(res => {
        if (res[0]) setForm({ ...defaultForm, ...res[0] });
        setIsFetching(false);
      });
    } else if (orgaoId) {
      setForm(f => ({ ...f, orgao_id: orgaoId }));
    }
  }, [id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error('Nome é obrigatório.'); return; }
    setIsLoading(true);
    const payload = { ...form, valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null, probabilidade: form.probabilidade ? Number(form.probabilidade) : null };
    if (isEdit) {
      await base44.entities.Oportunidade.update(id, payload);
      toast.success('Oportunidade atualizada.');
    } else {
      await base44.entities.Oportunidade.create(payload);
      toast.success('Oportunidade cadastrada.');
    }
    navigate('/oportunidades');
  };

  if (isFetching) return <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar Oportunidade' : 'Nova Oportunidade'}
        actions={<Link to="/oportunidades"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button></Link>}
      />
      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          {/* Geral */}
          <div>
            <h3 className="text-sm font-semibold mb-4 pb-2 border-b border-border">Informações Gerais</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Órgão Público</Label>
                <Select value={form.orgao_id} onValueChange={v => set('orgao_id', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o órgão" /></SelectTrigger>
                  <SelectContent>{orgaos.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Nome da Oportunidade *</Label>
                <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Fornecimento de Software de Gestão" className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} className="mt-1 resize-none" rows={3} />
              </div>
              <div>
                <Label>Valor Estimado (R$)</Label>
                <Input type="number" value={form.valor_estimado} onChange={e => set('valor_estimado', e.target.value)} placeholder="0,00" className="mt-1" />
              </div>
              <div>
                <Label>Probabilidade (%)</Label>
                <Input type="number" min="0" max="100" value={form.probabilidade} onChange={e => set('probabilidade', e.target.value)} placeholder="0 - 100" className="mt-1" />
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div>
            <h3 className="text-sm font-semibold mb-4 pb-2 border-b border-border">Pipeline & Status</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Etapa do Pipeline</Label>
                <Select value={form.etapa_pipeline} onValueChange={v => set('etapa_pipeline', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Aberta', 'Em Andamento', 'Ganha', 'Perdida', 'Cancelada'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Licitação */}
          <div>
            <h3 className="text-sm font-semibold mb-4 pb-2 border-b border-border">Dados da Licitação</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Modalidade</Label>
                <Select value={form.tipo_licitacao} onValueChange={v => set('tipo_licitacao', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{LICITACOES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Número do Edital</Label>
                <Input value={form.numero_edital} onChange={e => set('numero_edital', e.target.value)} placeholder="Ex: 001/2025" className="mt-1" />
              </div>
              <div>
                <Label>Data de Abertura</Label>
                <Input type="date" value={form.data_abertura} onChange={e => set('data_abertura', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Prazo para Proposta</Label>
                <Input type="date" value={form.data_entrega_proposta} onChange={e => set('data_entrega_proposta', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Data de Fechamento</Label>
                <Input type="date" value={form.data_fechamento} onChange={e => set('data_fechamento', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Concorrentes</Label>
                <Input value={form.concorrentes} onChange={e => set('concorrentes', e.target.value)} placeholder="Empresas concorrentes" className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Observações</Label>
                <Textarea value={form.notas} onChange={e => set('notas', e.target.value)} className="mt-1 resize-none" rows={3} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Link to="/oportunidades"><Button variant="outline" type="button">Cancelar</Button></Link>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : 'Salvar Oportunidade'}
          </Button>
        </div>
      </form>
    </div>
  );
}