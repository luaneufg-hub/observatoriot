'use client';
// Card — estrutura inspirada no FinanceHub (caixa, hierarquia, ícone de informação);
// cores, fontes e ícones do UI Kit do Observatório.
//
//   ┌──────────────────────────────────────┐
//   │ [ícone] Rótulo                 (i)   │  ← rótulo 13px + InfoTip (sempre presente)
//   │ Valor grande                         │  ← Proxima Nova 28–36px
//   │ [selo]  apoio                        │  ← pill/posição/variação
//   │ nota · fonte                         │  ← 12px apagado
//   └──────────────────────────────────────┘
import { useId, useState } from 'react';
import Icon from './Icon';

export function InfoTip({ titulo, children, lado = 'direita', classeBotao }) {
  const [aberto, setAberto] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={`Sobre: ${titulo}`}
        aria-describedby={aberto ? id : undefined}
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        onMouseEnter={() => setAberto(true)}
        onMouseLeave={() => setAberto(false)}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        className={classeBotao || 'grid h-7 w-7 place-items-center rounded-full text-tema-apagado transition hover:bg-tema-linha hover:text-tema-tinta [--icon-2:theme(colors.azul)] focus-visible:text-tema-tinta'}
      >
        <Icon name="info" size={18} />
      </button>
      {aberto && (
        <span
          id={id}
          role="tooltip"
          className={`anima-entra absolute top-8 z-40 w-64 rounded-2xl bg-white p-3.5 text-left text-[12.5px] leading-snug text-[#2b2b30] shadow-flutuante ${lado === 'direita' ? 'right-0' : 'left-0'}`}
        >
          <strong className="mb-1 block font-display text-[13px] font-bold text-navy-2">{titulo}</strong>
          {children}
        </span>
      )}
    </span>
  );
}

export default function Card({ icone, rotulo, info, infoTitulo, acao, className = '', children }) {
  return (
    <section className={`min-w-0 rounded-card border border-tema-linha bg-tema-card p-5 shadow-card ${className}`}>
      <header className="mb-2 flex items-center gap-2.5">
        {icone && (
          <span className="grid h-9 w-9 flex-none place-items-center rounded-controle bg-off text-navy-2 [[data-theme=navy]_&]:bg-white/10 [[data-theme=navy]_&]:text-off [[data-theme=escuro]_&]:bg-white/5 [[data-theme=escuro]_&]:text-off">
            <Icon name={icone} size={20} />
          </span>
        )}
        <h3 className="min-w-0 flex-1 truncate text-rotulo text-tema-suave">{rotulo}</h3>
        {acao}
        <InfoTip titulo={infoTitulo || rotulo}>{info}</InfoTip>
      </header>
      {children}
    </section>
  );
}

export function Valor({ children, className = '' }) {
  return <div className={`font-display text-[34px] font-extrabold leading-none tracking-tight text-tema-numero tabular-nums ${className}`}>{children}</div>;
}

export function Selo({ children, tom = 'neutro' }) {
  const tons = {
    neutro: 'bg-off text-navy-2 [[data-theme=navy]_&]:bg-white/10 [[data-theme=navy]_&]:text-off [[data-theme=escuro]_&]:bg-white/10 [[data-theme=escuro]_&]:text-off',
    destaque: 'bg-lima text-navy-2',
  };
  return <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold ${tons[tom]}`}>{children}</span>;
}

export function Nota({ children }) {
  return <p className="mt-3 font-detail text-nota italic text-tema-apagado">{children}</p>;
}

/** Barra horizontal com rótulo e valor (ranking) */
export function LinhaBarra({ pos, nome, frac, valor, onClick, onHover, ativo }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={`grid w-full grid-cols-[18px_minmax(0,1fr)_32%_64px] items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left text-[13px] text-tema-tinta transition hover:bg-tema-linha ${ativo ? 'bg-tema-linha font-semibold' : ''}`}
    >
      <span className="font-detail text-[11px] font-bold text-tema-apagado">{pos}</span>
      <span className="truncate">{nome}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-tema-linha">
        <span className="block h-full rounded-full bg-[var(--tema-barra)]" style={{ width: `${Math.max(2, frac * 100)}%` }} />
      </span>
      <span className="text-right font-semibold tabular-nums">{valor}</span>
    </button>
  );
}
