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
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const TIPOS = ['Edital', 'Proposta', 'Contrato', 'Ata', 'Certidão', 'Habilitação', 'Termo de Referência', 'Nota Fiscal', 'Outro'];

const defaultForm = {
  oportunidade_id: '', orgao_id: '', nome: '', tipo: '',
  arquivo_url: '', validade: '', descricao: '', versao: ''
};

export default function DocumentoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { usuarios, getLabel } = useUsuariosMap();
  const { resolverHierarquia } = useHierarquia();
  const isEdit = !!id && id !== 'novo';
  const [form, setForm] = useState(defaultForm);
  const [oportunidades, setOportunidades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const opId = params.get('oportunidade_id');
    base44.entities.Oportunidade.list().then(res => setOportunidades(res));
    if (isEdit) {
      base44.entities.Documento.filter({ id }).then(res => {
        if (res[0]) setForm({ ...defaultForm, ...res[0] });
        setIsFetching(false);
      });
    } else if (opId) {
      setForm(f => ({ ...f, oportunidade_id: opId }));
    }
  }, [id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('arquivo_url', file_url);
    if (!form.nome) set('nome', file.name.replace(/\.[^/.]+$/, ''));
    setIsUploading(false);
    toast.success('Arquivo enviado!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error('Nome é obrigatório.'); return; }
    if (!form.tipo) { toast.error('Tipo é obrigatório.'); return; }
    setIsLoading(true);
    const responsavelFinal = isAdmin() ? (form.responsavel_id || user?.email) : user?.email;
    const hierarquia = resolverHierarquia(responsavelFinal);
    const payload = {
      ...form,
      responsavel_id: responsavelFinal,
      responsavel_gestor_id: hierarquia.responsavel_gestor_id,
      responsavel_comercial_id: hierarquia.responsavel_comercial_id,
    };
    if (isEdit) {
      await base44.entities.Documento.update(id, payload);
      toast.success('Documento atualizado.');
    } else {
      await base44.entities.Documento.create(payload);
      toast.success('Documento salvo.');
    }
    navigate('/documentos');
  };

  if (isFetching) return <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar Documento' : 'Novo Documento'}
        actions={<Link to="/documentos"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button></Link>}
      />
      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div>
            <Label>Oportunidade Relacionada</Label>
            <Select value={form.oportunidade_id} onValueChange={v => set('oportunidade_id', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>{oportunidades.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nome do Documento *</Label>
              <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome descritivo" className="mt-1" />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{TIPOS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Versão</Label>
              <Input value={form.versao} onChange={e => set('versao', e.target.value)} placeholder="Ex: v1.0" className="mt-1" />
            </div>
            <div>
              <Label>Validade</Label>
              <Input type="date" value={form.validade} onChange={e => set('validade', e.target.value)} className="mt-1" />
            </div>
          </div>

          {/* Upload */}
          <div>
            <Label>Arquivo</Label>
            <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center">
              <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{isUploading ? 'Enviando...' : 'Clique para enviar arquivo'}</p>
              </label>
              {form.arquivo_url && (
                <a href={form.arquivo_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-2 block">
                  Arquivo atual — clique para visualizar
                </a>
              )}
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} className="mt-1 resize-none" rows={2} />
          </div>
        </div>
        {isAdmin() && usuarios.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 space-y-3 mt-4">
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
        <div className="flex justify-end gap-3 mt-4">
          <Link to="/documentos"><Button variant="outline" type="button">Cancelar</Button></Link>
          <Button type="submit" disabled={isLoading || isUploading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : 'Salvar Documento'}
          </Button>
        </div>
      </form>
    </div>
  );
}