import { useState } from 'react';
import { FileDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * ExportModal — reutilizável para exportar dados em PDF ou XLSX
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   data: object[]   — dados já filtrados
 *   fields: { key: string, label: string }[]
 *   title: string
 */
export default function ExportModal({ open, onClose, data = [], fields = [], title = 'Exportação' }) {
  const [selected, setSelected] = useState(() => fields.map(f => f.key));
  const [busy, setBusy] = useState(false);

  const toggle = (key) =>
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const toggleAll = () =>
    setSelected(selected.length === fields.length ? [] : fields.map(f => f.key));

  const activeFields = fields.filter(f => selected.includes(f.key));

  const cellValue = (row, field) => {
    const v = row[field.key];
    if (field.transform) return field.transform(v, row) ?? '';
    if (v == null) return '';
    if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  const exportXLS = async () => {
    if (activeFields.length === 0) { toast.error('Selecione ao menos um campo.'); return; }
    setBusy(true);
    try {
      const rows = data.map(row =>
        Object.fromEntries(activeFields.map(f => [f.label, cellValue(row, f)]))
      );
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
      XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`${rows.length} registros exportados para XLSX.`);
      onClose();
    } finally { setBusy(false); }
  };

  const exportPDF = async () => {
    if (activeFields.length === 0) { toast.error('Selecione ao menos um campo.'); return; }
    setBusy(true);
    try {
      const isLandscape = activeFields.length > 5;
      const doc = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;
      const colW = (pageW - margin * 2) / activeFields.length;

      // Header
      doc.setFillColor(255, 119, 0);
      doc.rect(0, 0, pageW, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(title, margin, 8);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} · ${data.length} registros`, pageW - margin, 8, { align: 'right' });

      // Table header
      let y = 20;
      const rowH = 7;
      doc.setFillColor(245, 166, 35);
      doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      activeFields.forEach((f, i) => {
        doc.text(f.label, margin + i * colW + 1, y + 4.5, { maxWidth: colW - 2 });
      });
      y += rowH;

      // Rows
      doc.setFont(undefined, 'normal');
      data.forEach((row, ri) => {
        if (y + rowH > doc.internal.pageSize.getHeight() - 10) {
          doc.addPage();
          y = 14;
        }
        if (ri % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
        }
        doc.setTextColor(40, 40, 40);
        activeFields.forEach((f, i) => {
          const txt = cellValue(row, f);
          doc.text(txt, margin + i * colW + 1, y + 4.5, { maxWidth: colW - 2 });
        });
        // row border
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y + rowH, pageW - margin, y + rowH);
        y += rowH;
      });

      doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(`${data.length} registros exportados para PDF.`);
      onClose();
    } finally { setBusy(false); }
  };

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
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{data.length}</span> registro(s) serão exportados conforme os filtros ativos.
          </p>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Campos para exportar</p>
              <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                {selected.length === fields.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-border rounded-lg p-3">
              {fields.map(f => (
                <div key={f.key} className="flex items-center gap-2">
                  <Checkbox id={`ef-${f.key}`} checked={selected.includes(f.key)} onCheckedChange={() => toggle(f.key)} />
                  <Label htmlFor={`ef-${f.key}`} className="text-sm cursor-pointer font-normal leading-none">{f.label}</Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{selected.length} de {fields.length} campos selecionados</p>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={exportXLS} disabled={busy || selected.length === 0}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Exportar XLS
            </Button>
            <Button className="flex-1 gap-2" onClick={exportPDF} disabled={busy || selected.length === 0}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Exportar PDF
            </Button>
          </div>
          <Button variant="outline" className="w-full" onClick={onClose} disabled={busy}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}