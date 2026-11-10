// Indicadores por UF.
// ⚠️ Os VALORES abaixo são ILUSTRATIVOS (gerados de forma determinística a partir
// da população de cada UF) e servem para validar layout e interação.
// Para usar dados reais, substitua `DADOS` por um JSON no mesmo formato:
//   { "SP": { "ativas": 6200000, "setor_agro": 180000, ... }, ... }
// As fontes indicadas em cada indicador seguem a página "Fontes de dados" do Observatório.

import { UFS } from './ufs';
import { BIOMAS, biomaPredominante } from './biomas';
import RF_UF from './retratos/rf-mpe-ativas-uf.json';
import RF_SETOR from './retratos/rf-mpe-setor-uf.json';
import RF_ABERT from './retratos/rf-mpe-aberturas.json';
import CAGED from './retratos/caged-saldo.json';
import ATEND from './retratos/sebrae-atendimentos.json';
import RAIS from './retratos/rais-2025.json';
import REG from './retratos/registro-2025.json';
import BIO from './retratos/bioeconomia-2026.json';
import INOV from './retratos/inovacao.json';
import PRODUCAO from './retratos/producao-2024.json';

// ---------------------------------------------------------------------------
// Grupos (mesma ordem do protótipo no Figma)
export const GRUPOS = [
  { id: 'setores', rotulo: 'Setores Econômicos', icone: 'setores' },
  { id: 'sebrae', rotulo: 'Sebrae nos territórios', icone: 'sebrae' },
  { id: 'localizacao', rotulo: 'Localização', icone: 'localizacao' },
  { id: 'biomas', rotulo: 'Biomas', icone: 'bioma' },
  { id: 'empresa', rotulo: 'Característica da empresa', icone: 'empresa' },
  { id: 'registro', rotulo: 'Situação e registro', icone: 'registro' },
  { id: 'inovacao', rotulo: 'Inovação', icone: 'robo' },
];

const F = {
  rfb: 'RFB – Receita Federal do Brasil · Estabelecimentos',
  rfbApi: 'RFB – Receita Federal do Brasil · Estabelecimentos ativos (API do Observatório, nov. 2026)',
  caged: 'Novo CAGED · Movimentação 2025 (API do Observatório)',
  sebraeApi: 'Sebrae – Atendimentos 2025 (API do Observatório)',
  raisApi: 'RAIS 2025 · vínculos ativos em 31/12 (API do Observatório)',
  rais: 'RAIS – Relação Anual de Informações Sociais · Vínculos',
  sebrae: 'Sebrae – Atendimentos 2026',
  ibge: 'IBGE – Censo Demográfico 2022',
  redesim: 'REDESIM – Tempo de Abertura',
  bio: 'Sebrae Bioeconomia – Municípios 2026',
  inov: `Sebrae – Indicadores Municipais de Inovação ${INOV.ano} (API do Observatório)`,
  biomas: 'IBGE – Biomas do Brasil',
};

// atendimentos sem UF na base = atendimentos online (sem estado associado)
const ATEND_ONLINE_MI = Math.round((ATEND.br[2025].atendimentos - Object.values(ATEND.uf).reduce((a, u) => a + (u[2025]?.atendimentos || 0), 0)) / 1e6);

export const INDICADORES = [
  // Setores econômicos
  { id: 'setor_agro', grupo: 'setores', rotulo: 'Agro', titulo: 'Pequenos negócios do agro', unidade: 'n', fonte: F.rfbApi, icone: 'agro', real: 'mun', descricao: 'Pequenos negócios ativos (MEI, ME e EPP) com atividade principal na agropecuária (Setor SEBRAE).' },
  { id: 'setor_comercio', grupo: 'setores', rotulo: 'Comércio', titulo: 'Pequenos negócios do comércio', unidade: 'n', fonte: F.rfbApi, icone: 'comercio', real: 'mun', descricao: 'Pequenos negócios ativos (MEI, ME e EPP) com atividade principal no comércio varejista e atacadista.' },
  { id: 'setor_industria', grupo: 'setores', rotulo: 'Indústria', titulo: 'Pequenos negócios da indústria', unidade: 'n', fonte: F.rfbApi, icone: 'industria', real: 'mun', descricao: 'Pequenos negócios ativos (MEI, ME e EPP) da indústria de transformação, extrativa, de utilidade pública e da construção.' },
  { id: 'setor_servicos', grupo: 'setores', rotulo: 'Serviços', titulo: 'Pequenos negócios de serviços', unidade: 'n', fonte: F.rfbApi, icone: 'servicos', real: 'mun', descricao: 'Pequenos negócios ativos (MEI, ME e EPP) com atividade principal em serviços.' },
  { id: 'setor_admpub', grupo: 'setores', rotulo: 'Adm. pública', titulo: 'Adm. pública', unidade: 'n', fonte: F.rfbApi, icone: 'admpub', real: 'mun', descricao: 'Pequenos negócios ativos (MEI, ME e EPP) classificados em administração pública, defesa e seguridade. São poucos: a maior parte dos órgãos públicos não se enquadra como pequeno negócio.' },
  { id: 'empregos', grupo: 'setores', rotulo: 'Empregos criados em MPE', titulo: 'Empregos criados pelas MPE em 2025', unidade: 'n', fonte: F.caged, icone: 'pessoas', real: 'mun', descricao: 'Saldo de empregos com carteira assinada (admissões menos desligamentos) das micro e pequenas empresas em 2025. Pode ser negativo, quando houve mais desligamentos que admissões.' },
  { id: 'vinculos_mpe', grupo: 'setores', rotulo: 'Empregados em MPE', titulo: 'Empregados com carteira em MPE', unidade: 'n', fonte: F.raisApi, icone: 'pessoas', real: 'mun', descricao: 'Vínculos de emprego com carteira ativos no fim de 2025 nas micro e pequenas empresas (RAIS).' },
  { id: 'vagas_mpe', grupo: 'setores', rotulo: 'MPE nas vagas criadas', titulo: 'Participação das MPE nas vagas criadas em 2025', unidade: '%', fonte: F.caged, icone: 'pessoas', real: 'mun', brasil: participacaoVagasBrasil(), descricao: 'Saldo de empregos das MPE ÷ saldo total de empregos com carteira em 2025. Acima de 100%: as MPE criaram mais vagas que o total, porque as demais empresas fecharam vagas. Fica sem valor onde o saldo total foi menor que 50 vagas (a conta fica instável) ou o das MPE foi negativo.' },

  // Sebrae nos territórios
  { id: 'atendimentos', grupo: 'sebrae', rotulo: 'Atendimentos', titulo: 'Atendimentos Sebrae em 2025', unidade: 'n', fonte: F.sebraeApi, icone: 'sebrae', real: 'mun', brasil: ATEND.br[2025].atendimentos, seloBrasil: ['Brasil', `total nacional · ${ATEND_ONLINE_MI} mi online`], descricao: `Atendimentos realizados pelo Sebrae em 2025, pelo município do cliente. O total do Brasil (${(ATEND.br[2025].atendimentos / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} milhões, recorde da série) inclui cerca de ${ATEND_ONLINE_MI} milhões de atendimentos online, que não têm estado associado; por isso a soma dos estados fica abaixo do total.` },
  { id: 'atend_por_mil', grupo: 'sebrae', rotulo: 'Cobertura do atendimento', titulo: 'Empresas atendidas pelo Sebrae em 2025', unidade: '%', fonte: `${F.sebraeApi} · ${F.rfbApi}`, icone: 'rede', real: 'mun', brasil: (ATEND.br[2025].clientesPJ / RF_UF.totalBrasil) * 100, descricao: 'Empresas (clientes pessoa jurídica) atendidas pelo Sebrae em 2025 ÷ pequenos negócios ativos. Indica o alcance do Sebrae no lugar. Em alguns municípios pequenos passa de 100%, porque a empresa atendida nem sempre é um pequeno negócio ativo registrado ali; uma empresa atendida em mais de um município conta em cada um.' },
  { id: 'pontos', grupo: 'sebrae', rotulo: 'Pontos de atendimento', titulo: 'Pontos de atendimento Sebrae', unidade: 'n', fonte: F.sebrae, icone: 'predio', descricao: 'Agências, escritórios regionais e salas do empreendedor.' },

  // Localização
  { id: 'interior', grupo: 'localizacao', rotulo: 'Interiorização', titulo: 'Pequenos negócios fora da capital', unidade: '%', fonte: F.rfbApi, icone: 'localizacao', real: 'uf', descricao: 'Participação dos pequenos negócios ativos (MEI, ME e EPP) sediados fora da capital do estado.' },
  { id: 'densidade', grupo: 'localizacao', rotulo: 'Pequenos negócios por mil hab.', titulo: 'Densidade empresarial', unidade: 'x', fonte: `${F.rfbApi} · ${F.ibge}`, icone: 'rede', real: 'uf', descricao: 'Pequenos negócios ativos (MEI, ME e EPP) a cada mil habitantes.' },

  // Biomas
  { id: 'bioma_predominante', grupo: 'biomas', rotulo: 'Bioma predominante', titulo: 'Bioma predominante', unidade: 'cat', fonte: F.biomas, icone: 'bioma', descricao: 'Bioma com maior participação no território da UF.' },
  { id: 'bioeconomia', grupo: 'biomas', rotulo: 'Potencial de bioeconomia', titulo: 'Potencial de bioeconomia (Amazônia Legal)', unidade: 'idx', fonte: 'Sebrae Bioeconomia – Municípios 2026 (API do Observatório)', icone: 'bioma', real: 'mun', brasil: BIO.br.media, referencia: 'à média da Amazônia Legal', seloBrasil: ['Média', 'Amazônia Legal'], descricao: `Índice de 0 a 1 do Sebrae Bioeconomia, que sintetiza maturidade ecológica, econômica e institucional. Calculado para ${BIO.municipios} municípios da Amazônia Legal; os demais ficam sem valor. No estado, é a média dos municípios avaliados.` },
  ...BIOMAS.map((b) => ({
    id: `bioma_${b.id}`,
    grupo: 'biomas',
    rotulo: b.nome,
    titulo: `Território em ${b.nome}`,
    unidade: '%',
    fonte: F.biomas,
    icone: 'bioma',
    biomaId: b.id,
    descricao: `Parte do território da UF coberta pelo bioma ${b.nome}. Principal cadeia produtiva no bioma (IBGE 2024): ${PRODUCAO.bioma[b.id]?.top?.[0]?.[0] ?? '—'}.`,
  })),

  // Característica da empresa
  { id: 'mei', grupo: 'empresa', rotulo: 'MEI', titulo: 'Microempreendedor Individual', unidade: '%', fonte: F.rfbApi, icone: 'gravata', real: 'mun', descricao: 'Participação de MEI entre os pequenos negócios ativos (MEI, ME e EPP).' },
  { id: 'me', grupo: 'empresa', rotulo: 'Microempresa', titulo: 'Microempresa (ME)', unidade: '%', fonte: F.rfbApi, icone: 'maleta', real: 'mun', descricao: 'Participação de microempresas entre os pequenos negócios ativos (MEI, ME e EPP).' },
  { id: 'epp', grupo: 'empresa', rotulo: 'Pequeno porte', titulo: 'Empresa de Pequeno Porte (EPP)', unidade: '%', fonte: F.rfbApi, icone: 'empresas', real: 'mun', descricao: 'Participação de empresas de pequeno porte entre os pequenos negócios ativos (MEI, ME e EPP).' },
  { id: 'remuneracao', grupo: 'empresa', rotulo: 'Remuneração média', titulo: 'Remuneração média em MPE', unidade: 'R$', fonte: F.raisApi, icone: 'moeda', real: 'mun', brasil: RAIS.br.massaMPE / RAIS.br.vinculosMPE, descricao: 'Remuneração média mensal dos empregados com carteira das micro e pequenas empresas (vínculos ativos no fim de 2025).' },

  // Situação e registro
  { id: 'ativas', grupo: 'registro', rotulo: 'Pequenos negócios ativos', titulo: 'Pequenos negócios ativos', unidade: 'n', fonte: F.rfbApi, icone: 'empresas', real: 'mun', descricao: 'Estabelecimentos com situação cadastral ativa de MEI, microempresas e empresas de pequeno porte. Matriz e filiais contam separadamente.' },
  { id: 'aberturas', grupo: 'registro', rotulo: 'Aberturas em 2026', titulo: 'Pequenos negócios abertos em 2026', unidade: 'n', fonte: F.rfbApi, icone: 'documento', real: 'mun', descricao: 'MEI, microempresas e empresas de pequeno porte abertos em 2026, até a última atualização da base (nov. 2026). Conta também os que já fecharam.' },
  { id: 'tempo_abertura', grupo: 'registro', rotulo: 'Tempo de abertura', titulo: 'Tempo médio de abertura em 2025', unidade: 'h', fonte: 'REDESIM – Tempo de Abertura 2025 (API do Observatório)', icone: 'relogio', real: 'mun', brasil: REG.tempoAbertura.br, menorMelhor: true, descricao: `Tempo médio, em horas, para abrir uma empresa em 2025, do pedido de viabilidade ao registro. No Brasil, ${Math.round(REG.tempoAbertura.br)} horas (cerca de ${(REG.tempoAbertura.br / 24).toFixed(1).replace('.', ',')} dias). Municípios sem aberturas registradas na REDESIM ficam sem valor.` },
  { id: 'baixas', grupo: 'registro', rotulo: 'Taxa de baixa', titulo: 'Taxa de baixa de pequenos negócios em 2025', unidade: '%', fonte: F.rfbApi, icone: 'documento', real: 'mun', brasil: (REG.baixas.br / RF_UF.totalBrasil) * 100, menorMelhor: true, descricao: 'Pequenos negócios (MEI, ME e EPP) baixados em 2025 ÷ pequenos negócios ativos. Inclui as baixas de MEI feitas de ofício pela Receita.' },
  // Inovação (Sebrae · Indicadores Municipais de Inovação)
  { id: 'inovacao', grupo: 'inovacao', rotulo: 'Índice de inovação', titulo: 'Índice municipal de inovação', unidade: 'pts', fonte: F.inov, icone: 'robo', real: 'mun', brasil: INOV.br.valor[0], referencia: 'à média dos municípios', seloBrasil: ['Média', 'dos municípios'], descricao: `Indicador geral de inovação do Sebrae, de 0 a 100, que reúne ${INOV.temas.reduce((a, t) => a + t.medidas.length, 0)} componentes: ambiente de negócios, educação, conectividade, patentes e marcas, emprego em tecnologia, startups e empresas de base tecnológica. Calculado por município; no estado e no Brasil, é a média simples dos municípios.` },
  { id: 'startups_ativas', grupo: 'inovacao', rotulo: 'Startups', titulo: 'Startups ativas (pontuação)', unidade: 'pts', fonte: F.inov, icone: 'robo', real: 'mun', brasil: INOV.br.valor[6], referencia: 'à média dos municípios', seloBrasil: ['Média', 'dos municípios'], descricao: 'Startups ativas por 10 mil habitantes, em pontuação de 0 a 100 (100 = o município com a maior densidade do país). A maioria dos municípios não tem startup mapeada e fica com zero.' },
  { id: 'ebts', grupo: 'inovacao', rotulo: 'Empresas de base tecnológica', titulo: 'Empresas de base tecnológica (pontuação)', unidade: 'pts', fonte: F.inov, icone: 'robo', real: 'mun', brasil: INOV.br.valor[7], referencia: 'à média dos municípios', seloBrasil: ['Média', 'dos municípios'], descricao: 'Densidade de empresas de base tecnológica (EBTs) por 10 mil habitantes, em pontuação de 0 a 100 (100 = o município com a maior densidade do país). É o dado mais próximo de deeptechs na base do Observatório, mas não é a mesma coisa: EBT é qualquer empresa cuja atividade se apoia em tecnologia.' },
];

export const INDICADOR_BY_ID = Object.fromEntries(INDICADORES.map((i) => [i.id, i]));

// ---------------------------------------------------------------------------
// Geração determinística dos valores ilustrativos
function rng(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (r, a, b) => a + r() * (b - a);

const PERFIL_REGIAO = {
  N: { perCapita: 0.075, agro: 0.1, ind: 0.08, rem: 2350 },
  NE: { perCapita: 0.082, agro: 0.06, ind: 0.08, rem: 2250 },
  CO: { perCapita: 0.125, agro: 0.11, ind: 0.09, rem: 2900 },
  SE: { perCapita: 0.14, agro: 0.03, ind: 0.1, rem: 3250 },
  S: { perCapita: 0.142, agro: 0.06, ind: 0.13, rem: 3150 },
};

function gerar(uf) {
  const r = rng(uf.sigla + '-observatorio');
  const p = PERFIL_REGIAO[uf.regiao];
  const ativas = Math.round(uf.pop * 1e6 * p.perCapita * between(r, 0.9, 1.12));

  const agro = p.agro * between(r, 0.75, 1.3);
  const ind = p.ind * between(r, 0.85, 1.2);
  const com = between(r, 0.3, 0.36);
  const adm = between(r, 0.004, 0.009);
  const serv = 1 - agro - ind - com - adm;

  const atendimentos = Math.round(ativas * between(r, 0.26, 0.46));
  const capital = uf.sigla === 'DF' ? 100 : between(r, 18, ['AP', 'RR', 'AM', 'AC'].includes(uf.sigla) ? 72 : 45);
  const mei = between(r, 48, 60);
  const me = between(r, 27, 34);
  const epp = between(r, 4.5, 8);
  const amaz = uf.biomas.amazonia || 0;

  const d = {
    ativas,
    setor_agro: Math.round(ativas * agro),
    setor_comercio: Math.round(ativas * com),
    setor_industria: Math.round(ativas * ind),
    setor_servicos: Math.round(ativas * serv),
    setor_admpub: Math.round(ativas * adm),
    empregos: Math.round(ativas * between(r, 1.3, 1.9)),
    atendimentos,
    atend_por_mil: (atendimentos / ativas) * 1000,
    pontos: Math.round(6 + uf.pop * between(r, 1.1, 1.9)),
    interior: 100 - capital,
    densidade: ativas / (uf.pop * 1000),
    bioma_predominante: biomaPredominante(uf),
    bioeconomia: Math.min(0.95, 0.28 + amaz * 0.0042 + (uf.biomas.pantanal || 0) * 0.006 + between(r, 0, 0.16)),
    mei,
    me,
    epp,
    remuneracao: (uf.sigla === 'DF' ? 3900 : p.rem) * between(r, 0.92, 1.1),
    aberturas: Math.round(ativas * between(r, 0.09, 0.14)),
    tempo_abertura: between(r, 9, 46),
    baixas: between(r, 4, 8.8),
  };
  for (const b of BIOMAS) d[`bioma_${b.id}`] = uf.biomas[b.id] || 0;
  return d;
}

// Dados reais (API do Observatório, cubo RF): pequenos negócios ativos por UF e porte.
// Os demais contadores ilustrativos são reescalados pela mesma razão, para manter as
// proporções entre eles (setores, empregos, atendimentos, aberturas).
const CONTADORES_ILUSTRATIVOS = [];
function aplicarReais(uf, d) {
  const r = RF_UF.uf[uf.sigla];
  if (!r) return d;
  const k = r.total / d.ativas;
  for (const c of CONTADORES_ILUSTRATIVOS) d[c] = Math.round(d[c] * k);
  d.ativas = r.total;
  d.mei = (r.mei / r.total) * 100;
  d.me = (r.me / r.total) * 100;
  d.epp = (r.epp / r.total) * 100;
  d.interior = 100 - (r.capital / r.total) * 100;
  d.densidade = r.total / (uf.pop * 1000);
  // atendimentos Sebrae 2025 e cobertura (empresas atendidas ÷ pequenos negócios ativos)
  const at = ATEND.uf[uf.sigla]?.[2025];
  if (at) {
    d.atendimentos = at.atendimentos;
    d.atend_por_mil = (at.clientesPJ / d.ativas) * 100;
  }
  // bioeconomia (Sebrae, 2026): só Amazônia Legal; no estado, média dos municípios avaliados
  d.bioeconomia = BIO.uf[uf.sigla]?.media ?? null;
  // inovação (Sebrae): no estado, média simples dos municípios
  const inov = INOV.uf[uf.sigla]?.valor;
  if (inov) {
    d.inovacao = inov[0];
    d.startups_ativas = inov[6];
    d.ebts = inov[7];
  }
  // registro: tempo de abertura (REDESIM) e taxa de baixa (RF) em 2025
  if (REG.tempoAbertura.uf[uf.sigla] != null) d.tempo_abertura = REG.tempoAbertura.uf[uf.sigla];
  if (REG.baixas.uf[uf.sigla] != null) d.baixas = (REG.baixas.uf[uf.sigla] / d.ativas) * 100;
  // RAIS 2025: empregados em MPE e remuneração média
  const ra = RAIS.uf[uf.sigla];
  if (ra) {
    d.vinculos_mpe = ra.vinculosMPE;
    d.remuneracao = ra.massaMPE / ra.vinculosMPE;
  }
  // empregos (Novo CAGED 2025): saldo das MPE e participação no saldo total
  const cg = CAGED.uf[uf.sigla]?.[2025];
  if (cg) {
    d.empregos = cg.mpe;
    d.vagas_mpe = participacaoVagas(cg.mpe, cg.total);
  }
  // aberturas em 2026 (parcial), todas as situações
  if (RF_ABERT.uf[uf.sigla]) d.aberturas = RF_ABERT.uf[uf.sigla][2026];
  // setores (Setor SEBRAE); no mapa, indústria inclui a construção
  const st = RF_SETOR.uf[uf.sigla];
  if (st) {
    d.setor_agro = st.agro;
    d.setor_comercio = st.comercio;
    d.setor_industria = st.industria + st.construcao;
    d.setor_servicos = st.servicos;
    d.setor_admpub = st.admpub;
  }
  return d;
}

export const DADOS = Object.fromEntries(UFS.map((u) => [u.sigla, aplicarReais(u, gerar(u))]));
function participacaoVagasBrasil() {
  const t = Object.values(CAGED.br[2025]).reduce((a, b) => a + b.saldo, 0);
  return (CAGED.br[2025].mpe.saldo / t) * 100;
}
/** % das vagas criadas que vieram das MPE; null quando a conta não faz sentido */
export function participacaoVagas(mpe, total) {
  // abaixo de 50 vagas de saldo total a conta fica instável (ex.: 7 de 1 = 700%)
  if (!(total >= 50) || mpe < 0) return null;
  return (mpe / total) * 100;
}
/** O indicador tem valor real nesse nível? (nivel: 'uf' | 'mun') */
export const ehReal = (ind, nivel = 'uf') => !!ind?.real && (nivel === 'uf' || ind.real === 'mun');
export const ANO_REFERENCIA = 2026;
export const ATUALIZADO_EM = 'atualizado em nov. 2026';

// ---------------------------------------------------------------------------
// Formatação pt-BR
const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function compacto(v) {
  if (v >= 1e6) return `${nf1.format(v / 1e6)} mi`;
  if (v >= 1e4) return `${nf0.format(v / 1e3)} mil`;
  return nf0.format(v);
}

export function formatar(ind, v, { curto = false } = {}) {
  if (v == null || Number.isNaN(v)) return '—';
  switch (ind.unidade) {
    case 'n':
      return curto ? compacto(v) : nf0.format(v);
    case '%':
      return `${nf1.format(v)}%`;
    case 'R$':
      return `R$ ${nf0.format(v)}`;
    case 'h':
      return `${nf0.format(v)} h`;
    case 'idx':
      return nf2.format(v);
    case 'x':
      return nf1.format(v);
    case 'pts':
      return nf1.format(v);
    default:
      return String(v);
  }
}

// ---------------------------------------------------------------------------
// Vocação setorial (quociente locacional — QL)
// QL = (empresas do setor na UF / empresas da UF) ÷ (empresas do setor no Brasil / empresas do Brasil)
// QL > 1 indica concentração do setor acima da média nacional.
export const SETORES = [
  { id: 'setor_agro', rotulo: 'Agro', icone: 'agro' },
  { id: 'setor_comercio', rotulo: 'Comércio', icone: 'comercio' },
  { id: 'setor_industria', rotulo: 'Indústria', icone: 'industria' },
  { id: 'setor_servicos', rotulo: 'Serviços', icone: 'servicos' },
];

const TOTAL_BR = Object.values(DADOS).reduce((a, d) => a + d.ativas, 0);
const SHARE_BR = Object.fromEntries(
  SETORES.map((s) => [s.id, Object.values(DADOS).reduce((a, d) => a + d[s.id], 0) / TOTAL_BR]),
);

export function quocienteLocacional(sigla, setorId) {
  const d = DADOS[sigla];
  return d[setorId] / d.ativas / SHARE_BR[setorId];
}

export function vocacao(sigla) {
  return SETORES.map((s) => ({ ...s, ql: quocienteLocacional(sigla, s.id) })).sort((a, b) => b.ql - a.ql)[0];
}

export function participacaoNoTotal(sigla, indicadorId) {
  // contagens com total nacional próprio (ex.: atendimentos com parte sem estado) usam esse total
  const ind = INDICADOR_BY_ID[indicadorId];
  const total = ind?.unidade === 'n' && ind.brasil != null ? ind.brasil : Object.values(DADOS).reduce((a, d) => a + d[indicadorId], 0);
  return (DADOS[sigla][indicadorId] / total) * 100;
}
