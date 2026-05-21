import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, Gavel } from 'lucide-react';

const MODALIDADES_PADRAO = [
  'Pregão Eletrônico', 'Pregão Presencial', 'Concorrência',
  'Tomada de Preços', 'Convite', 'Dispensa', 'Inexigibilidade', 'RDC', 'Leilão'
];

export default function ModalidadesLicitacao() {
  const [modalidades, setModalidades] = useState([]);
  const [novaModalidade, setNovaModalidade] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    base44.entities.ModalidadeLicitacao.list().then(setModalidades);
  }, []);

  const handleAdd = async () => {
    const nome = novaModalidade.trim();
    if (!nome) { toast.error('Digite o nome da modalidade.'); return; }
    const jaExiste = MODALIDADES_PADRAO.map(m => m.toLowerCase()).includes(nome.toLowerCase()) ||
      modalidades.some(m => m.nome.toLowerCase() === nome.toLowerCase());
    if (jaExiste) { toast.error('Essa modalidade já existe.'); return; }
    setIsAdding(true);
    const criada = await base44.entities.ModalidadeLicitacao.create({ nome, ativo: true });
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
    <div className="space-y-4">
      {/* Modalidades padrão */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-medium">Modalidades padrão do sistema</p>
        <div className="flex flex-wrap gap-2">
          {MODALIDADES_PADRAO.map(m => (
            <span key={m} className="px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground border border-border">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Modalidades customizadas */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-medium">Modalidades personalizadas</p>
        {modalidades.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma modalidade personalizada cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {modalidades.map(m => (
              <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary-light border border-primary/20">
                <span className="text-sm font-medium text-primary">{m.nome}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
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