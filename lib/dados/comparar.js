// Comparar territórios: monta o perfil de um lugar (Brasil, estado ou município) com os dados
// reais já carregados na página e escreve o resumo em texto.
import RF_UF from './retratos/rf-mpe-ativas-uf.json';
import RF_SETOR from './retratos/rf-mpe-setor-uf.json';
import RF_ABERT from './retratos/rf-mpe-aberturas.json';
import CAGED from './retratos/caged-saldo.json';
import ATEND from './retratos/sebrae-atendimentos.json';
import RAISM from './retratos/rais-mercantis-2025.json';
import REG from './retratos/registro-2025.json';
import INOV from './retratos/inovacao.json';
import { PRODUCAO, AMAZONIA_LEGAL } from './producao';
import { PROGRAMAS } from './sebraeTerritorio';
import { UFS, UF_BY_SIGLA } from './ufs';
import { BIOMA_BY_ID, biomaPredominante } from './biomas';

export const SETORES_CMP = [
  { id: 'agro', nome: 'Agro', de: 'do agro', icone: 'agro', cor: '#C9DF60' },
  { id: 'comercio', nome: 'Comércio', de: 'do comércio', icone: 'comercio', cor: '#D81E5B' },
  { id: 'industria', nome: 'Indústria', de: 'da indústria', icone: 'industria', cor: '#E8693F' },
  { id: 'construcao', nome: 'Construção', de: 'da construção', icone: 'construcao', cor: '#E7F79E' },
  { id: 'servicos', nome: 'Serviços', de: 'de serviços', icone: 'servicos', cor: '#BDBAB3' },
];
export const SETOR_CMP_BY_ID = Object.fromEntries(SETORES_CMP.map((s) => [s.id, s]));

const somaBR = (() => {
  const t = SETORES_CMP.reduce((a, s) => a + RF_SETOR.br[s.id], 0);
  return Object.fromEntries(SETORES_CMP.map((s) => [s.id, RF_SETOR.br[s.id] / t]));
})();
const K = INOV.campos.length;
const PROG = PROGRAMAS.filter((p) => p.id !== 'ig');

/**
 * @param t       { uf?, mun? }  (mun = item de base.lista)
 * @param base    retorno de carregarMunicipios()
 * @param extras  { igs, programas }
 */
export function perfil({ uf = null, mun = null }, base, { igs, programas } = {}) {
  const nivel = mun ? 'mun' : uf ? 'uf' : 'br';
  const cod = mun?.cod;
  const nome = mun ? mun.nome : uf ? UF_BY_SIGLA[uf].nome : 'Brasil';

  // porte
  let porte;
  if (mun) {
    const v = base?.mpe?.get(cod) || [0, 0, 0];
    porte = { epp: v[0], me: v[1], mei: v[2] };
  } else if (uf) porte = { epp: RF_UF.uf[uf].epp, me: RF_UF.uf[uf].me, mei: RF_UF.uf[uf].mei };
  else {
    porte = { epp: 0, me: 0, mei: 0 };
    for (const r of Object.values(RF_UF.uf)) for (const k of ['epp', 'me', 'mei']) porte[k] += r[k];
  }
  const ativas = porte.epp + porte.me + porte.mei;

  // setores (pequenos negócios ativos por Setor SEBRAE)
  const st = mun ? base?.setor?.get(cod) : uf ? RF_SETOR.uf[uf] : RF_SETOR.br;
  const totSet = SETORES_CMP.reduce((a, s) => a + (st?.[s.id] || 0), 0);
  const setores = SETORES_CMP.map((s) => {
    const n = st?.[s.id] || 0;
    const part = totSet ? n / totSet : 0;
    return { ...s, n, part, ql: part / somaBR[s.id] };
  });
  const destaque = nivel === 'br' ? null : [...setores].sort((a, b) => b.ql - a.ql)[0];

  // aberturas (pequenos negócios abertos no ano)
  let abertura;
  if (mun) {
    const v = base?.abertAnos?.mun.get(cod);
    const i = (a) => base.abertAnos.anos.indexOf(a);
    abertura = v ? { 2024: v[i(2024)], 2025: v[i(2025)] } : null;
  } else if (uf) abertura = RF_ABERT.uf[uf];
  else abertura = Object.fromEntries([2024, 2025].map((a) => [a, Object.values(RF_ABERT.br[a]).reduce((x, y) => x + y, 0)]));

  // empregos (CAGED 2025)
  let caged;
  if (mun) {
    const c = base?.caged?.get(cod);
    caged = c ? { mpe: c[0], total: c[1] } : null;
  } else if (uf) caged = CAGED.uf[uf]?.[2025];
  else caged = { mpe: CAGED.br[2025].mpe.saldo, total: Object.values(CAGED.br[2025]).reduce((a, x) => a + x.saldo, 0) };

  // RAIS 2025, empresas mercantis
  let rais;
  if (mun) {
    const m = base?.raisM?.get(cod);
    rais = m ? { vinculosMPE: m[0], massaMPE: m[1], vinculos: m[2], massa: m[3], mulheresMPE: m[4] } : null;
  } else rais = uf ? RAISM.uf[uf] : RAISM.br;

  // Sebrae: empresas atendidas em 2025
  const atendidas = mun ? base?.atend?.get(cod)?.[2] ?? 0 : uf ? ATEND.uf[uf]?.[2025]?.clientesPJ : ATEND.br[2025].clientesPJ;

  // tempo médio de abertura (horas)
  const tempo = mun ? base?.tempo?.get(cod) ?? null : uf ? REG.tempoAbertura.uf[uf] : REG.tempoAbertura.br;

  // inovação
  let inov = null;
  if (mun) {
    const v = base?.inov?.get(cod);
    if (v) inov = { valor: v.slice(0, K), pct: v.slice(K, 2 * K), posicao: v[2 * K], de: INOV.municipios, unidade: 'municípios' };
  } else if (uf) inov = { ...INOV.uf[uf], de: Object.keys(INOV.uf).length, unidade: 'estados' };
  else inov = { ...INOV.br, pct: INOV.br.pct.map(() => 50) };

  // cadeias produtivas (IBGE 2024)
  const cadeias = (mun ? base?.porCod?.get(cod)?.cadeias : uf ? PRODUCAO.uf[uf]?.top : PRODUCAO.br.top) || [];
  const amazLegal = mun ? AMAZONIA_LEGAL.includes(mun.uf) : uf ? AMAZONIA_LEGAL.includes(uf) : false;
  const extrativas = (amazLegal && (mun ? base?.porCod?.get(cod)?.extrativas : PRODUCAO.uf[uf]?.extrativas)) || [];

  // indicações geográficas (INPI)
  const listaIG = igs ? (mun ? igs.porMun.get(cod) || [] : uf ? igs.igs.filter((i) => i.ufs.includes(uf)) : igs.igs) : null;

  // programas do Sebrae
  let prog = null;
  if (programas && base) {
    if (mun) prog = { presentes: PROG.filter((p) => programas[p.id]?.sim.has(cod)), total: PROG.length };
    else {
      const muns = uf ? base.porUF[uf] || [] : base.lista;
      let soma = 0;
      const cobertura = PROG.map((p) => {
        let k = 0;
        for (const m of muns) if (programas[p.id]?.sim.has(m.cod)) k++;
        soma += k;
        return { ...p, pct: muns.length ? (k / muns.length) * 100 : 0 };
      });
      prog = { media: muns.length ? soma / muns.length : 0, total: PROG.length, cobertura };
    }
  }

  // bioma predominante
  const bioma = mun ? BIOMA_BY_ID[mun.pred]?.nome : uf ? BIOMA_BY_ID[biomaPredominante(UF_BY_SIGLA[uf])]?.nome : null;

  return { nivel, nome, uf: mun?.uf || uf, cod, porte, ativas, setores, destaque, abertura, caged, rais, atendidas, tempo, inov, cadeias, extrativas, listaIG, prog, bioma };
}

// ------------------------------------------------------------------ texto
const nf0 = (v) => Math.round(v).toLocaleString('pt-BR');
const nf1 = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const pctTxt = (v, c = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
export function variacao(a, b) {
  if (!a || b == null) return null;
  return ((b - a) / a) * 100;
}

/** Resumo em texto ("Temos um resumo pra você!") */
export function resumo(p, setorId) {
  const frases = [];
  const em = p.nivel === 'br' ? 'No Brasil' : `Em ${p.nome}`;
  if (p.ativas) {
    const ord = [
      { art: 'os', nome: 'MEI', v: p.porte.mei },
      { art: 'as', nome: 'microempresas', v: p.porte.me },
      { art: 'as', nome: 'empresas de pequeno porte', v: p.porte.epp },
    ].sort((a, b) => b.v - a.v);
    const pc = (v) => `${pctTxt((v / p.ativas) * 100)}%`;
    const d = (o) => `d${o.art} ${o.nome} (${pc(o.v)})`;
    frases.push(`${em}, há ${nf0(p.ativas)} pequenos negócios ativos. Predominam ${ord[0].art} ${ord[0].nome} (${pc(ord[0].v)}), ${ord[0].art === 'os' ? 'seguidos' : 'seguidas'} ${d(ord[1])} e ${d(ord[2])}.`);
  }
  const s = setorId && p.setores.find((x) => x.id === setorId);
  const vezes = (q) => `${nf1(q)} ${q >= 2 ? 'vezes' : 'vez'} a proporção nacional`;
  if (s) frases.push(`Os pequenos negócios ${s.de} somam ${nf0(s.n)}, ${pctTxt(s.part * 100)}% do total${p.nivel === 'br' ? '' : `, ${vezes(s.ql)}`}.`);
  else if (p.destaque && p.destaque.ql >= 1.05) frases.push(`Em relação ao Brasil, o destaque é o setor ${p.destaque.de}: ${pctTxt(p.destaque.part * 100)}% dos pequenos negócios, ${vezes(p.destaque.ql)}.`);
  if (p.cadeias[0]) frases.push(`A cadeia produtiva de referência é ${p.cadeias[0][0].toLowerCase()}${p.extrativas[0] && p.extrativas[0][0] !== p.cadeias[0][0] ? `; no extrativismo, destaca-se ${p.extrativas[0][0].toLowerCase()}` : ''}.`);
  const v = p.abertura && variacao(p.abertura[2024], p.abertura[2025]);
  if (v != null) frases.push(`Em 2025, abriram ${nf0(p.abertura[2025])} pequenos negócios, ${v >= 0 ? `${pctTxt(v)}% a mais` : `${pctTxt(-v)}% a menos`} que em 2024.`);
  return frases.join(' ');
}
