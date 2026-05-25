import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const CICLOS = [
  { key: 'etapa1', label: 'Etapa I' },
  { key: 'etapa2', label: 'Etapa II' },
  { key: '1ano', label: '1º Ano EF' },
  { key: '2ano', label: '2º Ano EF' },
  { key: '3ano', label: '3º Ano EF' },
  { key: '4ano', label: '4º Ano EF' },
  { key: '5ano', label: '5º Ano EF' },
  { key: '6ano', label: '6º Ano EF' },
  { key: '7ano', label: '7º Ano EF' },
  { key: '8ano', label: '8º Ano EF' },
  { key: '9ano', label: '9º Ano EF' },
  { key: 'em1', label: '1º Ano EM' },
  { key: 'em2', label: '2º Ano EM' },
  { key: 'em3', label: '3º Ano EM' },
];

const DOCENTES_SEGMENTOS = [
  { key: 'doc_etapa1', label: 'Etapa I' },
  { key: 'doc_etapa2', label: 'Etapa II' },
  { key: 'doc_ef1', label: 'Fundamental 1' },
  { key: 'doc_ef2', label: 'Fundamental 2' },
  { key: 'doc_em', label: 'Ensino Médio' },
];

const ESCOLAS_NIVEIS = [
  { key: 'esc_infantil', label: 'Ed. Infantil' },
  { key: 'esc_fundamental', label: 'Fundamental' },
  { key: 'esc_medio', label: 'Médio' },
];

const TIPOS_NECESSIDADES = ['Visual', 'Auditiva', 'Motora', 'Intelectual', 'TEA', 'Outros'];
const MODALIDADES_ENSINO = [
  'Educação Especial',
  'Educação do Campo',
  'Educação Escolar Indígena',
  'Educação Quilombola',
  'Educação Profissional',
  'Outros',
];

function NumericInput({ value, onChange, placeholder = '0' }) {
  return (
    <Input
      type="number"
      min="0"
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
      placeholder={placeholder}
      className="mt-1 text-center"
    />
  );
}

function MultiCheckbox({ options, value = [], onChange }) {
  const toggle = (opt) => {
    const current = Array.isArray(value) ? value : [];
    if (current.includes(opt)) {
      onChange(current.filter(v => v !== opt));
    } else {
      onChange([...current, opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={Array.isArray(value) && value.includes(opt)}
            onCheckedChange={() => toggle(opt)}
          />
          <span className="text-sm text-foreground">{opt}</span>
        </label>
      ))}
    </div>
  );
}

export default function QuadroEducacional({ form, set }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">
        Dados Educacionais
      </h3>

      {/* Matrículas por Ciclo */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Número de Matrículas por Ciclo</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {CICLOS.map(({ key, label }) => (
            <div key={`mat_${key}`}>
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <NumericInput value={form[`mat_${key}`]} onChange={v => set(`mat_${key}`, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Turmas por Ciclo */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Número de Turmas por Ciclo</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {CICLOS.map(({ key, label }) => (
            <div key={`turmas_${key}`}>
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <NumericInput value={form[`turmas_${key}`]} onChange={v => set(`turmas_${key}`, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Número de Docentes */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Número de Docentes por Segmento</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {DOCENTES_SEGMENTOS.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <NumericInput value={form[key]} onChange={v => set(key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Número de Escolas por Nível de Ensino */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Número de Escolas por Nível de Ensino</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ESCOLAS_NIVEIS.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <NumericInput value={form[key]} onChange={v => set(key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Inclusão */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Inclusão e Diversidade</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Alunos com Neuro-divergência</Label>
            <NumericInput value={form.alunos_neurodivergentes} onChange={v => set('alunos_neurodivergentes', v)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Alunos com Deficiência</Label>
            <NumericInput value={form.alunos_deficiencia} onChange={v => set('alunos_deficiencia', v)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Profissionais AEE</Label>
            <NumericInput value={form.profissionais_aee} onChange={v => set('profissionais_aee', v)} />
          </div>
        </div>
      </div>

      {/* Tipos de Necessidades */}
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Tipos de Necessidades Identificadas</p>
        <MultiCheckbox
          options={TIPOS_NECESSIDADES}
          value={form.tipos_necessidades}
          onChange={v => set('tipos_necessidades', v)}
        />
      </div>

      {/* Modalidades de Ensino */}
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Modalidades de Ensino</p>
        <MultiCheckbox
          options={MODALIDADES_ENSINO}
          value={form.modalidades_ensino}
          onChange={v => set('modalidades_ensino', v)}
        />
      </div>

      {/* IDEB */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">IDEB</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">IDEB – Anos Iniciais (EF1)</Label>
            <Input type="number" step="0.1" min="0" max="10" value={form.ideb_ef1 ?? ''} onChange={e => set('ideb_ef1', e.target.value === '' ? null : Number(e.target.value))} placeholder="0.0" className="mt-1 text-center" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">IDEB – Anos Finais (EF2)</Label>
            <Input type="number" step="0.1" min="0" max="10" value={form.ideb_ef2 ?? ''} onChange={e => set('ideb_ef2', e.target.value === '' ? null : Number(e.target.value))} placeholder="0.0" className="mt-1 text-center" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">IDEB – Ensino Médio</Label>
            <Input type="number" step="0.1" min="0" max="10" value={form.ideb_em ?? ''} onChange={e => set('ideb_em', e.target.value === '' ? null : Number(e.target.value))} placeholder="0.0" className="mt-1 text-center" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Ano de Referência IDEB</Label>
            <Input type="number" min="2000" max="2030" value={form.ideb_ano ?? ''} onChange={e => set('ideb_ano', e.target.value === '' ? null : Number(e.target.value))} placeholder="2023" className="mt-1 text-center" />
          </div>
        </div>
      </div>
    </div>
  );
}