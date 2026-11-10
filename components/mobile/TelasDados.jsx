'use client';
// Telas de dados da versão mobile: Início, Micro e Pequenas Empresas, Território-setor e Comparar.
// Visualização recortada: poucos números por vez e o resto em dropdowns (acordeões).
import { useMemo, useState } from 'react';
import Icon from '../Icon';
import { asset } from '@/lib/asset';
import { UF_BY_SIGLA, REGIOES } from '@/lib/dados/ufs';
import { cartoes, caixasMPE, heroi, temas, trilha, GENTILICO, perfil, curto } from '@/lib/dados/mobile';
import { pctTxt } from '@/lib/dados/comparar';
import { Acordeao, Botao, CartaoNumero, Folha, TituloTela } from './ui';
import MapaMini from './MapaMini';
import { PROGRAMAS } from '@/lib/dados/sebraeTerritorio';

const IMG_SETOR = { agro: 'agro', comercio: 'comercio', industria: 'industria', servicos: 'servicos' };

function Trilha({ t, onIr }) {
  const passos = trilha(t);
  if (passos.length < 2) return null;
  return (
    <nav aria-label="Navegação territorial" className="mb-1 flex flex-wrap items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-tema-suave">
      {passos.map((p, i) => (
        <span key={p.rotulo} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true">›</span>}
          {i < passos.length - 1 ? (
            <button type="button" onClick={() => onIr(p.t)} className="uppercase underline-offset-2 hover:underline">
              {p.rotulo}
            </button>
          ) : (
            <span aria-current="location">{p.rotulo}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Grade de caixas: mostra as 4 primeiras; o restante abre num dropdown */
function GradeCartoes({ lista, onDetalhe, inicial = 4 }) {
  const [mais, setMais] = useState(false);
  const vis = mais ? lista : lista.slice(0, inicial);
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {vis.map((c) => (
          <CartaoNumero key={c.id} c={c} onClick={() => onDetalhe(c)} />
        ))}
      </div>
      {lista.length > inicial && (
        <button type="button" aria-expanded={mais} onClick={() => setMais((v) => !v)} className="mx-auto mt-3 flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-tema-tinta hover:bg-tema-linha">
          {mais ? 'mostrar menos' : `mais ${lista.length - inicial} indicadores`}
          <span className={`transition-transform ${mais ? 'rotate-180' : ''}`}>
            <Icon name="chevron" size={16} />
          </span>
        </button>
      )}
    </>
  );
}

function DetalheCartao({ c, onFechar }) {
  return (
    <Folha aberta={!!c} onFechar={onFechar} titulo={c?.rotulo && c.rotulo[0].toUpperCase() + c.rotulo.slice(1)}>
      {c && (
        <>
          <p className="font-display text-[40px] font-extrabold leading-none text-tema-numero tabular-nums">{c.valor}</p>
          {c.apoio && <p className="mt-2 text-[14px] font-semibold text-tema-suave">{c.apoio}</p>}
          <p className="mt-4 text-[15px] leading-relaxed text-tema-tinta">{c.sobre}</p>
          <p className="mt-4 text-[12px] text-tema-apagado">Fonte: {c.fonte} · API do Observatório</p>
        </>
      )}
    </Folha>
  );
}

// ------------------------------------------------------------------ Início
export function TelaInicio({ ctx }) {
  const { p, t, irPara, setT } = ctx;
  const [det, setDet] = useState(null);
  const h = heroi(p, t);
  const lista = cartoes(p, t);
  return (
    <>
      <Trilha t={t} onIr={setT} />
      <TituloTela>{p.nome}</TituloTela>
      <section className="mb-3 rounded-[24px] bg-navy p-5 text-white [[data-theme=navy]_&]:bg-[#0c0b3a]" aria-label="Destaque">
        <span className="flex items-center gap-2 text-[13px] text-[#c3c5ec]">
          <Icon name={h.icone} size={18} /> {h.fonte}
        </span>
        <p className="mt-3 font-display text-[40px] font-extrabold leading-none tracking-tight text-lima tabular-nums">{h.valor}</p>
        <p className="mt-1 text-[15px]">{h.rotulo}</p>
      </section>
      <GradeCartoes lista={lista} onDetalhe={setDet} />
      <div className="mt-5 grid gap-2">
        <AtalhoGrande icone="empresas" titulo="Micro e pequenas empresas" texto="Temas em destaque no território" onClick={() => irPara('mpe')} />
        <AtalhoGrande icone="pino" titulo="Território-setor" texto="Mapa, Sebrae no território e setores" onClick={() => irPara('territorio')} />
      </div>
      <DetalheCartao c={det} onFechar={() => setDet(null)} />
    </>
  );
}

function AtalhoGrande({ icone, titulo, texto, onClick }) {
  return (
    <button type="button" onClick={onClick} className="seta-gatilho flex items-center gap-3 rounded-[20px] border border-tema-linha bg-tema-card p-4 text-left">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-lima text-navy">
        <Icon name={icone} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[16px] font-bold text-tema-tinta">{titulo}</span>
        <span className="block text-[13px] text-tema-suave">{texto}</span>
      </span>
      <Icon name="seta-dir" size={18} className="text-tema-tinta" />
    </button>
  );
}

// ------------------------------------------------------------------ Micro e pequenas empresas
export function TelaMPE({ ctx }) {
  const { p, t, setT, base, onAvancada } = ctx;
  const [aberto, setAberto] = useState(null);
  const caixas = caixasMPE(p, t);
  const lista = useMemo(() => temas(p, t, base), [p, t, base]);
  return (
    <>
      <Trilha t={t} onIr={setT} />
      <TituloTela apoio={p.nome}>Micro e pequenas empresas</TituloTela>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {caixas.map((c) => (
          <div key={c.rotulo} className="flex min-w-0 flex-col rounded-[18px] bg-[#36BF76] p-3 text-white">
            <span className="font-display text-[24px] font-extrabold leading-none tabular-nums">{c.valor}</span>
            <span className="mt-1.5 text-[11.5px] leading-snug">{c.rotulo}</span>
            <span className="mt-auto pt-1.5 text-[10px] opacity-90">{c.fonte}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-tema-linha">
        {lista.map((tm) => (
          <Acordeao key={tm.id} titulo={tm.titulo} icone={tm.icone} aberto={aberto === tm.id} onAlternar={() => setAberto((a) => (a === tm.id ? null : tm.id))}>
            <ConteudoTema tm={tm} />
          </Acordeao>
        ))}
      </div>
      <Botao tipo="secundario" className="mt-6 w-full" onClick={onAvancada}>
        <Icon name="expandir" size={18} /> visualizar versão avançada
      </Botao>
    </>
  );
}

function ConteudoTema({ tm }) {
  if (tm.emPreparacao)
    return (
      <p className="rounded-2xl bg-tema-linha/60 p-4 text-[14px] leading-relaxed text-tema-tinta">
        <strong className="mb-1 block text-[12px] uppercase tracking-wide text-tema-suave">em preparação</strong>
        {tm.texto}
      </p>
    );
  const max = tm.barras ? Math.max(...tm.barras.map((b) => Math.abs(b.v))) : 1;
  return (
    <div className="space-y-3">
      {tm.linhas.length > 0 && (
        <dl className="divide-y divide-tema-linha rounded-2xl bg-tema-card px-4 shadow-card">
          {tm.linhas.map((l) => (
            <div key={l.rotulo} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-[13px] leading-snug text-tema-tinta">{l.rotulo}</dt>
              <dd className={`flex-none text-right font-display font-extrabold tabular-nums text-tema-numero ${l.destaque ? 'text-[22px]' : 'text-[16px]'}`}>{l.valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {tm.barras && (
        <ul className="space-y-2.5 rounded-2xl bg-tema-card p-4 shadow-card">
          {tm.barras.map((b) => (
            <li key={b.rotulo} className="grid grid-cols-[22px_76px_1fr_54px] items-center gap-2 text-[13px] text-tema-tinta">
              <Icon name={b.icone} size={18} />
              <span className="truncate">{b.rotulo}</span>
              <span className="h-2 rounded-full bg-tema-linha">
                <span className="block h-2 rounded-full bg-[var(--tema-barra)]" style={{ width: `${Math.max(4, (Math.abs(b.v) / max) * 100)}%` }} />
              </span>
              <span className="text-right font-semibold tabular-nums">{b.txt}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[13px] leading-relaxed text-tema-suave">{tm.texto}</p>
      <p className="text-[11px] text-tema-apagado">Fonte: {tm.fonte}</p>
    </div>
  );
}

// ------------------------------------------------------------------ Território-setor
export function TelaTerritorio({ ctx }) {
  const { p, t, setT, base, irPara, agenda, setComparar } = ctx;
  const [det, setDet] = useState(null);
  const [aberto, setAberto] = useState('sebrae');
  const alt = (id) => setAberto((a) => (a === id ? null : id));
  const u = t.uf ? UF_BY_SIGLA[t.uf] : null;
  const info = [];
  if (u && !t.mun) {
    info.push({ id: 'pop', icone: 'pessoas', valor: `${u.pop.toLocaleString('pt-BR')} mi`, rotulo: 'habitantes', fonte: 'IBGE · Censo 2022', sobre: 'População residente no Censo Demográfico 2022, em milhões.' });
    info.push({ id: 'gent', icone: 'localizacao', valor: GENTILICO[t.uf][0].toUpperCase() + GENTILICO[t.uf].slice(1), rotulo: `gentílico · capital: ${u.capital}`, fonte: 'IBGE', sobre: `Quem nasce em ${u.nome} é ${GENTILICO[t.uf]}. Região ${REGIOES[u.regiao]}.` });
  }
  if (t.mun) info.push({ id: 'uf', icone: 'localizacao', valor: t.uf, rotulo: `${UF_BY_SIGLA[t.uf].nome}${t.mun.cap ? ' · capital' : ''}`, fonte: 'IBGE', sobre: `Município de ${UF_BY_SIGLA[t.uf].nome}, região ${REGIOES[UF_BY_SIGLA[t.uf].regiao]}.` });
  if (p.bioma) info.push({ id: 'bioma', icone: 'bioma', valor: p.bioma, rotulo: 'bioma predominante', fonte: 'IBGE · Biomas', sobre: 'Bioma com a maior parte do território.' });
  const cs = cartoes(p, t);
  info.push(cs.find((c) => c.id === 'remuneracao'), cs.find((c) => c.id === 'vinculos'), cs.find((c) => c.id === 'ativas'));
  const pinos = agenda.slice(0, 12);

  return (
    <>
      <Trilha t={t} onIr={setT} />
      <TituloTela apoio="toque no mapa para escolher um estado ou município">Território-setor</TituloTela>
      <MapaMini t={t} base={base} onEscolher={setT} pinos={pinos} />
      <h2 className="mb-3 mt-5 font-display text-[22px] font-extrabold text-tema-tinta">{p.nome}</h2>
      <GradeCartoes lista={info.filter(Boolean)} onDetalhe={setDet} />

      <div className="mt-5 border-t border-tema-linha">
        <Acordeao titulo="Sebrae no território" icone="sebrae" aberto={aberto === 'sebrae'} onAlternar={() => alt('sebrae')}>
          <SebraeNoTerritorio p={p} t={t} />
        </Acordeao>
        <Acordeao titulo="Setores em destaque" icone="setores" aberto={aberto === 'setores'} onAlternar={() => alt('setores')}>
          <SetoresDestaque p={p} t={t} />
        </Acordeao>
        <Acordeao titulo="Micro e pequenas empresas" icone="empresas" aberto={aberto === 'mpe'} onAlternar={() => alt('mpe')}>
          <div className="grid grid-cols-3 gap-2">
            {caixasMPE(p, t).map((c) => (
              <div key={c.rotulo} className="rounded-[18px] bg-[#36BF76] p-3 text-white">
                <span className="block font-display text-[22px] font-extrabold leading-none">{c.valor}</span>
                <span className="mt-1 block text-[11.5px] leading-snug">{c.rotulo}</span>
              </div>
            ))}
          </div>
          <Botao tipo="secundario" className="mt-3 w-full" onClick={() => irPara('mpe')}>
            ver os temas das MPE <Icon name="seta-dir" size={16} />
          </Botao>
        </Acordeao>
        <Acordeao titulo="Comparativo" icone="trocar" aberto={aberto === 'cmp'} onAlternar={() => alt('cmp')}>
          <p className="mb-3 text-[14px] text-tema-tinta">Compare {p.nome} com o Brasil ou com outro território.</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-full bg-tema-linha/70 px-4 py-3 text-[14px] text-tema-tinta">
              <Icon name="pino" size={18} /> {p.nome}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-tema-linha/70 px-4 py-3 text-[14px] text-tema-tinta">
              <Icon name="pino" size={18} /> {t.mun ? UF_BY_SIGLA[t.uf].nome : 'Brasil'}
            </div>
          </div>
          <Botao className="mt-3 w-full" onClick={() => { setComparar([t, t.mun ? { uf: t.uf } : {}]); irPara('comparar'); }}>
            Comparar
          </Botao>
        </Acordeao>
      </div>
      <DetalheCartao c={det} onFechar={() => setDet(null)} />
    </>
  );
}

function SebraeNoTerritorio({ p, t }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between rounded-2xl bg-tema-card px-4 py-3 shadow-card">
        <span className="text-[13px] text-tema-tinta">Empresas atendidas em 2025</span>
        <span className="font-display text-[22px] font-extrabold text-tema-numero tabular-nums">{curto(p.atendidas)}</span>
      </div>
      {!p.prog && <p className="text-[13px] text-tema-suave">Carregando os programas…</p>}
      {p.prog && t.mun && (
        <ul className="grid grid-cols-2 gap-2">
          {ctxProgramas(p).map((x) => (
            <li key={x.id} className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-[12.5px] leading-tight ${x.sim ? 'border-transparent bg-tema-card text-tema-tinta shadow-card' : 'border-dashed border-tema-linha text-tema-apagado'}`}>
              <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: x.sim ? x.cor : 'transparent', border: x.sim ? 0 : '1px solid currentColor' }} />
              {x.nome}
            </li>
          ))}
        </ul>
      )}
      {p.prog && !t.mun && (
        <ul className="space-y-2.5 rounded-2xl bg-tema-card p-4 shadow-card">
          {[...p.prog.cobertura].sort((a, b) => b.pct - a.pct).map((x) => (
            <li key={x.id} className="text-[12.5px] text-tema-tinta">
              <span className="flex justify-between gap-2">
                <span className="truncate">{x.nome}</span>
                <span className="font-semibold tabular-nums">{pctTxt(x.pct, 0)}%</span>
              </span>
              <span className="mt-1 block h-1.5 rounded-full bg-tema-linha">
                <span className="block h-1.5 rounded-full" style={{ width: `${Math.max(2, x.pct)}%`, background: x.cor }} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-tema-apagado">{t.mun ? 'Programas com registro no município.' : 'Parte dos municípios com cada programa.'} Fonte: Sebrae · API do Observatório.</p>
    </div>
  );
}
// programas do município: todos os acompanhados, marcando os presentes
function ctxProgramas(p) {
  const pres = new Set(p.prog.presentes.map((x) => x.id));
  return PROGRAMAS.filter((x) => x.id !== 'ig').map((x) => ({ ...x, sim: pres.has(x.id) }));
}

function SetoresDestaque({ p, t }) {
  const ord = [...p.setores].filter((s) => s.n).sort((a, b) => (t.uf ? b.ql - a.ql : b.part - a.part));
  return (
    <div className="sem-barra -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
      {ord.map((s) => (
        <div key={s.id} className="w-[150px] flex-none snap-start overflow-hidden rounded-[20px] bg-tema-card shadow-card">
          <div className="relative h-[92px]" style={{ background: s.cor }}>
            {IMG_SETOR[s.id] && <img src={asset(`setores/${IMG_SETOR[s.id]}.webp`)} alt="" className="h-full w-full object-cover" loading="lazy" />}
          </div>
          <div className="p-3">
            <p className="font-display text-[15px] font-bold text-tema-tinta">{s.nome}</p>
            <p className="font-display text-[20px] font-extrabold text-tema-numero tabular-nums">{pctTxt(s.part * 100, 0)}%</p>
            <p className="text-[11.5px] leading-snug text-tema-suave">{t.uf ? `${s.ql.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}× a proporção do Brasil` : 'dos pequenos negócios'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Comparar
export function TelaComparar({ ctx }) {
  const { base, extras, comparar, setComparar, abrirBusca } = ctx;
  const [a, b] = comparar;
  const pa = useMemo(() => perfil(a, base, extras), [a, base, extras]);
  const pb = useMemo(() => perfil(b, base, extras), [b, base, extras]);
  const ca = cartoes(pa, a);
  const cb = cartoes(pb, b);
  const [det, setDet] = useState(null);
  const lado = (i) => (
    <button type="button" onClick={() => abrirBusca((nt) => setComparar(i === 0 ? [nt, b] : [a, nt]))} className="flex w-full items-center gap-2 rounded-full bg-tema-card px-4 py-3 text-left text-[14px] text-tema-tinta shadow-card">
      <Icon name="pino" size={18} className={i === 0 ? 'text-[#36BF76]' : 'text-[#A093D1]'} />
      <span className="min-w-0 flex-1 truncate">{(i === 0 ? pa : pb).nome}</span>
      <span className="text-[12px] text-tema-suave">trocar</span>
    </button>
  );
  return (
    <>
      <TituloTela apoio="toque em um território para trocar">Comparar</TituloTela>
      <div className="space-y-2">
        {lado(0)}
        {lado(1)}
      </div>
      <div className="sticky top-[124px] z-10 -mx-5 mt-5 grid grid-cols-2 border-b border-tema-linha bg-tema-bg px-5 py-2.5 text-center font-display text-[15px] font-bold text-tema-tinta">
        <span className="truncate border-r border-tema-linha pr-2">{pa.nome}</span>
        <span className="truncate pl-2">{pb.nome}</span>
      </div>
      <ul className="mt-3 space-y-3">
        {ca.map((c, i) => (
          <li key={c.id}>
            <p className="mb-1.5 text-center text-[12.5px] font-semibold text-tema-suave">{c.rotulo}</p>
            <div className="grid grid-cols-2 gap-3">
              {[c, cb[i]].map((x, j) => (
                <button key={j} type="button" onClick={() => setDet(x)} className={`rounded-[18px] bg-tema-card p-3 text-center shadow-card ${j === 0 ? 'border-t-4 border-[#36BF76]' : 'border-t-4 border-[#A093D1]'}`}>
                  <span className="block font-display text-[22px] font-extrabold leading-tight text-tema-numero tabular-nums">{x.valor}</span>
                  {x.apoio && <span className="mt-0.5 block text-[11px] text-tema-suave">{x.apoio}</span>}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-tema-apagado">Contagens absolutas dependem do tamanho de cada território. Fontes: Receita Federal, RAIS 2025, Novo CAGED, Sebrae e REDESIM.</p>
      <DetalheCartao c={det} onFechar={() => setDet(null)} />
    </>
  );
}
