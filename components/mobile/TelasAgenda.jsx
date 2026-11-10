'use client';
// Calendário de eventos (agenda FICTÍCIA de demonstração) e gerador de briefing georreferenciado.
import { useMemo, useState } from 'react';
import Icon from '../Icon';
import { OBJETIVOS, SECOES_BRIEFING, montarBriefing, briefingEmTexto, municipioMaisProximo } from '@/lib/dados/mobile';
import { CAT_BY_ID, chaveDia, localTexto, noDia, nomeMes, periodo, proximos, tomCat } from '@/lib/dados/calendario';
import { UF_BY_SIGLA } from '@/lib/dados/ufs';
import { Acordeao, Botao, Chips, Folha, TituloTela, useGuardado } from './ui';


// ------------------------------------------------------------------ Calendário (Calendário Sebrae DITEC 2026)
const SEM = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const SEM_LONGO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export function TelaCalendario({ ctx }) {
  const { t, setT, agenda, irPara, setBriefingPara } = ctx;
  const hoje = useMemo(() => new Date(), []);
  const [mes, setMes] = useState(hoje.getFullYear() === 2026 ? hoje.getMonth() : 0);
  const [dia, setDia] = useState(hoje.getFullYear() === 2026 ? hoje : new Date(2026, 0, 1));
  const [escopo, setEscopo] = useState('todos');
  const [ev, setEv] = useState(null);
  const [marcados, setMarcados] = useGuardado('obs-mobile-agenda-ditec', []);
  const lista = escopo === 'estado' && t.uf ? agenda.filter((e) => e.uf === t.uf) : agenda;

  const primeiro = new Date(2026, mes, 1);
  const vazios = primeiro.getDay();
  const nDias = new Date(2026, mes + 1, 0).getDate();
  const doDiaSel = lista.filter((e) => noDia(e, dia));
  const prox = proximos(4, lista, dia);
  const alternarMarca = (id) => setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  const escopos = [{ id: 'todos', rotulo: 'Todos os eventos' }, ...(t.uf ? [{ id: 'estado', rotulo: `Em ${UF_BY_SIGLA[t.uf].nome}` }] : []), { id: 'meus', rotulo: 'Vou participar' }];
  const listaFinal = escopo === 'meus' ? agenda.filter((e) => marcados.includes(e.id)) : null;

  return (
    <>
      <section className="rounded-[28px] bg-tema-card p-4" aria-label="Mês">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-[15px] text-tema-tinta">
            <strong className="font-semibold">{dia.getDate()} {nomeMes(dia.getMonth()).slice(0, 3)}., 26</strong> <span className="text-tema-suave">{SEM_LONGO[dia.getDay()]}</span>
          </p>
          <div className="flex items-center gap-1">
            <button type="button" disabled={mes === 0} onClick={() => setMes((m) => m - 1)} aria-label="Mês anterior" className="grid h-9 w-9 place-items-center rounded-full text-tema-tinta disabled:opacity-30">
              <Icon name="seta-esq" size={18} />
            </button>
            <span className="min-w-[78px] text-center text-[13px] font-semibold capitalize text-tema-tinta">{nomeMes(mes)}</span>
            <button type="button" disabled={mes === 11} onClick={() => setMes((m) => m + 1)} aria-label="Próximo mês" className="grid h-9 w-9 place-items-center rounded-full text-tema-tinta disabled:opacity-30">
              <Icon name="seta-dir" size={18} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center" role="group" aria-label={`${nomeMes(mes)} de 2026`}>
          {SEM.map((d, i) => (
            <span key={i} aria-hidden="true" className="pb-2 text-[12px] text-tema-suave">
              {d}
            </span>
          ))}
          {Array.from({ length: vazios }).map((_, i) => (
            <span key={`v${i}`} />
          ))}
          {Array.from({ length: nDias }).map((_, i) => {
            const d = new Date(2026, mes, i + 1);
            const sel = chaveDia(d) === chaveDia(dia);
            const ehHoje = chaveDia(d) === chaveDia(hoje);
            const cats = [...new Set(lista.filter((e) => noDia(e, d)).map((e) => e.categoria))].slice(0, 3);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={sel}
                aria-label={`${d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}${cats.length ? `, ${cats.length} unidade${cats.length > 1 ? 's' : ''} com eventos` : ''}${ehHoje ? ', hoje' : ''}`}
                onClick={() => setDia(d)}
                className="flex h-12 flex-col items-center justify-start gap-1 pt-1"
              >
                <span className={`grid h-8 w-8 place-items-center rounded-full text-[14px] tabular-nums ${sel ? 'bg-navy font-semibold text-white [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy [[data-theme=escuro]_&]:bg-lima [[data-theme=escuro]_&]:text-[#141414]' : ehHoje ? 'font-bold text-tema-tinta ring-1 ring-tema-tinta' : 'text-tema-tinta'}`}>{i + 1}</span>
                <span className="flex h-1.5 gap-0.5" aria-hidden="true">
                  {cats.map((c) => (
                    <span key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: CAT_BY_ID[c].cor }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-4">
        <Chips itens={escopos} ativo={escopo} onEscolher={setEscopo} rotulo="Quais eventos" />
      </div>

      {listaFinal ? (
        <ListaEventos titulo="Vou participar" eventos={listaFinal} vazio="Marque os eventos de que vai participar." marcados={marcados} onMarcar={alternarMarca} onAbrir={setEv} />
      ) : (
        <>
          <ListaEventos titulo={doDiaSel.length ? `Eventos em ${dia.getDate()} de ${nomeMes(dia.getMonth())}` : `Nenhum evento em ${dia.getDate()} de ${nomeMes(dia.getMonth())}`} eventos={doDiaSel} marcados={marcados} onMarcar={alternarMarca} onAbrir={setEv} />
          <ListaEventos titulo="Próximos" eventos={prox.filter((e) => !doDiaSel.includes(e))} vazio="Não há mais eventos em 2026." marcados={marcados} onMarcar={alternarMarca} onAbrir={setEv} />
        </>
      )}
      <p className="mt-4 text-[11px] text-tema-apagado">Fonte: Calendário Sebrae DITEC 2026.</p>

      <Folha aberta={!!ev} onFechar={() => setEv(null)} titulo={ev?.nome}>
        {ev && (
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold text-tema-tinta" style={{ background: tomCat(ev.categoria) }}>
              <span className="h-2 w-2 rounded-full" style={{ background: CAT_BY_ID[ev.categoria].cor }} />
              {ev.unidade}
            </span>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[15px]">
              <dt className="text-tema-suave">Quando</dt>
              <dd className="text-tema-tinta">{periodo(ev)}</dd>
              <dt className="text-tema-suave">Onde</dt>
              <dd className="text-tema-tinta">{localTexto(ev)}</dd>
              <dt className="text-tema-suave">Público</dt>
              <dd className="text-tema-tinta">{ev.publico || '—'}</dd>
            </dl>
            <Botao tipo={marcados.includes(ev.id) ? 'secundario' : 'lima'} className="w-full" onClick={() => alternarMarca(ev.id)}>
              <Icon name="marcado" size={18} /> {marcados.includes(ev.id) ? 'Marcado: vou participar' : 'Vou participar'}
            </Botao>
            {ev.uf && (
              <Botao
                className="w-full"
                onClick={() => {
                  setT(ev.mun ? { uf: ev.uf, mun: ev.mun } : { uf: ev.uf });
                  setBriefingPara(ev);
                  setEv(null);
                  irPara('relatorios');
                }}
              >
                <Icon name="documento2" size={18} /> Briefing de {ev.mun ? ev.mun.nome : UF_BY_SIGLA[ev.uf].nome}
              </Botao>
            )}
          </div>
        )}
      </Folha>
    </>
  );
}

function ListaEventos({ titulo, eventos, vazio, marcados, onMarcar, onAbrir }) {
  if (!eventos.length && !vazio) return <h2 className="mb-1 mt-5 font-display text-[18px] font-semibold text-tema-tinta">{titulo}</h2>;
  return (
    <section className="mt-5">
      <h2 className="mb-2 font-display text-[18px] font-semibold text-tema-tinta">{titulo}</h2>
      {!eventos.length && <p className="text-[14px] text-tema-suave">{vazio}</p>}
      <ul className="space-y-2.5">
        {eventos.map((e) => {
          const c = CAT_BY_ID[e.categoria];
          const m = marcados.includes(e.id);
          return (
            <li key={e.id} className="flex items-stretch gap-2">
              <button type="button" onClick={() => onAbrir(e)} className="min-w-0 flex-1 rounded-[22px] p-4 text-left" style={{ background: tomCat(e.categoria) }}>
                <span className="text-[12px] text-tema-tinta">{c.curto || c.rotulo}</span>
                <span className="mt-0.5 block font-display text-[16px] font-semibold leading-snug text-tema-tinta">{e.nome}</span>
                <span className="mt-2 flex items-center gap-1.5 border-t border-tema-tinta/10 pt-2 text-[12.5px] text-tema-tinta">
                  <Icon name="calendario" size={16} /> {periodo(e)} · {localTexto(e)}
                </span>
              </button>
              <button type="button" role="checkbox" aria-checked={m} aria-label={`Vou participar: ${e.nome}`} onClick={() => onMarcar(e.id)} className={`grid w-11 flex-none place-items-center rounded-[18px] ${m ? 'bg-[#36BF76] text-white' : 'bg-tema-card text-tema-apagado'}`}>
                <Icon name="marcado" size={20} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------ Briefing
export function TelaBriefing({ ctx }) {
  const { p, t, setT, base, agenda, abrirBusca, briefingPara, setBriefingPara } = ctx;
  const [objetivo, setObjetivo] = useState(briefingPara ? OBJETIVOS[2] : OBJETIVOS[0]);
  const [pauta, setPauta] = useState(briefingPara ? briefingPara.nome : '');
  const [secoes, setSecoes] = useState(SECOES_BRIEFING.map((s) => s.id));
  const [doc, setDoc] = useState(null);
  const [aviso, setAviso] = useState('');
  const [aberto, setAberto] = useState('onde');

  const localizar = () => {
    setAviso('Procurando sua localização…');
    if (!navigator.geolocation) return setAviso('Este navegador não informa a localização. Escolha o território pela busca.');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const m = municipioMaisProximo(base, pos.coords.longitude, pos.coords.latitude);
        if (m) {
          setT({ uf: m.uf, mun: m });
          setAviso(`Localização encontrada: ${m.nome} (${m.uf}).`);
        }
      },
      () => setAviso('Não foi possível obter a localização (permissão negada ou indisponível). Escolha o território pela busca.'),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const gerar = () => {
    const ag = proximos(99, t.uf ? agenda.filter((e) => e.uf === t.uf) : agenda);
    setDoc(montarBriefing(p, t, { objetivo, secoes, agenda: ag, pauta }));
    window.scrollTo({ top: 0 });
  };
  const texto = doc ? briefingEmTexto(doc) : '';
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setAviso('Briefing copiado.');
    } catch {
      setAviso('Não foi possível copiar neste navegador.');
    }
  };
  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: doc.titulo, text: texto });
      } catch {
        /* cancelado */
      }
    } else copiar();
  };

  if (doc)
    return (
      <>
        <div className="nao-imprimir mb-3 flex items-center gap-2">
          <button type="button" onClick={() => setDoc(null)} className="seta-gatilho flex items-center gap-1 rounded-full px-2 py-1.5 text-[14px] font-semibold text-tema-tinta hover:bg-tema-linha">
            <Icon name="voltar" size={18} /> editar
          </button>
        </div>
        <article className="briefing-doc rounded-[24px] bg-tema-card p-5">
          <header className="mb-4 border-b border-tema-linha pb-4">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#36BF76]">Briefing do território</p>
            <h1 className="mt-1 font-display text-[26px] font-extrabold leading-tight text-tema-tinta">{doc.titulo.replace('Briefing · ', '')}</h1>
            <p className="mt-1 text-[13px] text-tema-suave">
              {doc.subtitulo} · {doc.data}
            </p>
          </header>
          {doc.secoes.map((s) => (
            <section key={s.titulo} className="mb-4">
              <h2 className="mb-1.5 flex items-center gap-2 font-display text-[16px] font-bold text-tema-tinta">
                {s.titulo}
              </h2>
              <ul className="space-y-1.5 text-[14px] leading-relaxed text-tema-tinta">
                {s.itens.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-[#36BF76]" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {doc.atencao.length > 0 && (
            <section className="mb-4 rounded-2xl bg-lima/40 p-4 [[data-theme=escuro]_&]:bg-lima/15 [[data-theme=navy]_&]:bg-lima/15">
              <h2 className="mb-1.5 font-display text-[15px] font-bold text-tema-tinta">Pontos de atenção</h2>
              <ul className="list-disc space-y-1 pl-5 text-[14px] text-tema-tinta">
                {doc.atencao.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </section>
          )}
          <p className="text-[11px] leading-snug text-tema-apagado">Fontes: {doc.fontes}</p>
        </article>
        <div className="nao-imprimir mt-4 grid grid-cols-3 gap-2">
          <Botao tipo="secundario" className="px-2" onClick={copiar}>
            Copiar
          </Botao>
          <Botao tipo="secundario" className="px-2" onClick={compartilhar}>
            <Icon name="enviar" size={16} /> Enviar
          </Botao>
          <Botao tipo="secundario" className="px-2" onClick={() => window.print()}>
            <Icon name="baixar" size={16} /> PDF
          </Botao>
        </div>
        {aviso && (
          <p role="status" className="nao-imprimir mt-3 text-center text-[13px] text-tema-suave">
            {aviso}
          </p>
        )}
      </>
    );

  return (
    <>
      <TituloTela apoio="um resumo do território para levar à visita, à reunião ou ao evento">Gerar briefing</TituloTela>
      <div className="border-t border-tema-linha">
        <Acordeao titulo="Onde" icone="pino" aberto={aberto === 'onde'} onAlternar={() => setAberto((a) => (a === 'onde' ? null : 'onde'))}>
          <div className="space-y-2">
            <button type="button" onClick={() => abrirBusca((nt) => setT(nt))} className="flex w-full items-center gap-2 rounded-full bg-tema-card px-4 py-3 text-left text-[14px] text-tema-tinta">
              <Icon name="pino" size={18} /> <span className="flex-1">{p.nome}</span> <span className="text-[12px] text-tema-suave">trocar</span>
            </button>
            <Botao tipo="lima" className="w-full" onClick={localizar}>
              <Icon name="recentrar" size={18} /> Usar minha localização
            </Botao>
            {aviso && (
              <p role="status" className="text-[13px] text-tema-suave">
                {aviso}
              </p>
            )}
          </div>
        </Acordeao>
        <Acordeao titulo="Para quê" icone="documento2" aberto={aberto === 'para'} onAlternar={() => setAberto((a) => (a === 'para' ? null : 'para'))}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Objetivo">
            {OBJETIVOS.map((o) => (
              <button key={o} type="button" role="radio" aria-checked={o === objetivo} onClick={() => setObjetivo(o)} className={`rounded-full px-3.5 py-2 text-[13px] ${o === objetivo ? 'bg-navy text-white [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy [[data-theme=escuro]_&]:bg-lima [[data-theme=escuro]_&]:text-[#141414]' : 'bg-tema-card text-tema-tinta'}`}>
                {o}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-[13px] text-tema-suave" htmlFor="pauta">
            Pauta (opcional)
          </label>
          <input id="pauta" value={pauta} onChange={(e) => setPauta(e.target.value)} placeholder="ex.: reunião com a secretaria de desenvolvimento" className="mt-1 w-full rounded-2xl border border-tema-linha bg-tema-card px-4 py-3 text-[14px] text-tema-tinta placeholder:text-tema-apagado" />
        </Acordeao>
        <Acordeao titulo="O que incluir" icone="categoria" aberto={aberto === 'secoes'} onAlternar={() => setAberto((a) => (a === 'secoes' ? null : 'secoes'))}>
          <ul className="space-y-1">
            {SECOES_BRIEFING.map((s) => {
              const on = secoes.includes(s.id);
              return (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl px-1 py-2 text-[14px] text-tema-tinta">
                    <input type="checkbox" checked={on} onChange={() => setSecoes((x) => (on ? x.filter((y) => y !== s.id) : [...x, s.id]))} className="h-5 w-5 accent-[#36BF76]" />
                    {s.rotulo}
                  </label>
                </li>
              );
            })}
          </ul>
        </Acordeao>
      </div>
      <Botao className="mt-6 w-full" onClick={gerar} disabled={!secoes.length}>
        <Icon name="documento2" size={18} /> Gerar briefing de {p.nome}
      </Botao>
    </>
  );
}
