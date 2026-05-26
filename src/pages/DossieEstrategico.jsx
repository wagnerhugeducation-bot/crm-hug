import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Download, ChevronLeft, FileBarChart2, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function InfoRow({ label, value }) {
  if (!value || value === '...' || value === 'Não localizado em fonte oficial consultada.') return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-border last:border-0">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide sm:w-48 flex-shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-primary/10 border-b border-border px-5 py-3">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function TagList({ items }) {
  if (!items?.length) return <span className="text-sm text-muted-foreground">Nenhum item identificado.</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
      ))}
    </div>
  );
}

function Nota({ nota, classificacao }) {
  const n = parseFloat(nota);
  const color = n >= 8 ? 'text-success' : n >= 6 ? 'text-warning' : 'text-destructive';
  return (
    <div className="flex items-center gap-4">
      <span className={`text-5xl font-black ${color}`}>{nota}</span>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Classificação</p>
        <p className="text-base font-bold text-foreground">{classificacao}</p>
      </div>
    </div>
  );
}

export default function DossieEstrategico() {
  const [municipio, setMunicipio] = useState('');
  const [uf, setUf] = useState('');
  const [loading, setLoading] = useState(false);
  const [dossie, setDossie] = useState(null);
  const [error, setError] = useState('');

  const gerar = async () => {
    if (!municipio.trim() || !uf) {
      setError('Preencha o município e selecione a UF.');
      return;
    }
    setError('');
    setLoading(true);
    setDossie(null);
    try {
      const res = await base44.functions.invoke('backend', { municipio, uf });
      setDossie(res.data);
      // PDF gerado automaticamente após receber os dados
      setTimeout(() => gerarPDFComDados(res.data), 300);
    } catch (e) {
      setError('Erro ao gerar dossiê: ' + (e?.response?.data?.error || e.message));
    }
    setLoading(false);
  };

  const gerarPDFComDados = (dados) => {
    const s1 = dados?.secao1;
    const s2 = dados?.secao2;
    const s3 = dados?.secao3;
    const s4 = dados?.secao4;
    const s5 = dados?.secao5;
    const s6 = dados?.secao6;
    const s7 = dados?.secao7;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const marginL = 15;
    const marginR = 15;
    const contentW = pageW - marginL - marginR;
    let y = 0;

    const checkPage = (needed = 10) => {
      if (y + needed > 275) { doc.addPage(); y = 15; }
    };

    const addTitle = (text) => {
      checkPage(12);
      doc.setFillColor(230, 90, 10);
      doc.rect(marginL, y, contentW, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(text.toUpperCase(), marginL + 3, y + 5.5);
      y += 11;
      doc.setTextColor(30, 30, 30);
    };

    const addRow = (label, value) => {
      if (!value || value === '...' || value === 'Não localizado em fonte oficial consultada.') return;
      const lines = doc.splitTextToSize(`${value}`, contentW - 42);
      const h = Math.max(7, lines.length * 5 + 3);
      checkPage(h);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(label, marginL, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(lines, marginL + 42, y + 4);
      y += h;
      doc.setDrawColor(220, 220, 220);
      doc.line(marginL, y, marginL + contentW, y);
      y += 1;
    };

    const addText = (text) => {
      if (!text) return;
      const lines = doc.splitTextToSize(text, contentW);
      checkPage(lines.length * 5 + 4);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text(lines, marginL, y + 4);
      y += lines.length * 5 + 5;
    };

    const addTagList = (label, items) => {
      if (!items?.length) return;
      checkPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(label.toUpperCase(), marginL, y + 4);
      y += 7;
      const line = items.join('  •  ');
      const lines = doc.splitTextToSize(line, contentW);
      checkPage(lines.length * 5 + 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      doc.text(lines, marginL, y + 4);
      y += lines.length * 5 + 4;
    };

    const addBulletList = (label, items) => {
      if (!items?.length) return;
      checkPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(label.toUpperCase(), marginL, y + 4);
      y += 7;
      items.forEach(item => {
        const lines = doc.splitTextToSize(`• ${item}`, contentW);
        checkPage(lines.length * 5 + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(50, 50, 50);
        doc.text(lines, marginL + 2, y + 4);
        y += lines.length * 5 + 2;
      });
      y += 2;
    };

    // --- Capa ---
    doc.setFillColor(230, 90, 10);
    doc.rect(0, 0, pageW, 45, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 200, 150);
    doc.text('DOSSIÊ ESTRATÉGICO EXECUTIVO', marginL, 18);
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(`${dados.municipio} — ${dados.uf}`, marginL, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(255, 220, 190);
    doc.text('Rede Municipal de Ensino', marginL, 38);
    y = 52;

    // Seção 7 — Classificação
    if (s7) {
      addTitle('Classificação Estratégica');
      addRow('Nota', `${s7.nota} — ${s7.classificacao}`);
      addText(s7.resumo);
    }

    // Seção 1 — Mapa Político
    if (s1) {
      addTitle('Mapa Político e Lideranças');
      if (s1.prefeito) addRow('Prefeito(a)', `${s1.prefeito.nome} (${s1.prefeito.partido}) — ${s1.prefeito.perfil}`);
      if (s1.vice_prefeito) addRow('Vice-Prefeito(a)', `${s1.vice_prefeito.nome} (${s1.vice_prefeito.partido})`);
      addRow('Chefe de Gabinete', s1.chefe_gabinete?.nome);
      addRow('Secretário(a) de Governo', s1.secretario_governo?.nome);
      if (s1.secretario_educacao) addRow('Secretário(a) de Educação', `${s1.secretario_educacao.nome} — ${s1.secretario_educacao.perfil}`);
      if (s1.deputado_federal) addRow('Dep. Federal mais votado', `${s1.deputado_federal.nome} (${s1.deputado_federal.partido}) — ${s1.deputado_federal.votos} votos`);
      if (s1.deputado_estadual) addRow('Dep. Estadual mais votado', `${s1.deputado_estadual.nome} (${s1.deputado_estadual.partido}) — ${s1.deputado_estadual.votos} votos`);
      addText(s1.leitura_politica);
    }

    // Seção 2 — Perfil Secretaria
    if (s2) {
      addTitle('Perfil da Secretaria de Educação');
      addRow('Estrutura', s2.estrutura);
      addRow('Maturidade', s2.maturidade);
      addRow('Abertura a fornecedores', s2.abertura_fornecedores);
      addTagList('Principais dores', s2.dores);
    }

    // Seção 3 — Indicadores
    if (s3) {
      addTitle('Indicadores Educacionais');
      addRow('Total de Alunos', s3.total_alunos);
      addRow('Total de Escolas', s3.total_escolas);
      addRow('IDEB', s3.ideb);
      addRow('Média Nacional', s3.media_nacional);
      addRow('Média Estadual', s3.media_estadual);
      addRow('Creche', s3.creche);
      addRow('Pré-escola', s3.pre_escola);
      addRow('Fundamental', s3.fundamental);
      addTagList('Destaques IDEB', s3.destaques_ideb);
      addText(s3.interpretacao);
    }

    // Seção 4 — Socioemocional
    if (s4) {
      addTitle('Educação Socioemocional e Inclusão');
      addRow('Grau de urgência', s4.grau_urgencia);
      if (s4.programas?.length) {
        s4.programas.forEach(p => addRow(p.nome, p.descricao));
      }
      addTagList('Lacunas identificadas', s4.lacunas);
      addText(s4.interpretacao_comercial);
    }

    // Seção 5 — Orçamento
    if (s5) {
      addTitle('Orçamento e Saúde Financeira');
      addRow('Orçamento Total', s5.orcamento_total);
      addRow('Orçamento Educação', s5.orcamento_educacao);
      addRow('Percentual Educação', s5.percentual);
      addRow('Dívida / restrições', s5.divida);
      addBulletList('Histórico', s5.historico);
      addText(s5.leitura_financeira);
    }

    // Seção 6 — Estratégia Comercial
    if (s6) {
      addTitle('Estratégia Comercial');
      addRow('Porta de entrada', s6.porta_entrada);
      addRow('Estratégia política', s6.estrategia_politica);
      addRow('Estratégia emenda', s6.estrategia_emenda);
      addRow('Narrativa de valor', s6.narrativa_valor);
      addRow('Timing', s6.timing);
      addTagList('Stakeholders-chave', s6.stakeholders);
      addBulletList('Riscos', s6.riscos);
    }

    // Rodapé em todas as páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Dossiê Estratégico — ${dados.municipio}/${dados.uf} — HUG Life Skills Education`, marginL, 290);
      doc.text(`Página ${i} de ${totalPages}`, pageW - marginR, 290, { align: 'right' });
    }

    const nomeArquivo = `Dossie_${dados.municipio.replace(/\s+/g, '_')}_${dados.uf}.pdf`;
    doc.save(nomeArquivo);
  };

  const s1 = dossie?.secao1;
  const s2 = dossie?.secao2;
  const s3 = dossie?.secao3;
  const s4 = dossie?.secao4;
  const s5 = dossie?.secao5;
  const s6 = dossie?.secao6;
  const s7 = dossie?.secao7;



  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileBarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Dossiê Estratégico Municipal</h1>
            <p className="text-sm text-muted-foreground">Inteligência de mercado educacional com busca em fontes oficiais</p>
          </div>
        </div>

        {/* Form */}
        {!dossie && !loading && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Preencha o município e UF. O agente irá buscar dados em fontes oficiais e imprensa local automaticamente.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="municipio">Município</Label>
                <Input
                  id="municipio"
                  placeholder="Ex: Campinas"
                  value={municipio}
                  onChange={e => setMunicipio(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && gerar()}
                />
              </div>
              <div className="space-y-1">
                <Label>UF</Label>
                <Select value={uf} onValueChange={setUf}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}
            <Button onClick={gerar} className="w-full sm:w-auto gap-2">
              <Search className="w-4 h-4" /> Gerar Dossiê Estratégico
            </Button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div>
              <p className="font-semibold text-foreground">Consultando fontes oficiais e buscando dados...</p>
              <p className="text-sm text-muted-foreground mt-1">Isso pode levar até 2 minutos</p>
            </div>
          </div>
        )}

        {/* Resultado */}
        {dossie && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setDossie(null)}>
                <ChevronLeft className="w-4 h-4" /> Novo dossiê
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => gerarPDFComDados(dossie)}>
                <Download className="w-4 h-4" /> Baixar PDF
              </Button>
            </div>

            {/* Título */}
            <div className="bg-primary rounded-xl p-6 text-white">
              <p className="text-primary-foreground/70 text-xs uppercase tracking-widest mb-1">Dossiê Estratégico Executivo</p>
              <h2 className="text-2xl font-black">{dossie.municipio} — {dossie.uf}</h2>
              <p className="text-primary-foreground/80 text-sm mt-1">Rede Municipal de Ensino</p>
            </div>

            {/* Seção 7 — Classificação (destaque) */}
            {s7 && (
              <Section title="Classificação Estratégica">
                <Nota nota={s7.nota} classificacao={s7.classificacao} />
                {s7.resumo && <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{s7.resumo}</p>}
              </Section>
            )}

            {/* Seção 1 — Mapa Político */}
            {s1 && (
              <Section title="Mapa Político e Lideranças">
                {s1.prefeito && <InfoRow label="Prefeito(a)" value={`${s1.prefeito.nome} (${s1.prefeito.partido}) — ${s1.prefeito.perfil}`} />}
                {s1.vice_prefeito && <InfoRow label="Vice-Prefeito(a)" value={`${s1.vice_prefeito.nome} (${s1.vice_prefeito.partido})`} />}
                <InfoRow label="Chefe de Gabinete" value={s1.chefe_gabinete?.nome} />
                <InfoRow label="Secretário(a) de Governo" value={s1.secretario_governo?.nome} />
                {s1.secretario_educacao && <InfoRow label="Secretário(a) de Educação" value={`${s1.secretario_educacao.nome} — ${s1.secretario_educacao.perfil}`} />}
                {s1.deputado_federal && <InfoRow label="Dep. Federal mais votado" value={`${s1.deputado_federal.nome} (${s1.deputado_federal.partido}) — ${s1.deputado_federal.votos} votos`} />}
                {s1.deputado_estadual && <InfoRow label="Dep. Estadual mais votado" value={`${s1.deputado_estadual.nome} (${s1.deputado_estadual.partido}) — ${s1.deputado_estadual.votos} votos`} />}
                {s1.leitura_politica && <p className="text-sm text-muted-foreground mt-4 pt-3 border-t border-border leading-relaxed">{s1.leitura_politica}</p>}
              </Section>
            )}

            {/* Seção 2 — Perfil da Secretaria */}
            {s2 && (
              <Section title="Perfil da Secretaria de Educação">
                <InfoRow label="Estrutura" value={s2.estrutura} />
                <InfoRow label="Maturidade" value={s2.maturidade} />
                <InfoRow label="Abertura a fornecedores" value={s2.abertura_fornecedores} />
                {s2.dores?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Principais dores</p>
                    <TagList items={s2.dores} />
                  </div>
                )}
              </Section>
            )}

            {/* Seção 3 — Indicadores Educacionais */}
            {s3 && (
              <Section title="Indicadores Educacionais">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: 'Total de Alunos', value: s3.total_alunos },
                    { label: 'Total de Escolas', value: s3.total_escolas },
                    { label: 'IDEB', value: s3.ideb },
                    { label: 'Média Nacional', value: s3.media_nacional },
                  ].map(({ label, value }) => value && value !== '...' && (
                    <div key={label} className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className="text-lg font-bold text-foreground mt-1">{value}</p>
                    </div>
                  ))}
                </div>
                <InfoRow label="Creche" value={s3.creche} />
                <InfoRow label="Pré-escola" value={s3.pre_escola} />
                <InfoRow label="Fundamental" value={s3.fundamental} />
                <InfoRow label="Média Estadual" value={s3.media_estadual} />
                {s3.destaques_ideb?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Destaques IDEB</p>
                    <TagList items={s3.destaques_ideb} />
                  </div>
                )}
                {s3.interpretacao && <p className="text-sm text-muted-foreground mt-4 pt-3 border-t border-border leading-relaxed">{s3.interpretacao}</p>}
              </Section>
            )}

            {/* Seção 4 — Socioemocional */}
            {s4 && (
              <Section title="Educação Socioemocional e Inclusão">
                <InfoRow label="Grau de urgência" value={s4.grau_urgencia} />
                {s4.programas?.length > 0 && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Programas identificados</p>
                    {s4.programas.map((p, i) => (
                      <div key={i} className="bg-muted rounded-lg p-3">
                        <p className="text-sm font-semibold text-foreground">{p.nome}</p>
                        <p className="text-xs text-muted-foreground mt-1">{p.descricao}</p>
                      </div>
                    ))}
                  </div>
                )}
                {s4.lacunas?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lacunas identificadas</p>
                    <TagList items={s4.lacunas} />
                  </div>
                )}
                {s4.interpretacao_comercial && <p className="text-sm text-muted-foreground mt-4 pt-3 border-t border-border leading-relaxed">{s4.interpretacao_comercial}</p>}
              </Section>
            )}

            {/* Seção 5 — Orçamento */}
            {s5 && (
              <Section title="Orçamento e Saúde Financeira">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {[
                    { label: 'Orçamento Total', value: s5.orcamento_total },
                    { label: 'Orçamento Educação', value: s5.orcamento_educacao },
                    { label: 'Percentual Educação', value: s5.percentual },
                  ].map(({ label, value }) => value && value !== '...' && (
                    <div key={label} className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className="text-base font-bold text-foreground mt-1">{value}</p>
                    </div>
                  ))}
                </div>
                <InfoRow label="Dívida / restrições" value={s5.divida} />
                {s5.historico?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Histórico</p>
                    <ul className="space-y-1">
                      {s5.historico.map((h, i) => <li key={i} className="text-sm text-muted-foreground">• {h}</li>)}
                    </ul>
                  </div>
                )}
                {s5.leitura_financeira && <p className="text-sm text-muted-foreground mt-4 pt-3 border-t border-border leading-relaxed">{s5.leitura_financeira}</p>}
              </Section>
            )}

            {/* Seção 6 — Estratégia Comercial */}
            {s6 && (
              <Section title="Estratégia Comercial">
                <InfoRow label="Porta de entrada" value={s6.porta_entrada} />
                <InfoRow label="Estratégia política" value={s6.estrategia_politica} />
                <InfoRow label="Estratégia emenda" value={s6.estrategia_emenda} />
                <InfoRow label="Narrativa de valor" value={s6.narrativa_valor} />
                <InfoRow label="Timing" value={s6.timing} />
                {s6.stakeholders?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Stakeholders-chave</p>
                    <TagList items={s6.stakeholders} />
                  </div>
                )}
                {s6.riscos?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-destructive uppercase tracking-wide mb-2">Riscos</p>
                    <ul className="space-y-1">
                      {s6.riscos.map((r, i) => <li key={i} className="text-sm text-muted-foreground">• {r}</li>)}
                    </ul>
                  </div>
                )}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}