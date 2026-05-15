import { useState } from 'react';
import { FileDown, FileSpreadsheet, FileText, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * ExportModal - Componente reutilizável de exportação para PDF e XLSX
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   data: array de objetos (dados já filtrados da listagem)
 *   fields: [{ key: string, label: string }]  — campos disponíveis
 *   title: string — título do relatório
 */
export default function ExportModal({ open, onClose, data = [], fields = [], title = 'Exportação' }) {
  const [selectedFields, setSelectedFields] = useState(() => fields.map(f => f.key));
  const [isExporting, setIsExporting] = useState(false);

  const toggleField = (key) => {
    setSelectedFields(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleAll = () => {
    if (selectedFields.length === fields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(fields.map(f => f.key));
    }
  };

  const getRows = () => {
    const activeFields = fields.filter(f => selectedFields.includes(f.key));
    return data.map(row =>
      activeFields.reduce((obj, f) => {
        let val = row[f.key];
        if (val == null) val = '';
        else if (typeof val === 'boolean') val = val ? 'Sim' : 'Não';
        else if (typeof val === 'object') val = JSON.stringify(val);
        else val = String(val);
        obj[f.label] = val;
        return obj;
      }, {})
    );
  };

  const exportXLS = async () => {
    if (selectedFields.length === 0) { toast.error('Selecione ao menos um campo.'); return; }
    setIsExporting(true);
    try {
      const rows = getRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));
      XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`${rows.length} registros exportados para XLSX.`);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    if (selectedFields.length === 0) { toast.error('Selecione ao menos um campo.'); return; }
    setIsExporting(true);
    try {
      const activeFields = fields.filter(f => selectedFields.includes(f.key));
      const rows = getRows();
      const doc = new jsPDF({ orientation: activeFields.length > 5 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(title, 14, 16);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} · ${rows.length} registros`, 14, 22);

      doc.autoTable({
        startY: 28,
        head: [activeFields.map(f => f.label)],
        body: rows.map(r => activeFields.map(f => r[f.label] || '')),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [255, 119, 0], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 14, right: 14 },
      });

      doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(`${rows.length} registros exportados para PDF.`);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  const allSelected = selectedFields.length === fields.length;
  const someSelected = selectedFields.length > 0 && selectedFields.length < fields.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            Exportar — {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contador */}
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{data.length}</span> registro(s) serão exportados conforme os filtros ativos.
          </p>

          {/* Seleção de campos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Campos para exportar</p>
              <button
                onClick={toggleAll}
                className="text-xs text-primary hover:underline"
              >
                {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 border border-border rounded-lg p-3">
              {fields.map(f => (
                <div key={f.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`field-${f.key}`}
                    checked={selectedFields.includes(f.key)}
                    onCheckedChange={() => toggleField(f.key)}
                  />
                  <Label htmlFor={`field-${f.key}`} className="text-sm cursor-pointer font-normal">
                    {f.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {selectedFields.length} de {fields.length} campos selecionados
            </p>
          </div>

          {/* Botões de exportação */}
          <div className="flex gap-3 pt-1">
            <Button
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={exportXLS}
              disabled={isExporting || selectedFields.length === 0}
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Exportar XLS
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={exportPDF}
              disabled={isExporting || selectedFields.length === 0}
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Exportar PDF
            </Button>
          </div>
          <Button variant="outline" className="w-full" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}