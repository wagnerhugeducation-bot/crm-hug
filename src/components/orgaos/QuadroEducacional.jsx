import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MATRICULAS_CICLOS = [
  { key: 'mat_bercario1', label: 'Berçário 1' },
  { key: 'mat_bercario2', label: 'Berçário 2' },
  { key: 'mat_maternal1', label: 'Maternal I' },
  { key: 'mat_maternal2', label: 'Maternal II' },
  { key: 'mat_etapa1', label: 'Etapa I' },
  { key: 'mat_etapa2', label: 'Etapa II' },
  { key: 'mat_1ano', label: '1º Ano EF' },
  { key: 'mat_2ano', label: '2º Ano EF' },
  { key: 'mat_3ano', label: '3º Ano EF' },
  { key: 'mat_4ano', label: '4º Ano EF' },
  { key: 'mat_5ano', label: '5º Ano EF' },
  { key: 'mat_6ano', label: '6º Ano EF' },
  { key: 'mat_7ano', label: '7º Ano EF' },
  { key: 'mat_8ano', label: '8º Ano EF' },
  { key: 'mat_9ano', label: '9º Ano EF' },
  { key: 'mat_em1', label: '1º Ano EM' },
  { key: 'mat_em2', label: '2º Ano EM' },
  { key: 'mat_em3', label: '3º Ano EM' },
];

const DOCENTES_SEGMENTOS = [
  { key: 'doc_bercario', label: 'Berçário' },
  { key: 'doc_etapa1', label: 'Etapa I' },
  { key: 'doc_etapa2', label: 'Etapa II' },
  { key: 'doc_ef1', label: 'Fundamental 1' },
  { key: 'doc_ef2', label: 'Fundamental 2' },
  { key: 'doc_em', label: 'Ensino Médio' },
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

export default function QuadroEducacional({ form, set }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">
        Dados Educacionais
      </h3>

      {/* Matrículas por Ciclo */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Número de Matrículas por Ciclo</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {MATRICULAS_CICLOS.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <NumericInput
                value={form[key]}
                onChange={v => set(key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Número de Docentes */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Número de Docentes por Segmento</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {DOCENTES_SEGMENTOS.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <NumericInput
                value={form[key]}
                onChange={v => set(key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* IDEB */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">IDEB</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">IDEB – Anos Iniciais (EF1)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={form.ideb_ef1 ?? ''}
              onChange={e => set('ideb_ef1', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="0.0"
              className="mt-1 text-center"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">IDEB – Anos Finais (EF2)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={form.ideb_ef2 ?? ''}
              onChange={e => set('ideb_ef2', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="0.0"
              className="mt-1 text-center"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">IDEB – Ensino Médio</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={form.ideb_em ?? ''}
              onChange={e => set('ideb_em', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="0.0"
              className="mt-1 text-center"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Ano de Referência IDEB</Label>
            <Input
              type="number"
              min="2000"
              max="2030"
              value={form.ideb_ano ?? ''}
              onChange={e => set('ideb_ano', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="2023"
              className="mt-1 text-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
}