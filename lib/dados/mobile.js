// Versão mobile (auxiliar): dados prontos para as telas, a partir do perfil() de comparar.js.
// Tudo aqui é real; a agenda vem do Calendário Sebrae DITEC 2026 (lib/dados/calendario.js).
import { perfil, resumo, variacao, pctTxt, SETORES_CMP } from './comparar';
import { participacaoVagas } from './indicadores';
import { GRANDES_NUMEROS } from './mpe';
import { UFS, UF_BY_SIGLA, REGIOES } from './ufs';
import INOV from './retratos/inovacao.json';
import EXP from './retratos/exportacoes-mpe-ue-2025.json';
import RF_ABERT from './retratos/rf-mpe-aberturas.json';
import REG from './retratos/registro-2025.json';
import BIO from './retratos/bioeconomia-2026.json';
import { reais } from './producao';
import { periodo, localTexto } from './calendario';

export { perfil, resumo, SETORES_CMP };

const nf0 = (v) => Math.round(v).toLocaleString('pt-BR');
const nf1 = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const curto = (v) => {
  if (v == null || Number.isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e6) return `${nf1(v / 1e6)} mi`;
  if (a >= 1e4) return `${nf0(v / 1e3)} mil`;
  return nf0(v);
};
const pct = (v, c = 1) => (v == null || Number.isNaN(v) ? '—' : `${pctTxt(v, c)}%`);

// ------------------------------------------------------------------ território
export const GENTILICO = {
  AC: 'acriano', AL: 'alagoano', AP: 'amapaense', AM: 'amazonense', BA: 'baiano', CE: 'cearense',
  DF: 'brasiliense', ES: 'capixaba', GO: 'goiano', MA: 'maranhense', MT: 'mato-grossense',
  MS: 'sul-mato-grossense', MG: 'mineiro', PA: 'paraense', PB: 'paraibano', PR: 'paranaense',
  PE: 'pernambucano', PI: 'piauiense', RJ: 'fluminense', RN: 'potiguar', RS: 'gaúcho',
  RO: 'rondoniense', RR: 'roraimense', SC: 'catarinense', SP: 'paulista', SE: 'sergipano', TO: 'tocantinense',
};

const POP_BR = UFS.reduce((a, u) => a + u.pop, 0); // milhões, Censo 2022

export function nomeTerritorio(t) {
  if (t.mun) return t.mun.nome;
  if (t.uf) return UF_BY_SIGLA[t.uf].nome;
  return 'Brasil';
}
export function trilha(t) {
  const r = [{ rotulo: 'Brasil', t: {} }];
  if (t.uf) r.push({ rotulo: UF_BY_SIGLA[t.uf].nome, t: { uf: t.uf } });
  if (t.mun) r.push({ rotulo: t.mun.nome, t: { uf: t.uf, mun: t.mun } });
  return r;
}

/** Destaque do topo da tela Início */
export function heroi(p, t) {
  if (t.mun) return { icone: 'empresas', valor: nf0(p.ativas), rotulo: 'pequenos negócios ativos', fonte: 'Receita Federal · nov. 2026' };
  const pop = t.uf ? UF_BY_SIGLA[t.uf].pop : POP_BR;
  return { icone: 'pessoas', valor: `${nf1(pop)} milhões`, rotulo: 'de habitantes', fonte: 'IBGE · Censo 2022' };
}

/**
 * Cartões numéricos (Início e Comparar). Cada um: id, icone, valor, rotulo, fonte, sobre, num (para comparar).
 */
export function cartoes(p, t) {
  const r = p.rais;
  const rem = r && r.vinculosMPE ? r.massaMPE / r.vinculosMPE : null;
  const v = p.abertura && variacao(p.abertura[2024], p.abertura[2025]);
  const tempoBR = REG.tempoAbertura.br;
  return [
    {
      id: 'ativas', grupo: 'empresas', tom: 'lima', curtoRot: 'Pequenos negócios', icone: 'empresas', num: p.ativas, valor: curto(p.ativas), rotulo: 'pequenos negócios ativos',
      fonte: 'Receita Federal · nov. 2026',
      sobre: 'Estabelecimentos com CNPJ ativo de MEI, microempresas e empresas de pequeno porte. Matriz e filiais contam separadamente.',
    },
    {
      id: 'mei', grupo: 'empresas', tom: 'areia', curtoRot: 'São MEI', icone: 'gravata', num: p.ativas ? (p.porte.mei / p.ativas) * 100 : null, valor: pct(p.ativas ? (p.porte.mei / p.ativas) * 100 : null), rotulo: 'dos pequenos negócios são MEI',
      fonte: 'Receita Federal · nov. 2026',
      sobre: `MEI: ${curto(p.porte.mei)} · Microempresas: ${curto(p.porte.me)} · Pequeno porte: ${curto(p.porte.epp)}.`,
    },
    {
      id: 'vinculos', grupo: 'emprego', tom: 'lavanda', curtoRot: 'Empregados em MPE', icone: 'pessoas', num: r?.vinculosMPE ?? null, valor: curto(r?.vinculosMPE), rotulo: 'empregados com carteira em MPE',
      fonte: 'RAIS 2025 · empresas mercantis',
      sobre: 'Vínculos de emprego com carteira ativos no fim de 2025 nas micro e pequenas empresas. Segue o critério do DataSebrae: só empresas mercantis.',
    },
    {
      id: 'remuneracao', grupo: 'emprego', tom: 'branco', curtoRot: 'Salário médio em MPE', icone: 'moeda', num: rem, valor: rem ? `R$ ${nf0(rem)}` : '—', rotulo: 'remuneração média em MPE',
      fonte: 'RAIS 2025 · empresas mercantis',
      sobre: 'Remuneração média mensal dos empregados com carteira das micro e pequenas empresas, no fim de 2025.',
    },
    {
      id: 'empregos', grupo: 'emprego', tom: 'verde', curtoRot: 'Empregos criados em 2025', icone: 'maleta', num: p.caged?.mpe ?? null, valor: p.caged ? `${p.caged.mpe >= 0 ? '+' : ''}${curto(p.caged.mpe)}` : '—', rotulo: 'empregos criados pelas MPE em 2025',
      fonte: 'Novo CAGED 2025',
      sobre: 'Saldo de empregos com carteira assinada (admissões menos desligamentos) das micro e pequenas empresas em 2025.',
    },
    {
      id: 'atendidas', grupo: 'sebrae', tom: 'lima', curtoRot: 'Empresas atendidas', icone: 'sebrae', num: p.atendidas ?? null, valor: curto(p.atendidas), rotulo: 'empresas atendidas pelo Sebrae',
      fonte: 'Sebrae · Atendimentos 2025',
      sobre: t.uf || t.mun ? 'Clientes pessoa jurídica atendidos pelo Sebrae em 2025, pelo município do cliente.' : 'Clientes pessoa jurídica atendidos pelo Sebrae em 2025, inclusive os atendidos online, sem estado associado.',
    },
    {
      id: 'aberturas', grupo: 'empresas', tom: 'verde', curtoRot: 'Abertas em 2025', icone: 'documento', num: p.abertura?.[2025] ?? null, valor: curto(p.abertura?.[2025]), rotulo: 'pequenos negócios abertos em 2025',
      apoio: v != null ? `${v >= 0 ? '+' : '−'}${pctTxt(Math.abs(v))}% sobre 2024` : null,
      fonte: 'Receita Federal',
      sobre: 'MEI, microempresas e empresas de pequeno porte abertos em 2025, comparados com 2024.',
    },
    {
      id: 'tempo', grupo: 'empresas', tom: 'lavanda', curtoRot: 'Tempo para abrir', icone: 'relogio', num: p.tempo ?? null, valor: p.tempo != null ? `${nf0(p.tempo)} h` : '—', rotulo: 'tempo médio para abrir uma empresa',
      apoio: p.tempo != null && (t.uf || t.mun) ? (p.tempo <= tempoBR ? 'abaixo da média do Brasil' : 'acima da média do Brasil') : null,
      fonte: 'REDESIM 2025',
      sobre: `Tempo médio, em horas, do pedido de viabilidade ao registro, em 2025. No Brasil, ${nf0(tempoBR)} horas.`,
    },
  ];
}

export const GRUPOS_CARTAO = [
  { id: 'destaque', rotulo: 'Destaques', ids: ['ativas', 'empregos', 'atendidas', 'remuneracao'] },
  { id: 'empresas', rotulo: 'Empresas' },
  { id: 'emprego', rotulo: 'Emprego e renda' },
  { id: 'sebrae', rotulo: 'Sebrae' },
];

/** Série de aberturas de pequenos negócios por ano (2026 parcial, até nov.) */
export function serieAberturas(t, base) {
  const anos = [2024, 2025, 2026];
  let v;
  if (t.mun) {
    const a = base?.abertAnos;
    const m = a?.mun.get(t.mun.cod);
    v = anos.map((x) => (m ? m[a.anos.indexOf(x)] ?? null : null));
  } else if (t.uf) v = anos.map((x) => RF_ABERT.uf[t.uf]?.[x] ?? null);
  else v = anos.map((x) => (RF_ABERT.br[x] ? Object.values(RF_ABERT.br[x]).reduce((a, b) => a + b, 0) : null));
  return anos.map((ano, i) => ({ ano, v: v[i], parcial: ano === 2026 }));
}

/** As três caixas do topo da tela Micro e Pequenas Empresas */
export function caixasMPE(p, t) {
  const r = p.rais;
  const vagas = p.caged ? participacaoVagas(p.caged.mpe, p.caged.total) : null;
  const sal = r && r.massa ? (r.massaMPE / r.massa) * 100 : null;
  const emp = r && r.vinculos ? (r.vinculosMPE / r.vinculos) * 100 : null;
  const pib = GRANDES_NUMEROS.find((g) => g.id === 'pib');
  return [
    t.uf || t.mun
      ? { valor: pct(emp, 0), rotulo: 'dos empregados das empresas', fonte: 'RAIS 2025' }
      : { valor: `${pctTxt(pib.valor)}%`, rotulo: 'do PIB do Brasil', fonte: 'Sebrae' },
    { valor: pct(vagas, 0), rotulo: 'das vagas com carteira criadas em 2025', fonte: 'Novo CAGED' },
    { valor: pct(sal, 0), rotulo: 'dos salários pagos pelas empresas', fonte: 'RAIS 2025' },
  ];
}

// ------------------------------------------------------------------ temas (acordeão)
const K = INOV.campos.length;
const iUF = (uf) => EXP.ufs.indexOf(uf);
const expUE = (uf) => (iUF(uf) >= 0 ? EXP.todos.ue[iUF(uf)] : null);
const rankExp = (uf) => {
  const ord = [...EXP.ufs].sort((a, b) => expUE(b) - expUE(a));
  return ord.indexOf(uf) + 1;
};
const IA = GRANDES_NUMEROS.find((g) => g.id === 'ia');
const MULHERES = GRANDES_NUMEROS.find((g) => g.id === 'mulheres');
const EXPORTA = GRANDES_NUMEROS.find((g) => g.id === 'exporta');

/**
 * Cada tema: { id, titulo, linhas: [{rotulo, valor}], texto, fonte, barras?, emPreparacao? }
 */
export function temas(p, t, base) {
  const em = t.mun ? `Em ${p.nome}` : t.uf ? `Em ${p.nome}` : 'No Brasil';
  const lista = [];

  // 1. Setores em crescimento
  {
    const linhas = [];
    let texto;
    let barras;
    if (!t.uf) {
      const a = RF_ABERT.br[2024];
      const b = RF_ABERT.br[2025];
      barras = SETORES_CMP.map((s) => ({ rotulo: s.nome, icone: s.icone, cor: s.cor, v: variacao(a[s.id], b[s.id]) })).sort((x, y) => y.v - x.v);
      barras = barras.map((x) => ({ ...x, txt: `${x.v >= 0 ? '+' : '−'}${pctTxt(Math.abs(x.v))}%` }));
      texto = `Aberturas de pequenos negócios por setor, 2025 sobre 2024. ${barras[0].rotulo} foi o que mais cresceu.`;
    } else {
      barras = [...p.setores].filter((s) => s.n).sort((a, b) => b.ql - a.ql).map((s) => ({ rotulo: s.nome, icone: s.icone, cor: s.cor, v: s.ql, txt: `${nf1(s.ql)}×` }));
      const v = p.abertura && variacao(p.abertura[2024], p.abertura[2025]);
      texto = `Concentração de cada setor em relação ao Brasil (1,0× = igual à média nacional).${v != null ? ` ${em}, as aberturas de pequenos negócios ${v >= 0 ? 'cresceram' : 'caíram'} ${pctTxt(Math.abs(v))}% em 2025.` : ''}`;
    }
    lista.push({ id: 'setores', titulo: 'Setores em crescimento', icone: 'tendencia', barras, linhas, texto, fonte: 'Receita Federal · API do Observatório' });
  }

  // 2. Startups
  {
    const v = p.inov ? p.inov.valor[6] : null;
    const pc = p.inov?.pct?.[6];
    lista.push({
      id: 'startups', titulo: 'Startups', icone: 'robo',
      linhas: [
        { rotulo: 'Pontuação de startups ativas (0 a 100)', valor: v != null ? nf1(v) : '—' },
        ...(t.uf && pc != null ? [{ rotulo: t.mun ? 'Acima de quantos municípios' : 'Acima de quantos estados', valor: `${pc}%` }] : []),
      ],
      texto: 'Startups ativas por 10 mil habitantes, em pontuação de 0 a 100 (100 = maior densidade do país). A maioria dos municípios ainda não tem startup mapeada.',
      fonte: `Sebrae · Indicadores Municipais de Inovação ${INOV.ano}`,
    });
  }

  // 3. Inovação nas MPEs
  {
    const v = p.inov ? p.inov.valor[0] : null;
    const temasInov = INOV.temas.map((tm, i) => ({ rotulo: tm.nome, valor: p.inov ? nf1(p.inov.valor[i + 1]) : '—' }));
    lista.push({
      id: 'inovacao', titulo: 'Inovação nas MPEs', icone: 'explorar',
      linhas: [
        { rotulo: 'Índice municipal de inovação', valor: v != null ? nf1(v) : '—', destaque: true },
        ...(p.inov?.posicao ? [{ rotulo: 'Posição', valor: `${nf0(p.inov.posicao)}º de ${nf0(p.inov.de)} ${p.inov.unidade}` }] : []),
        ...temasInov.slice(0, 4),
      ],
      texto: `Índice de 0 a 100 do Sebrae, que reúne ambiente de negócios, educação, conectividade, patentes, emprego em tecnologia e startups.${t.mun ? '' : ' No estado e no Brasil, é a média dos municípios.'}`,
      fonte: `Sebrae · Indicadores Municipais de Inovação ${INOV.ano}`,
    });
  }

  // 4. Mercado internacional
  {
    const linhas = [];
    let texto;
    if (!t.uf) {
      const tot = EXP.todos.ue.reduce((a, b) => a + b, 0);
      linhas.push({ rotulo: 'Das empresas exportadoras são pequenos negócios', valor: `${pctTxt(EXPORTA.valor)}%`, destaque: true });
      linhas.push({ rotulo: 'Exportado pelas MPE para a União Europeia em 2025', valor: `US$ ${nf0(tot)} mi` });
      texto = `${EXPORTA.explica} Para a União Europeia, os valores são de 2025.`;
    } else {
      const v = expUE(t.uf);
      linhas.push({ rotulo: 'Exportado pelas MPE do estado para a União Europeia em 2025', valor: v != null ? `US$ ${nf1(v)} mi` : '—', destaque: true });
      linhas.push({ rotulo: 'Posição entre os estados', valor: `${rankExp(t.uf)}º de 27` });
      texto = t.mun ? `Dado do estado (${UF_BY_SIGLA[t.uf].nome}); a base não abre as exportações por município.` : 'Valores em dólares (FOB), de MEI, microempresas e empresas de pequeno porte.';
    }
    lista.push({ id: 'internacional', titulo: 'Mercado internacional', icone: 'enviar', linhas, texto, fonte: 'SECEX/MDIC · Comex Stat' });
  }

  // 5. Uso de IA
  lista.push({
    id: 'ia', titulo: 'Uso de IA', icone: 'robo',
    linhas: [{ rotulo: 'Donos de pequenos negócios que já usaram IA', valor: `${IA.valor}%`, destaque: true }],
    texto: `${IA.explica}${t.uf ? ' Dado nacional: a pesquisa não abre o resultado por estado ou município.' : ''}`,
    fonte: 'Pesquisa Sebrae',
  });

  // 6. Empreendedorismo feminino
  {
    const r = p.rais;
    const m = r && r.vinculosMPE && r.mulheresMPE != null ? (r.mulheresMPE / r.vinculosMPE) * 100 : null;
    const linhas = [];
    if (!t.uf) linhas.push({ rotulo: 'Dos donos de negócio são mulheres', valor: `${pctTxt(MULHERES.valor)}%`, destaque: true });
    linhas.push({ rotulo: 'Das vagas com carteira nas MPE são ocupadas por mulheres', valor: pct(m), destaque: !!t.uf });
    lista.push({
      id: 'mulheres', titulo: 'Empreendedorismo feminino', icone: 'mulher', linhas,
      texto: t.uf ? 'Mulheres entre os empregados com carteira das micro e pequenas empresas (empresas mercantis), no fim de 2025.' : `${MULHERES.explica}`,
      fonte: t.uf ? 'RAIS 2025' : 'IBGE · PNAD Contínua · RAIS 2025',
    });
  }

  // 7. Participação de pessoas pretas
  lista.push({
    id: 'pretas', titulo: 'Participação de pessoas pretas', icone: 'pessoas', linhas: [],
    texto: 'Em preparação: a base atual do Observatório não traz a cor ou raça dos donos de pequenos negócios por território.',
    fonte: 'aguardando fonte', emPreparacao: true,
  });

  // 8. Bioeconomia no território
  {
    const linhas = [];
    if (p.bioma) linhas.push({ rotulo: 'Bioma predominante', valor: p.bioma });
    for (const [prod, v] of p.cadeias.slice(0, 3)) linhas.push({ rotulo: prod, valor: reais(v) });
    if (p.extrativas[0]) linhas.push({ rotulo: `Extrativismo: ${p.extrativas[0][0]}`, valor: reais(p.extrativas[0][1]) });
    let bio = null;
    if (t.mun) bio = base?.bioeco?.get(t.mun.cod)?.[0] ?? null;
    else if (t.uf) bio = BIO.uf?.[t.uf]?.media ?? null;
    else bio = BIO.br.media;
    if (typeof bio === 'number') linhas.push({ rotulo: t.uf ? 'Índice de bioeconomia (0 a 1)' : 'Índice de bioeconomia, média da Amazônia Legal', valor: bio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });
    lista.push({
      id: 'bioeconomia', titulo: 'Bioeconomia no território', icone: 'bioma', linhas,
      texto: 'Principais cadeias produtivas pelo valor da produção (agricultura, pecuária e extrativismo).',
      fonte: 'IBGE · PAM, PPM e PEVS 2024',
    });
  }
  return lista;
}

// ------------------------------------------------------------------ localização
/** Município mais próximo de um ponto (lon, lat), pelos centroides da base */
export function municipioMaisProximo(base, lon, lat) {
  let melhor = null;
  let d = Infinity;
  const k = Math.cos((lat * Math.PI) / 180);
  for (const m of base.lista) {
    const dx = (m.lon - lon) * k;
    const dy = m.lat - lat;
    const dd = dx * dx + dy * dy;
    if (dd < d) {
      d = dd;
      melhor = m;
    }
  }
  return melhor;
}

// ------------------------------------------------------------------ briefing
export const OBJETIVOS = ['Visita técnica', 'Reunião com a prefeitura', 'Evento no território', 'Planejamento da regional'];
export const SECOES_BRIEFING = [
  { id: 'retrato', rotulo: 'Retrato do território' },
  { id: 'mpe', rotulo: 'Micro e pequenas empresas' },
  { id: 'setores', rotulo: 'Setores e cadeias produtivas' },
  { id: 'sebrae', rotulo: 'Sebrae no território' },
  { id: 'inovacao', rotulo: 'Inovação' },
  { id: 'agenda', rotulo: 'Agenda DITEC no território' },
];

/** Monta o briefing: { titulo, subtitulo, secoes: [{titulo, itens: [texto]}], atencao, fontes } */
export function montarBriefing(p, t, { objetivo, secoes, agenda = [], pauta = '' }) {
  const out = [];
  const em = t.uf ? `Em ${p.nome}` : 'No Brasil';
  const r = p.rais;
  const tem = (id) => secoes.includes(id);
  if (tem('retrato')) {
    const itens = [];
    if (t.mun) itens.push(`Município ${GENTILICO[t.uf]}${t.mun.cap ? ', capital do estado' : ''}, na região ${REGIOES[UF_BY_SIGLA[t.uf].regiao]}.`);
    else if (t.uf) {
      const u = UF_BY_SIGLA[t.uf];
      itens.push(`Estado da região ${REGIOES[u.regiao]}, com ${nf1(u.pop)} milhões de habitantes (Censo 2022). Capital: ${u.capital}.`);
    }
    if (p.bioma) itens.push(`Bioma predominante: ${p.bioma}.`);
    const res = resumo(p);
    if (res) itens.push(res);
    out.push({ titulo: 'Retrato do território', itens });
  }
  if (tem('mpe')) {
    const itens = [];
    if (r?.vinculosMPE) itens.push(`As MPE empregam ${nf0(r.vinculosMPE)} pessoas com carteira (${pctTxt((r.vinculosMPE / r.vinculos) * 100, 0)}% dos empregados das empresas), com remuneração média de R$ ${nf0(r.massaMPE / r.vinculosMPE)}.`);
    if (p.caged) {
      const pv = participacaoVagas(p.caged.mpe, p.caged.total);
      itens.push(`Em 2025, as MPE tiveram saldo de ${p.caged.mpe >= 0 ? '' : 'menos '}${nf0(Math.abs(p.caged.mpe))} empregos com carteira${pv != null ? `, ${pctTxt(pv, 0)}% das vagas criadas` : ''}.`);
    }
    if (p.tempo != null) itens.push(`Abrir uma empresa leva, em média, ${nf0(p.tempo)} horas (Brasil: ${nf0(REG.tempoAbertura.br)} horas).`);
    out.push({ titulo: 'Micro e pequenas empresas', itens });
  }
  if (tem('setores')) {
    const itens = [];
    const ord = [...p.setores].filter((s) => s.n).sort((a, b) => b.part - a.part);
    if (ord.length) itens.push(`Distribuição dos pequenos negócios: ${ord.map((s) => `${s.nome.toLowerCase()} ${pctTxt(s.part * 100, 0)}%`).join(', ')}.`);
    if (p.destaque && p.destaque.ql >= 1.05) itens.push(`Setor em destaque: ${p.destaque.nome.toLowerCase()}, com ${nf1(p.destaque.ql)} vez${p.destaque.ql >= 2 ? 'es' : ''} a proporção nacional.`);
    if (p.cadeias.length) itens.push(`Cadeias produtivas de referência: ${p.cadeias.slice(0, 3).map(([n, v]) => `${n.toLowerCase()} (${reais(v)})`).join('; ')}.`);
    if (p.listaIG?.length) itens.push(`Indicações geográficas: ${p.listaIG.slice(0, 3).map((i) => i.nome).join('; ')}${p.listaIG.length > 3 ? ` e mais ${p.listaIG.length - 3}` : ''}.`);
    out.push({ titulo: 'Setores e cadeias produtivas', itens });
  }
  if (tem('sebrae')) {
    const itens = [];
    if (p.atendidas) itens.push(`${em}, o Sebrae atendeu ${nf0(p.atendidas)} empresas em 2025${p.ativas ? ` (${pctTxt((p.atendidas / p.ativas) * 100, 0)}% dos pequenos negócios ativos)` : ''}.`);
    if (p.prog) {
      if (t.mun) itens.push(p.prog.presentes.length ? `Programas presentes: ${p.prog.presentes.map((x) => x.nome).join(', ')}.` : 'Nenhum dos programas acompanhados tem registro no município.');
      else {
        const top = [...p.prog.cobertura].sort((a, b) => b.pct - a.pct).slice(0, 3);
        itens.push(`Programas com maior cobertura: ${top.map((x) => `${x.nome} (${pctTxt(x.pct, 0)}% dos municípios)`).join('; ')}.`);
      }
    }
    out.push({ titulo: 'Sebrae no território', itens });
  }
  if (tem('inovacao') && p.inov) {
    const itens = [`Índice municipal de inovação: ${nf1(p.inov.valor[0])} de 100${p.inov.posicao ? `, ${nf0(p.inov.posicao)}º de ${nf0(p.inov.de)} ${p.inov.unidade}` : ''}.`];
    out.push({ titulo: 'Inovação', itens });
  }
  if (tem('agenda')) {
    const itens = agenda.slice(0, 4).map((e) => `${periodo(e)} · ${e.nome} (${localTexto(e)})`);
    out.push({ titulo: 'Agenda DITEC no território', itens: itens.length ? itens : [`Sem eventos da DITEC previstos${t.uf ? ' no estado' : ''} até o fim de 2026.`] });
  }

  // pontos de atenção
  const atencao = [];
  if (p.tempo != null && t.uf && p.tempo > REG.tempoAbertura.br * 1.2) atencao.push('Tempo de abertura de empresas acima da média nacional.');
  const v = p.abertura && variacao(p.abertura[2024], p.abertura[2025]);
  if (v != null && v < 0) atencao.push('Queda nas aberturas de pequenos negócios em 2025.');
  if (p.caged && p.caged.mpe < 0) atencao.push('Saldo negativo de empregos nas MPE em 2025.');
  if (p.inov?.pct && t.uf && p.inov.pct[0] < 35) atencao.push('Índice de inovação abaixo da maioria dos territórios comparáveis.');
  if (p.ativas && p.atendidas != null && t.uf && p.atendidas / p.ativas < 0.03) atencao.push('Baixa cobertura de atendimento do Sebrae.');

  return {
    titulo: `Briefing · ${p.nome}`,
    subtitulo: `${objetivo}${pauta ? ` · ${pauta}` : ''}`,
    data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    secoes: out,
    atencao,
    fontes: 'Receita Federal, RAIS 2025, Novo CAGED, REDESIM, Sebrae (Atendimentos 2025 e Indicadores de Inovação), IBGE (Censo 2022, PAM, PPM e PEVS 2024) e INPI, pela API do Observatório; agenda: Calendário Sebrae DITEC 2026.',
  };
}

export function briefingEmTexto(b) {
  const l = [b.titulo, `${b.subtitulo} · ${b.data}`, ''];
  for (const s of b.secoes) {
    l.push(s.titulo.toUpperCase());
    for (const i of s.itens) l.push(`• ${i}`);
    l.push('');
  }
  if (b.atencao.length) {
    l.push('PONTOS DE ATENÇÃO');
    for (const i of b.atencao) l.push(`• ${i}`);
    l.push('');
  }
  l.push(`Fontes: ${b.fontes}`);
  l.push('Observatório Setorial Territorial · Sebrae');
  return l.join('\n');
}
