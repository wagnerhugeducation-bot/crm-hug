/**
 * BANTGauge – velocímetro semicircular com segmentos graduados vermelho→verde
 * score: 0–40 | size: 'sm' (lista) | 'md' (detalhe)
 */
export default function BANTGauge({ score, size = 'md' }) {
  const sm = size === 'sm';
  const W = sm ? 90 : 200;
  const H = sm ? 52 : 115;
  const cx = W / 2;
  const cy = H - (sm ? 4 : 8);
  const outerR = sm ? 38 : 86;
  const innerR = sm ? 24 : 54;
  const gap = sm ? 1.5 : 2.5;   // gap em graus entre segmentos

  // 8 segmentos cobrindo 180°
  const SEGMENTS = 8;
  const segDeg = 180 / SEGMENTS;

  // Cores dos segmentos: vermelho → laranja → amarelo → verde
  const colors = [
    '#ef4444',  // 0
    '#f05a28',  // 1
    '#f97316',  // 2
    '#fb923c',  // 3
    '#fbbf24',  // 4
    '#a3c030',  // 5
    '#6abf1e',  // 6
    '#22c55e',  // 7
  ];

  // Converte ângulo (graus, 0=direita, cresce anti-horário) para coordenadas
  // No velocímetro: 180° = esquerda, 0° = direita
  const toRad = (deg) => (deg * Math.PI) / 180;
  const pt = (r, deg) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy - r * Math.sin(toRad(deg)),
  });

  // Gera o path de um segmento de anel (arco externo + arco interno invertido)
  const segPath = (startDeg, endDeg) => {
    const s1 = pt(outerR, startDeg);
    const e1 = pt(outerR, endDeg);
    const s2 = pt(innerR, endDeg);
    const e2 = pt(innerR, startDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 0 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 1 ${e2.x} ${e2.y}`,
      'Z',
    ].join(' ');
  };

  // Posição do ponteiro: score 0 → 180°, score 40 → 0°
  const pct = Math.min(Math.max((score ?? 0) / 40, 0), 1);
  const needleDeg = 180 - pct * 180;
  const needleLen = innerR - (sm ? 3 : 6);
  const needleTip = pt(needleLen, needleDeg);
  const pivotR = sm ? 4 : 8;

  const scoreFontSize = sm ? 10 : 20;
  const hasScore = score != null;

  return (
    <div className="flex flex-col items-center select-none">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow="visible">
        {/* Segmentos */}
        {colors.map((color, i) => {
          // segmento i vai de (i * segDeg) a ((i+1)*segDeg) no sistema onde 0°=direita, 180°=esquerda
          // mas nosso arco vai de 180° (esquerda) para 0° (direita)
          // segmento 0 = mais à esquerda (vermelho), segmento 7 = mais à direita (verde)
          const startDeg = 180 - i * segDeg;
          const endDeg = 180 - (i + 1) * segDeg;
          const startWithGap = startDeg - (i === 0 ? 0 : gap / 2);
          const endWithGap = endDeg + (i === SEGMENTS - 1 ? 0 : gap / 2);
          return (
            <path
              key={i}
              d={segPath(startWithGap, endWithGap)}
              fill={color}
            />
          );
        })}

        {/* Ponteiro */}
        <line
          x1={cx} y1={cy}
          x2={needleTip.x} y2={needleTip.y}
          stroke="#1e293b"
          strokeWidth={sm ? 1.8 : 3.5}
          strokeLinecap="round"
        />
        {/* Pivot */}
        <circle cx={cx} cy={cy} r={pivotR} fill="white" stroke="#1e293b" strokeWidth={sm ? 1.2 : 2} />

        {/* Score centralizado */}
        {hasScore && (
          <text
            x={cx}
            y={cy - innerR - (sm ? 3 : 6)}
            textAnchor="middle"
            fontSize={scoreFontSize}
            fontWeight="700"
            fill="#1e293b"
          >
            {score}
            <tspan fontSize={sm ? 7 : 12} fontWeight="400" fill="#64748b">/40</tspan>
          </text>
        )}
      </svg>
    </div>
  );
}