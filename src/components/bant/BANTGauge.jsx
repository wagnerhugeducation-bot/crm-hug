/**
 * BANTGauge – velocímetro semicircular baseado em SVG.
 * score: 0–40 (soma dos 4 critérios 0–10)
 * size: 'sm' (lista) | 'md' (detalhe)
 */
export default function BANTGauge({ score, size = 'md' }) {
  const total = 40;
  const pct = Math.min(Math.max((score ?? 0) / total, 0), 1);

  // Dimensões
  const sm = size === 'sm';
  const W = sm ? 80 : 160;
  const H = sm ? 46 : 92;
  const cx = W / 2;
  const cy = H - (sm ? 6 : 12);
  const r = sm ? 32 : 64;
  const strokeW = sm ? 7 : 14;

  // Arco: 180° (de 180° a 0° = de -π a 0)
  const startAngle = Math.PI;       // esquerda
  const endAngle = 0;               // direita
  const angle = startAngle - pct * Math.PI;

  const toX = (a) => cx + r * Math.cos(a);
  const toY = (a) => cy - r * Math.sin(a);   // SVG y cresce para baixo

  const arcPath = (from, to) => {
    const x1 = toX(from), y1 = toY(from);
    const x2 = toX(to), y2 = toY(to);
    const sweep = 1;
    return `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
  };

  // Cor baseada no score
  const color =
    pct < 0.25 ? '#ef4444' :
    pct < 0.5  ? '#f97316' :
    pct < 0.75 ? '#eab308' :
                 '#22c55e';

  // Ponteiro
  const needleLen = r - (sm ? 4 : 8);
  const needleX = cx + needleLen * Math.cos(angle);
  const needleY = cy - needleLen * Math.sin(angle);

  const label = score == null ? '—' : score;
  const fontSize = sm ? 11 : 22;
  const subSize = sm ? 7 : 11;

  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow="visible">
        {/* Trilho cinza */}
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Arco colorido */}
        {pct > 0 && (
          <path
            d={arcPath(startAngle, angle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        {/* Ponteiro */}
        <line
          x1={cx} y1={cy}
          x2={needleX} y2={needleY}
          stroke="#1e293b"
          strokeWidth={sm ? 1.5 : 3}
          strokeLinecap="round"
        />
        {/* Centro */}
        <circle cx={cx} cy={cy} r={sm ? 3 : 5} fill="#1e293b" />
        {/* Score */}
        <text
          x={cx} y={cy - (sm ? 14 : 26)}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="700"
          fill={color}
        >{label}</text>
        {!sm && (
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={subSize} fill="#94a3b8">
            / 40
          </text>
        )}
      </svg>
      {sm && (
        <span className="text-[9px] text-muted-foreground leading-none -mt-1">/40</span>
      )}
    </div>
  );
}