import { useMemo } from 'react';
import { Building2, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmtBRL = (v) => v > 0 ? `R$ ${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '—';
const fmtNum = (v) => v > 0 ? Number(v).toLocaleString('pt-BR') : '—';

const MAT_KEYS = [
  'mat_bercario1','mat_bercario2','mat_maternal1','mat_maternal2',
  'mat_etapa1','mat_etapa2','mat_1ano','mat_2ano','mat_3ano','mat_4ano',
  'mat_5ano','mat_6ano','mat_7ano','mat_8ano','mat_9ano',
  'mat_em1','mat_em2','mat_em3',
];
const DOC_KEYS = ['doc_bercario','doc_etapa1','doc_etapa2','doc_ef1','doc_ef2','doc_em'];
const ESC_KEYS = ['esc_infantil','esc_fundamental','esc_medio'];

export default function OrgaosSemOportunidades({ orgaos, oportunidades, contatos, isLoading }) {
  const dados = useMemo(() => {
    const orgaoIdsComOp = new Set((oportunidades || []).map(o => o.orgao_id).filter(Boolean));
    return (orgaos || [])
      .filter(o => !orgaoIdsComOp.has(o.id))
      .map(o => {
        const qtdContatos = (contatos || []).filter(c => c.orgao_id === o.id).length;
        const totalAlunos = MAT_KEYS.reduce((s, k) => s + (o[k] || 0), 0);
        const totalDocentes = DOC_KEYS.reduce((s, k) => s + (o[k] || 0), 0);
        const totalEscolas = ESC_KEYS.reduce((s, k) => s + (o[k] || 0), 0);
        return { ...o, qtdContatos, totalAlunos, totalDocentes, totalEscolas };
      })
      .sort((a, b) => (b.potencial_orgao || 0) - (a.potencial_orgao || 0));
  }, [orgaos, oportunidades, contatos]);

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Building2 className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Órgãos sem Oportunidades Criadas</h2>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{dados.length}</span>
      </div>

      {isLoading ? (
        <div className="h-40 bg-muted animate-pulse rounded-b-xl" />
      ) : dados.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Todos os órgãos possuem oportunidades cadastradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Órgão</th>
                <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider">Contatos</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider">Potencial do Órgão</th>
                <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider">Nº Alunos</th>
                <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider">Nº Docentes</th>
                <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider">Nº Escolas</th>
                <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dados.map(o => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-medium text-foreground truncate max-w-[200px]">{o.nome}</p>
                      {o.cidade && <p className="text-muted-foreground text-[10px]">{o.cidade}{o.estado ? ` / ${o.estado}` : ''}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center text-foreground font-medium">{o.qtdContatos}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-primary">{fmtBRL(o.potencial_orgao)}</td>
                  <td className="px-4 py-2.5 text-center text-foreground">{fmtNum(o.totalAlunos)}</td>
                  <td className="px-4 py-2.5 text-center text-foreground">{fmtNum(o.totalDocentes)}</td>
                  <td className="px-4 py-2.5 text-center text-foreground">{fmtNum(o.totalEscolas)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Link
                      to={`/oportunidades/nova?orgao_id=${o.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium whitespace-nowrap"
                    >
                      <LinkIcon className="w-3 h-3" /> Criar oportunidade
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}