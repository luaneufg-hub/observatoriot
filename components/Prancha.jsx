'use client';
// Visualização "Destaques" (estilo prancha de arquitetura) em Deck.gl:
// quadro tracejado (PathLayer + PathStyleExtension), cruzetas e N/S/L/O (TextLayer),
// círculo de foco (ScatterplotLayer). A caixa do lugar fica só na barra lateral.
import { PathLayer, TextLayer, ScatterplotLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import { PRANCHA, hexParaRgb } from '@/lib/escalas';

const COR = hexParaRgb(PRANCHA.escura);
const BRASIL = [-74.2, -33.9, -34.6, 5.4];

export function construirPrancha({ foco, carimbo }) {
  // foco: { bbox:[x0,y0,x1,y1], centro:[lon,lat] } | null (Brasil)
  const [x0, y0, x1, y1] = foco?.bbox || BRASIL;
  const px = (x1 - x0) * (foco ? 0.12 : 0.02);
  const py = (y1 - y0) * (foco ? 0.12 : 0.02);
  const a = [x0 - px, y0 - py, x1 + px, y1 + py];
  const cx = (a[0] + a[2]) / 2;
  const cy = (a[1] + a[3]) / 2;

  const camadasDeck = [
    new PathLayer({
      id: 'pr-quadro',
      data: [{ path: [[a[0], a[1]], [a[2], a[1]], [a[2], a[3]], [a[0], a[3]], [a[0], a[1]]] }],
      getPath: (d) => d.path,
      getColor: COR,
      getWidth: 1.4,
      widthUnits: 'pixels',
      getDashArray: [7, 5],
      dashJustified: true,
      extensions: [new PathStyleExtension({ dash: true })],
    }),
    new TextLayer({
      id: 'pr-cruzetas',
      data: [[a[0], a[1]], [a[2], a[1]], [a[2], a[3]], [a[0], a[3]]],
      getPosition: (d) => d,
      getText: () => '+',
      getSize: 26,
      getColor: COR,
      fontFamily: 'Lato, Inter, sans-serif',
      fontWeight: 400,
      getAlignmentBaseline: 'center',
    }),
    new TextLayer({
      id: 'pr-cardeais',
      data: [
        { t: 'N', p: [cx, a[3]], o: [0, -18] },
        { t: 'S', p: [cx, a[1]], o: [0, 20] },
        { t: 'O', p: [a[0], cy], o: [-18, 0] },
        { t: 'L', p: [a[2], cy], o: [18, 0] },
      ],
      getPosition: (d) => d.p,
      getText: (d) => d.t,
      getPixelOffset: (d) => d.o,
      getSize: 24,
      getColor: COR,
      fontFamily: 'proxima-nova, Inter, sans-serif',
      fontWeight: 800,
      getAlignmentBaseline: 'center',
    }),
  ];
  if (foco?.centro) {
    camadasDeck.push(
      new ScatterplotLayer({
        id: 'pr-circulo',
        data: [foco.centro],
        getPosition: (d) => d,
        getRadius: 44,
        radiusUnits: 'pixels',
        stroked: true,
        filled: false,
        getLineColor: COR,
        getLineWidth: 1.5,
        lineWidthUnits: 'pixels',
      }),
      new ScatterplotLayer({
        id: 'pr-marca',
        data: [foco.centro],
        getPosition: (d) => d,
        getRadius: 5,
        radiusUnits: 'pixels',
        getFillColor: COR,
        stroked: true,
        getLineColor: [255, 255, 255],
        getLineWidth: 2,
        lineWidthUnits: 'pixels',
      }),
    );
  }

  // A caixa do lugar (bandeira, valor, vocação) fica só na barra lateral; no mapa, o foco é o círculo.
  const html = () => {
    return (
      <>
        {!foco && (
          <div className="absolute left-6 top-[124px] z-[5] sm:left-7 inline-flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-2.5 pr-3 text-[12px] text-[#3c3a36] shadow-card">
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: PRANCHA.escura }} />
            Em que setor cada lugar se destaca: clique para aproximar
          </div>
        )}
        <Carimbo {...carimbo} />
      </>
    );
  };
  return { camadasDeck, html };
}

function Carimbo({ titulo, itens, folha, lugar, nota }) {
  return (
    <div className="absolute bottom-6 left-6 z-[5] w-[250px] border border-[#d9d5cc] bg-white/95 px-3.5 pb-2.5 pt-3 text-[11px] text-[#2b2b30]">
      <div className="absolute right-3 top-2.5 flex flex-col items-end leading-none">
        <span className="text-[9px] uppercase tracking-[0.1em] text-cinza">folha</span>
        <strong className="font-display text-[18px] font-extrabold text-[#1e1e22]">{folha}</strong>
      </div>
      <div className="mr-16 font-display text-[12px] font-extrabold uppercase leading-tight tracking-[0.1em]" style={{ color: PRANCHA.escura }}>
        + Destaques no território
      </div>
      <div className="mb-2 mr-16 mt-0.5 font-display text-[13px] font-bold leading-tight text-[#1e1e22]">{titulo}</div>
      <ul className="grid gap-[3px] tabular-nums">
        {itens.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-5 flex-none"
              style={{
                backgroundColor: it.cor,
                backgroundImage: it.hachura ? 'repeating-linear-gradient(45deg, rgba(20,20,24,.6) 0 1px, transparent 1px 4px)' : undefined,
              }}
            />
            {it.rotulo}
          </li>
        ))}
      </ul>
      {nota && <p className="mt-1.5 text-[10px] italic leading-snug text-[#6b6b70]">{nota}</p>}
      <div className="mt-2 flex items-end justify-between border-t border-[#e3dfd6] pt-2">
        <span className="text-[9.5px] uppercase tracking-[0.08em] text-cinza">{lugar}</span>
        <svg width="26" height="26" viewBox="0 0 30 30" aria-label="Norte">
          <circle cx="15" cy="15" r="13" fill="none" stroke="#2b2b30" />
          <path d="M15 4 19 18 15 15 11 18Z" fill="#2b2b30" />
        </svg>
      </div>
    </div>
  );
}
