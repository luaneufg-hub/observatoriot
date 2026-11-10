// Diagnóstico das micro e pequenas empresas (MPE) — Brasil.
//
// Números públicos, publicados pelo Sebrae a partir das bases do Observatório
// (Receita Federal, Novo CAGED, PNAD Contínua, Secex). Cada número traz a fonte,
// o período e a base de origem (`base`), que é a mesma da lista de fontes do
// Observatório: quando a API da base estiver disponível, basta trocar o valor
// pela consulta em `carregarDiagnostico()`.
//
// `situacao`:
//   'publicado'  — número tal como divulgado pela fonte
//   'calculado'  — derivado de números publicados (a conta está em `nota`)
//   'pendente'   — sem dado público; aguarda endpoint da API do Observatório

import RETRATO_PORTE from './retratos/rf-ativas-porte-brasil.json';
import RETRATO_SETOR from './retratos/rf-mpe-setor-uf.json';
import RETRATO_ABERT from './retratos/rf-mpe-aberturas.json';
import CAGED from './retratos/caged-saldo.json';
import RAIS from './retratos/rais-2025.json';
import RAISM from './retratos/rais-mercantis-2025.json';

export const ATUALIZADO_EM = 'atualizado em nov. 2026';

// Retratos da API do Observatório (cubo RF). Quando houver chave, a consulta equivalente
// está em lib/api/observatorio.js (CONSULTAS.ativasPorteBrasil).
const PORTE = Object.fromEntries(RETRATO_PORTE.dados.map((r) => [r['Porte da empresa SEBRAE ID'], r.Estabelecimentos]));
const ATIVAS_TOTAL = Object.values(PORTE).reduce((a, b) => a + b, 0);
const ATIVAS_MPE = PORTE[3] + PORTE[4] + PORTE[5]; // EPP + ME + MEI
// pequenos negócios ativos por Setor SEBRAE (Brasil); `outros` = não especificado + sem fins lucrativos
const { outros: ATIVAS_SETOR_OUTROS, ...ATIVAS_SETOR } = RETRATO_SETOR.br;
const ATIVAS_SETOR_TOTAL = Object.values(RETRATO_SETOR.br).reduce((a, b) => a + b, 0);
// Novo CAGED (API do Observatório): saldo de empregos por porte agregado, 2025 e 2026 (jan–ago)
const saldoTotal = (a) => Object.values(CAGED.br[a]).reduce((x, y) => x + y.saldo, 0);
const VAGAS = {
  mpe25: CAGED.br[2025].mpe.saldo,
  total25: saldoTotal(2025),
  mge25: CAGED.br[2025].mge.saldo,
  mpe26: CAGED.br[2026].mpe.saldo,
  total26: saldoTotal(2026),
  semPorte26: CAGED.br[2026].naoInformado.saldo,
};
const mil = (v) => `${Math.round(v / 1000).toLocaleString('pt-BR')} mil`;
const mi2 = (v) => (v / 1e6).toFixed(2).replace('.', ',');
// "1,9 milhão", "2,8 milhões"
const mi = (v) => { const n = Math.round(v / 1e5) / 10; return `${n.toFixed(1).replace('.', ',')} ${n < 2 ? 'milhão' : 'milhões'}`; };

const F = {
  pib: {
    nome: 'Sebrae — Pequenos negócios somam 24 milhões de empresas ativas',
    url: 'https://agenciasebrae.com.br/dados/pequenos-negocios-somam-24-milhoes-de-empresas-ativas/',
    data: 'jun. 2026',
  },
  ia: {
    nome: 'Sebrae — Transformação Digital nos Pequenos Negócios 2025',
    url: 'https://agenciasebrae.com.br/inovacao-e-tecnologia/de-gps-a-chat-gpt-maioria-dos-pequenos-negocios-abraca-a-inteligencia-artificial-para-aumentar-resultados/',
    data: 'jun. 2025',
  },
  mulheres: {
    nome: 'Sebrae — Empreendedorismo feminino (PNAD Contínua, 4º tri. 2025)',
    url: 'https://agenciasebrae.com.br/cultura-empreendedora/empreendedorismo-feminino-cresce-quase-30-em-dez-anos-e-alcanca-maior-patamar-da-serie-historica/',
    data: 'abr. 2026',
  },
  empregos2025: {
    nome: 'Sebrae com dados do Novo CAGED (MTE)',
    url: 'https://www.otempobetim.com.br/opiniao/shirlei-miranda/2026/2/25/micro-e-pequenos-negocios-sao-responsaveis-por-mais-de-1-milhao-de-empregos-em-2025-diz-caged',
    data: 'fev. 2026',
  },
  exporta: {
    nome: 'Sebrae com dados da Secex — Pequenos negócios exportadores',
    url: 'https://fenacon.org.br/noticias/numero-de-pequenos-negocios-exportadores-mais-que-dobra-em-uma-decada/',
    data: 'jun. 2025',
  },
  aberturas2025: {
    nome: 'DataSebrae — Resumo executivo: abertura de pequenos negócios 2025 (Receita Federal)',
    url: 'https://datasebrae.com.br/wp-content/uploads/2026/01/13012026_resumo_executivo_aberturas_pn_anual.pdf',
    data: 'jan. 2026',
  },
  aberturas2026: {
    nome: 'Sebrae — Abertura de pequenos negócios cresce 12% no 1º semestre (Receita Federal)',
    url: 'https://agenciasebrae.com.br/dados/abertura-de-pequenos-negocios-cresce-12-no-primeiro-semestre-deste-ano/',
    data: 'jul. 2026',
  },
  rfAtivas: {
    nome: 'API do Observatório Sebrae — Receita Federal, estabelecimentos ativos por porte',
    url: 'https://observatorio.sebrae.com.br/',
    data: 'nov. 2026',
  },
  rfAberturas: {
    nome: 'API do Observatório Sebrae — Receita Federal, pequenos negócios abertos por Setor SEBRAE e ano',
    url: 'https://observatorio.sebrae.com.br/',
    data: 'nov. 2026',
  },
  rfSetor: {
    nome: 'API do Observatório Sebrae — Receita Federal, pequenos negócios ativos por Setor SEBRAE',
    url: 'https://observatorio.sebrae.com.br/',
    data: 'nov. 2026',
  },
  raisApi: {
    nome: 'API do Observatório Sebrae — RAIS 2025 (MTE), vínculos ativos por porte, empresas mercantis e sexo',
    url: 'https://observatorio.sebrae.com.br/',
    data: 'nov. 2026',
  },
  cagedApi: {
    nome: 'API do Observatório Sebrae — Novo CAGED (MTE), saldo de empregos por porte',
    url: 'https://observatorio.sebrae.com.br/',
    data: 'nov. 2026',
  },
  empregosSetor: {
    nome: 'Sebrae com dados do Novo CAGED — Carteira assinada: 4,8 milhões de pessoas',
    url: 'https://agenciasebrae.com.br/dados/carteira-assinada-uma-conquista-de-48-milhoes-de-pessoas-e-das-micro-e-pequenas-empresas/',
    data: 'ago. 2026',
  },
};
export const FONTES = F;

/* ------------------------------------------------------------------ grandes números */
// `formato`: pct (valor em %), mi (milhões), mil (milhares). `casas`: casas decimais.
export const GRANDES_NUMEROS = [
  {
    id: 'pib',
    icone: 'Ativo_62',
    antes: 'representam',
    valor: 26.5,
    formato: 'pct',
    casas: 1,
    depois: 'do PIB do Brasil',
    cor: 'lavanda',
    base: 'Levantamento Sebrae',
    fonte: F.pib,
    situacao: 'publicado',
    explica: 'Participação dos pequenos negócios no Produto Interno Bruto, segundo levantamento do Sebrae.',
  },
  {
    id: 'ia',
    icone: 'robo',
    valor: 44,
    formato: 'pct',
    casas: 0,
    depois: 'já usaram inteligência artificial',
    cor: 'lavanda',
    base: 'Pesquisa Sebrae',
    fonte: F.ia,
    situacao: 'publicado',
    explica: 'Donos de pequenos negócios que disseram, sem estímulo, já ter usado algum tipo de IA. Entre as EPP, 65%; entre os MEI, 35%.',
  },
  {
    id: 'mulheres',
    icone: 'Ativo_45',
    valor: 34.3,
    formato: 'pct',
    casas: 1,
    depois: 'dos donos de negócio são mulheres',
    extra: '10,4 milhões de empreendedoras',
    cor: 'cinza',
    base: 'IBGE · PNAD Contínua',
    fonte: F.mulheres,
    situacao: 'publicado',
    explica: 'Mulheres entre os donos de negócio (empregadores e conta própria) no 4º trimestre de 2025: 10,4 milhões, maior patamar da série.',
  },
  {
    id: 'salarios',
    icone: 'Ativo_59',
    valor: Math.round((RAISM.br.massaMPE / RAISM.br.massa) * 100),
    formato: 'pct',
    casas: 0,
    depois: 'dos salários pagos pelas empresas',
    extra: `R$ ${Math.round(RAISM.br.massaMPE / 1e9)} bilhões por mês`,
    cor: 'lima',
    base: 'MTE · RAIS 2025 · API do Observatório',
    fonte: F.raisApi,
    situacao: 'publicado',
    explica: `Das remunerações pagas pelas empresas aos empregados com carteira ativos no fim de 2025, ${((RAISM.br.massaMPE / RAISM.br.massa) * 100).toFixed(1).replace('.', ',')}% vêm das micro e pequenas empresas: cerca de R$ ${Math.round(RAISM.br.massaMPE / 1e9)} bilhões por mês, para ${(RAISM.br.vinculosMPE / 1e6).toFixed(1).replace('.', ',')} milhões de empregados (${((RAISM.br.vinculosMPE / RAISM.br.vinculos) * 100).toFixed(1).replace('.', ',')}% dos vínculos das empresas). Segue o critério do DataSebrae: conta só as empresas mercantis e deixa de fora a administração pública, as associações e os organismos internacionais. Somando todos os empregadores, a parcela das MPE cai para ${((RAIS.br.massaMPE / RAIS.br.massa) * 100).toFixed(1).replace('.', ',')}%.`,
  },
  {
    id: 'empregos',
    icone: 'Ativo_54',
    valor: Math.round(VAGAS.mpe25 / 1e5) / 10, // em milhões
    formato: 'mi',
    casas: 1,
    depois: 'empregos com carteira assinada criados em 2025',
    cor: 'lima',
    base: 'MTE · Novo CAGED · API do Observatório',
    fonte: F.cagedApi,
    situacao: 'publicado',
    explica: `Saldo de empregos com carteira assinada (admissões menos desligamentos) das micro e pequenas empresas em 2025: ${VAGAS.mpe25.toLocaleString('pt-BR')} vagas. De janeiro a agosto de 2026, mais ${mil(VAGAS.mpe26)}.`,
  },
  {
    id: 'exporta',
    icone: 'Ativo_53',
    valor: 39.6,
    formato: 'pct',
    casas: 1,
    depois: 'das empresas exportadoras',
    extra: '11,4 mil pequenos negócios, em 2024',
    cor: 'cinza',
    base: 'MDIC · Secex / Comex Stat',
    fonte: F.exporta,
    situacao: 'publicado',
    explica: 'Em 2024, 11.432 das 28.847 empresas exportadoras eram pequenos negócios. Elas exportaram US$ 2,62 bilhões.',
  },
  {
    id: 'ativas',
    icone: 'Ativo_64',
    valor: Math.round(ATIVAS_MPE / 1e6), // em milhões; o número exato está em `explica`
    formato: 'mi',
    casas: 0,
    depois: 'de pequenos negócios ativos',
    extra: `${Math.round((ATIVAS_MPE / ATIVAS_TOTAL) * 100)}% dos estabelecimentos ativos`,
    cor: 'lavanda',
    base: 'Receita Federal · API do Observatório',
    fonte: F.rfAtivas,
    situacao: 'publicado',
    explica: `${ATIVAS_MPE.toLocaleString('pt-BR')} estabelecimentos com CNPJ ativo na Receita Federal: ${mi(PORTE[5])} de MEI, ${mi(PORTE[4])} de microempresas e ${mi(PORTE[3])} de empresas de pequeno porte. São ${((ATIVAS_MPE / ATIVAS_TOTAL) * 100).toFixed(1).replace('.', ',')}% dos ${mi(ATIVAS_TOTAL)} de estabelecimentos ativos. O restante é formado por médias e grandes empresas (${mi(PORTE[1] + PORTE[2])}) e outros portes (${mi(PORTE[9])}). A contagem é por estabelecimento: matriz e filiais contam separadamente.`,
  },
  {
    id: 'vagas',
    icone: 'Ativo_67',
    valor: Math.round((VAGAS.mpe25 / VAGAS.total25) * 100),
    formato: 'pct',
    casas: 0,
    depois: 'das novas vagas com carteira em 2025',
    extra: `${mi2(VAGAS.mpe25)} mi de ${mi2(VAGAS.total25)} mi de vagas`,
    cor: 'lavanda',
    base: 'MTE · Novo CAGED · API do Observatório',
    fonte: F.cagedApi,
    situacao: 'publicado',
    explica: `Das ${VAGAS.total25.toLocaleString('pt-BR')} vagas com carteira criadas no Brasil em 2025 (saldo de admissões menos desligamentos), ${VAGAS.mpe25.toLocaleString('pt-BR')} vieram das micro e pequenas empresas: ${((VAGAS.mpe25 / VAGAS.total25) * 100).toFixed(1).replace('.', ',')}%. As médias e grandes criaram ${mil(VAGAS.mge25)}. De janeiro a agosto de 2026, a participação está em ${Math.round((VAGAS.mpe26 / VAGAS.total26) * 100)}%, mas ${mil(VAGAS.semPorte26)} vagas ainda estão sem porte informado.`,
  },
];

/* ------------------------------------------------------------------ setores */
export const SETORES_MPE = [
  // cores e ícones conforme a arte da seção Setores (nov. 2026); imagem em /public/setores/<id>.webp
  { id: 'agro', rotulo: 'agro', nome: 'Agropecuária', icone: 'agro', cor: '#CDDF67', imagem: 'agro' },
  { id: 'servicos', rotulo: 'serviços', nome: 'Serviços', icone: 'servico', cor: '#BDBAB3', imagem: 'servicos' },
  { id: 'comercio', rotulo: 'comércio', nome: 'Comércio', icone: 'comercio', cor: '#D81E5B', imagem: 'comercio' },
  { id: 'industria', rotulo: 'indústria', nome: 'Indústria', icone: 'industria', cor: '#E8693F', imagem: 'industria' },
  { id: 'construcao', rotulo: 'construção', nome: 'Construção', icone: 'tijolos', cor: '#E9F59A', borda: '#C9D865' },
  // Administração pública (Setor Sebrae 32): tem ativas e aberturas (API); empregos por setor, ainda não.
  { id: 'admpub', rotulo: 'adm. pública', nome: 'Administração pública', icone: 'Ativo_80', cor: '#A093D1', pendente: true },
];

// Aberturas de pequenos negócios (MEI + ME + EPP) por setor e ano: API do Observatório (cubo RF,
// todas as situações cadastrais: conta também quem abriu e já fechou). 2026 é parcial.
const CINCO = ['servicos', 'comercio', 'industria', 'construcao', 'agro'];
const doAno = (a) => Object.fromEntries(CINCO.map((k) => [k, RETRATO_ABERT.br[a][k]]));
const ABERTURAS_2024 = doAno(2024);
const ABERTURAS_2025 = doAno(2025);
const ABERTURAS_2026 = doAno(2026); // parcial: até a última atualização da base
const ADMPUB_ABERT = { 2024: RETRATO_ABERT.br[2024].admpub, 2025: RETRATO_ABERT.br[2025].admpub, 2026: RETRATO_ABERT.br[2026].admpub };
const CRESC_2025 = Object.fromEntries(CINCO.map((k) => [k, Math.round((ABERTURAS_2025[k] / ABERTURAS_2024[k] - 1) * 1000) / 10]));
const ATE_2026 = 'até a última atualização da base (nov. 2026)';

export const ABAS = [
  {
    id: 'crescimento',
    rotulo: ['Setores', 'em crescimento'],
    titulo: 'Crescimento da abertura de pequenos negócios',
    unidade: 'pct',
    explica: 'Variação do número de pequenos negócios abertos em cada setor em relação ao ano anterior.',
    periodos: [
      {
        id: '2025',
        rotulo: '2025',
        nota: '2025 em relação a 2024',
        valores: CRESC_2025,
        fonte: F.rfAberturas,
        situacao: 'publicado',
        semValor: {
          admpub: {
            rotulo: 'base pequena',
            texto: `De ${ADMPUB_ABERT[2024]} aberturas em 2024 para ${ADMPUB_ABERT[2025]} em 2025: a base é pequena demais para comparar o crescimento com os outros setores.`,
          },
        },
      },
    ],
  },
  {
    id: 'novos',
    rotulo: ['Novos', 'negócios'],
    titulo: 'Pequenos negócios abertos por setor',
    unidade: 'n',
    explica: 'MEI, microempresas e empresas de pequeno porte abertos no período, pela atividade principal do CNPJ. Conta também os que já fecharam.',
    periodos: [
      { id: '2026', rotulo: '2026', nota: `parcial: ${ATE_2026}`, valores: { ...ABERTURAS_2026, admpub: ADMPUB_ABERT[2026] }, fonte: F.rfAberturas, situacao: 'publicado' },
      { id: '2025', rotulo: '2025', nota: 'ano completo', valores: { ...ABERTURAS_2025, admpub: ADMPUB_ABERT[2025] }, fonte: F.rfAberturas, situacao: 'publicado' },
      { id: '2024', rotulo: '2024', nota: 'ano completo', valores: { ...ABERTURAS_2024, admpub: ADMPUB_ABERT[2024] }, fonte: F.rfAberturas, situacao: 'publicado' },
    ],
  },
  {
    id: 'empregos',
    rotulo: ['Empregos', 'por setor'],
    titulo: 'Empregos formais criados pelas MPE',
    unidade: 'n',
    explica: 'Saldo de empregos com carteira assinada (admissões menos desligamentos) gerado pelas micro e pequenas empresas.',
    periodos: [
      {
        id: '2023-2025',
        rotulo: '2023–2025',
        nota: 'acumulado de 2023 a 2025 · indústria = indústria de transformação',
        valores: { servicos: 1700000, comercio: 790000, construcao: 482000, industria: 304000, agro: 53000 },
        fonte: F.empregosSetor,
        situacao: 'publicado',
      },
    ],
  },
  {
    id: 'atividade',
    rotulo: ['Empresas por', 'atividade principal'],
    titulo: 'Pequenos negócios ativos por atividade principal',
    unidade: 'n',
    explica: `Estoque de MEI, microempresas e empresas de pequeno porte ativos, pelo setor da atividade principal do CNPJ (Setor SEBRAE). Outros ${Math.round(ATIVAS_SETOR_OUTROS / 1000).toLocaleString('pt-BR')} mil, sem setor especificado ou sem fins lucrativos, ficam fora do gráfico.`,
    periodos: [
      { id: '2026', rotulo: '2026', nota: 'estoque em nov. 2026 · MEI, ME e EPP ativos', valores: ATIVAS_SETOR, fonte: F.rfSetor, situacao: 'publicado' },
    ],
  },
];

// ---------------------------------------------------------------------------
// "Temos um resumo pra você!": frases por aba, setor e período (só com os números acima).
// subtitulo = frase curta com o setor e o ano; texto = leitura detalhada;
// destaque = o setor lidera aquele indicador (ganha a estrelinha).
const DE = { agro: 'do agro', servicos: 'de serviços', comercio: 'do comércio', industria: 'da indústria', construcao: 'da construção', admpub: 'da administração pública' };
const oSetor = (id) => `O setor ${DE[id]}`;
const pct = (v) => v.toFixed(1).replace('.', ',');
function fmt(v) {
  if (v >= 1e6) {
    const n = v / 1e6;
    return `${n.toFixed(2).replace(/0$/, '').replace('.', ',')} ${n < 2 ? 'milhão' : 'milhões'}`;
  }
  return `${Math.round(v / 1000).toLocaleString('pt-BR')} mil`;
}
// "3,16 milhões de aberturas", mas "38 mil aberturas" (sem "de" depois de mil)
const qtd = (v, nome) => `${fmt(v)}${v >= 1e6 ? ' de' : ''} ${nome}`;
const soma = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const posicao = (o, id) => Object.entries(o).sort((a, b) => b[1] - a[1]).findIndex(([k]) => k === id) + 1;
const EMPREGOS = ABAS.find((a) => a.id === 'empregos').periodos[0].valores;

// Estoque de pequenos negócios ativos por setor (API do Observatório, nov. 2026)
function resumoAtividade(id) {
  const v = ATIVAS_SETOR[id];
  const pos = posicao(ATIVAS_SETOR, id);
  const part = pct((v / ATIVAS_SETOR_TOTAL) * 100);
  const ranking = Object.entries(ATIVAS_SETOR).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  if (id === 'admpub') {
    return {
      destaque: false,
      subtitulo: `${oSetor(id)} tem só ${v.toLocaleString('pt-BR')} pequenos negócios ativos em 2026.`,
      texto: 'É o menor estoque entre os seis setores. A maior parte dos órgãos e entidades públicas não se enquadra como pequeno negócio, por isso o número é baixo.',
    };
  }
  if (pos === 1) {
    return {
      destaque: true,
      subtitulo: `${oSetor(id)} reúne a maior parte dos pequenos negócios ativos em 2026.`,
      texto: `São ${qtd(v, 'estabelecimentos ativos')} de MEI, microempresas e empresas de pequeno porte, ${part}% do total. O segundo maior estoque é o ${DE[ranking[1]]}, com ${fmt(ATIVAS_SETOR[ranking[1]])}.`,
    };
  }
  return {
    destaque: false,
    subtitulo: `${oSetor(id)} reúne ${part}% dos pequenos negócios ativos em 2026.`,
    texto: `São ${qtd(v, 'estabelecimentos ativos')} de MEI, microempresas e empresas de pequeno porte, o ${pos}º maior estoque entre os seis setores.`,
  };
}

// Regra de coesão: o que o subtítulo já diz (quantidade ou percentual), o texto não repete.
function resumoNovos2025(id) {
  const pos = posicao(ABERTURAS_2025, id);
  const part = pct((ABERTURAS_2025[id] / soma(ABERTURAS_2025)) * 100);
  const c = pct(CRESC_2025[id]);
  if (pos === 1) {
    return {
      destaque: true,
      subtitulo: `${oSetor(id)} é destaque no ano de 2025.`,
      texto: `Em 2025, o segmento somou ${qtd(ABERTURAS_2025[id], 'pequenos negócios abertos')} (${part}% do total), ${c}% a mais que em 2024. Nenhum outro setor teve tantas aberturas no ano.`,
    };
  }
  return {
    destaque: false,
    subtitulo: `${oSetor(id)} respondeu por ${part}% das aberturas de 2025.`,
    texto: `Em 2025, o segmento somou ${qtd(ABERTURAS_2025[id], 'pequenos negócios abertos')}, ${c}% a mais que em 2024, e ficou em ${pos}º lugar em número de aberturas.`,
  };
}

export function resumoFaixa(abaId, periodoId, id) {
  if (abaId === 'atividade') return resumoAtividade(id);
  if (id === 'admpub') {
    const pq = 'São números pequenos: quase nenhum órgão público se enquadra como pequeno negócio.';
    if (abaId === 'crescimento') {
      return {
        destaque: false,
        subtitulo: `${oSetor(id)} passou de ${ADMPUB_ABERT[2024]} para ${ADMPUB_ABERT[2025]} aberturas em 2025.`,
        texto: `${pq} Por isso o setor fica fora da comparação de crescimento entre os setores.`,
      };
    }
    if (abaId === 'novos') {
      const ano = periodoId || '2026';
      return {
        destaque: false,
        subtitulo: `${oSetor(id)} ${ano === '2026' ? 'já registrou' : 'registrou'} ${ADMPUB_ABERT[ano]} aberturas em ${ano}.`,
        texto: `${pq} No gráfico, a barra quase não aparece ao lado dos outros setores.`,
      };
    }
    return {
      destaque: false,
      subtitulo: `${oSetor(id)} ainda não tem dados publicados nesta aba.`,
      texto: 'Os números públicos de empregos por setor cobrem cinco setores. A administração pública entrará aqui quando a consulta à API do Observatório estiver disponível.',
    };
  }
  if (abaId === 'crescimento') {
    const pos = posicao(CRESC_2025, id);
    const media = (soma(ABERTURAS_2025) / soma(ABERTURAS_2024) - 1) * 100;
    const c = CRESC_2025[id];
    return {
      destaque: pos === 1,
      subtitulo:
        pos === 1 ? `${oSetor(id)} foi o que mais cresceu em 2025.`
        : pos === 5 ? `${oSetor(id)} teve o crescimento mais tímido de 2025.`
        : `${oSetor(id)} teve o ${pos}º maior crescimento de 2025.`,
      texto: `Foram ${qtd(ABERTURAS_2025[id], 'pequenos negócios abertos')} em 2025, contra ${fmt(ABERTURAS_2024[id])} em 2024: ${pct(c)}% a mais. A média dos cinco setores foi de ${pct(media)}%; o ritmo do setor, portanto, ficou ${c >= media ? 'acima' : 'abaixo'} dela.`,
    };
  }

  if (abaId === 'novos' && periodoId === '2026') {
    const ritmo = Object.fromEntries(CINCO.map((k) => [k, (ABERTURAS_2026[k] / ABERTURAS_2025[k]) * 100]));
    const acelera = posicao(ritmo, id) === 1;
    const lidera = posicao(ABERTURAS_2026, id) === 1;
    const r = ritmo[id];
    const fim = r >= 100 ? ' O setor já superou o ano de 2025 inteiro.' : '';
    if (acelera || lidera) {
      return {
        destaque: true,
        subtitulo: acelera ? `${oSetor(id)} é o que mais acelera de 2025 para 2026.` : `${oSetor(id)} segue na liderança em 2026.`,
        texto: `Em 2026, ${ATE_2026}, o segmento registrou ${qtd(ABERTURAS_2026[id], 'aberturas de pequenos negócios')}, o equivalente a ${pct(r)}% do total de 2025.${fim}`,
      };
    }
    return {
      destaque: false,
      subtitulo: `${oSetor(id)} já registrou ${qtd(ABERTURAS_2026[id], 'aberturas')} em 2026.`,
      texto: `Contados ${ATE_2026}, esses negócios equivalem a ${pct(r)}% do total aberto pelo setor em 2025.${fim}`,
    };
  }

  if (abaId === 'novos' && periodoId === '2024') {
    const pos = posicao(ABERTURAS_2024, id);
    const part = pct((ABERTURAS_2024[id] / soma(ABERTURAS_2024)) * 100);
    const depois = ` No ano seguinte, o número chegou a ${fmt(ABERTURAS_2025[id])}.`;
    if (pos === 1) {
      return {
        destaque: true,
        subtitulo: `${oSetor(id)} já liderava as aberturas em 2024.`,
        texto: `Foram ${qtd(ABERTURAS_2024[id], 'aberturas')} em 2024 (${part}% do total).${depois}`,
      };
    }
    return {
      destaque: false,
      subtitulo: `${oSetor(id)} registrou ${qtd(ABERTURAS_2024[id], 'aberturas')} em 2024.`,
      texto: `Isso corresponde a ${part}% do total do ano.${depois}`,
    };
  }

  if (abaId === 'empregos') {
    const pos = posicao(EMPREGOS, id);
    const part = pct((EMPREGOS[id] / soma(EMPREGOS)) * 100);
    const transf = id === 'industria' ? ' Aqui, indústria corresponde à indústria de transformação.' : '';
    if (pos === 1) {
      return {
        destaque: true,
        subtitulo: `${oSetor(id)} foi o que mais gerou empregos de 2023 a 2025.`,
        texto: `As micro e pequenas empresas do setor somaram um saldo de ${qtd(EMPREGOS[id], 'vagas com carteira assinada')} no período, ${part}% do total dos cinco setores.${transf}`,
      };
    }
    return {
      destaque: false,
      subtitulo: `${oSetor(id)} gerou ${qtd(EMPREGOS[id], 'empregos')} de 2023 a 2025.`,
      texto: `O número é o saldo de vagas com carteira assinada (admissões menos desligamentos) das micro e pequenas empresas do setor e representa ${part}% do total dos cinco setores. Com isso, o setor ficou em ${pos}º lugar na geração de empregos.${transf}`,
    };
  }


  return resumoNovos2025(id); // novos · 2025
}

// O que ainda falta (para pedir os endpoints)
export const PENDENCIAS = [
  'Estoque de empregos formais nas MPE (RAIS · vínculos por porte)',
  'Empregos por setor ano a ano: 2024, 2025 e 2026 (Novo CAGED · movimentação por porte e setor)',
  'Aberturas por setor de 2024 (hoje calculadas a partir do crescimento de 2025)',
  'Pequenos negócios sustentáveis (base ainda não identificada; talvez Sebrae Bioeconomia)',
  'Todos os números por UF e município, para acompanhar a seleção do mapa',
];

// Ponto único de troca: hoje devolve os números publicados; depois, consulta a API.
export async function carregarDiagnostico() {
  return { grandesNumeros: GRANDES_NUMEROS, abas: ABAS, setores: SETORES_MPE };
}
