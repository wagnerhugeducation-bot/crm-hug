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

      // Calcula larguras proporcionais respeitando o campo `widthFactor` (padrão 1)
      const totalUnits = activeFields.reduce((s, f) => s + (f.widthFactor || 1), 0);
      const unitW = (pageW - margin * 2) / totalUnits;
      // Posição X e largura de cada coluna
      const colMeta = activeFields.reduce((acc, f) => {
        const prev = acc.length ? acc[acc.length - 1] : null;
        const x = prev ? prev.x + prev.w : margin;
        const w = (f.widthFactor || 1) * unitW;
        acc.push({ x, w });
        return acc;
      }, []);

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
        doc.text(f.label, colMeta[i].x + 1, y + 4.5, { maxWidth: colMeta[i].w - 2 });
      });
      y += rowH;

      // Rows
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      const lineH = 3.5;
      const cellPadV = 2;

      // Separa campos normais do campo especial de contatos_ids (subrow)
      const contatosField = activeFields.find(f => f.key === 'contatos_ids');
      const mainFields = activeFields.filter(f => f.key !== 'contatos_ids');
      const mainColMeta = mainFields.length > 0
        ? (() => {
            const totalU = mainFields.reduce((s, f) => s + (f.widthFactor || 1), 0);
            const uW = (pageW - margin * 2) / totalU;
            return mainFields.reduce((acc, f) => {
              const prev = acc.length ? acc[acc.length - 1] : null;
              const x = prev ? prev.x + prev.w : margin;
              acc.push({ x, w: (f.widthFactor || 1) * uW });
              return acc;
            }, []);
          })()
        : colMeta;

      // Se contatos está selecionado, recoloca o cabeçalho usando apenas mainFields
      if (contatosField) {
        // Redesenha header com mainFields apenas
        y = 20;
        doc.setFillColor(245, 166, 35);
        doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        mainFields.forEach((f, i) => {
          doc.text(f.label, mainColMeta[i].x + 1, y + 4.5, { maxWidth: mainColMeta[i].w - 2 });
        });
        y += rowH;
      }

      const usedFields = contatosField ? mainFields : activeFields;
      const usedColMeta = contatosField ? mainColMeta : colMeta;

      data.forEach((row, ri) => {
        let maxLines = 1;
        usedFields.forEach((f, i) => {
          const txt = cellValue(row, f);
          const lines = doc.splitTextToSize(txt, usedColMeta[i].w - 2);
          if (lines.length > maxLines) maxLines = lines.length;
        });
        const dynamicRowH = maxLines * lineH + cellPadV * 2;

        // Linha de contatos (se existir)
        const contatosTxt = contatosField ? cellValue(row, contatosField) : null;
        const hasContatos = contatosTxt && contatosTxt !== '—';
        const contatosLines = hasContatos ? doc.splitTextToSize(contatosTxt, pageW - margin * 2 - 2) : [];
        const subRowH = hasContatos ? contatosLines.length * lineH + cellPadV * 2 : 0;

        const totalH = dynamicRowH + subRowH;

        if (y + totalH > doc.internal.pageSize.getHeight() - 10) {
          doc.addPage();
          y = 14;
        }

        // Fundo linha principal
        if (ri % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y, pageW - margin * 2, dynamicRowH, 'F');
        }
        doc.setFont(undefined, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(40, 40, 40);
        usedFields.forEach((f, i) => {
          const txt = cellValue(row, f);
          const lines = doc.splitTextToSize(txt, usedColMeta[i].w - 2);
          doc.text(lines, usedColMeta[i].x + 1, y + cellPadV + lineH * 0.8);
        });
        y += dynamicRowH;

        // Sub-linha de contatos
        if (hasContatos) {
          doc.setFillColor(240, 245, 255);
          doc.rect(margin, y, pageW - margin * 2, subRowH, 'F');
          doc.setTextColor(60, 80, 140);
          doc.setFont(undefined, 'italic');
          doc.text(contatosLines, margin + 2, y + cellPadV + lineH * 0.8);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(40, 40, 40);
          y += subRowH;
        }

        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y, pageW - margin, y);
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