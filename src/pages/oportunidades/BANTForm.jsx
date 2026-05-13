import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

const CRITERIOS = [
  { key: 'budget', label: 'Budget — Orçamento', desc: 'O órgão tem orçamento disponível para esta solução?' },
  { key: 'authority', label: 'Authority — Autoridade', desc: 'Você tem acesso ao decisor da compra?' },
  { key: 'need', label: 'Need — Necessidade', desc: 'Existe uma necessidade clara e urgente?' },
  { key: 'timing', label: 'Timing — Momento', desc: 'O timing da compra é favorável?' },
];

function getClassificacao(total) {
  if (total >= 35) return 'Muito Quente';
  if (total >= 25) return 'Quente';
  if (total >= 15) return 'Morno';
  return 'Frio';
}

const defaultForm = { budget_score: 5, budget_notas: '', authority_score: 5, authority_notas: '', need_score: 5, need_notas: '', timing_score: 5, timing_notas: '' };

export default function BANTForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [bantId, setBantId] = useState(null);
  const [op, setOp] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Oportunidade.filter({ id }),
      base44.entities.ScoreBANT.filter({ oportunidade_id: id }),
    ]).then(([ops, bants]) => {
      setOp(ops[0] || null);
      if (bants[0]) { setForm({ ...defaultForm, ...bants[0] }); setBantId(bants[0].id); }
    });
  }, [id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const total = (form.budget_score || 0) + (form.authority_score || 0) + (form.need_score || 0) + (form.timing_score || 0);
  const classificacao = getClassificacao(total);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const payload = { ...form, oportunidade_id: id, total_score: total, classificacao };
    if (bantId) {
      await base44.entities.ScoreBANT.update(bantId, payload);
    } else {
      await base44.entities.ScoreBANT.create(payload);
    }
    toast.success('Score BANT salvo!');
    navigate(`/oportunidades/${id}`);
  };

  return (
    <div>
      <PageHeader
        title="Score BANT"
        subtitle={op?.nome}
        actions={<Link to={`/oportunidades/${id}`}><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button></Link>}
      />
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          {/* Score total */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Score Total</p>
              <p className="text-3xl font-bold text-foreground">{total}<span className="text-lg text-muted-foreground">/40</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Classificação</p>
              <StatusBadge value={classificacao} />
            </div>
          </div>

          {CRITERIOS.map(c => (
            <div key={c.key} className="space-y-3">
              <div>
                <Label className="text-sm font-semibold">{c.label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Slider
                    value={[form[`${c.key}_score`] || 0]}
                    onValueChange={([v]) => set(`${c.key}_score`, v)}
                    min={0} max={10} step={1}
                    className="w-full"
                  />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{form[`${c.key}_score`]}</span>
                </div>
              </div>
              <Textarea
                value={form[`${c.key}_notas`]}
                onChange={e => set(`${c.key}_notas`, e.target.value)}
                placeholder={`Observações sobre ${c.label.split(' — ')[1].toLowerCase()}...`}
                className="resize-none text-sm"
                rows={2}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Link to={`/oportunidades/${id}`}><Button variant="outline" type="button">Cancelar</Button></Link>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : 'Salvar Score BANT'}
          </Button>
        </div>
      </form>
    </div>
  );
}