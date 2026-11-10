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
    // sol do kit (Ativo_1.svg, nov. 2026)
    return (
      <svg width="22" height="22" viewBox="0 0 56.71 56.71" aria-hidden="true">
        <path fill="#F39D72" d="M45.21,35.24l-5.02-3.95,16.52-3.06-16.63-2.93c-.02-.06-.03-.13-.05-.19l4.92-4.32-6.35.93,4.48-8.8-8.58,4.97s0,0,0,0l.3-6.58-3.5,4.91L28.35,0l-3,16.62s-.05.01-.07.02l.07-.03-4.35-5.04.88,6.36-8.76-4.55,4.9,8.63-6.59-.35,5.17,3.75L0,28.48l16.56,2.92-4.87,3.96,6.37-.69s0,0,0,.01l-4.8,8.61,8.77-4.64s0,0,0,0l-.55,6.57,3.88-5.02,2.98,16.52,3.01-16.65,3.91,4.9-.62-6.28s.06-.04.09-.05l8.48,4.82-4.55-8.76s.02-.03.03-.04l6.52.6ZM28.37,38.5c-5.59,0-10.15-4.55-10.15-10.15s4.55-10.15,10.15-10.15,10.15,4.55,10.15,10.15-4.55,10.15-10.15,10.15Z" />
        <path fill="#F39D72" d="M28.37,19.21c-5.04,0-9.15,4.1-9.15,9.15s4.1,9.15,9.15,9.15,9.15-4.1,9.15-9.15-4.1-9.15-9.15-9.15Z" />
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
          className={`pointer-events-none absolute left-[4px] top-[4px] grid h-[32px] w-[32px] place-items-center rounded-full transition-[transform,background-color,box-shadow] ${m.id === 'escuro' ? 'shadow-[0_2px_6px_rgba(0,0,0,0.25)]' : ''} duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none`}
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
