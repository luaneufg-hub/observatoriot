'use client';
// Versão mobile (auxiliar) do Observatório: para os gestores nos estados.
// Não altera a versão desktop: é outra rota (#/m) que reaproveita os mesmos dados reais.
// Abas: Início · Calendário · Territórios · Relatórios (briefing) · Comparar.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icon';
import LogoObservatorio from '../LogoObservatorio';
import { carregarMunicipios, buscarMunicipios, normaliza } from '@/lib/dados/municipios';
import { carregarIGs } from '@/lib/dados/ig';
import { carregarProgramas } from '@/lib/dados/sebraeTerritorio';
import { UFS } from '@/lib/dados/ufs';
import { ATUALIZADO_EM } from '@/lib/dados/indicadores';
import { perfil, municipioMaisProximo } from '@/lib/dados/mobile';
import { eventosComMunicipio, proximos, periodo, localTexto } from '@/lib/dados/calendario';
import { Folha, Botao, useGuardado } from './ui';
import { TelaInicio, TelaMPE, TelaTerritorio, TelaComparar } from './TelasDados';
import { TelaCalendario, TelaBriefing } from './TelasAgenda';

const ABAS = [
  { id: 'inicio', rotulo: 'Início', icone: 'inicio' },
  { id: 'territorio', rotulo: 'Territórios', icone: 'pino' },
  { id: 'relatorios', rotulo: 'Relatórios', icone: 'grafico' },
  { id: 'comparar', rotulo: 'Comparar', icone: 'trocar' },
  { id: 'calendario', rotulo: 'Calendário', icone: 'calendario' },
];
const TEMAS = [
  { id: 'claro', rotulo: 'Claro' },
  { id: 'navy', rotulo: 'Navy' },
  { id: 'escuro', rotulo: 'Escuro' },
];

export function irParaAvancada() {
  try {
    window.sessionStorage.setItem('obs-versao', 'avancada');
  } catch {
    window.__obsVersao = 'avancada';
  }
  window.location.hash = '#/';
}

export default function AppMobile() {
  const [tema, setTema] = useGuardado('obs-mobile-tema', 'claro');
  const [entrou, setEntrou] = useState(() => {
    try {
      return window.sessionStorage.getItem('obs-mobile-entrou') === '1';
    } catch {
      return false;
    }
  });
  const [tela, setTela] = useState('inicio');
  const [t, setTRaw] = useGuardado('obs-mobile-territorio', {});
  const [base, setBase] = useState(null);
  const [igs, setIgs] = useState(null);
  const [programas, setProgramas] = useState(null);
  const [menu, setMenu] = useState(false);
  const [notif, setNotif] = useState(false);
  const [busca, setBusca] = useState(null); // callback de escolha
  const [comparar, setComparar] = useState([{}, {}]);
  const [briefingPara, setBriefingPara] = useState(null);
  const conteudo = useRef(null);

  useEffect(() => {
    carregarMunicipios().then(setBase);
    carregarIGs().then(setIgs);
  }, []);
  useEffect(() => {
    if (base) carregarProgramas(base).then(setProgramas);
  }, [base]);

  // o território guardado tem só o código do município: religa ao objeto da base
  const tt = useMemo(() => {
    if (t.mun && base) return { uf: t.mun.uf, mun: base.porCod.get(t.mun.cod) || t.mun };
    return t;
  }, [t, base]);
  const setT = useCallback((nt) => setTRaw(nt.mun ? { uf: nt.mun.uf, mun: { cod: nt.mun.cod, nome: nt.mun.nome, uf: nt.mun.uf } } : nt.uf ? { uf: nt.uf } : {}), [setTRaw]);
  useEffect(() => {
    if (comparar[0].uf == null && comparar[1].uf == null && (tt.uf || tt.mun)) setComparar([tt, tt.mun ? { uf: tt.uf } : {}]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tt.uf, tt.mun?.cod]);

  const extras = useMemo(() => ({ igs, programas }), [igs, programas]);
  const p = useMemo(() => (base ? perfil(tt.mun ? { uf: tt.uf, mun: tt.mun } : { uf: tt.uf }, base, extras) : null), [tt, base, extras]);
  const agenda = useMemo(() => eventosComMunicipio(base), [base]);

  const irPara = useCallback((id) => {
    setTela(id);
    setMenu(false);
    window.scrollTo({ top: 0 });
  }, []);
  const abrirBusca = useCallback((fn) => setBusca(() => fn), []);

  const ctx = { p, t: tt, setT, base, extras, irPara, agenda, comparar, setComparar, abrirBusca, briefingPara, setBriefingPara, onAvancada: irParaAvancada };

  const abaAtiva = tela === 'mpe' ? 'inicio' : tela;

  return (
    <div data-theme={tema} data-app="mobile" className="min-h-screen bg-[#0c0b3a] font-body sm:py-6 [&_*]:[-webkit-tap-highlight-color:transparent]">
      <div className="relative mx-auto flex min-h-screen max-w-[440px] flex-col bg-[var(--app-bg)] sm:min-h-[calc(100vh-48px)] sm:rounded-[36px] sm:[clip-path:inset(0_round_36px)] sm:shadow-flutuante">
        {!entrou ? (
          <Entrada
            onEntrar={() => {
              try {
                window.sessionStorage.setItem('obs-mobile-entrou', '1');
              } catch {
                /* segue em memória */
              }
              setEntrou(true);
            }}
          />
        ) : (
          <>
            <header className="nao-imprimir sticky top-0 z-30 flex h-16 items-center gap-2 bg-[var(--app-bg)]/90 px-4 backdrop-blur">
              <button type="button" onClick={() => setMenu(true)} aria-label="Abrir menu" className="grid h-11 w-11 flex-none place-items-center rounded-full bg-navy text-white [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy [[data-theme=escuro]_&]:bg-lima [[data-theme=escuro]_&]:text-[#141414]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 8h14M5 12h14M5 16h9" />
                </svg>
              </button>
              <button type="button" onClick={() => irPara('inicio')} className="mx-auto flex min-w-0 items-center text-tema-tinta" aria-label="Observatório Setorial Territorial · início">
                <LogoObservatorio className="block h-[10px] w-auto max-w-full" />
              </button>
              <button type="button" onClick={() => abrirBusca((nt) => setT(nt))} aria-label="Buscar estado ou município" className="grid h-11 w-11 flex-none place-items-center rounded-full bg-tema-card text-tema-tinta">
                <Icon name="busca" size={20} />
              </button>
              <button type="button" onClick={() => setNotif(true)} aria-label="Notificações (2 novas)" className="relative grid h-11 w-11 flex-none place-items-center rounded-full bg-tema-card text-tema-tinta">
                <Icon name="notificacao" size={20} />
                <span aria-hidden="true" className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-tema-card bg-[#D81E5B]" />
              </button>
            </header>

            <main ref={conteudo} className="flex-1 px-5 pb-6 pt-3">
              {!p ? (
                <p role="status" className="py-20 text-center text-[14px] text-tema-suave">
                  Carregando os dados do território…
                </p>
              ) : tela === 'inicio' ? (
                <TelaInicio ctx={ctx} />
              ) : tela === 'mpe' ? (
                <TelaMPE ctx={ctx} />
              ) : tela === 'calendario' ? (
                <TelaCalendario ctx={ctx} />
              ) : tela === 'territorio' ? (
                <TelaTerritorio ctx={ctx} />
              ) : tela === 'relatorios' ? (
                <TelaBriefing key={briefingPara?.id || 'b'} ctx={ctx} />
              ) : (
                <TelaComparar ctx={ctx} />
              )}
            </main>

            <nav aria-label="Seções" className="nao-imprimir pointer-events-none sticky bottom-0 z-30 mt-auto flex justify-center px-3 pb-[max(14px,env(safe-area-inset-bottom))]">
              <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-tema-card p-1.5 shadow-flutuante">
                {ABAS.map((a) => {
                  const on = a.id === abaAtiva;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => irPara(a.id)}
                      aria-current={on ? 'page' : undefined}
                      aria-label={a.rotulo}
                      title={a.rotulo}
                      className={`flex h-12 items-center justify-center gap-2 rounded-full transition-all ${on ? 'bg-navy px-4 text-[13px] font-semibold text-white [--icon-2:#C9DF60] [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy [[data-theme=navy]_&]:[--icon-2:#070568] [[data-theme=escuro]_&]:bg-lima [[data-theme=escuro]_&]:text-[#141414] [[data-theme=escuro]_&]:[--icon-2:#141414]' : 'w-12 text-tema-suave hover:bg-tema-linha'}`}
                    >
                      <Icon name={a.icone} size={22} />
                      {on && <span aria-hidden="true">{a.rotulo}</span>}
                    </button>
                  );
                })}
              </div>
            </nav>

            {menu && <Menu tema={tema} setTema={setTema} irPara={irPara} onFechar={() => setMenu(false)} onSair={() => { try { window.sessionStorage.removeItem('obs-mobile-entrou'); } catch { /* */ } setEntrou(false); setMenu(false); }} />}
            <Notificacoes aberta={notif} onFechar={() => setNotif(false)} agenda={agenda} irPara={irPara} />
            <Busca aberta={!!busca} base={base} onFechar={() => setBusca(null)} onEscolher={(nt) => { busca?.(nt); setBusca(null); }} />
          </>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ entrada
function Entrada({ onEntrar }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-navy px-8 text-center text-white sm:min-h-0">
      <LogoObservatorio className="block h-[15px] w-auto" />
      <h1 className="mt-6 font-display text-[28px] font-extrabold leading-tight">O território na palma da mão</h1>
      <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-[#c3c5ec]">Dados do território, atuação do Sebrae, agenda de eventos e briefings para quem está no campo.</p>
      <Botao tipo="lima" className="mt-10 w-full max-w-[300px]" onClick={onEntrar}>
        Entrar
      </Botao>
      <p className="mt-4 max-w-[300px] text-[12px] leading-snug text-[#c3c5ec]">Protótipo: acesso livre. Na versão final, a entrada será pelo login corporativo do Sebrae.</p>
    </div>
  );
}

// ------------------------------------------------------------------ menu lateral
function Menu({ tema, setTema, irPara, onFechar, onSair }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    const k = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onFechar]);
  const item = 'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[15px] text-tema-tinta hover:bg-tema-linha';
  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="relative h-full w-full max-w-[440px]">
        <button type="button" aria-label="Fechar menu" onClick={onFechar} className="absolute inset-0 bg-[#070568]/45" />
        <aside ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Menu" className="anima-gaveta relative flex h-full w-[82%] max-w-[340px] flex-col bg-tema-card p-5 outline-none">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-display text-[20px] font-extrabold text-tema-tinta">Menu</span>
            <button type="button" onClick={onFechar} aria-label="Fechar menu" className="grid h-10 w-10 place-items-center rounded-full text-tema-tinta hover:bg-tema-linha">
              <Icon name="fechar" size={20} />
            </button>
          </div>
          <nav aria-label="Seções" className="space-y-0.5">
            {[...ABAS.slice(0, 1), { id: 'mpe', rotulo: 'Micro e pequenas empresas', icone: 'empresas' }, ...ABAS.slice(1)].map((a) => (
              <button key={a.id} type="button" className={item} onClick={() => irPara(a.id)}>
                <Icon name={a.icone} size={20} /> {a.rotulo}
              </button>
            ))}
          </nav>
          <div className="my-4 h-px bg-tema-linha" />
          <p className="mb-2 px-3 text-[12px] font-bold uppercase tracking-wide text-tema-suave">Aparência</p>
          <div role="radiogroup" aria-label="Tema" className="mx-3 grid grid-cols-3 gap-1 rounded-full bg-tema-linha p-1">
            {TEMAS.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={tema === x.id} onClick={() => setTema(x.id)} className={`rounded-full py-2 text-[13px] ${tema === x.id ? 'bg-tema-card font-semibold text-tema-tinta shadow-card' : 'text-tema-suave'}`}>
                {x.rotulo}
              </button>
            ))}
          </div>
          <div className="my-4 h-px bg-tema-linha" />
          <button type="button" className={item} onClick={irParaAvancada}>
            <Icon name="expandir" size={20} /> Visualizar versão avançada
          </button>
          <a className={item} href="https://observatorio.sebrae.com.br/about#o-projeto" target="_blank" rel="noopener noreferrer">
            <Icon name="info" size={20} /> Sobre o Observatório<span className="sr-only"> (abre em nova aba)</span>
          </a>
          <button type="button" className={`${item} mt-auto`} onClick={onSair}>
            <Icon name="sair" size={20} /> Sair
          </button>
        </aside>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ notificações
function Notificacoes({ aberta, onFechar, agenda, irPara }) {
  const [prox] = proximos(1, agenda);
  return (
    <Folha aberta={aberta} onFechar={onFechar} titulo="Notificações">
      <ul className="space-y-3">
        <li className="rounded-2xl bg-[var(--tom-verde)] p-4">
          <p className="text-[12px] font-bold uppercase tracking-wide text-tema-suave">Dados atualizados</p>
          <p className="mt-1 text-[14px] leading-snug text-tema-tinta">RAIS 2025, Novo CAGED e Atendimentos Sebrae 2025 já estão no app ({ATUALIZADO_EM}).</p>
        </li>
        {prox && (
          <li>
            <button type="button" onClick={() => { onFechar(); irPara('calendario'); }} className="w-full rounded-2xl bg-[var(--tom-lavanda)] p-4 text-left">
              <span className="text-[12px] font-bold uppercase tracking-wide text-tema-suave">Próximo evento DITEC</span>
              <span className="mt-1 block text-[14px] leading-snug text-tema-tinta">
                {prox.nome}: {periodo(prox)}, {localTexto(prox)}.
              </span>
            </button>
          </li>
        )}
      </ul>
    </Folha>
  );
}

// ------------------------------------------------------------------ busca
function Busca({ aberta, base, onFechar, onEscolher }) {
  const [q, setQ] = useState('');
  const [aviso, setAviso] = useState('');
  useEffect(() => {
    if (aberta) {
      setQ('');
      setAviso('');
    }
  }, [aberta]);
  const n = normaliza(q.trim());
  const ufs = n ? UFS.filter((u) => normaliza(u.nome).includes(n) || u.sigla.toLowerCase() === n) : [];
  const muns = base && n.length >= 2 ? buscarMunicipios(base, q.trim(), 8) : [];
  const localizar = () => {
    setAviso('Procurando sua localização…');
    if (!navigator.geolocation || !base) return setAviso('Não foi possível obter a localização neste navegador.');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const m = municipioMaisProximo(base, pos.coords.longitude, pos.coords.latitude);
        if (m) onEscolher({ uf: m.uf, mun: m });
      },
      () => setAviso('Não foi possível obter a localização (permissão negada ou indisponível).'),
      { timeout: 10000 },
    );
  };
  const linha = 'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[15px] text-tema-tinta hover:bg-tema-linha';
  return (
    <Folha aberta={aberta} onFechar={onFechar} titulo="Escolher território" alta>
      <label htmlFor="busca-mobile" className="sr-only">
        Estado ou município
      </label>
      <div className="flex h-12 items-center gap-3 rounded-full border border-tema-linha bg-tema-bg px-4">
        <Icon name="busca" size={20} className="text-tema-suave" />
        <input id="busca-mobile" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="escolha um estado ou município" autoComplete="off" className="min-w-0 flex-1 bg-transparent text-[15px] text-tema-tinta outline-none placeholder:text-tema-apagado" />
      </div>
      <button type="button" onClick={localizar} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-lima px-4 py-3 text-left text-[15px] font-semibold text-navy">
        <Icon name="recentrar" size={20} /> Usar minha localização
      </button>
      {aviso && (
        <p role="status" className="mt-2 text-[13px] text-tema-suave">
          {aviso}
        </p>
      )}
      <ul className="mt-3 space-y-0.5" aria-label="Resultados">
        {!n && (
          <li>
            <button type="button" className={linha} onClick={() => onEscolher({})}>
              <Icon name="localizacao" size={20} /> Brasil
            </button>
          </li>
        )}
        {(n ? ufs : UFS).map((u) => (
          <li key={u.sigla}>
            <button type="button" className={linha} onClick={() => onEscolher({ uf: u.sigla })}>
              <span className="grid h-6 w-8 place-items-center rounded-md bg-tema-linha text-[11px] font-bold">{u.sigla}</span> {u.nome}
            </button>
          </li>
        ))}
        {muns.map((m) => (
          <li key={m.cod}>
            <button type="button" className={linha} onClick={() => onEscolher({ uf: m.uf, mun: m })}>
              <Icon name="pino" size={20} /> {m.nome} <span className="text-[13px] text-tema-suave">· {m.uf}</span>
            </button>
          </li>
        ))}
        {n && !ufs.length && !muns.length && <li className="px-3 py-3 text-[14px] text-tema-suave">Nenhum território encontrado.</li>}
      </ul>
    </Folha>
  );
}
