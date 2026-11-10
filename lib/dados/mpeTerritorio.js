// Grandes números das MPE por território: Brasil → Estado → Município.
//
// Brasil: números publicados ou da API (lib/dados/mpe.js).
// Estados e municípios: reais para pequenos negócios ativos (Receita Federal) e empregos
// (Novo CAGED); os demais são ILUSTRATIVOS até a ligação com a API do Observatório.
// São determinísticos e coerentes com o mapa (empresas ativas e empregos seguem a
// mesma distribuição usada nas camadas por UF e por município).
//
// Alguns dados só existem até o nível do estado (pesquisas amostrais como a PNAD):
// num município, o cartão mostra o valor do estado e avisa (`escopo: 'UF'`).
import { DADOS, participacaoVagas } from './indicadores';
import CAGED from './retratos/caged-saldo.json';
import RAISM from './retratos/rais-mercantis-2025.json';
import { GRANDES_NUMEROS } from './mpe';
import { UF_BY_SIGLA } from './ufs';
import ATEND from './retratos/sebrae-atendimentos.json';
import { DESTAQUES_UF, PART_BR, SETOR_DESTAQUE_BY_ID, destaquesMunicipais } from './destaques';
import { PRODUCAO, AMAZONIA_LEGAL, reais } from './producao';
import { produtoCurto } from './ig';

function sorte(chave) {
  let h = 2166136261;
  for (let i = 0; i < chave.length; i++) h = Math.imul(h ^ chave.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000; // 0–1
}
const varia = (v, chave, amp) => v * (1 + (sorte(chave) * 2 - 1) * amp);
const entre = (v, a, b) => Math.min(b, Math.max(a, v));


// nível mínimo em que cada dado existe: 'MUN' ou 'UF'
// dados reais em todos os níveis (retrato da API do Observatório)
const REAIS = new Set(['ativas']);

const NIVEL = { pib: 'MUN', ia: 'UF', mulheres: 'UF', salarios: 'MUN', empregos: 'MUN', exporta: 'UF', ativas: 'MUN', vagas: 'MUN' };

function valorUF(id, uf, br) {
  const d = DADOS[uf];
  switch (id) {
    case 'pib':
      return entre(varia(br, `pib-${uf}`, 0.28), 12, 45);
    case 'ia':
      return entre(varia(br, `ia-${uf}`, 0.22), 20, 70);
    case 'mulheres':
      return entre(varia(br, `mul-${uf}`, 0.14), 24, 45);
    case 'salarios':
      return entre(varia(br, `sal-${uf}`, 0.22), 22, 62);
    case 'exporta':
      return entre(varia(br, `exp-${uf}`, 0.3), 12, 70);
    case 'ativas':
      return d.ativas; // real (API do Observatório)
    case 'vagas':
      return entre(varia(br, `vag-${uf}`, 0.12), 55, 96);
    default:
      return br;
  }
}

function valorMun(id, m, vUF, peso) {
  switch (id) {
    case 'ativas':
      return vUF * (peso ?? 0);
    case 'pib':
      return entre(varia(vUF, `pib-${m.cod}`, 0.35) + (m.cap ? -4 : 3), 8, 70);
    case 'salarios':
      return entre(varia(vUF, `sal-${m.cod}`, 0.3) + (m.cap ? -5 : 4), 12, 85);
    case 'vagas':
      return entre(varia(vUF, `vag-${m.cod}`, 0.16), 35, 100);
    default:
      return vUF;
  }
}

/** Formato de exibição de um número absoluto (contagem); aceita negativos (saldo) */
export function exibirContagem(v) {
  const s = v < 0 ? -1 : 1;
  const a = Math.abs(v);
  if (a >= 1e6) return { valor: (s * a) / 1e6, casas: 1, sufixo: ' mi' };
  if (a >= 1e4) return { valor: (s * a) / 1e3, casas: 0, sufixo: ' mil' };
  if (a >= 1e3) return { valor: (s * a) / 1e3, casas: 1, sufixo: ' mil' };
  return { valor: Math.round(v), casas: 0, sufixo: '' };
}

const n0 = (v) => Math.round(v).toLocaleString('pt-BR').replace('-', '−');

// Empregos (Novo CAGED 2025): saldo das MPE e participação no saldo total, por estado ou município
function cartaoEmprego(item, { uf, mun, base }) {
  let mpe;
  let total;
  let escopo = 'UF';
  const c = mun && base?.caged?.get(mun.cod);
  if (mun && c) {
    [mpe, total] = c;
    escopo = 'MUN';
  } else {
    ({ mpe, total } = CAGED.uf[uf]?.[2025] || { mpe: 0, total: 0 });
  }
  const lugar = escopo === 'MUN' ? mun.nome : UF_BY_SIGLA[uf]?.nome;
  const conta = `Saldo de empregos com carteira (admissões menos desligamentos) em ${lugar} em 2025: ${n0(mpe)} nas micro e pequenas empresas e ${n0(total)} no total, somando todas as empresas.`;
  const real = { ...item, escopo, ilustrativo: false };
  if (item.id === 'empregos') {
    return {
      ...real,
      exibe: exibirContagem(mpe),
      depois: mpe >= 0 ? item.depois : 'de saldo de empregos com carteira nas MPE em 2025',
      extra: undefined,
      explica: `${conta}${mpe < 0 ? ' O saldo negativo indica mais desligamentos que admissões.' : ''}`,
    };
  }
  // vagas: participação das MPE no saldo total
  const p = participacaoVagas(mpe, total);
  if (p == null) {
    // a conta não faz sentido (saldo total < 50 ou das MPE < 0): mostra o saldo das MPE
    return {
      ...real,
      formato: 'n',
      exibe: exibirContagem(mpe),
      depois: mpe >= 0 ? 'vagas criadas pelas MPE em 2025' : 'de saldo de vagas nas MPE em 2025',
      extra: `saldo total ${escopo === 'MUN' ? 'do município' : 'do estado'}: ${n0(total)}`,
      explica: `${conta} Como o saldo ${mpe < 0 ? 'das MPE foi negativo' : total <= 0 ? 'total foi zero ou negativo' : 'total ficou abaixo de 50 vagas'}, a participação em % não se aplica.`,
    };
  }
  return {
    ...real,
    exibe: { valor: p >= 100 ? Math.round(p) : Math.round(p * 10) / 10, casas: p >= 100 ? 0 : 1, sufixo: '%' },
    extra: p > 100 ? 'as demais empresas fecharam vagas' : `${n0(mpe)} de ${n0(total)} vagas`,
    explica: `${conta} Participação das MPE: ${p.toFixed(1).replace('.', ',')}%.${p > 100 ? ' Passa de 100% porque as demais empresas, somadas, fecharam vagas.' : ''}`,
  };
}

// RAIS 2025, empresas mercantis (critério DataSebrae): [vinculosMPE, massaMPE, vinculos, massa, mulheresMPE]
function raisDoLugar({ uf, mun, base }) {
  const m = mun && base?.raisM?.get(mun.cod);
  if (m) return { r: { vinculosMPE: m[0], massaMPE: m[1], vinculos: m[2], massa: m[3], mulheresMPE: m[4] }, escopo: 'MUN' };
  return { r: RAISM.uf[uf], escopo: 'UF' };
}

// Salários: participação das MPE na massa salarial das empresas do estado ou município
function cartaoSalarios(item, ctx) {
  const { uf, mun } = ctx;
  const { r, escopo } = raisDoLugar(ctx);
  const lugar = escopo === 'MUN' ? mun.nome : UF_BY_SIGLA[uf]?.nome;
  const p = r?.massa ? (r.massaMPE / r.massa) * 100 : 0;
  const valor = r.massaMPE >= 1e9 ? `R$ ${(r.massaMPE / 1e9).toFixed(1).replace('.', ',')} bi` : `R$ ${Math.round(r.massaMPE / 1e6).toLocaleString('pt-BR')} mi`;
  return {
    ...item,
    escopo,
    ilustrativo: false,
    depois: `dos salários pagos pelas empresas ${escopo === 'MUN' ? 'do município' : 'do estado'}`,
    exibe: { valor: Math.round(p * 10) / 10, casas: 1, sufixo: '%' },
    extra: r.massaMPE >= 1e6 ? `${valor} por mês` : undefined,
    explica: `Das remunerações pagas pelas empresas de ${lugar} aos empregados com carteira ativos no fim de 2025, ${p.toFixed(1).replace('.', ',')}% vêm das micro e pequenas empresas, que empregam ${n0(r.vinculosMPE)} de ${n0(r.vinculos)} pessoas. Segue o critério do DataSebrae: conta só as empresas mercantis, sem administração pública, associações e organismos internacionais.`,
  };
}

// ---------------------------------------------------------------- cartões locais
// Em estados e municípios, os quatro números que só existem para o Brasil (PIB, IA, mulheres
// donas de negócio e exportadoras) dão lugar a indicadores do lugar: setor em destaque,
// alcance do Sebrae, mulheres nos empregos das MPE e cadeia produtiva de referência. Os programas do Sebrae
// no território ficam na barra lateral do mapa.
const API_OBS = 'https://observatorio.sebrae.com.br/';
const FL = {
  setor: { nome: 'API do Observatório Sebrae — Receita Federal, pequenos negócios ativos por Setor SEBRAE', url: API_OBS, data: 'nov. 2026' },
  atend: { nome: 'API do Observatório Sebrae — Atendimentos Sebrae 2025 e Receita Federal', url: API_OBS, data: 'nov. 2026' },
  cadeia: { nome: 'API do Observatório Sebrae — IBGE (PAM, PPM e PEVS 2024) · INPI, indicações geográficas', url: API_OBS, data: 'nov. 2026' },
};
// "do agro", "do comércio", "da indústria", "de serviços"
const DO_SETOR = { agro: 'do agro', comercio: 'do comércio', industria: 'da indústria e da construção', servicos: 'de serviços' };
const pctTxt = (v, c = 1) => v.toLocaleString('pt-BR', { maximumFractionDigits: c, minimumFractionDigits: c });

function cartaoSetor(item, { uf, mun, base }) {
  let d = null;
  let escopo = 'UF';
  if (mun) {
    const x = base && destaquesMunicipais(base).get(mun.cod);
    if (x && !x.ficticio) {
      d = x;
      escopo = 'MUN';
    }
  }
  if (!d) d = DESTAQUES_UF.get(uf);
  const s = SETOR_DESTAQUE_BY_ID[d.setor];
  const part = d.ql * PART_BR[d.setor] * 100;
  const lugar = escopo === 'MUN' ? mun.nome : UF_BY_SIGLA[uf].nome;
  return {
    ...item,
    id: 'setor_local',
    slot: 'pib',
    icone: s.icone,
    escopo,
    ilustrativo: false,
    antes: 'setor em destaque',
    exibe: { valor: Math.round(part * 10) / 10, casas: 1, sufixo: '%' },
    depois: `dos pequenos negócios são ${DO_SETOR[d.setor]}`,
    extra: `${pctTxt(d.ql)}× a proporção do Brasil (${pctTxt(PART_BR[d.setor] * 100)}%)`,
    base: 'Receita Federal · API do Observatório',
    fonte: FL.setor,
    explica: `Setor em que ${lugar} mais se especializa: ${pctTxt(part)}% dos pequenos negócios ativos são ${DO_SETOR[d.setor]}, contra ${pctTxt(PART_BR[d.setor] * 100)}% no Brasil. A razão entre as duas participações (${pctTxt(d.ql)}) é o quociente locacional; acima de 1, o setor pesa mais no lugar que no país.`,
  };
}

function cartaoAtendimento(item, { uf, mun, base }) {
  let pj;
  let ativas;
  let escopo = 'UF';
  const a = mun && base?.atend?.get(mun.cod);
  const v = mun && base?.mpe?.get(mun.cod);
  if (a && v) {
    pj = a[2];
    ativas = v[0] + v[1] + v[2];
    escopo = 'MUN';
  } else {
    pj = ATEND.uf[uf]?.[2025]?.clientesPJ ?? 0;
    ativas = DADOS[uf].ativas;
  }
  const p = ativas ? (pj / ativas) * 100 : 0;
  const lugar = escopo === 'MUN' ? mun.nome : UF_BY_SIGLA[uf].nome;
  return {
    ...item,
    id: 'atendimento_local',
    slot: 'ia',
    icone: 'sebrae',
    escopo,
    ilustrativo: false,
    antes: undefined,
    exibe: { valor: Math.round(p * 10) / 10, casas: 1, sufixo: '%' },
    depois: 'dos pequenos negócios atendidos pelo Sebrae em 2025',
    extra: `${n0(pj)} empresas atendidas`,
    base: 'Sebrae · Atendimentos 2025 · API do Observatório',
    fonte: FL.atend,
    explica: `Empresas atendidas pelo Sebrae em ${lugar} em 2025 (${n0(pj)} clientes pessoa jurídica) em relação aos ${n0(ativas)} pequenos negócios ativos.${p > 100 ? ' Passa de 100% porque a empresa atendida nem sempre é um pequeno negócio ativo registrado no município.' : ''}`,
  };
}

function cartaoCadeia(item, { uf, mun, base, igs }) {
  let top = null;
  let escopo = 'UF';
  const m = mun && base?.porCod?.get(mun.cod);
  if (m?.cadeias?.length) {
    top = m.cadeias;
    escopo = 'MUN';
  } else top = PRODUCAO.uf[uf]?.top || [];
  const ext = escopo === 'MUN' ? m?.extrativas : AMAZONIA_LEGAL.includes(uf) ? PRODUCAO.uf[uf]?.extrativas : null;
  const lugar = escopo === 'MUN' ? mun.nome : UF_BY_SIGLA[uf].nome;
  const [prod, valor] = top[0] || ['—', 0];
  const lista = igs ? (mun ? igs.porMun.get(mun.cod) || [] : igs.igs.filter((i) => i.ufs.includes(uf))) : [];
  const nomesIG = [...new Set(lista.map((i) => produtoCurto(i.produto)))];
  const linhaIG = lista.length ? `${lista.length} ${lista.length === 1 ? 'indicação geográfica' : 'indicações geográficas'}: ${nomesIG.slice(0, 2).join(', ')}${nomesIG.length > 2 ? '…' : ''}` : null;
  const linhaExt = ext?.length && ext[0][0] !== prod ? `extrativismo: ${ext.slice(0, 2).map((e) => e[0].toLowerCase()).join(' e ')}` : null;
  return {
    ...item,
    id: 'cadeia_local',
    slot: 'exporta',
    icone: 'agro',
    escopo,
    ilustrativo: false,
    antes: 'cadeia produtiva de referência',
    exibe: { texto: prod },
    depois: `${reais(valor)} de produção em 2024`,
    extra: [linhaExt, linhaIG].filter(Boolean).join(' · ') || undefined,
    base: 'IBGE (PAM, PPM, PEVS 2024) e INPI · API do Observatório',
    fonte: FL.cadeia,
    explica: `Produto agropecuário ou extrativo de maior valor de produção em ${lugar} em 2024, somando lavouras (PAM), produtos de origem animal (PPM) e extração vegetal (PEVS) do IBGE: ${top.slice(0, 3).map(([p, v]) => `${p} (${reais(v)})`).join(', ')}. A pecuária de corte não entra nessas pesquisas.${lista.length ? ` Indicações geográficas reconhecidas pelo INPI: ${lista.map((i) => `${produtoCurto(i.produto)} (${i.nome}, ${i.especie})`).join('; ')}.` : ''}`,
  };
}

// Mulheres nos empregos das MPE (RAIS 2025, empresas mercantis): pictograma
function cartaoMulheres(item, ctx) {
  const { uf, mun } = ctx;
  const { r, escopo } = raisDoLugar(ctx);
  const p = r?.vinculosMPE ? (r.mulheresMPE / r.vinculosMPE) * 100 : 0;
  const lugar = escopo === 'MUN' ? mun.nome : UF_BY_SIGLA[uf].nome;
  const br = (RAISM.br.mulheresMPE / RAISM.br.vinculosMPE) * 100;
  return {
    ...item,
    id: 'mulheres_mpe',
    slot: 'mulheres',
    escopo,
    ilustrativo: false,
    antes: undefined,
    exibe: { valor: Math.round(p * 10) / 10, casas: 1, sufixo: '%' },
    depois: 'dos empregados das MPE são mulheres',
    extra: `${n0(r.mulheresMPE)} de ${n0(r.vinculosMPE)} · Brasil: ${pctTxt(br)}%`,
    base: 'MTE · RAIS 2025 · API do Observatório',
    fonte: { nome: 'API do Observatório Sebrae — RAIS 2025 (MTE), vínculos ativos por porte, empresas mercantis e sexo', url: API_OBS, data: 'nov. 2026' },
    explica: `Mulheres entre os empregados com carteira das micro e pequenas empresas de ${lugar}, no fim de 2025: ${n0(r.mulheresMPE)} de ${n0(r.vinculosMPE)} (${pctTxt(p)}%). No Brasil, ${pctTxt(br)}%. Conta só as empresas mercantis, como no cartão de salários. O número de mulheres donas de negócio vem da PNAD e só existe para o Brasil.${r.vinculosMPE < 30 ? ' Com tão poucos empregados, a parcela muda muito de um ano para outro.' : ''}`,
  };
}

const LOCAIS = { pib: cartaoSetor, ia: cartaoAtendimento, mulheres: cartaoMulheres, exporta: cartaoCadeia };

/**
 * @param territorio { uf?: string, mun?: { cod, nome, uf, cap } }
 * @param base       retorno de carregarMunicipios() (peso no estado, saldos do CAGED…)
 * @returns lista de cartões com { ...item, exibe: {valor, casas, sufixo}, escopo, ilustrativo }
 */
export function numerosDoTerritorio(territorio, base, extras = {}) {
  const { uf, mun } = territorio;
  const peso = base?.peso;
  return GRANDES_NUMEROS.map((item) => {
    const contagem = item.formato !== 'pct';
    const br = contagem ? item.valor * (item.formato === 'mi' ? 1e6 : 1e3) : item.valor;
    if (!uf) {
      return { ...item, escopo: 'BR', ilustrativo: false, exibe: { valor: item.valor, casas: item.casas, sufixo: item.formato === 'pct' ? '%' : item.formato === 'mi' ? ' mi' : ' mil' } };
    }
    if (item.id === 'empregos' || item.id === 'vagas') return cartaoEmprego(item, { uf, mun, base });
    if (item.id === 'salarios') return cartaoSalarios(item, { uf, mun, base });
    if (LOCAIS[item.id]) return LOCAIS[item.id](item, { uf, mun, base, ...extras });
    const vUF = valorUF(item.id, uf, br);
    let v = vUF;
    let escopo = 'UF';
    if (mun && NIVEL[item.id] === 'MUN') {
      v = valorMun(item.id, mun, vUF, peso?.get(mun.cod));
      escopo = 'MUN';
    }
    const exibe = contagem ? exibirContagem(v) : { valor: Math.round(v * 10) / 10, casas: 1, sufixo: '%' };
    const onde = escopo === 'MUN' ? 'do município' : 'do estado';
    const depois = item.id === 'pib' ? `do PIB ${onde}` : item.id === 'salarios' ? `dos salários pagos ${escopo === 'MUN' ? 'no município' : 'no estado'}` : item.depois;
    if (REAIS.has(item.id)) {
      const lugar = escopo === 'MUN' ? mun.nome : UF_BY_SIGLA[uf]?.nome;
      const part = escopo === 'MUN' && peso?.get(mun.cod) != null ? peso.get(mun.cod) * 100 : null;
      return {
        ...item,
        escopo,
        ilustrativo: false,
        exibe,
        extra: part != null ? `${part.toLocaleString('pt-BR', { maximumFractionDigits: part < 1 ? 2 : 1 })}% dos pequenos negócios do estado` : undefined,
        explica: `${Math.round(v).toLocaleString('pt-BR')} estabelecimentos ativos de MEI, microempresas e empresas de pequeno porte em ${lugar}, segundo a Receita Federal. Matriz e filiais contam separadamente.`,
      };
    }
    return { ...item, depois, escopo, ilustrativo: true, exibe, extra: undefined };
  });
}

export const SO_ESTADO = Object.entries(NIVEL)
  .filter(([, n]) => n === 'UF')
  .map(([id]) => id);
