import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, Upload, Database, Loader2, Building2, Users, Target, CheckSquare, FileText, Gauge, Activity, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const ENTITIES = [
  { name: 'OrgaoPublico', label: 'Órgãos Públicos', icon: Building2 },
  { name: 'Contato', label: 'Contatos', icon: Users },
  { name: 'Oportunidade', label: 'Oportunidades', icon: Target },
  { name: 'Tarefa', label: 'Tarefas', icon: CheckSquare },
  { name: 'Documento', label: 'Documentos', icon: FileText },
  { name: 'ScoreBANT', label: 'Scores BANT', icon: Gauge },
  { name: 'AtividadeLog', label: 'Logs de Atividade', icon: Activity },
  { name: 'ModalidadeLicitacao', label: 'Modalidades de Licitação', icon: ListChecks },
];

function toCSV(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const escape = (v) => {
    if (v == null) return '';
    if (typeof v === 'object') return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = keys.map(escape).join(';');
  const body = rows.map(r => keys.map(k => escape(r[k])).join(';')).join('\n');
  return header + '\n' + body;
}

function downloadCSV(csv, filename) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportacaoExportacao() {
  const [loadingEntity, setLoadingEntity] = useState(null);
  const [importingEntity, setImportingEntity] = useState(null);
  const fileRefs = useRef({});

  const handleExport = async (entity) => {
    setLoadingEntity(entity.name);
    try {
      const records = await base44.entities[entity.name].list('-created_date', 10000);
      const rows = (records || []).map(r => {
        const { id, created_date, updated_date, created_by_id, ...rest } = r;
        return rest;
      });
      if (!rows.length) {
        toast.info(`Nenhum registro em ${entity.label}.`);
        return;
      }
      const csv = toCSV(rows);
      downloadCSV(csv, `${entity.name}_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`${rows.length} registros exportados de ${entity.label}.`);
    } catch (err) {
      toast.error(err.message || `Erro ao exportar ${entity.label}.`);
    } finally {
      setLoadingEntity(null);
    }
  };

  const handleImport = async (entity, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportingEntity(entity.name);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!rows.length) {
        toast.error('O arquivo CSV está vazio ou inválido.');
        return;
      }

      // Converte valores: strings vazias → undefined, "true"/"false" → boolean, números
      const cleaned = rows.map(row => {
        const obj = {};
        for (const [k, v] of Object.entries(row)) {
          if (v === '' || v == null) continue;
          if (typeof v === 'string') {
            const lower = v.trim().toLowerCase();
            if (lower === 'true') { obj[k] = true; continue; }
            if (lower === 'false') { obj[k] = false; continue; }
          }
          obj[k] = v;
        }
        return obj;
      });

      const result = await base44.entities[entity.name].bulkCreate(cleaned);
      const count = Array.isArray(result) ? result.length : (result?.created || cleaned.length);
      toast.success(`${count} registro(s) importado(s) em ${entity.label}.`);
    } catch (err) {
      toast.error(err.message || `Erro ao importar ${entity.label}.`);
    } finally {
      setImportingEntity(null);
      event.target.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Importação / Exportação CSV"
        subtitle="Exporte e importe dados de todas as tabelas do sistema em formato CSV."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ENTITIES.map((entity) => {
          const Icon = entity.icon;
          const isLoading = loadingEntity === entity.name;
          const isImporting = importingEntity === entity.name;
          return (
            <Card key={entity.name} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  {entity.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 mt-auto">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleExport(entity)}
                  disabled={isLoading || isImporting}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Exportar CSV
                </Button>
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => fileRefs.current[entity.name]?.click()}
                  disabled={isLoading || isImporting}
                >
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Importar CSV
                </Button>
                <input
                  ref={el => fileRefs.current[entity.name] = el}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleImport(entity, e)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Como funciona</p>
              <p>• <strong>Exportar:</strong> baixa todos os registros da tabela em formato CSV (separado por ponto e vírgula).</p>
              <p>• <strong>Importar:</strong> envia um arquivo CSV que será convertido em novos registros. Campos como <code>id</code>, <code>created_date</code> e <code>updated_date</code> são ignorados na importação.</p>
              <p>• A importação <strong>adiciona</strong> novos registros — não atualiza os existentes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}