'use client';
// Potencial exportador das MPEs para a UE (estudo especial do Observatório, 2025).
// Abas Por produto e Por estado, resumo em texto, cartões, mapa por estado e rankings.
// Dados: lib/dados/retratos/exportacoes-mpe-ue-2025.json (scripts/retrato-exportacoes-ue.py).
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoIdentity, geoPath } from 'd3-geo';
import { quantile } from 'd3-array';
import Icon from '../Icon';
import { Bandeira } from '../CaixaUF';
import { UF_BY_SIGLA } from '@/lib/dados/ufs';
import { normaliza } from '@/lib/dados/municipios';
import { RAMPA_EMPRESAS, BASE } from '@/lib/escalas';
import { geo } from '@/lib/geo';
import { asset } from '@/lib/asset';
import EXP from '@/lib/dados/retratos/exportacoes-mpe-ue-2025.json';

const UFS = EXP.ufs;
const IDX = Object.fromEntries(UFS.map((u, i) => [u, i]));
const PRODUTOS = Object.entries(EXP.produtos)
  .map(([cod, p]) => ({ cod, nome: p.nome, ue: p.ue.reduce((a, b) => a + b, 0), demais: p.demais.reduce((a, b) => a + b, 0) }))
  .sort((a, b) => b.ue - a.ue);
const TOTAL_UE = EXP.todos.ue.reduce((a, b) => a + b, 0);
const TOTAL_DEMAIS = EXP.todos.demais.reduce((a, b) => a + b, 0);

/* ------------------------------------------------------------------ formatos */
const nf1 = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = (v) => Math.round(v).toLocaleString('pt-BR');
/** valores em US$ milhões → "US$ 70,8 mi" · "US$ 450 mil" */
function usd(mi) {
  if (mi >= 1000) return `US$ ${nf1(mi / 1000)} bi`;
  if (mi >= 0.95) return `US$ ${nf1(mi)} mi`;
  if (mi > 0) return `US$ ${nf0(mi * 1000)} mil`;
  return 'US$ 0';
}
const pct = (v) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: v < 10 ? 1 : 0 })}%`;
const nomeProduto = (cod) => (cod === 'todos' ? 'Todos os produtos' : EXP.produtos[cod].nome);
const DO = (uf) => ({ RJ: 'do', RN: 'do', RS: 'do', PR: 'do', PA: 'do', AP: 'do', AM: 'do', ES: 'do', MA: 'do', PI: 'do', CE: 'do', TO: 'do', MT: 'de', MS: 'de', GO: 'de', SP: 'de', MG: 'de', SC: 'de', SE: 'de', AL: 'de', PE: 'de', RO: 'de', RR: 'de', AC: 'do', DF: 'do', BA: 'da', PB: 'da' })[uf] || 'de';

/* ------------------------------------------------------------------ dados derivados */
// série por UF de um produto (ou do total)
function serie(cod) {
  const d = cod === 'todos' ? EXP.todos : EXP.produtos[cod];
  return UFS.map((u, i) => ({ uf: u, ue: d.ue[i], demais: d.demais[i] }));
}
// produtos de uma UF
function produtosDaUF(uf) {
  const i = IDX[uf];
  return Object.entries(EXP.produtos)
    .map(([cod, p]) => ({ cod, nome: p.nome, ue: p.ue[i], demais: p.demais[i] }))
    .filter((p) => p.ue > 0 || p.demais > 0)
    .sort((a, b) => b.ue - a.ue);
}

function resumoProduto(cod) {
  const s = serie(cod).sort((a, b) => b.ue - a.ue);
  const ue = s.reduce((a, x) => a + x.ue, 0);
  const dm = s.reduce((a, x) => a + x.demais, 0);
  if (cod === 'todos') {
    const [a, b] = PRODUTOS;
    const top = s[0];
    return {
      titulo: `${a.nome.split(' ')[0]} e ${b.nome.split(' ')[0].toLowerCase()}`,
      texto: `${a.nome} (SH2 ${a.cod}, ${usd(a.ue)}) e ${b.nome.toLowerCase()} (SH2 ${b.cod}, ${usd(b.ue)}) lideram as vendas dos pequenos negócios para a UE: juntos, ${pct(((a.ue + b.ue) / TOTAL_UE) * 100)} do total de ${usd(TOTAL_UE)}. ${UF_BY_SIGLA[top.uf].nome} concentra ${pct((top.ue / TOTAL_UE) * 100)}. Só ${pct((TOTAL_UE / (TOTAL_UE + TOTAL_DEMAIS)) * 100)} do que as MPE exportam vai para o bloco: o espaço para crescer com o acordo Mercosul–UE é grande.`,
    };
  }
  if (!ue) return { titulo: nomeProduto(cod), texto: `As MPE não registraram vendas de ${nomeProduto(cod).toLowerCase()} para a UE em 2025${dm ? `; para outros destinos, foram ${usd(dm)}` : ''}.` };
  const top = s[0];
  const nUF = s.filter((x) => x.ue > 0).length;
  return {
    titulo: nomeProduto(cod),
    texto: `Em 2025, os pequenos negócios venderam ${usd(ue)} de ${nomeProduto(cod).toLowerCase()} para a UE, ${pct((ue / (ue + dm)) * 100)} de tudo o que exportaram desse produto. ${UF_BY_SIGLA[top.uf].nome} lidera, com ${pct((top.ue / ue) * 100)}${s[1]?.ue ? `, seguido ${DO(s[1].uf)} ${UF_BY_SIGLA[s[1].uf].nome} (${pct((s[1].ue / ue) * 100)})` : ''}. ${nUF === 1 ? 'Só esse estado exportou o produto para o bloco.' : `${nUF} estados exportaram o produto para o bloco.`}`,
  };
}

function resumoUF(uf) {
  const i = IDX[uf];
  const ue = EXP.todos.ue[i];
  const dm = EXP.todos.demais[i];
  const ps = produtosDaUF(uf);
  const nome = UF_BY_SIGLA[uf].nome;
  if (!ue) return { titulo: nome, texto: `As MPE ${DO(uf)} ${nome} não registraram vendas para a UE em 2025${dm ? `; para outros destinos, foram ${usd(dm)}` : ''}.` };
  const rank = [...UFS].sort((a, b) => EXP.todos.ue[IDX[b]] - EXP.todos.ue[IDX[a]]).indexOf(uf) + 1;
  const [a, b] = ps;
  return {
    titulo: nome,
    texto: `Os pequenos negócios ${DO(uf)} ${nome} venderam ${usd(ue)} para a UE em 2025 (${rank}º lugar entre os estados), ${pct((ue / (ue + dm)) * 100)} do que exportaram. ${a?.ue ? `O principal produto é ${a.nome.toLowerCase()} (${usd(a.ue)})${b?.ue ? `, seguido de ${b.nome.toLowerCase()} (${usd(b.ue)})` : ''}.` : ''}`,
  };
}

/* ------------------------------------------------------------------ peças visuais */
const SELECT =
  'h-12 w-full appearance-none rounded-2xl border border-transparent bg-off px-4 pr-10 text-[15px] text-[#232122] outline-none transition focus-visible:border-azul bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%232A4FDA%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-[length:20px] bg-[right_14px_center] bg-no-repeat';

function BuscaProduto({ valor, onEscolher }) {
  const [q, setQ] = useState('');
  const [aberto, setAberto] = useState(false);
  const n = normaliza(q);
  const lista = [{ cod: 'todos', nome: 'Todos os produtos', ue: TOTAL_UE }, ...PRODUTOS].filter((p) => !n || normaliza(p.nome).includes(n) || p.cod.startsWith(n)).slice(0, 12);
  return (
    <div className="relative">
      <label htmlFor="exp-produto" className="mb-1.5 block text-[14px] font-semibold text-tema-tinta">
        Selecione o produto
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#232122]">
          <Icon name="busca" size={20} />
        </span>
        <input
          id="exp-produto"
          value={aberto ? q : nomeProduto(valor)}
          onChange={(e) => {
            setQ(e.target.value);
            setAberto(true);
          }}
          onFocus={() => {
            setQ('');
            setAberto(true);
          }}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && lista[0]) {
              onEscolher(lista[0].cod);
              setAberto(false);
              e.currentTarget.blur();
            }
            if (e.key === 'Escape') setAberto(false);
          }}
          autoComplete="off"
          role="combobox"
          aria-expanded={aberto}
          aria-controls="exp-produto-lista"
          placeholder="todos os produtos"
          className="h-12 w-full rounded-2xl bg-off pl-12 pr-4 text-[15px] text-[#232122] outline-none placeholder:text-cinza focus-visible:ring-2 focus-visible:ring-azul"
        />
      </div>
      {aberto && (
        <ul id="exp-produto-lista" role="listbox" className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-[320px] overflow-auto rounded-2xl bg-white py-1.5 shadow-flutuante">
          {lista.map((p) => (
            <li key={p.cod} role="option" aria-selected={p.cod === valor}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onEscolher(p.cod);
                  setAberto(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-[14px] text-[#232122] hover:bg-off"
              >
                <span className="w-7 flex-none text-[12px] font-semibold tabular-nums text-cinza">{p.cod === 'todos' ? '' : p.cod}</span>
                <span className="min-w-0 flex-1 truncate">{p.nome}</span>
                <span className="flex-none text-[12.5px] tabular-nums text-cinza">{usd(p.ue)}</span>
              </button>
            </li>
          ))}
          {!lista.length && <li className="px-4 py-2 text-[14px] text-cinza">Nenhum produto com esse nome.</li>}
        </ul>
      )}
    </div>
  );
}

function CaixaResumo({ titulo, texto }) {
  return (
    <div className="overflow-hidden rounded-xl border border-tema-linha bg-tema-card">
      <div className="flex h-12">
        <span className="grid w-14 flex-none place-items-center bg-magenta text-white">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
          </svg>
        </span>
        <span className="flex min-w-0 flex-1 items-center bg-[#36BF76] px-4">
          <span className="truncate font-display text-[clamp(18px,1.8vw,24px)] font-extrabold text-white">{titulo}</span>
        </span>
      </div>
      <p className="p-4 text-[14px] leading-relaxed text-tema-suave">
        <span className="block font-semibold text-tema-tinta">Temos um resumo pra você!</span>
        {texto}
      </p>
    </div>
  );
}

function Cartao({ rotulo, valor, apoio, icone }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl bg-tema-bg p-4">
      <span className="flex items-center gap-2 text-[13px] text-tema-suave">
        <Icon name={icone} size={18} className="text-tema-tinta" />
        {rotulo}
      </span>
      <span
        className={`mt-2 font-display font-extrabold leading-tight text-tema-tinta [overflow-wrap:anywhere] hyphens-auto ${String(valor).length > 16 ? 'line-clamp-2 text-[18px] sm:text-[clamp(18px,1.6vw,22px)]' : 'text-[20px] sm:text-[clamp(22px,2.2vw,30px)]'}`}
        title={typeof valor === 'string' ? valor : undefined}
      >
        {valor}
      </span>
      {apoio && <span className="mt-0.5 text-[12.5px] leading-snug text-tema-suave">{apoio}</span>}
    </div>
  );
}

// mapa dos estados (coroplético, quintis)
let ufsCache = null;
function MapaEstados({ valores, formato, destaque, onClicar }) {
  const [fc, setFc] = useState(ufsCache);
  const [sobre, setSobre] = useState(null);
  useEffect(() => {
    if (ufsCache) return;
    fetch(geo('ufs.json'))
      .then((r) => r.json())
      .then((j) => {
        ufsCache = j;
        setFc(j);
      })
      .catch(() => {});
  }, []);
  const L = 520;
  const desenho = useMemo(() => {
    if (!fc) return null;
    const path = geoPath(geoIdentity().reflectY(true).fitSize([L, L], fc));
    return fc.features.map((f) => ({ uf: f.properties.uf, d: path(f) }));
  }, [fc]);
  const escala = useMemo(() => {
    const v = Object.values(valores).filter((x) => x > 0).sort((a, b) => a - b);
    const lim = v.length ? [0.2, 0.4, 0.6, 0.8].map((p) => quantile(v, p)) : [];
    return { lim, cor: (x) => (!x ? BASE : RAMPA_EMPRESAS[lim.filter((l) => x > l).length]), min: v[0], max: v[v.length - 1] };
  }, [valores]);
  if (!desenho) return <div className="aspect-square w-full animate-pulse rounded-3xl bg-tema-linha" />;
  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${L} ${L}`} className="block h-auto w-full" role="group" aria-label="Mapa dos estados: toque num estado para ver os produtos">
        {desenho.map((u) => (
          <path
            key={u.uf}
            d={u.d}
            role="button"
            tabIndex={0}
            aria-label={`${UF_BY_SIGLA[u.uf].nome}: ${formato(valores[u.uf] || 0)}`}
            onClick={() => onClicar(u.uf)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClicar(u.uf))}
            onMouseEnter={() => setSobre(u.uf)}
            onMouseLeave={() => setSobre(null)}
            onFocus={() => setSobre(u.uf)}
            onBlur={() => setSobre(null)}
            fill={escala.cor(valores[u.uf])}
            stroke={destaque === u.uf ? '#D81E5B' : valores[u.uf] ? '#FFFEFC' : '#DDD5C8'}
            strokeWidth={destaque === u.uf ? 3 : 1}
            className="cursor-pointer outline-none transition-opacity hover:opacity-80 focus-visible:opacity-80"
          />
        ))}
      </svg>
      {sobre && (
        <figcaption className="pointer-events-none absolute left-2 top-2 flex items-center gap-2 rounded-xl bg-tema-card px-3 py-2 text-[13.5px] text-tema-tinta shadow-flutuante">
          <Bandeira uf={sobre} className="h-3.5 w-5" />
          <span className="font-semibold">{UF_BY_SIGLA[sobre].nome}</span>
          <span className="tabular-nums">{formato(valores[sobre] || 0)}</span>
        </figcaption>
      )}
      {escala.lim.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-[12px] text-tema-suave">
          <span>{formato(escala.min)}</span>
          <span className="flex h-2.5 flex-1 overflow-hidden rounded-full" aria-hidden>
            {RAMPA_EMPRESAS.map((c) => (
              <span key={c} className="flex-1" style={{ background: c }} />
            ))}
          </span>
          <span>{formato(escala.max)}</span>
        </div>
      )}
    </figure>
  );
}

// ranking em barras: valor para a UE + (claro) demais destinos
function Ranking({ titulo, itens, onClicar, rotuloItem }) {
  const max = Math.max(...itens.map((x) => x.ue), 0.0001);
  return (
    <div className="rounded-2xl bg-tema-bg p-4 sm:p-5">
      <p className="mb-3 font-display text-[16px] font-extrabold text-tema-tinta">{titulo}</p>
      <ol className="grid gap-2">
        {itens.map((x, i) => (
          <li key={x.chave}>
            <button type="button" onClick={() => onClicar?.(x.chave)} className="group grid w-full grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-x-2 text-left">
              <span className="text-[12px] tabular-nums text-tema-suave">{i + 1}</span>
              <span className="min-w-0 truncate text-[13.5px] text-tema-tinta group-hover:underline">{rotuloItem(x)}</span>
              <span className="text-[13px] font-semibold tabular-nums text-tema-tinta">{usd(x.ue)}</span>
              <span className="col-start-2 col-end-4 mt-1 h-1.5 overflow-hidden rounded-full bg-tema-linha" aria-hidden>
                <span className="block h-full rounded-full bg-[var(--tema-barra)]" style={{ width: `${(x.ue / max) * 100}%` }} />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ seção */
export default function PotencialExportador() {
  const [aba, setAba] = useState('produto');
  const [produto, setProduto] = useState('todos');
  const [uf, setUf] = useState('SP');
  const [metrica, setMetrica] = useState('ue');
  const topo = useRef(null);

  const s = useMemo(() => serie(produto), [produto]);
  const valoresProduto = useMemo(() => Object.fromEntries(s.map((x) => [x.uf, metrica === 'ue' ? x.ue : x.ue + x.demais ? (x.ue / (x.ue + x.demais)) * 100 : 0])), [s, metrica]);
  const valoresTotal = useMemo(() => Object.fromEntries(serie('todos').map((x) => [x.uf, metrica === 'ue' ? x.ue : x.ue + x.demais ? (x.ue / (x.ue + x.demais)) * 100 : 0])), [metrica]);
  const formato = metrica === 'ue' ? usd : pct;

  const irEstado = (u) => {
    setUf(u);
    setAba('estado');
  };
  const irProduto = (c) => {
    setProduto(c);
    setAba('produto');
  };

  // números do recorte
  const ueP = s.reduce((a, x) => a + x.ue, 0);
  const dmP = s.reduce((a, x) => a + x.demais, 0);
  const ordemUF = [...s].sort((a, b) => b.ue - a.ue);
  const res = aba === 'produto' ? resumoProduto(produto) : resumoUF(uf);
  const iU = IDX[uf];
  const ueU = EXP.todos.ue[iU];
  const dmU = EXP.todos.demais[iU];
  const psU = useMemo(() => produtosDaUF(uf), [uf]);

  return (
    <div ref={topo} className="rounded-[40px] bg-tema-card px-5 pb-10 pt-[16%] shadow-card sm:px-10 sm:pt-[12%] lg:pt-[110px]">
      <div role="tablist" aria-label="Recorte" className="flex gap-8 border-b border-tema-linha">
        {[
          ['produto', 'Por produto', 'empresas'],
          ['estado', 'Por estado', 'localizacao'],
        ].map(([id, t, ic]) => (
          <button
            key={id}
            role="tab"
            id={`exp-aba-${id}`}
            aria-selected={aba === id}
            aria-controls="exp-painel"
            onClick={() => setAba(id)}
            className={`-mb-px flex items-center gap-2 border-b-2 pb-3 font-display text-[17px] font-extrabold transition ${aba === id ? 'border-tema-tinta text-tema-tinta' : 'border-transparent text-tema-suave hover:text-tema-tinta'}`}
          >
            <Icon name={ic} size={20} />
            {t}
          </button>
        ))}
      </div>

      <div id="exp-painel" role="tabpanel" aria-labelledby={`exp-aba-${aba}`} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        {/* coluna esquerda: escolha, resumo e mapa */}
        <div className="grid content-start gap-5">
          {aba === 'produto' ? (
            <BuscaProduto valor={produto} onEscolher={setProduto} />
          ) : (
            <label htmlFor="exp-uf" className="grid gap-1.5">
              <span className="text-[14px] font-semibold text-tema-tinta">Selecione o estado</span>
              <select id="exp-uf" className={SELECT} value={uf} onChange={(e) => setUf(e.target.value)}>
                {[...UFS]
                  .sort((a, b) => UF_BY_SIGLA[a].nome.localeCompare(UF_BY_SIGLA[b].nome, 'pt-BR'))
                  .map((u) => (
                    <option key={u} value={u}>
                      {UF_BY_SIGLA[u].nome}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <CaixaResumo titulo={res.titulo} texto={res.texto} />
          <div className="rounded-2xl bg-tema-bg p-4 sm:p-5">
            <p className="mb-1 font-display text-[16px] font-extrabold text-tema-tinta">
              {aba === 'produto' ? `${produto === 'todos' ? 'Exportações para a UE' : nomeProduto(produto)} por estado` : 'Exportações para a UE por estado'}
            </p>
            <p className="mb-2 text-[12.5px] text-tema-suave">{aba === 'produto' ? 'Toque num estado para ver os produtos dele.' : `${UF_BY_SIGLA[uf].nome} em destaque. Toque em outro estado para trocar.`}</p>
            <MapaEstados valores={aba === 'produto' ? valoresProduto : valoresTotal} formato={formato} destaque={aba === 'estado' ? uf : null} onClicar={aba === 'produto' ? irEstado : setUf} />
          </div>
        </div>

        {/* coluna direita: métrica, cartões e rankings */}
        <div className="grid content-start gap-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5" htmlFor="exp-visao">
              <span className="text-[14px] font-semibold text-tema-tinta">Visão territorial</span>
              <select id="exp-visao" className={SELECT} value="uf" onChange={() => {}} disabled title="Por município entra quando houver a base municipal">
                <option value="uf">Estado</option>
              </select>
            </label>
            <label className="grid gap-1.5" htmlFor="exp-metrica">
              <span className="text-[14px] font-semibold text-tema-tinta">Métrica principal</span>
              <select id="exp-metrica" className={SELECT} value={metrica} onChange={(e) => setMetrica(e.target.value)}>
                <option value="ue">Volume (US$)</option>
                <option value="parcela">Parcela para a UE (%)</option>
              </select>
            </label>
          </div>

          {aba === 'produto' ? (
            <div className="grid grid-cols-2 gap-3">
              <Cartao icone="moeda" rotulo="Exportado para a UE" valor={usd(ueP)} apoio={produto === 'todos' ? 'MPE, 2025 (FOB)' : `${pct((ueP / TOTAL_UE) * 100)} da pauta MPE para a UE`} />
              <Cartao icone="direcoes" rotulo="Parcela que vai para a UE" valor={ueP + dmP ? pct((ueP / (ueP + dmP)) * 100) : '—'} apoio={`outros destinos: ${usd(dmP)}`} />
              <Cartao icone="localizacao" rotulo="Principal estado" valor={ordemUF[0]?.ue ? UF_BY_SIGLA[ordemUF[0].uf].nome : '—'} apoio={ordemUF[0]?.ue ? `${pct((ordemUF[0].ue / ueP) * 100)} · ${usd(ordemUF[0].ue)}` : undefined} />
              <Cartao icone="rede" rotulo="Estados que exportam para a UE" valor={`${s.filter((x) => x.ue > 0).length} de 27`} apoio={produto === 'todos' ? undefined : nomeProduto(produto)} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Cartao icone="moeda" rotulo="Exportado para a UE" valor={usd(ueU)} apoio={`${pct((ueU / TOTAL_UE) * 100)} do total das MPE`} />
              <Cartao icone="direcoes" rotulo="Parcela que vai para a UE" valor={ueU + dmU ? pct((ueU / (ueU + dmU)) * 100) : '—'} apoio={`outros destinos: ${usd(dmU)}`} />
              <Cartao icone="empresas" rotulo="Principal produto" valor={psU[0]?.ue ? psU[0].nome : '—'} apoio={psU[0]?.ue ? usd(psU[0].ue) : undefined} />
              <Cartao icone="setores" rotulo="Produtos vendidos para a UE" valor={nf0(psU.filter((p) => p.ue > 0).length)} apoio="capítulos SH2" />
            </div>
          )}

          {aba === 'produto' ? (
            <>
              <Ranking titulo={`Estados que mais exportam ${produto === 'todos' ? '' : 'o produto '}para a UE`} itens={ordemUF.filter((x) => x.ue > 0).slice(0, 8).map((x) => ({ ...x, chave: x.uf }))} rotuloItem={(x) => UF_BY_SIGLA[x.uf].nome} onClicar={irEstado} />
              {produto === 'todos' && <Ranking titulo="Produtos mais vendidos para a UE" itens={PRODUTOS.slice(0, 8).map((p) => ({ ...p, chave: p.cod }))} rotuloItem={(p) => p.nome} onClicar={setProduto} />}
            </>
          ) : (
            <Ranking titulo={`O que ${UF_BY_SIGLA[uf].nome} vende para a UE`} itens={psU.filter((p) => p.ue > 0).slice(0, 10).map((p) => ({ ...p, chave: p.cod }))} rotuloItem={(p) => p.nome} onClicar={irProduto} />
          )}
        </div>
      </div>

      <p className="mt-8 max-w-[110ch] font-detail text-nota italic text-tema-apagado">
        Fonte: {EXP.fonte}. Exportações de MEI, ME e EPP em {EXP.ano}, valor FOB. Destino: {EXP.destino}. {usd(EXP.sigiloUE)} vendidos para a UE estão em linhas sob sigilo
        estatístico: entram no total de cada estado, mas não aparecem por produto.
      </p>
    </div>
  );
}
