import { useEffect, useMemo, useRef, useState } from 'react';
import cloud from 'd3-cloud';
import * as d3 from 'd3';

const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();


type Polarity = 'neg' | 'pos';
type Item = { text: string; count: number; score?: number };

const RAW_STOP = [
  'de','da','do','das','dos','e','a','o','os','as','um','uma','que','com','pra',
  'pro','na','no','em','por','para','se','ser','foi','era','é','são'
];
// normaliza TODAS as stopwords (remove acento e baixa)
const STOP = new Set(RAW_STOP.map(s =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
));


// agrega por palavra somando contagem e média de score
function mergeItems(items: Item[]) {
  const map = new Map<string, { count: number; scoreSum: number; scoreAbsMax: number; nScore: number }>();
  for (const it of items) {
    const key = normalize(it.text);
    if (!key || key.length < 3 || STOP.has(key)) continue;

    const prev = map.get(key) ?? { count: 0, scoreSum: 0, scoreAbsMax: 0, nScore: 0 };
    const hasScore = Number.isFinite(it.score as number);
    const score = hasScore ? (it.score as number) : 0;

    map.set(key, {
      count: prev.count + (Number(it.count) || 0),
      scoreSum: prev.scoreSum + (hasScore ? score : 0),
      scoreAbsMax: hasScore ? Math.max(prev.scoreAbsMax, Math.abs(score)) : prev.scoreAbsMax,
      nScore: prev.nScore + (hasScore ? 1 : 0),
    });
  }
  return [...map.entries()].map(([text, v]) => ({
    text,
    count: v.count,
    avgScore: v.nScore ? v.scoreSum / v.nScore : Number.NaN, // <<< sem score => NaN
    maxAbsScore: v.scoreAbsMax
  }));
}


export default function WordHeatmap({
  items,
  polarity,
  width = 720,
  height = 360,
  maxWords = 40,
  gap = 0.25,      
  minFreq = 2     
}: {
  items: Item[];
  polarity: Polarity;
  width?: number;
  height?: number;
  maxWords?: number;
  gap?: number;
  minFreq?: number;
}) {
   if (!items || items.length === 0) return null;

  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(width);
  const h = height;

  

  // responsivo
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  // pré-processa (agrega + filtra + ordena)
  const words = useMemo(() => {
   const agg = mergeItems(items)
  .filter(x => x.count >= minFreq)
  .filter(x => Number.isFinite(x.avgScore)) // <<< exige score válido
  .filter(x => polarity === 'pos' ? x.avgScore! >= gap : x.avgScore! <= -gap)
  .sort((a, b) => b.count - a.count)
  .slice(0, maxWords);


    if (agg.length === 0) return [];

    const maxCnt = Math.max(1, ...agg.map(s => s.count));
    const maxAbs = Math.max(0.2, ...agg.map(s => Math.abs(s.avgScore)));

    // peso = 65% frequência + 35% intensidade do sentimento
    const weight = (a: typeof agg[number]) =>
      0.65 * (a.count / maxCnt) + 0.35 * (Math.abs(a.avgScore) / maxAbs);

    // tamanho conduzido majoritariamente por frequência
    const size = d3.scaleSqrt()
      .domain([Math.min(...agg.map(s => s.count)), maxCnt])
      .range([14, Math.max(28, Math.min(72, h * 0.22))]);

    return agg.map(s => ({
      text: s.text,
      value: s.count,
      avgScore: s.avgScore,
      heat: weight(s),            // 0..1
      size: Math.max(12, size(s.count))
    }));
  }, [items, maxWords, h, gap, minFreq, polarity]);

   if (words.length === 0) return null;

  useEffect(() => {
    if (!canvasRef.current || words.length === 0) return;

    const cw = Math.max(200, w);
    const ch = h;
    const dpr = window.devicePixelRatio || 1;

    const canvas = canvasRef.current;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.resetTransform();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const layout = cloud<any>()
      .size([cw, ch])
      .words(words as any)
      .padding(2)
      .rotate(() => 0)
      .spiral('archimedean')
      .font('Inter, system-ui, sans-serif')
      .fontSize((d: any) => d.size)
      .on('end', (placed: any[]) => draw(placed));

    layout.start();

    function colorScale(pol: Polarity, t: number) {
      // t = heat 0..1
      return pol === 'neg'
        ? d3.interpolateInferno(0.35 + 0.65 * t)  // roxo→laranja→amarelo
        : d3.interpolateYlGn(0.35 + 0.65 * t);    // verdes quentes
    }

    function draw(placed: any[]) {
      ctx.save();
      for (const p of placed) {
        const r = Math.max(16, p.size * 0.9);
        const grad = ctx.createRadialGradient(p.x + cw / 2, p.y + ch / 2, 0, p.x + cw / 2, p.y + ch / 2, r);
        const col = colorScale(polarity, p.heat); // usa heat (freq×|score|)
        grad.addColorStop(0, d3.color(col)!.copy({ opacity: 0.55 })!.formatRgb());
        grad.addColorStop(1, d3.color(col)!.copy({ opacity: 0 })!.formatRgb());
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x + cw / 2, p.y + ch / 2, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // texto por cima
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const p of placed) {
        ctx.font = `${Math.round(p.size)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = '#111';
        ctx.strokeStyle = 'rgba(255,255,255,.6)';
        ctx.lineWidth = Math.max(1, p.size * 0.06);
        const x = p.x + cw / 2, y = p.y + ch / 2;
        ctx.strokeText(p.text, x, y);
        ctx.fillText(p.text, x, y);
      }
    }
    return () => {
    try { (layout as any).stop?.(); } catch {}
    ctx.clearRect(0, 0, cw, ch);
  };
  }, [words, w, h, polarity]);

  return (
    <div ref={hostRef} style={{ width: '100%', height: h }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
