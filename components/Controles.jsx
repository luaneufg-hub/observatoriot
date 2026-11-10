'use client';
// Controles da barra lateral: Dropdown (Indicadores / UF), Busca global e Camadas.
import { useEffect, useMemo, useRef, useState } from 'react';
import Seta from './Seta';
import Icon from './Icon';
import { Bandeira } from './CaixaUF';
import { UFS } from '@/lib/dados/ufs';
import { GRUPOS, INDICADORES } from '@/lib/dados/indicadores';
import { BIOMA_BY_ID } from '@/lib/dados/biomas';
import { buscarMunicipios, normaliza } from '@/lib/dados/municipios';

function useFora(ref, fechar) {
  useEffect(() => {
    const f = (e) => ref.current && !ref.current.contains(e.target) && fechar();
    document.addEventListener('pointerdown', f);
    return () => document.removeEventListener('pointerdown', f);
  }, [ref, fechar]);
}

/* -------------------------------------------------------------- Dropdown */
export function Dropdown({ rotulo, valor, children, largura = 'w-[320px]', alinhar = 'left-0' }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  useFora(ref, () => setAberto(false));
  useEffect(() => {
    if (!aberto) return;
    const f = (e) => e.key === 'Escape' && setAberto(false);
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [aberto]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className={`flex h-12 w-full items-center justify-between gap-2 rounded-controle bg-tema-destaque pl-4 pr-3 font-detail text-[17px] font-bold text-tema-sobre-destaque transition hover:brightness-[0.97] ${aberto ? '[--icon-2:theme(colors.azul)]' : ''}`}
      >
        <span className="min-w-0 truncate text-left">
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">{rotulo}</span>
          <span className="block truncate leading-tight">{valor}</span>
        </span>
        <Seta size={20} giro={0} aberto={aberto} />
      </button>
      {aberto && (
        <div className={`anima-entra rolagem absolute top-[54px] z-50 max-h-[420px] overflow-y-auto rounded-2xl bg-white p-2 shadow-flutuante ${largura} ${alinhar}`}>
          {typeof children === 'function' ? children(() => setAberto(false)) : children}
        </div>
      )}
    </div>
  );
}

export function ItemLista({ ativo, onClick, children, icone, extra }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={ativo}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px] transition ${ativo ? 'bg-lima font-semibold text-navy-2' : 'text-[#2b2b30] hover:bg-off'}`}
    >
      {icone}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {extra}
    </button>
  );
}

export function DropdownIndicadores({ indicadorId, onEscolher }) {
  const atual = INDICADORES.find((i) => i.id === indicadorId);
  return (
    <Dropdown rotulo="Indicadores" valor={atual.rotulo}>
      {(fechar) =>
        GRUPOS.map((g) => (
          <div key={g.id} className="mb-1" role="listbox" aria-label={g.rotulo}>
            <div className="flex items-center gap-2 px-3 pb-1 pt-2.5 font-detail text-[10.5px] font-bold uppercase tracking-[0.12em] text-cinza">
              <Icon name={g.icone} size={16} /> {g.rotulo}
            </div>
            {INDICADORES.filter((i) => i.grupo === g.id).map((i) => (
              <ItemLista
                key={i.id}
                ativo={i.id === indicadorId}
                onClick={() => {
                  onEscolher(i.id);
                  fechar();
                }}
                icone={i.biomaId ? <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: BIOMA_BY_ID[i.biomaId].cor }} /> : <span className="w-2.5" />}
              >
                {i.rotulo}
              </ItemLista>
            ))}
          </div>
        ))
      }
    </Dropdown>
  );
}

export function DropdownUF({ uf, onEscolher }) {
  const ordenadas = [...UFS].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  return (
    <Dropdown rotulo="UF" valor={uf ? uf : 'Todas'} largura="w-[260px]" alinhar="right-0">
      {(fechar) => (
        <div role="listbox" aria-label="Unidade da Federação">
          <ItemLista
            ativo={!uf}
            onClick={() => {
              onEscolher(null);
              fechar();
            }}
            icone={<Icon name="localizacao" size={18} />}
          >
            Brasil (todas)
          </ItemLista>
          {ordenadas.map((u) => (
            <ItemLista
              key={u.sigla}
              ativo={u.sigla === uf}
              onClick={() => {
                onEscolher(u.sigla);
                fechar();
              }}
              icone={<Bandeira uf={u.sigla} className="h-[14px] w-5 flex-none" />}
              extra={<span className="font-detail text-[11px] font-bold text-cinza">{u.sigla}</span>}
            >
              {u.nome}
            </ItemLista>
          ))}
        </div>
      )}
    </Dropdown>
  );
}

/* -------------------------------------------------------------- Busca global */
export function Busca({ municipios, onUF, onMunicipio, onIndicador }) {
  const [q, setQ] = useState('');
  const [ativo, setAtivo] = useState(0);
  const ref = useRef(null);
  useFora(ref, () => setQ(''));

  const resultados = useMemo(() => {
    const n = normaliza(q.trim());
    if (n.length < 2) return [];
    const ufs = UFS.filter((u) => normaliza(u.nome).includes(n) || normaliza(u.sigla) === n)
      .slice(0, 3)
      .map((u) => ({ tipo: 'uf', id: u.sigla, titulo: u.nome, sub: 'Estado', uf: u.sigla }));
    const mun = municipios
      ? buscarMunicipios(municipios, q, 5).map((m) => ({ tipo: 'mun', id: m.cod, titulo: m.nome, sub: `Município · ${m.uf}`, uf: m.uf, m }))
      : [];
    const inds = INDICADORES.filter((i) => normaliza(i.rotulo).includes(n) || normaliza(i.titulo).includes(n))
      .slice(0, 3)
      .map((i) => ({ tipo: 'ind', id: i.id, titulo: i.titulo, sub: 'Indicador', icone: i.icone }));
    return [...ufs, ...mun, ...inds];
  }, [q, municipios]);

  const escolher = (r) => {
    setQ('');
    if (r.tipo === 'uf') onUF(r.id);
    else if (r.tipo === 'mun') onMunicipio(r.m);
    else onIndicador(r.id);
  };

  return (
    <div ref={ref} className="relative">
      <label className="flex h-12 items-center gap-3 rounded-controle border border-transparent bg-white px-4 text-navy-2 shadow-card focus-within:border-azul focus-within:[--icon-2:theme(colors.azul)]">
        <Icon name="busca" size={22} />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAtivo(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setAtivo((a) => Math.min(a + 1, resultados.length - 1));
            if (e.key === 'ArrowUp') setAtivo((a) => Math.max(a - 1, 0));
            if (e.key === 'Enter' && resultados[ativo]) escolher(resultados[ativo]);
            if (e.key === 'Escape') setQ('');
          }}
          placeholder="escolha um estado, município ou setor"
          aria-label="Buscar estado, município ou setor"
          className="min-w-0 flex-1 bg-transparent font-detail text-[15px] text-[#1e1e1e] outline-none placeholder:text-[#9a9a9a]"
        />
      </label>
      {resultados.length > 0 && (
        <ul role="listbox" className="anima-entra absolute left-0 right-0 top-[54px] z-50 rounded-2xl bg-white p-2 shadow-flutuante">
          {resultados.map((r, i) => (
            <li key={r.tipo + r.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === ativo}
                onMouseEnter={() => setAtivo(i)}
                onClick={() => escolher(r)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${i === ativo ? 'bg-off' : ''}`}
              >
                {r.uf ? <Bandeira uf={r.uf} className="h-[14px] w-5 flex-none" /> : <span className="grid w-5 place-items-center text-navy-2"><Icon name={r.icone} size={18} /></span>}
                <span className="min-w-0 flex-1 truncate text-[14px] text-[#1e1e1e]">{r.titulo}</span>
                <span className="font-detail text-[11px] text-cinza">{r.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- Camadas */
export const CAMADAS = [
  { id: 'sebrae', rotulo: 'Sebrae', desc: 'Sede estadual e escritórios regionais', icone: 'sebrae' },
  { id: 'municipais', rotulo: 'Indicadores municipais', desc: 'Coroplético por município', icone: 'rede' },
  { id: 'limites', rotulo: 'Limites estaduais', desc: 'Divisas entre as UFs', icone: 'localizacao' },
  { id: 'bioma', rotulo: 'Bioma', desc: 'Limites dos 6 biomas (IBGE)', icone: 'bioma' },
];

export function Camadas({ camadas, onAlternar }) {
  return (
    <ul className="grid gap-1.5" aria-label="Camadas do mapa">
      {CAMADAS.map((c) => {
        const on = camadas[c.id];
        return (
          <li key={c.id}>
            <label className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-tema-linha ${on ? '' : 'opacity-90'}`}>
              <input type="checkbox" className="peer sr-only" checked={on} onChange={() => onAlternar(c.id)} />
              <span
                aria-hidden
                className={`grid h-5 w-5 flex-none place-items-center rounded-md border-2 transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-azul ${on ? 'border-navy-2 bg-navy-2 text-lima [[data-theme=navy]_&]:border-lima [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy [[data-theme=escuro]_&]:border-verde [[data-theme=escuro]_&]:bg-verde [[data-theme=escuro]_&]:text-[#141414]' : 'border-cinza'}`}
              >
                {on && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 6.2 5 8.5l4.5-5" />
                  </svg>
                )}
              </span>
              <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg text-tema-tinta ${on ? 'bg-tema-linha' : ''}`}>
                <Icon name={c.icone} size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-tema-tinta">{c.rotulo}</span>
                <span className="block text-[11.5px] text-tema-suave">{c.desc}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
