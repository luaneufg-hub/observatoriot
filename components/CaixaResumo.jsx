'use client';
// "Temos um resumo pra você!": caixa no padrão da CaixaUF (quadro magenta + cabeçalho verde),
// com o olho do UI Kit no quadro. A pupila segue o mouse (ou o toque); com "reduzir movimento"
// ela fica parada no centro.
import { useEffect, useId, useRef } from 'react';
import { reduzMovimento } from './diagnostico/Contador';

// Olho redesenhado a partir da arte do kit (Ativo_29–35), sem a textura de grãos
// (a textura vira um ruído leve em SVG, para o arquivo continuar pequeno).
export function Olho({ className = '', alcance = 5.2 }) {
  const ref = useRef(null);
  const pupila = useRef(null);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    if (reduzMovimento()) return;
    let raf = 0;
    let alvo = null;
    const mover = () => {
      raf = 0;
      const svg = ref.current;
      const p = pupila.current;
      if (!svg || !p || !alvo) return;
      const r = svg.getBoundingClientRect();
      // centro da íris na tela (íris em x 41.8 de 83.6; y 44.2, recorte de 19 a 69)
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * ((44.24 - 19) / 50);
      const dx = alvo[0] - cx;
      const dy = alvo[1] - cy;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 260); // perto do olho, a pupila anda menos
      p.style.transform = `translate(${(dx / d) * alcance * k}px, ${(dy / d) * alcance * k * 0.8}px)`;
    };
    const agendar = (x, y) => {
      alvo = [x, y];
      if (!raf) raf = requestAnimationFrame(mover);
    };
    const onMove = (e) => agendar(e.clientX, e.clientY);
    const onTouch = (e) => e.touches[0] && agendar(e.touches[0].clientX, e.touches[0].clientY);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('touchstart', onTouch);
    };
  }, [alcance]);

  return (
    <svg ref={ref} viewBox="0 19 83.58 50" className={className} aria-hidden>
      <defs>
        <clipPath id={`iris-${id}`}>
          <circle cx="41.79" cy="44.24" r="16.57" />
        </clipPath>
        <filter id={`grao-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="7" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.05" />
        </filter>
      </defs>
      {/* branco do olho */}
      <path fill="#fff" d="M0,44.24s19.93-24.36,42.63-24.36,40.94,24.36,40.94,24.36c0,0-19.35,24.36-40.94,24.36C18.25,68.6,0,44.24,0,44.24Z" />
      {/* íris com as fatias (gráfico) e o grão */}
      <g clipPath={`url(#iris-${id})`}>
        <circle cx="41.79" cy="44.24" r="16.57" fill="#3854a1" />
        <circle cx="34.16" cy="43.35" r="8.94" fill="#72b2e3" opacity=".23" />
        <path fill="#de565d" d="M42.4,27.67l.46,17.11s5.92,5.26,11.5,10.25c2.5-2.9,4-6.67,4-10.8,0-8.95-7.09-16.24-15.96-16.56Z" />
        <path fill="#c9d865" d="M58.31,45.61l-9.7-.82-2.92,4.52,7.18,7.34c3.08-2.77,5.11-6.67,5.45-11.04Z" />
        <rect x="25" y="27.5" width="34" height="34" filter={`url(#grao-${id})`} opacity=".28" />
      </g>
      {/* pupila + brilho: seguem o mouse */}
      <g ref={pupila} style={{ transition: 'transform .18s ease-out', transformBox: 'view-box' }}>
        <circle cx="41.79" cy="44.24" r="8.25" fill="#253267" />
        <circle cx="35.92" cy="40.6" r="4.14" fill="#eff3ee" />
      </g>
    </svg>
  );
}

export default function CaixaResumo({ titulo, rotulo = 'Temos um resumo pra você!', children, className = '' }) {
  return (
    <article className={`overflow-hidden rounded-[12px] border-[1.5px] border-[#e2e2e2] bg-white text-[#1b1b1f] ${className}`}>
      <header className="flex h-[60px] items-stretch">
        <span className="grid w-[64px] flex-none place-items-center bg-[#D81E5B]">
          <Olho className="w-[56px]" />
        </span>
        <h3 className="flex min-w-0 flex-1 items-center justify-center truncate bg-[#36BF76] px-4 font-detail text-[26px] font-bold leading-none tracking-[-0.01em] text-white">
          {titulo}
        </h3>
      </header>
      <div className="px-5 pb-5 pt-4">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-magenta">{rotulo}</p>
        <div className="mt-1.5 text-[14px] leading-relaxed">{children}</div>
      </div>
    </article>
  );
}

// Íris inteira sobre a borda da faixa (arte outra_ver.svg): metade na faixa, metade no corpo,
// sem o branco do olho. Pupila e brilho seguem o mouse; com "reduzir movimento" ficam parados.
// Coordenadas no espaço da arte (faixa de 42,85 de largura; íris em 39,25 / 58,21, raio 28,25).
const IRIS = { cx: 39.25, cy: 58.21, r: 28.25 };
const VB = { x: 9, y: 28, l: 61 }; // recorte quadrado em volta da íris
const REPOUSO = [6.69, -1.51]; // posição da pupila na arte, relativa ao centro da íris
const BRILHO = 0.45; // o brilho anda menos que a pupila: dá a sensação de volume

function IrisFaixa({ alcance = 9, className = '' }) {
  const ref = useRef(null);
  const pupila = useRef(null);
  const brilho = useRef(null);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    if (reduzMovimento()) return;
    let raf = 0;
    let alvo = null;
    const mover = () => {
      raf = 0;
      const svg = ref.current;
      if (!svg || !alvo) return;
      const r = svg.getBoundingClientRect();
      const esc = r.width / VB.l;
      const cx = r.left + (IRIS.cx - VB.x) * esc;
      const cy = r.top + (IRIS.cy - VB.y) * esc;
      const dx = alvo[0] - cx;
      const dy = alvo[1] - cy;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 320); // perto do olho, a pupila anda menos
      const x = (dx / d) * alcance * k;
      const y = (dy / d) * alcance * k;
      pupila.current.style.transform = `translate(${x}px, ${y}px)`;
      brilho.current.style.transform = `translate(${x * BRILHO}px, ${y * BRILHO}px)`;
    };
    const agendar = (x, y) => {
      alvo = [x, y];
      if (!raf) raf = requestAnimationFrame(mover);
    };
    const onMove = (e) => agendar(e.clientX, e.clientY);
    const onTouch = (e) => e.touches[0] && agendar(e.touches[0].clientX, e.touches[0].clientY);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('touchstart', onTouch);
    };
  }, [alcance]);

  const mov = { transition: 'transform .22s ease-out', transformBox: 'view-box' };
  return (
    <svg ref={ref} viewBox={`${VB.x} ${VB.y} ${VB.l} ${VB.l}`} className={className} aria-hidden>
      <defs>
        <clipPath id={`iris-${id}`}>
          <circle cx={IRIS.cx} cy={IRIS.cy} r={IRIS.r} />
        </clipPath>
        <filter id={`grao-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="11" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.1" />
        </filter>
      </defs>
      <g clipPath={`url(#iris-${id})`}>
        <circle cx={IRIS.cx} cy={IRIS.cy} r={IRIS.r} fill="#43559e" />
        <circle cx="26.25" cy="56.7" r="15.25" fill="#87b1e0" opacity=".23" />
        <path fill="#c1575d" d="M40.29,29.96l.78,29.17s10.1,8.96,19.6,17.47c4.25-4.94,6.83-11.38,6.83-18.41,0-15.25-12.09-27.68-27.21-28.23Z" />
        <path fill="#ccd76d" d="M67.42,60.56l-16.54-1.4-4.98,7.71,12.24,12.51c5.24-4.72,8.71-11.37,9.28-18.83Z" />
        <rect x={VB.x} y={VB.y} width={VB.l} height={VB.l} filter={`url(#grao-${id})`} opacity=".3" />
        <g ref={pupila} style={{ ...mov, transform: `translate(${REPOUSO[0]}px, ${REPOUSO[1]}px)` }}>
          <circle cx={IRIS.cx} cy={IRIS.cy} r="14.06" fill="#2e3566" />
        </g>
        <g ref={brilho} style={{ ...mov, transform: `translate(${REPOUSO[0] * BRILHO}px, ${REPOUSO[1] * BRILHO}px)` }}>
          <circle cx={29.25 - REPOUSO[0] * BRILHO} cy={49.63 - REPOUSO[1] * BRILHO} r="7.06" fill="#f0f3ee" />
        </g>
      </g>
    </svg>
  );
}

// Variações de cor da faixa (alternam ao passar de uma aba para a outra).
// Contraste (WCAG): nenhum verde da paleta passa com texto branco (Guaco 2,55:1). Por isso a
// variação verde usa Guaco (#61B466) com texto navy (6,7:1, passa AA). Na magenta (#D81E5B, da identidade), branco 4,9:1 (passa AA) e
// umbu 4,3:1 (só no título grande, onde o mínimo é 3:1).
const VARIANTES = {
  verde: { corpo: '#61B466', faixa: '#D81E5B', titulo: '#070568', texto: '#070568', fio: 'rgba(7,5,104,.45)' },
  magenta: { corpo: '#D81E5B', faixa: '#61B466', titulo: '#E7F79E', texto: '#FFFFFF', fio: 'rgba(255,255,255,.7)' },
};

function Estrela({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#F6C343"
        d="M12 2.6l2.75 5.86 6.4.8-4.7 4.43 1.2 6.35L12 16.9l-5.65 3.14 1.2-6.35-4.7-4.43 6.4-.8z"
      />
    </svg>
  );
}

// Versão em faixa (horizontal), conforme outra_ver.svg: faixa estreita + corpo, com a íris inteira na divisa.
// Hierarquia: título (umbu, Proxima Bold) · fio branco · subtítulo (branco, bold) · texto (branco, regular).
// Troca de aba/setor sem transição: cor e texto mudam na hora.
export function FaixaResumo({ titulo = 'Temos um resumo pra você!', subtitulo, destaque = false, variante = 'verde', chave, children, className = '' }) {
  const v = VARIANTES[variante] || VARIANTES.verde;
  return (
    <article
      className={`relative flex overflow-hidden rounded-[22px] shadow-[0_14px_30px_-20px_rgba(7,5,104,.5)] ${className}`}
      style={{ backgroundColor: v.corpo, color: v.texto }}
    >
      <span className="w-[44px] flex-none sm:w-[52px]" style={{ backgroundColor: v.faixa }} aria-hidden />
      {/* a íris fica por cima da borda entre a faixa e o corpo (centro a 52% da altura) */}
      <IrisFaixa className="pointer-events-none absolute left-[9px] top-[calc(52%-31px)] h-[63px] w-[63px] sm:left-[11px] sm:top-[calc(52%-37.5px)] sm:h-[75px] sm:w-[75px]" />
      <div key={chave} className="min-w-0 flex-1 pb-5 pl-[40px] pr-5 pt-4 sm:pb-6 sm:pl-[60px] sm:pr-7 sm:pt-5">
        <h3 className="font-display text-[24px] font-bold leading-[1.1] tracking-[-0.01em] sm:text-[30px]" style={{ color: v.titulo }}>{titulo}</h3>
        <span className="mt-2 block h-px w-full max-w-[313px]" style={{ backgroundColor: v.fio }} aria-hidden />
        {subtitulo && (
          <p className="mt-3 font-display text-[16.5px] font-bold leading-snug sm:text-[19.5px]">
            {subtitulo}
            {destaque && (
              <>
                {' '}
                <Estrela className="-mt-1 inline-block h-[1.05em] w-[1.05em] align-middle" />
                <span className="sr-only">(destaque)</span>
              </>
            )}
          </p>
        )}
        <div className="mt-2 font-display text-[14px] leading-[1.45] sm:text-[15.5px]">{children}</div>
      </div>
    </article>
  );
}
