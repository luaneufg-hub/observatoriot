// Calendário de eventos da DITEC 2026 (planilha da equipe, nov. 2026; scripts/retrato-calendario-ditec.py).
// Usado pela versão desktop (#/calendario) e pela versão mobile (aba Calendário).
import CAL from './retratos/calendario-ditec-2026.json';
import { normaliza } from './municipios';
import { UF_BY_SIGLA } from './ufs';

export const FONTE_CALENDARIO = CAL.fonte;

// unidades da DITEC, nas cores do kit
export const CATEGORIAS_CAL = [
  { id: 'UCOMP', rotulo: 'Competitividade', cor: '#36BF76' },
  { id: 'UAM', rotulo: 'Acesso a Mercados', cor: '#E8693F' },
  { id: 'INOV', rotulo: 'Inovação', cor: '#A093D1' },
  { id: 'UDT', rotulo: 'Desenvolvimento Territorial', cor: '#DF57B1' },
  { id: 'UEE', rotulo: 'Educação Empreendedora', cor: '#C9DF60' },
  { id: 'UGS', rotulo: 'Gestão de Soluções', cor: '#BDBAB3' },
  { id: 'URC', rotulo: 'Relacionamento com o Cliente', cor: '#2A4FDA' },
  { id: 'GERAL', rotulo: 'Dirigentes, parceiros e público geral', curto: 'Público geral', cor: '#753335' },
];
export const CAT_BY_ID = Object.fromEntries(CATEGORIAS_CAL.map((c) => [c.id, c]));
/** fundo suave da categoria (cor do kit com transparência) */
export const tomCat = (id, a = '2E') => `${CAT_BY_ID[id]?.cor || '#BDBAB3'}${a}`;

const data = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const chaveDia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const EVENTOS = CAL.eventos.map((e) => {
  const inicio = data(e.inicio);
  const fim = e.soMes ? new Date(inicio.getFullYear(), e.soMes, 0) : data(e.fim);
  return { ...e, dInicio: inicio, dFim: fim, dias: Math.round((fim - inicio) / 864e5) + 1 };
});

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const nomeMes = (m) => MES_LONGO[m];

/** "09 a 13 de nov.", "16 de nov.", "novembro (data a definir)" */
export function periodo(e) {
  if (e.soMes) return `${MES_LONGO[e.soMes - 1]} (dia a definir)`;
  const a = e.dInicio.getDate();
  const b = e.dFim.getDate();
  const m = MES[e.dFim.getMonth()];
  return a === b ? `${a} de ${m}.` : `${a} a ${b} de ${m}.`;
}
export const localTexto = (e) => (e.cidade ? `${e.cidade} · ${e.uf}` : e.uf ? UF_BY_SIGLA[e.uf].nome : 'local a definir');

/** O evento acontece no dia d? (eventos só com o mês aparecem no dia 1) */
export function noDia(e, d) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (e.soMes) return t === e.dInicio.getTime();
  return t >= e.dInicio.getTime() && t <= e.dFim.getTime();
}
export const doDia = (d, lista = EVENTOS) => lista.filter((e) => noDia(e, d));
export const doMes = (ano, mes, lista = EVENTOS) =>
  lista.filter((e) => e.dInicio <= new Date(ano, mes + 1, 0) && e.dFim >= new Date(ano, mes, 1));

/** Próximos eventos a partir de hoje (inclui os que estão acontecendo) */
export function proximos(n = 5, lista = EVENTOS, hoje = new Date()) {
  const h = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return lista.filter((e) => e.dFim >= h).slice(0, n);
}
export const acontecendo = (e, hoje = new Date()) => noDia(e, hoje) && !e.soMes;

// nomes da planilha que diferem do nome oficial do município (IBGE)
// "Cariri - PB" é uma região (Cariri paraibano), não um município: o evento fica ligado só ao estado
const NOME_OFICIAL = { 'GO|alto paraiso': 'alto paraiso de goias' };

/** Liga cada evento ao município da base (pelo nome da cidade e UF), para mapa e briefing */
let ligados = null;
export function eventosComMunicipio(base) {
  if (!base) return EVENTOS;
  if (ligados) return ligados;
  ligados = EVENTOS.map((e) => {
    if (!e.cidade || !e.uf) return e;
    const n = normaliza(e.cidade);
    const alvo = NOME_OFICIAL[`${e.uf}|${n}`] || n;
    const mun = (base.porUF[e.uf] || []).find((m) => normaliza(m.nome) === alvo);
    return mun ? { ...e, mun } : e;
  });
  return ligados;
}

/** Eventos de um recorte (Brasil: todos; estado: os do estado; município: os do município e os do estado) */
export function doTerritorio(lista, t) {
  if (!t.uf) return lista;
  return lista.filter((e) => e.uf === t.uf);
}

/**
 * Link para adicionar o evento ao Google Agenda (evento de dia inteiro; a data final do Google é exclusiva).
 * Eventos só com o mês (dia a definir) não têm link.
 */
export function linkGoogleAgenda(e) {
  if (e.soMes) return null;
  const f = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const fim = new Date(e.dFim);
  fim.setDate(fim.getDate() + 1);
  const detalhes = [
    `${e.unidade}${e.categoria !== 'GERAL' ? ` (${e.categoria})` : ''}`,
    e.publico ? `Público: ${e.publico}` : null,
    'Calendário Sebrae DITEC 2026 · Observatório Setorial Territorial',
  ].filter(Boolean).join('\n');
  const local = e.cidade ? `${e.cidade}, ${e.uf}` : e.uf ? UF_BY_SIGLA[e.uf].nome : '';
  const q = new URLSearchParams({ action: 'TEMPLATE', text: e.nome, dates: `${f(e.dInicio)}/${f(fim)}`, details: detalhes, ...(local ? { location: local } : {}), ctz: 'America/Sao_Paulo' });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

// ------------------------------------------------------------------ outras agendas
const dataISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fimExclusivo = (e) => {
  const f = new Date(e.dFim);
  f.setDate(f.getDate() + 1);
  return f;
};
const descricao = (e) =>
  [`${e.unidade}${e.categoria !== 'GERAL' ? ` (${e.categoria})` : ''}`, e.publico ? `Público: ${e.publico}` : null, 'Calendário Sebrae DITEC 2026 · Observatório Setorial Territorial']
    .filter(Boolean)
    .join('\n');
const localAgenda = (e) => (e.cidade ? `${e.cidade}, ${e.uf}` : e.uf ? UF_BY_SIGLA[e.uf].nome : '');

/** Outlook na web (Microsoft 365): abre o formulário de novo evento preenchido */
export function linkOutlook(e) {
  if (e.soMes) return null;
  const q = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: e.nome, startdt: dataISO(e.dInicio), enddt: dataISO(fimExclusivo(e)), allday: 'true', body: descricao(e), ...(localAgenda(e) ? { location: localAgenda(e) } : {}) });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${q.toString()}`;
}

/** Arquivo .ics (Outlook no computador, Apple Calendar e outros), como endereço data: para baixar */
export function linkICS(e) {
  if (e.soMes) return null;
  const f = (d) => dataISO(d).replaceAll('-', '');
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
  const agora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sebrae//Observatorio Setorial Territorial//PT-BR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:ditec-2026-${e.id}@observatorio.sebrae.com.br`,
    `DTSTAMP:${agora}`,
    `DTSTART;VALUE=DATE:${f(e.dInicio)}`,
    `DTEND;VALUE=DATE:${f(fimExclusivo(e))}`,
    `SUMMARY:${esc(e.nome)}`,
    ...(localAgenda(e) ? [`LOCATION:${esc(localAgenda(e))}`] : []),
    `DESCRIPTION:${esc(descricao(e))}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(linhas.join('\r\n'))}`;
}
export const nomeArquivoICS = (e) => `${e.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60)}.ics`;
