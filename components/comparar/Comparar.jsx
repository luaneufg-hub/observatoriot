'use client';
// "Comparar": dois territórios lado a lado (Brasil, estado ou município, com um setor opcional).
// Segue o protótipo (Região 1 × Região 2, Principais Indicadores com "Temos um resumo pra você!")
// e, abaixo, um relatório em abas inspirado no Observatório Sebrae Startups, com o kit da página.
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icon';
import LogoObservatorio from '../LogoObservatorio';
import { Bandeira } from '../CaixaUF';
import { UFS, UF_BY_SIGLA } from '@/lib/dados/ufs';
import { buscarMunicipios, normaliza } from '@/lib/dados/municipios';
import { carregarIGs, produtoCurto } from '@/lib/dados/ig';
import { carregarProgramas } from '@/lib/dados/sebraeTerritorio';
import { perfil, resumo, variacao, pctTxt, SETORES_CMP, SETOR_CMP_BY_ID } from '@/lib/dados/comparar';
import INOV from '@/lib/dados/retratos/inovacao.json';

const nf0 = (v) => Math.round(v).toLocaleString('pt-BR');
const nf1 = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** contagem curta: 24,9 mi · 415 mil · 1.234 */
function curto(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return `${nf1(v / 1e6)} mi`;
  if (a >= 1e5) return `${nf0(v / 1e3)} mil`;
  return nf0(v);
}
const reais = (v) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
const horas = (h) => (h == null ? '—' : h >= 48 ? `${nf1(h / 24)} dias` : `${nf0(h)} h`);

const SETOR_PADRAO = null;
const INICIAL = [
  { uf: 'DF', mun: 5300108, setor: SETOR_PADRAO },
  { uf: 'GO', mun: null, setor: SETOR_PADRAO },
];

/* ------------------------------------------------------------------ bandeiras */
function BandeiraBR({ className }) {
  return (
    <svg viewBox="0 0 20 14" className={className} role="img" aria-label="Bandeira do Brasil">
      <rect width="20" height="14" rx="1.5" fill="#009C3B" />
      <path d="M10 1.8 18 7l-8 5.2L2 7Z" fill="#FFDF00" />
      <circle cx="10" cy="7" r="3.1" fill="#002776" />
    </svg>
  );
}
function BandeiraLugar({ uf, className }) {
  return uf ? <Bandeira uf={uf} className={className} /> : <BandeiraBR className={className} />;
}

/* ------------------------------------------------------------------ seleção de cada região */
function Campo({ rotulo, children, id }) {
  return (
    <label htmlFor={id} className="grid gap-1.5">
      <span className="text-[14px] font-semibold text-tema-tinta">{rotulo}</span>
      {children}
    </label>
  );
}
const SELECT =
  'h-12 w-full appearance-none rounded-2xl border border-transparent bg-off px-4 pr-10 text-[15px] text-[#232122] outline-none transition focus-visible:border-azul disabled:opacity-50 bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%232A4FDA%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-[length:20px] bg-[right_14px_center] bg-no-repeat';

function Busca({ base, onEscolher, id }) {
  const [q, setQ] = useState('');
  const [aberto, setAberto] = useState(false);
  const n = normaliza(q);
  const ufs = n.length >= 2 ? UFS.filter((u) => normaliza(u.nome).includes(n) || u.sigla.toLowerCase() === n).slice(0, 3) : [];
  const muns = base && n.length >= 2 ? buscarMunicipios(base, q, 6) : [];
  const brasil = n.length >= 2 && 'brasil'.startsWith(n);
  const itens = [...(brasil ? [{ tipo: 'br' }] : []), ...ufs.map((u) => ({ tipo: 'uf', u })), ...muns.map((m) => ({ tipo: 'mun', m }))];
  const escolher = (it) => {
    if (it.tipo === 'br') onEscolher({ uf: 'BR', mun: null });
    else if (it.tipo === 'uf') onEscolher({ uf: it.u.sigla, mun: null });
    else onEscolher({ uf: it.m.uf, mun: it.m.cod });
    setQ('');
    setAberto(false);
  };
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#232122]">
        <Icon name="busca" size={20} />
      </span>
      <input
        id={id}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && itens[0]) escolher(itens[0]);
          if (e.key === 'Escape') setAberto(false);
        }}
        placeholder="escolha um estado ou município"
        autoComplete="off"
        role="combobox"
        aria-expanded={aberto && itens.length > 0}
        aria-controls={`${id}-lista`}
        className="h-12 w-full rounded-2xl bg-off pl-12 pr-4 text-[15px] text-[#232122] outline-none placeholder:text-cinza focus-visible:ring-2 focus-visible:ring-azul"
      />
      {aberto && itens.length > 0 && (
        <ul id={`${id}-lista`} role="listbox" className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl bg-white py-1.5 shadow-flutuante">
          {itens.map((it, i) => (
            <li key={i} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => escolher(it)}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[14px] text-[#232122] hover:bg-off"
              >
                {it.tipo === 'br' ? <BandeiraBR className="h-3.5 w-5 flex-none" /> : <Bandeira uf={it.tipo === 'uf' ? it.u.sigla : it.m.uf} className="h-3.5 w-5 flex-none" />}
                <span className="min-w-0 flex-1 truncate">{it.tipo === 'br' ? 'Brasil' : it.tipo === 'uf' ? it.u.nome : it.m.nome}</span>
                <span className="text-[12px] text-cinza">{it.tipo === 'br' ? 'país' : it.tipo === 'uf' ? 'estado' : it.m.uf}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Regiao({ n, lado, base, onMudar }) {
  const ufsOrd = useMemo(() => [...UFS].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), []);
  const muns = useMemo(() => (lado.uf && lado.uf !== 'BR' && base ? [...(base.porUF[lado.uf] || [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) : []), [lado.uf, base]);
  const p = `reg${n}`;
  return (
    <fieldset className="grid content-start gap-4">
      <legend className="mb-3 font-display text-[22px] font-extrabold text-tema-tinta">Região {n}</legend>
      <Busca id={`${p}-busca`} base={base} onEscolher={(v) => onMudar({ ...lado, ...v })} />
      <Campo rotulo="Estado" id={`${p}-uf`}>
        <select id={`${p}-uf`} className={SELECT} value={lado.uf || ''} onChange={(e) => onMudar({ ...lado, uf: e.target.value || null, mun: null })}>
          <option value="">Selecione</option>
          <option value="BR">Brasil (todos os estados)</option>
          {ufsOrd.map((u) => (
            <option key={u.sigla} value={u.sigla}>
              {u.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Município" id={`${p}-mun`}>
        <select id={`${p}-mun`} className={SELECT} disabled={!muns.length} value={lado.mun || ''} onChange={(e) => onMudar({ ...lado, mun: e.target.value ? +e.target.value : null })}>
          <option value="">{lado.uf && lado.uf !== 'BR' ? 'Todo o estado' : 'Selecione um estado antes'}</option>
          {muns.map((m) => (
            <option key={m.cod} value={m.cod}>
              {m.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Setor" id={`${p}-setor`}>
        <select id={`${p}-setor`} className={SELECT} value={lado.setor || ''} onChange={(e) => onMudar({ ...lado, setor: e.target.value || null })}>
          <option value="">Todos os setores</option>
          {SETORES_CMP.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      </Campo>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ Principais Indicadores */
function Cabecalho({ p }) {
  return (
    <div className="flex h-[60px] overflow-hidden rounded-xl">
      <span className="grid w-[64px] flex-none place-items-center bg-magenta">
        <span className="grid h-[30px] w-[42px] place-items-center rounded-[3px] bg-white p-[3px]">
          <BandeiraLugar uf={p.nivel === 'br' ? null : p.uf} className="h-full w-full" />
        </span>
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-center bg-[#36BF76] px-3 text-center">
        <span className="min-w-0">
          <span className="block truncate font-display text-[clamp(20px,2.4vw,30px)] font-extrabold leading-tight text-white">{p.nome}</span>
          {p.nivel === 'mun' && <span className="block text-[12px] font-semibold text-white/90">{UF_BY_SIGLA[p.uf].nome}</span>}
        </span>
      </span>
    </div>
  );
}

function Resumo({ texto }) {
  return (
    <div className="mt-2 flex gap-3 rounded-xl border border-tema-linha bg-tema-card p-4">
      <svg viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 flex-none text-tema-tinta" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
        <path d="M12 0.5v1M3.5 4l.8.8M20.5 4l-.8.8M1.5 10h1M21.5 10h1" />
      </svg>
      <p className="text-[13.5px] leading-relaxed text-tema-suave">
        <span className="block font-semibold text-tema-tinta">Temos um resumo pra você!</span>
        {texto}
      </p>
    </div>
  );
}

function Variacao({ v, rotulo = 'vs 2024' }) {
  if (v == null) return null;
  const sobe = v >= 0;
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11.5px] font-semibold text-tema-tinta">
      <svg viewBox="0 0 12 12" className={`h-3 w-3 ${sobe ? 'text-[#36BF76]' : 'rotate-180 text-magenta'}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" />
      </svg>
      {sobe ? '+' : '−'}
      {pctTxt(Math.abs(v))}% {rotulo}
    </span>
  );
}

function Indicador({ valor, rotulo, apoio, badge }) {
  return (
    <div className="relative rounded-2xl border border-tema-linha bg-tema-card px-5 pb-4 pt-5">
      {badge && <span className="absolute right-4 top-3">{badge}</span>}
      <p className="font-display text-[clamp(30px,3.4vw,44px)] font-extrabold leading-none tracking-[-0.02em] text-tema-tinta">{valor}</p>
      <p className="mt-1.5 text-[15px] text-tema-tinta">{rotulo}</p>
      {apoio && <p className="mt-0.5 text-[12.5px] text-tema-suave">{apoio}</p>}
    </div>
  );
}

function indicadoresDe(p, setorId) {
  const s = setorId && p.setores.find((x) => x.id === setorId);
  const r = p.rais;
  const lista = [];
  if (s) lista.push({ valor: curto(s.n), rotulo: `Pequenos negócios ${s.de}`, apoio: `${pctTxt(s.part * 100)}% dos pequenos negócios ativos${p.nivel === 'br' ? '' : ` · ${nf1(s.ql)}× a proporção do Brasil`}` });
  else lista.push({ valor: curto(p.ativas), rotulo: 'Pequenos negócios ativos', apoio: `${pctTxt((p.porte.mei / (p.ativas || 1)) * 100)}% são MEI` });
  if (r) {
    lista.push({ valor: curto(r.vinculosMPE), rotulo: 'Empregados nas MPE', apoio: `${pctTxt((r.vinculosMPE / (r.vinculos || 1)) * 100)}% dos empregados das empresas · RAIS 2025` });
    lista.push({ valor: reais(r.vinculosMPE ? r.massaMPE / r.vinculosMPE : 0), rotulo: 'Remuneração média por trabalhador', apoio: `nas MPE, por mês · média de todas as empresas: ${reais(r.vinculos ? r.massa / r.vinculos : 0)}` });
  }
  const v = p.abertura && variacao(p.abertura[2024], p.abertura[2025]);
  if (p.abertura?.[2025] != null) lista.push({ valor: curto(p.abertura[2025]), rotulo: 'Novos pequenos negócios em 2025', apoio: `${nf0(p.abertura[2024])} em 2024`, badge: <Variacao v={v} /> });
  return lista;
}

/* ------------------------------------------------------------------ relatório em abas */
// fundos do kit; no verde, o texto passa a navy (painel-claro) para manter o contraste
const ABAS = [
  { id: 'visao', rotulo: 'Visão geral', titulo: 'Visão geral', fundo: '#080568', destaque: '#C9DF60' },
  { id: 'setores', rotulo: 'Raio-x dos setores', titulo: 'Raio-x dos setores', fundo: '#232122', destaque: '#E7F79E' },
  { id: 'trabalho', rotulo: 'Trabalho e renda', titulo: 'Trabalho e renda', fundo: '#36BF76', destaque: '#080568', claro: true },
  { id: 'inovacao', rotulo: 'Inovação e território', titulo: 'Inovação e território', fundo: '#753335', destaque: '#C9DF60' },
];

function Item({ icone, rotulo, valor, apoio, cor, grande }) {
  return (
    <div className="min-w-0 hyphens-auto [overflow-wrap:break-word]">
      <Icon name={icone} size={grande ? 38 : 32} className="text-white" />
      <p className="mt-2 text-[15px] leading-snug text-white/90">{rotulo}</p>
      <p className={`mt-1 font-display font-extrabold leading-tight ${grande ? 'text-[clamp(44px,5vw,68px)] leading-none' : 'text-[clamp(20px,1.9vw,26px)]'}`} style={{ color: cor }}>
        {valor}
      </p>
      {apoio && <p className="mt-1 text-[13px] leading-snug text-white/75">{apoio}</p>}
    </div>
  );
}

function Lados({ perfis, render }) {
  return (
    <div className="mt-6 grid gap-x-10 gap-y-10 md:grid-cols-2">
      {perfis.map((p, i) => (
        <div key={i} className={`min-w-0 ${i === 1 ? 'md:border-l md:border-white/15 md:pl-10' : ''}`}>
          <h4 className="font-display text-[clamp(24px,2.6vw,34px)] font-extrabold leading-tight text-white">{p.nome}</h4>
          {p.nivel === 'mun' && <p className="text-[13px] text-white/70">{UF_BY_SIGLA[p.uf].nome}</p>}
          {render(p, i)}
        </div>
      ))}
    </div>
  );
}

function PainelVisao({ perfis, setores, aba }) {
  const c = aba.destaque;
  return (
    <Lados
      perfis={perfis}
      render={(p, i) => {
        const s = setores[i] && p.setores.find((x) => x.id === setores[i]);
        const maior = [...p.setores].sort((a, b) => b.n - a.n)[0];
        const d = s || p.destaque || maior;
        const v = p.abertura && variacao(p.abertura[2024], p.abertura[2025]);
        const mei = (p.porte.mei / (p.ativas || 1)) * 100;
        return (
          <>
            <div className="mt-6">
              <Item grande icone="empresas" rotulo={s ? `Pequenos negócios ${s.de}` : 'Pequenos negócios ativos'} valor={curto(s ? s.n : p.ativas)} cor={c} apoio={s ? `de ${nf0(p.ativas)} no total` : undefined} />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7">
              <Item icone={d.icone} rotulo={s ? 'Setor escolhido' : p.nivel === 'br' ? 'Maior setor' : 'Setor em destaque'} valor={d.nome} cor={c} apoio={p.nivel === 'br' ? `${pctTxt(d.part * 100)}% dos pequenos negócios` : `${nf1(d.ql)}× a proporção do Brasil`} />
              <Item icone="agro" rotulo="Cadeia produtiva de referência" valor={p.cadeias[0]?.[0] || '—'} cor={c} apoio={p.extrativas[0] && p.extrativas[0][0] !== p.cadeias[0]?.[0] ? `extrativismo: ${p.extrativas[0][0].toLowerCase()}` : 'IBGE 2024'} />
              <Item icone="pessoas" rotulo={'Microempreen\u00ADdedores individuais'} valor={`${pctTxt(mei)}%`} cor={c} apoio={`${curto(p.porte.mei)} MEI`} />
              <Item icone="documento" rotulo="Novos pequenos negócios em 2025" valor={p.abertura?.[2025] != null ? curto(p.abertura[2025]) : '—'} cor={c} apoio={v != null ? `${v >= 0 ? '+' : '−'}${pctTxt(Math.abs(v))}% em relação a 2024` : undefined} />
              <Item icone="relogio" rotulo="Tempo médio para abrir uma empresa" valor={horas(p.tempo)} cor={c} apoio="REDESIM 2025" />
              <Item icone="bioma" rotulo="Bioma predominante" valor={p.bioma || 'vários'} cor={c} apoio={p.nivel === 'br' ? 'seis biomas' : undefined} />
            </div>
            <p className="mt-8 border-t border-white/15 pt-5 text-[14px] leading-relaxed text-white/85">{resumo(p, setores[i])}</p>
          </>
        );
      }}
    />
  );
}

function PainelSetores({ perfis, setores, aba }) {
  return (
    <>
      <p className="mt-2 text-center font-display text-[clamp(20px,2vw,26px)] font-extrabold" style={{ color: aba.destaque }}>
        Pequenos negócios por setor
      </p>
      <Lados
        perfis={perfis}
        render={(p, i) => {
          const ord = [...p.setores].sort((a, b) => b.n - a.n);
          return (
            <>
              {/* barra empilhada da composição setorial */}
              <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`Composição: ${ord.map((s) => `${s.nome} ${pctTxt(s.part * 100)}%`).join(', ')}`}>
                {ord.map((s) => (
                  <span key={s.id} style={{ width: `${s.part * 100}%`, background: s.cor }} className={setores[i] && setores[i] !== s.id ? 'opacity-35' : ''} />
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6">
                {ord.map((s) => {
                  const marcado = setores[i] === s.id;
                  return (
                    <div key={s.id} className={`min-w-0 rounded-2xl ${marcado ? 'bg-white/10 p-3 ring-2 ring-[#E7F79E]' : ''}`}>
                      <p className="flex items-center gap-2 text-[15px] text-white/90">
                        <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: s.cor }} aria-hidden />
                        {s.nome}
                      </p>
                      <p className="mt-1 font-display text-[clamp(32px,3.4vw,44px)] font-extrabold leading-none" style={{ color: aba.destaque }}>
                        {pctTxt(s.part * 100, s.part < 0.1 ? 1 : 0)}%
                      </p>
                      <p className="mt-1.5 text-[13.5px] leading-snug text-white/80">
                        {nf0(s.n)} pequenos negócios
                        {p.nivel !== 'br' && (
                          <>
                            {' · '}
                            <span className={`whitespace-nowrap font-semibold ${s.ql >= 1 ? 'text-[#E7F79E]' : 'text-white/80'}`} title="Participação do setor no lugar em relação à participação no Brasil">
                              {nf1(s.ql)}×
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          );
        }}
      />
      <p className="mt-8 max-w-[90ch] text-[12.5px] leading-relaxed text-white/75">
        Pequenos negócios ativos (MEI, ME e EPP) por Setor SEBRAE. O número com × compara a participação do setor no lugar com a participação dele no Brasil (quociente
        locacional): 1,3× quer dizer que o setor pesa 30% mais no lugar do que no país; abaixo de 1×, pesa menos. Em destaque, os setores acima da média nacional.
      </p>
    </>
  );
}

function PainelTrabalho({ perfis, aba }) {
  const c = aba.destaque;
  return (
    <Lados
      perfis={perfis}
      render={(p) => {
        const r = p.rais;
        if (!r) return <p className="mt-6 text-white/80">Sem dados da RAIS para este lugar.</p>;
        const mulheres = r.vinculosMPE ? (r.mulheresMPE / r.vinculosMPE) * 100 : 0;
        const sal = r.massa ? (r.massaMPE / r.massa) * 100 : 0;
        const cob = p.ativas ? (p.atendidas / p.ativas) * 100 : 0;
        return (
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-7">
            <Item icone="pessoas" rotulo="Empregados nas MPE" valor={curto(r.vinculosMPE)} cor={c} apoio={`${pctTxt((r.vinculosMPE / (r.vinculos || 1)) * 100)}% dos empregados das empresas`} />
            <Item icone="mulher" rotulo="Mulheres nos empregos das MPE" valor={`${pctTxt(mulheres)}%`} cor={c} apoio={`${curto(r.mulheresMPE)} empregadas`} />
            <Item icone="moeda" rotulo="Salários pagos pelas MPE" valor={`${pctTxt(sal)}%`} cor={c} apoio="da massa salarial das empresas" />
            <Item icone="gravata" rotulo="Remuneração média nas MPE" valor={reais(r.vinculosMPE ? r.massaMPE / r.vinculosMPE : 0)} cor={c} apoio="por trabalhador, por mês" />
            <Item icone="maleta" rotulo="Empregos criados pelas MPE em 2025" valor={p.caged ? curto(p.caged.mpe) : '—'} cor={c} apoio={p.caged ? `saldo total: ${nf0(p.caged.total)}` : undefined} />
            <Item icone="sebrae" rotulo="Pequenos negócios atendidos pelo Sebrae" valor={`${pctTxt(cob)}%`} cor={c} apoio={`${curto(p.atendidas || 0)} empresas em 2025`} />
          </div>
        );
      }}
    />
  );
}

// gráfico "borboleta": os temas de inovação, um lugar para cada lado
const COR_B = '#A093D1'; // lavanda (lado 2)
function Borboleta({ perfis, cor }) {
  const linhas = [{ nome: 'Índice geral', k: 0 }, ...INOV.temas.map((t, i) => ({ nome: t.nome, k: i + 1 }))];
  const barra = (v) => `calc((100% - 44px) * ${v / 100})`;
  return (
    <figure className="mt-8 rounded-2xl bg-white/5 p-4 sm:p-6">
      {/* celular: cada tema com duas barras, uma para cada lugar */}
      <div className="sm:hidden">
        <p className="mb-3 text-[13px] text-white/80">À frente de quantos % dos municípios</p>
        <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-white">
          {[cor, COR_B].map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ background: c }} aria-hidden />
              {perfis[i].nome}
            </span>
          ))}
        </p>
        <ul className="grid gap-3.5">
          {linhas.map((l) => (
            <li key={l.k}>
              <p className={`text-[13px] ${l.k === 0 ? 'font-bold text-white' : 'text-white/85'}`}>{l.nome}</p>
              {[0, 1].map((i) => {
                const v = perfis[i].inov?.pct?.[l.k] ?? 0;
                return (
                  <span key={i} className="mt-1 flex h-4 items-center gap-2">
                    <span className="h-full rounded-r-full" style={{ width: barra(v), background: i ? COR_B : cor }} />
                    <span className="text-[12px] font-bold tabular-nums text-white">{v}%</span>
                  </span>
                );
              })}
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mb-4 hidden grid-cols-[1fr_minmax(96px,150px)_1fr] items-end gap-2 text-[13px] text-white/80 sm:grid sm:gap-3">
        <span className="flex items-center justify-end gap-2 truncate font-semibold text-white">
          {perfis[0].nome}
          <span className="h-3 w-3 flex-none rounded-full" style={{ background: cor }} aria-hidden />
        </span>
        <span className="text-center leading-tight">à frente de quantos % dos municípios</span>
        <span className="flex items-center gap-2 truncate font-semibold text-white">
          <span className="h-3 w-3 flex-none rounded-full" style={{ background: COR_B }} aria-hidden />
          {perfis[1].nome}
        </span>
      </figcaption>
      <ul className="hidden gap-3 sm:grid">
        {linhas.map((l) => {
          const a = perfis[0].inov?.pct?.[l.k] ?? 0;
          const b = perfis[1].inov?.pct?.[l.k] ?? 0;
          return (
            <li key={l.k} className="grid grid-cols-[1fr_minmax(96px,150px)_1fr] items-center gap-2 sm:gap-3">
              <span className="flex h-6 items-center justify-end gap-2">
                <span className="text-[12.5px] font-bold tabular-nums text-white">{a}%</span>
                <span className="h-full rounded-l-full" style={{ width: barra(a), background: cor }} />
              </span>
              <span className={`text-center text-[12.5px] leading-tight ${l.k === 0 ? 'font-bold text-white' : 'text-white/85'}`}>{l.nome}</span>
              <span className="flex h-6 items-center gap-2">
                <span className="h-full rounded-r-full" style={{ width: barra(b), background: COR_B }} />
                <span className="text-[12.5px] font-bold tabular-nums text-white">{b}%</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[12px] text-white/65">No estado e no Brasil, média dos municípios (o Brasil fica em 50%, o município do meio). Fonte: Sebrae, Indicadores Municipais de Inovação {INOV.ano}.</p>
    </figure>
  );
}

function PainelInovacao({ perfis, aba }) {
  const c = aba.destaque;
  return (
    <>
      <Lados
        perfis={perfis}
        render={(p) => {
          const igs = p.listaIG || [];
          const nomesIG = [...new Set(igs.map((i) => produtoCurto(i.produto)))];
          return (
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-7">
              <Item
                icone="robo"
                rotulo="Índice de inovação"
                valor={p.inov ? nf1(p.inov.valor[0]) : '—'}
                cor={c}
                apoio={p.inov?.posicao ? `${nf0(p.inov.posicao)}º de ${nf0(p.inov.de)} ${p.inov.unidade} · de 0 a 100` : 'média dos municípios · de 0 a 100'}
              />
              <Item icone="rede" rotulo="Startups e base tecnológica" valor={p.inov ? `${p.nivel === 'br' ? 50 : p.inov.pct[5]}%` : '—'} cor={c} apoio="à frente desses % dos municípios" />
              <Item icone="selo" rotulo="Indicações geográficas" valor={igs.length ? nf0(igs.length) : 'nenhuma'} cor={c} apoio={nomesIG.length ? `${nomesIG.slice(0, 2).join(', ')}${nomesIG.length > 2 ? '…' : ''}` : 'INPI'} />
              <Item
                icone="sebrae"
                rotulo="Programas do Sebrae"
                valor={p.prog ? (p.nivel === 'mun' ? `${p.prog.presentes.length} de ${p.prog.total}` : `${nf1(p.prog.media)} de ${p.prog.total}`) : '…'}
                cor={c}
                apoio={p.prog ? (p.nivel === 'mun' ? p.prog.presentes.slice(0, 2).map((x) => x.nome).join(', ') || 'nenhum programa' : 'em média, por município') : undefined}
              />
            </div>
          );
        }}
      />
      <Borboleta perfis={perfis} cor={c} />
    </>
  );
}

/* ------------------------------------------------------------------ URL (link compartilhável) */
function lerURL() {
  try {
    const q = new URLSearchParams(window.location.search);
    if (!q.get('r1') && !q.get('r2')) return null;
    return [1, 2].map((i) => ({ uf: q.get(`r${i}`) || null, mun: q.get(`m${i}`) ? +q.get(`m${i}`) : null, setor: SETOR_CMP_BY_ID[q.get(`s${i}`)] ? q.get(`s${i}`) : null }));
  } catch {
    return null;
  }
}
function gravarURL(lados) {
  try {
    const q = new URLSearchParams(window.location.search);
    lados.forEach((l, k) => {
      const i = k + 1;
      for (const [chave, v] of [[`r${i}`, l.uf], [`m${i}`, l.mun], [`s${i}`, l.setor]]) v ? q.set(chave, v) : q.delete(chave);
    });
    const s = q.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${s ? `?${s}` : ''}${window.location.hash}`);
  } catch {
    /* sem histórico (pré-visualização): segue sem link */
  }
}

/* ------------------------------------------------------------------ seção */
export default function Comparar({ base }) {
  const [lados, setLados] = useState(INICIAL);
  const [aba, setAba] = useState('visao');
  const [aberto, setAberto] = useState(true);
  const [igs, setIgs] = useState(null);
  const [programas, setProgramas] = useState(null);
  const [aviso, setAviso] = useState('');
  const pronto = useRef(false);

  useEffect(() => {
    const u = lerURL();
    if (u) setLados(u);
    pronto.current = true;
    carregarIGs().then(setIgs);
  }, []);
  useEffect(() => {
    if (base) carregarProgramas(base).then(setProgramas);
  }, [base]);
  useEffect(() => {
    if (pronto.current) gravarURL(lados);
  }, [lados]);

  const perfis = useMemo(
    () =>
      lados.map((l) => {
        if (!l.uf) return null;
        const mun = l.mun && base ? base.porCod.get(l.mun) : null;
        if (l.mun && !mun) return null; // municípios ainda carregando
        return perfil({ uf: l.uf === 'BR' ? null : l.uf, mun }, base, { igs, programas });
      }),
    [lados, base, igs, programas],
  );
  const completos = perfis.every(Boolean);
  const setores = lados.map((l) => l.setor);
  const abaAtual = ABAS.find((a) => a.id === aba);

  const mudar = (i, v) => setLados((ls) => ls.map((l, k) => (k === i ? v : l)));
  const gerar = () => {
    try {
      window.print();
    } catch {
      setAviso('A impressão não está disponível nesta visualização. Abra a página em uma aba própria do navegador para salvar o relatório em PDF.');
    }
  };

  return (
    <section id="comparar" aria-labelledby="comparar-titulo" className="bg-tema-bg px-4 pb-16 pt-12 sm:px-8 lg:px-12 lg:pb-24 lg:pt-16 print:bg-white print:p-0">
      <div className="mx-auto max-w-[1240px]">
        <div className="text-center print:hidden">
          <h2 id="comparar-titulo" className="inline-flex items-center gap-3 font-display text-[clamp(40px,5.4vw,72px)] font-extrabold leading-none tracking-[-0.02em] text-tema-tinta">
            Comparar
            <button type="button" aria-expanded={aberto} aria-controls="comparar-corpo" onClick={() => setAberto((a) => !a)} className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-tema-linha" title={aberto ? 'Recolher' : 'Abrir'}>
              <Icon name="chevron" size={26} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
            </button>
          </h2>
          <p className="mx-auto mt-4 max-w-[62ch] text-[15px] leading-relaxed text-tema-suave">
            O raio-x de dois territórios lado a lado. Escolha o Brasil, um estado ou um município em cada região e, se quiser, um setor. O relatório reúne pequenos negócios,
            setores, trabalho e renda, cadeias produtivas, inovação e a presença do Sebrae, com dados da API do Observatório.
          </p>
        </div>

        {aberto && (
          <div id="comparar-corpo">
            {/* filtros */}
            <div className="mt-10 rounded-[28px] bg-tema-card p-6 shadow-card sm:p-10 print:hidden">
              <div className="grid gap-10 md:grid-cols-2 md:gap-14">
                {lados.map((l, i) => (
                  <Regiao key={i} n={i + 1} lado={l} base={base} onMudar={(v) => mudar(i, v)} />
                ))}
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <button type="button" onClick={gerar} disabled={!completos} className="h-12 rounded-2xl bg-lima px-7 font-display text-[17px] font-extrabold text-navy transition hover:brightness-105 disabled:opacity-50">
                  Gerar relatório
                </button>
                <button type="button" onClick={() => document.getElementById('territorio')?.scrollIntoView({ behavior: 'smooth' })} className="h-12 rounded-2xl bg-lima px-7 font-display text-[17px] font-extrabold text-navy transition hover:brightness-105">
                  Voltar
                </button>
                <button type="button" onClick={() => setLados([{ uf: null, mun: null, setor: null }, { uf: null, mun: null, setor: null }])} className="h-12 rounded-2xl border-2 border-lima px-7 font-display text-[17px] font-extrabold text-azul transition hover:bg-lima/20 [[data-theme=navy]_&]:text-lima [[data-theme=escuro]_&]:text-lima">
                  Limpar filtros
                </button>
              </div>
              {aviso && (
                <p role="status" className="mt-4 text-[13px] text-magenta">
                  {aviso}
                </p>
              )}
            </div>

            {!completos ? (
              <p className="mt-10 text-center text-[15px] text-tema-suave">{lados.some((l) => !l.uf) ? 'Escolha as duas regiões para ver a comparação.' : 'Carregando os dados dos municípios…'}</p>
            ) : (
              <div id="relatorio">
                {/* principais indicadores */}
                <h3 className="mt-14 flex items-center justify-center gap-3 font-display text-[clamp(22px,2.4vw,28px)] font-extrabold text-magenta">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-magenta text-white" aria-hidden>
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m3 16 5-5 4 3 7-7M15 7h4v4" />
                    </svg>
                  </span>
                  Principais Indicadores
                </h3>
                <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-14">
                  {perfis.map((p, i) => (
                    <div key={i} className={`min-w-0 ${i === 1 ? 'md:border-l md:border-tema-linha md:pl-14' : ''}`}>
                      <Cabecalho p={p} />
                      <Resumo texto={resumo(p, setores[i])} />
                      <div className="mt-5 grid gap-3">
                        {indicadoresDe(p, setores[i]).map((x, k) => (
                          <Indicador key={k} {...x} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* relatório em abas */}
                <div className="mt-16 rounded-[28px] bg-tema-linha p-1.5 sm:p-5 print:bg-white print:p-0">
                  <div role="tablist" aria-label="Relatório da comparação" className="flex gap-1 overflow-x-auto print:hidden">
                    {ABAS.map((a) => (
                      <button
                        key={a.id}
                        role="tab"
                        id={`aba-${a.id}`}
                        aria-selected={aba === a.id}
                        aria-controls={`painel-${a.id}`}
                        onClick={() => setAba(a.id)}
                        className={`whitespace-nowrap rounded-t-2xl px-5 py-3 text-[15px] transition ${aba === a.id ? 'bg-tema-card font-semibold text-tema-tinta' : 'text-tema-suave hover:bg-tema-card hover:text-tema-tinta'}`}
                      >
                        {a.rotulo}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-b-[22px] rounded-tr-[22px] bg-tema-card p-1.5 sm:p-6 print:p-0">
                    {ABAS.map((a) => (
                      <div
                        key={a.id}
                        id={`painel-${a.id}`}
                        role="tabpanel"
                        aria-labelledby={`aba-${a.id}`}
                        data-painel
                        className={`${aba === a.id ? '' : 'hidden'} ${a.claro ? 'painel-claro' : ''} rounded-[22px] p-5 sm:p-10 print:mb-4`}
                        style={{ background: a.fundo }}
                      >
                        {/* logo do mesmo tamanho em todas as abas, cerca de metade da largura do título
                            "Visão geral" (3,3 em do corpo do título): assina o relatório sem competir com ele */}
                        <div className="text-[clamp(38px,5.2vw,76px)]">
                          <LogoObservatorio className="mb-3 block h-auto w-[3.3em] min-w-[168px] max-w-full text-white sm:mb-4" />
                          <h3 className="font-display text-[length:inherit] font-extrabold uppercase leading-[0.95] tracking-[-0.01em] text-white">{a.titulo}</h3>
                        </div>
                        {a.id === 'visao' && <PainelVisao perfis={perfis} setores={setores} aba={a} />}
                        {a.id === 'setores' && <PainelSetores perfis={perfis} setores={setores} aba={a} />}
                        {a.id === 'trabalho' && <PainelTrabalho perfis={perfis} aba={a} />}
                        {a.id === 'inovacao' && <PainelInovacao perfis={perfis} aba={a} />}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-4 font-detail text-nota italic text-tema-apagado">
                  Fontes: API do Observatório Sebrae — Receita Federal (pequenos negócios ativos e abertos), MTE (RAIS 2025 e Novo CAGED 2025), Sebrae (atendimentos 2025, programas,
                  Indicadores Municipais de Inovação), IBGE (PAM, PPM e PEVS 2024), REDESIM (tempo de abertura 2025) e INPI (indicações geográficas). Gerado em{' '}
                  {new Date().toLocaleDateString('pt-BR')}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
