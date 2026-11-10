'use client';
// Peças de interface da versão mobile, no padrão do UI Kit (cores, fontes, ícones e caixas).
import { useEffect, useId, useRef, useState } from 'react';
import Icon from '../Icon';
import Seta from '../Seta';

/** Folha que sobe da base da tela (detalhes, busca, notificações) */
export function Folha({ aberta, onFechar, titulo, children, alta = false, rotulo }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!aberta) return;
    const ant = document.activeElement;
    ref.current?.focus();
    const tecla = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', tecla);
    return () => {
      window.removeEventListener('keydown', tecla);
      ant?.focus?.();
    };
  }, [aberta, onFechar]);
  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="relative flex h-full w-full max-w-[440px] flex-col justify-end">
        <button type="button" aria-label="Fechar" onClick={onFechar} className="absolute inset-0 bg-[#070568]/45" />
        <section
          ref={ref}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titulo ? id : undefined}
          aria-label={titulo ? undefined : rotulo}
          className={`anima-sobe relative flex flex-col rounded-t-[28px] bg-tema-card shadow-flutuante outline-none ${alta ? 'h-[92%]' : 'max-h-[85%]'}`}
        >
          <div className="flex items-center gap-3 px-5 pb-2 pt-3">
            <span aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-tema-linha" />
            {titulo && (
              <h2 id={id} className="mt-3 min-w-0 flex-1 font-display text-[20px] font-extrabold leading-tight text-tema-tinta">
                {titulo}
              </h2>
            )}
            <button type="button" onClick={onFechar} aria-label="Fechar" className="ml-auto mt-3 grid h-10 w-10 flex-none place-items-center rounded-full text-tema-tinta hover:bg-tema-linha">
              <Icon name="fechar" size={20} />
            </button>
          </div>
          <div className="rolagem min-h-0 flex-1 overflow-y-auto px-5 pb-8">{children}</div>
        </section>
      </div>
    </div>
  );
}

/** Caixa numérica limpa: tom pastel do kit, número escuro, rótulo curto; o resto fica no detalhe */
export function CartaoNumero({ c, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[132px] min-w-0 flex-col items-start rounded-[24px] p-4 text-left transition active:scale-[0.98]"
      style={{ background: `var(--tom-${c.tom || 'branco'})` }}
    >
      <span className="flex w-full items-start justify-between gap-2">
        <span className="text-[13px] leading-snug text-tema-suave">{c.curtoRot || c.rotulo}</span>
        <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-tema-card text-tema-tinta [[data-theme=navy]_&]:bg-white/10 [[data-theme=escuro]_&]:bg-white/10">
          <Icon name={c.icone} size={17} />
        </span>
      </span>
      <span className="mt-auto pt-3 font-display text-[26px] font-semibold leading-none tracking-tight text-tema-tinta tabular-nums">{c.valor}</span>
      {c.apoio && <span className="mt-1 text-[11.5px] text-tema-suave">{c.apoio}</span>}
    </button>
  );
}

/** Chips de filtro (pílulas), ativo escuro */
export function Chips({ itens, ativo, onEscolher, rotulo }) {
  return (
    <div role="tablist" aria-label={rotulo} className="sem-barra -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {itens.map((i) => {
        const on = i.id === ativo;
        return (
          <button
            key={i.id}
            role="tab"
            aria-selected={on}
            onClick={() => onEscolher(i.id)}
            className={`flex-none rounded-full px-4 py-2.5 text-[13.5px] transition ${on ? 'bg-navy font-semibold text-white [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy [[data-theme=escuro]_&]:bg-lima [[data-theme=escuro]_&]:text-[#141414]' : 'bg-tema-card text-tema-tinta'}`}
          >
            {i.rotulo}
          </button>
        );
      })}
    </div>
  );
}

/** Faixa de chamada (lima) com botão redondo */
export function Chamada({ icone = 'documento2', texto, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-[24px] bg-lima px-4 py-3.5 text-left text-navy">
      <Icon name={icone} size={22} />
      <span className="flex-1 text-[14px] leading-snug">{texto}</span>
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-navy text-white">
        <Icon name="seta-dir" size={18} />
      </span>
    </button>
  );
}

/** Item de acordeão (lista de temas) */
export function Acordeao({ titulo, icone, aberto, onAlternar, children }) {
  const id = useId();
  return (
    <div className="border-b border-tema-linha">
      <h3>
        <button type="button" aria-expanded={aberto} aria-controls={id} onClick={onAlternar} className="seta-gatilho flex w-full items-center gap-3 py-4 text-left">
          {icone && (
            <span className="grid h-9 w-9 flex-none place-items-center rounded-[12px] bg-tema-card text-tema-tinta">
              <Icon name={icone} size={18} />
            </span>
          )}
          <span className="flex-1 font-display text-[16px] font-semibold text-tema-tinta">{titulo}</span>
          <Seta name="chevron" size={18} aberto={aberto} giro={180} className="text-tema-tinta" />
        </button>
      </h3>
      <div id={id} hidden={!aberto} className="pb-5">
        {children}
      </div>
    </div>
  );
}

export function Botao({ children, onClick, tipo = 'primario', className = '', ...resto }) {
  const estilos = {
    primario: 'bg-navy text-white [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy [[data-theme=escuro]_&]:bg-lima [[data-theme=escuro]_&]:text-[#141414]',
    secundario: 'border border-tema-linha bg-tema-card text-tema-tinta',
    lima: 'bg-lima text-navy',
  };
  return (
    <button type="button" onClick={onClick} className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-50 ${estilos[tipo]} ${className}`} {...resto}>
      {children}
    </button>
  );
}

export function TituloTela({ children, apoio }) {
  return (
    <div className="mb-4">
      <h1 className="font-display text-[28px] font-semibold leading-[1.1] tracking-tight text-tema-tinta">{children}</h1>
      {apoio && <p className="mt-1 text-[13px] text-tema-suave">{apoio}</p>}
    </div>
  );
}

export function SeloFicticio({ children = 'fictício' }) {
  return <span className="inline-flex items-center rounded-full bg-[#FBE7F3] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#8A1457]">{children}</span>;
}

/** Hook simples de estado guardado no navegador (com fallback em memória) */
export function useGuardado(chave, inicial) {
  const [v, setV] = useState(() => {
    try {
      const s = window.localStorage.getItem(chave);
      return s != null ? JSON.parse(s) : inicial;
    } catch {
      return inicial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(chave, JSON.stringify(v));
    } catch {
      /* sem armazenamento: fica só em memória */
    }
  }, [chave, v]);
  return [v, setV];
}
