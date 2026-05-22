import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const MODALIDADES_PADRAO = [
  'Pregão Eletrônico', 'Pregão Presencial', 'Concorrência',
  'Tomada de Preços', 'Convite', 'Dispensa', 'Inexigibilidade', 'RDC', 'Leilão'
];

// Chave para salvar graus das modalidades padrão no localStorage
const LS_KEY = 'modalidades_padrao_graus';

function DificuldadeSlider({ value, onChange, label }) {
  const cores = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-500'];
  const textos = ['', 'Muito Difícil', 'Difícil', 'Médio', 'Fácil', 'Muito Fácil'];
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <Slider
        min={1}
        max={5}
        step={1}
        value={[value || 3]}
        onValueChange={([v]) => onChange(v)}
        className="w-28 shrink-0"
      />
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full text-white ${cores[value || 3]}`}>
        {value || 3} – {textos[value || 3]}
      </span>
    </div>
  );
}

export default function ModalidadesLicitacao() {
  const [modalidades, setModalidades] = useState([]);
  const [grausPadrao, setGrausPadrao] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
  });
  const [novaModalidade, setNovaModalidade] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    base44.entities.ModalidadeLicitacao.list().then(setModalidades);
  }, []);

  const handleGrauPadraoChange = (nome, valor) => {
    const novo = { ...grausPadrao, [nome]: valor };
    setGrausPadrao(novo);
    localStorage.setItem(LS_KEY, JSON.stringify(novo));
  };

  const handleGrauCustomChange = async (id, valor) => {
    setSavingId(id);
    setModalidades(prev => prev.map(m => m.id === id ? { ...m, grau_dificuldade: valor } : m));
    await base44.entities.ModalidadeLicitacao.update(id, { grau_dificuldade: valor });
    setSavingId(null);
  };

  const handleAdd = async () => {
    const nome = novaModalidade.trim();
    if (!nome) { toast.error('Digite o nome da modalidade.'); return; }
    const jaExiste = MODALIDADES_PADRAO.map(m => m.toLowerCase()).includes(nome.toLowerCase()) ||
      modalidades.some(m => m.nome.toLowerCase() === nome.toLowerCase());
    if (jaExiste) { toast.error('Essa modalidade já existe.'); return; }
    setIsAdding(true);
    const criada = await base44.entities.ModalidadeLicitacao.create({ nome, ativo: true, grau_dificuldade: 3 });
    setModalidades(prev => [...prev, criada]);
    setNovaModalidade('');
    toast.success('Modalidade adicionada!');
    setIsAdding(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.ModalidadeLicitacao.delete(id);
    setModalidades(prev => prev.filter(m => m.id !== id));
    toast.success('Modalidade removida.');
  };

  return (
    <div className="space-y-5">
      {/* Modalidades padrão */}
      <div>
        <p className="text-xs text-muted-foreground mb-3 font-medium">Modalidades padrão do sistema</p>
        <div className="space-y-2">
          {MODALIDADES_PADRAO.map(m => (
            <div key={m} className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-muted border border-border">
              <span className="text-sm text-muted-foreground min-w-[160px]">{m}</span>
              <DificuldadeSlider
                value={grausPadrao[m]}
                onChange={v => handleGrauPadraoChange(m, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modalidades customizadas */}
      <div>
        <p className="text-xs text-muted-foreground mb-3 font-medium">Modalidades personalizadas</p>
        {modalidades.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma modalidade personalizada cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {modalidades.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-primary-light border border-primary/20">
                <span className="text-sm font-medium text-primary min-w-[160px]">{m.nome}</span>
                <DificuldadeSlider
                  value={m.grau_dificuldade}
                  onChange={v => handleGrauCustomChange(m.id, v)}
                />
                {savingId === m.id && <span className="text-xs text-muted-foreground">Salvando...</span>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDelete(m.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adicionar nova */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <Input
          value={novaModalidade}
          onChange={e => setNovaModalidade(e.target.value)}
          placeholder="Nova modalidade de licitação..."
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <Button onClick={handleAdd} disabled={isAdding} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}