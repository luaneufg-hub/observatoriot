'use client';
// Toggle de três posições para os modos de cor: claro (sol), navy (lua crescente) e escuro (lua cheia).
// O botão desliza pela trilha; a trilha muda de cor e ganha estrelas nos modos noturnos.
// Acessível como grupo de rádios: clique numa posição, ou use as setas do teclado.
import { useRef } from 'react';

const MODOS = [
  { id: 'claro', rotulo: 'Claro', trilha: '#C9DF60', botao: '#FFFFFF', tinta: '#E8693F' },
  { id: 'navy', rotulo: 'Navy', trilha: '#2A4FDA', botao: '#F5F1EB', tinta: '#070568' },
  { id: 'escuro', rotulo: 'Escuro', trilha: '#232122', botao: '#F5F1EB', tinta: '#8B8D86' },
];
const PASSO = 34; // deslocamento do botão entre posições (px)

function Simbolo({ id, cor }) {
  if (id === 'claro')
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" fill={cor} />
        <path d="M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
    );
  if (id === 'navy')
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1Z" fill={cor} />
      </svg>
    );
  // lua cheia, com crateras
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="#D9D5CC" />
      <circle cx="9" cy="9.5" r="1.8" fill={cor} opacity="0.55" />
      <circle cx="14.5" cy="14" r="2.4" fill={cor} opacity="0.45" />
      <circle cx="14" cy="8" r="1" fill={cor} opacity="0.5" />
    </svg>
  );
}

export default function SeletorTema({ tema, onMudar, className = '' }) {
  const i = Math.max(0, MODOS.findIndex((m) => m.id === tema));
  const m = MODOS[i];
  const refs = useRef([]);
  const tecla = (e) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + MODOS.length) % MODOS.length;
    onMudar(MODOS[n].id);
    refs.current[n]?.focus();
  };
  const noturno = m.id !== 'claro';
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="hidden min-w-[44px] text-right text-[13px] font-semibold text-white sm:inline" aria-hidden="true">
        {m.rotulo}
      </span>
      <div
        role="radiogroup"
        aria-label="Modo de cor"
        onKeyDown={tecla}
        className="relative h-[40px] w-[108px] flex-none rounded-full ring-1 ring-white/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.25)] transition-colors duration-500"
        style={{ background: m.trilha }}
      >
        {/* estrelas nos modos noturnos, do lado oposto ao botão */}
        <span aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${noturno ? 'opacity-100' : 'opacity-0'}`}>
          {(i === 1 ? [[14, 10, 3], [24, 24, 2], [86, 12, 2.5], [94, 25, 2]] : [[16, 11, 3], [28, 25, 2], [42, 13, 2], [54, 26, 1.6]]).map(([x, y, r], k) => (
            <span key={k} className="absolute rounded-full bg-white" style={{ left: x, top: y, width: r * 2, height: r * 2 }} />
          ))}
        </span>
        {/* botão que desliza */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[4px] top-[4px] grid h-[32px] w-[32px] place-items-center rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(${i * PASSO}px) rotate(${i * 120}deg)`, background: m.botao }}
        >
          <span style={{ transform: `rotate(${-i * 120}deg)` }} className="grid place-items-center transition-transform duration-500">
            <Simbolo id={m.id} cor={m.tinta} />
          </span>
        </span>
        {/* posições clicáveis (rádios) */}
        <span className="absolute inset-0 grid grid-cols-3">
          {MODOS.map((x, k) => (
            <button
              key={x.id}
              ref={(el) => (refs.current[k] = el)}
              type="button"
              role="radio"
              aria-checked={k === i}
              aria-label={x.rotulo}
              title={x.rotulo}
              tabIndex={k === i ? 0 : -1}
              onClick={() => onMudar(k === i ? MODOS[(i + 1) % MODOS.length].id : x.id)}
              className="h-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tema-nav)]"
            />
          ))}
        </span>
      </div>
    </div>
  );
}
