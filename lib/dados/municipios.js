// Municípios: índice (nome, UF, centróide, bioma predominante) e valores por indicador.
// ⚠️ Valores municipais ILUSTRATIVOS: o total de cada UF é distribuído entre os seus
// municípios com pesos determinísticos (a capital recebe a fatia "não interiorizada").
// Os biomas por município são REAIS (polígonos IBGE cruzados com a malha municipal).
// Para dados reais, substitua `valorMunicipal` por uma consulta à API/arquivo do Observatório.
import { DADOS, INDICADOR_BY_ID, participacaoVagas } from '@/lib/dados/indicadores';
import { geo } from '@/lib/geo';
import { asset } from '@/lib/asset';

const CODIGO_BIOMA = { a: 'amazonia', c: 'caatinga', e: 'cerrado', m: 'mataAtlantica', p: 'pampa', n: 'pantanal' };

let cache = null;

export async function carregarMunicipios() {
  if (cache) return cache;
  const [idx, bio, rf, rfSetor, rfAbert, rfCaged, rfAtend, rfRais, rfTempo, rfBaixas, rfBioeco, rfProd, rfInov, rfRaisM] = await Promise.all([
    fetch(geo('municipios-index.json')).then((r) => r.json()),
    fetch(geo('municipios-biomas.json')).then((r) => r.json()),
    // pequenos negócios ativos por município e porte (API do Observatório, cubo RF)
    fetch(asset('dados/rf/mpe-ativas-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    // pequenos negócios ativos por município e Setor SEBRAE
    fetch(asset('dados/rf/mpe-setor-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    // pequenos negócios abertos por município e ano
    fetch(asset('dados/rf/mpe-aberturas-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    // saldo de empregos (Novo CAGED) por município: [mpe2025, total2025, mpe2026, total2026]
    fetch(asset('dados/caged/saldo-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    // atendimentos Sebrae 2025 por município: [atendimentos, clientes, clientesPJ]
    fetch(asset('dados/sebrae/atendimentos-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    // RAIS 2025 por município: [vinculosMPE, massaMPE, vinculos, massa]
    fetch(asset('dados/rais/vinculos-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    // tempo médio de abertura (REDESIM, horas) e baixas de pequenos negócios (RF), 2025
    fetch(asset('dados/redesim/tempo-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(asset('dados/rf/mpe-baixas-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    // índice de bioeconomia (Sebrae, 2026): [score, ranking], só Amazônia Legal
    fetch(asset('dados/sebrae/bioeconomia-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    // cadeias produtivas (IBGE 2024): { c: [[produto, R$]…], e: extrativas na Amazônia Legal }
    fetch(asset('dados/ibge/producao-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    // indicadores municipais de inovação (Sebrae): [valores…, percentis…, posição]
    fetch(asset('dados/sebrae/inovacao-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    // RAIS 2025, empresas mercantis: [vinculosMPE, massaMPE, vinculos, massa, mulheresMPE]
    fetch(asset('dados/rais/mercantis-municipio.json'))
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);
  const raisM = new Map(Object.entries(rfRaisM?.mun || {}).map(([c, v]) => [+c, v]));
  const inov = new Map(Object.entries(rfInov?.mun || {}).map(([c, v]) => [+c, v]));
  const bioeco = new Map(Object.entries(rfBioeco?.mun || {}).map(([c, v]) => [+c, v]));
  const tempo = new Map(Object.entries(rfTempo?.mun || {}).map(([c, v]) => [+c, v]));
  const baixas = new Map(Object.entries(rfBaixas?.mun || {}).map(([c, v]) => [+c, v]));
  const rais = new Map(Object.entries(rfRais?.mun || {}).map(([c, v]) => [+c, v]));
  const atend = new Map(Object.entries(rfAtend?.mun || {}).map(([c, v]) => [+c, v]));
  const caged = new Map(Object.entries(rfCaged?.mun || {}).map(([c, v]) => [+c, v]));
  // cod → aberturas em 2026 (parcial)
  const i2026 = rfAbert?.anos?.indexOf(2026) ?? -1;
  const abert = new Map(i2026 < 0 ? [] : Object.entries(rfAbert.mun).map(([c, v]) => [+c, v[i2026]]));
  // cod → aberturas por ano (2024, 2025, 2026…), para comparações
  const abertAnos = { anos: rfAbert?.anos || [], mun: new Map(Object.entries(rfAbert?.mun || {}).map(([c, v]) => [+c, v])) };
  // cod → { agro, comercio, industria, construcao, servicos, admpub, outros }
  const setor = new Map(
    Object.entries(rfSetor?.mun || {}).map(([c, v]) => [+c, Object.fromEntries(rfSetor.ordem.map((k, i) => [k, v[i]]))]),
  );
  const mpe = new Map(Object.entries(rf?.mun || {}).map(([c, v]) => [+c, v])); // cod → [epp, me, mei]
  const lista = idx.map(([cod, nome, uf, cap, lon, lat, pred]) => {
    const biomas = {};
    for (const m of (bio[cod] || '').matchAll(/([acempn])(\d+)/g)) biomas[CODIGO_BIOMA[m[1]]] = +m[2];
    return { cod, nome, uf, cap: !!cap, lon, lat, pred, biomas, busca: normaliza(nome) };
  });
  for (const m of lista) {
    const p = rfProd?.mun?.[m.cod];
    if (p) {
      m.cadeias = p.c;
      m.extrativas = p.e;
    }
  }
  const porCod = new Map(lista.map((m) => [m.cod, m]));
  const porUF = {};
  for (const m of lista) (porUF[m.uf] = porUF[m.uf] || []).push(m);

  // peso de cada município no estado: real (pequenos negócios ativos) quando há o retrato
  // da API; senão, pesos determinísticos ilustrativos
  const peso = new Map();
  if (mpe.size) {
    for (const [uf, ms] of Object.entries(porUF)) {
      const total = DADOS[uf]?.ativas || 1;
      for (const m of ms) {
        const v = mpe.get(m.cod);
        peso.set(m.cod, v ? (v[0] + v[1] + v[2]) / total : 0);
      }
    }
    cache = { lista, porCod, porUF, peso, mpe, setor, abert, caged, atend, rais, tempo, baixas, bioeco, inov, raisM, abertAnos };
    return cache;
  }
  for (const [uf, ms] of Object.entries(porUF)) {
    const interior = (DADOS[uf]?.interior ?? 70) / 100;
    let soma = 0;
    for (const m of ms) {
      if (m.cap) continue;
      const r = rng(String(m.cod));
      const z = Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
      const w = Math.exp(1.15 * z);
      peso.set(m.cod, w);
      soma += w;
    }
    const cap = ms.find((m) => m.cap);
    if (uf === 'DF') peso.set(cap.cod, 1);
    else {
      for (const m of ms) if (!m.cap) peso.set(m.cod, (peso.get(m.cod) / soma) * interior);
      if (cap) peso.set(cap.cod, 1 - interior);
    }
  }
  cache = { lista, porCod, porUF, peso, mpe, setor, abert, caged, atend, rais, tempo, baixas, bioeco, inov, raisM, abertAnos };
  return cache;
}

const memo = new Map();
/** Valores de um indicador para todos os municípios: Map(cod → valor) */
export function valoresMunicipais(base, indicadorId) {
  if (memo.has(indicadorId)) return memo.get(indicadorId);
  const ind = INDICADOR_BY_ID[indicadorId];
  const out = new Map();
  for (const m of base.lista) out.set(m.cod, valorMunicipal(base, ind, m));
  memo.set(indicadorId, out);
  return out;
}

const PORTE_POS = { epp: 0, me: 1, mei: 2 };

function valorMunicipal(base, ind, m) {
  if (ind.unidade === 'cat') return m.pred;
  // reais por município (retrato da API do Observatório)
  if (base.abert?.size && ind.id === 'aberturas') return base.abert.get(m.cod) ?? 0;
  if (base.tempo?.size && ind.id === 'tempo_abertura') return base.tempo.get(m.cod) ?? null;
  if (base.bioeco?.size && ind.id === 'bioeconomia') return base.bioeco.get(m.cod)?.[0] ?? null;
  if (base.inov?.size && (ind.id === 'inovacao' || ind.id === 'startups_ativas' || ind.id === 'ebts')) {
    const v = base.inov.get(m.cod);
    return v ? v[{ inovacao: 0, startups_ativas: 6, ebts: 7 }[ind.id]] : null;
  }
  if (base.baixas?.size && ind.id === 'baixas') {
    const v = base.mpe?.get(m.cod);
    const ativas = v ? v[0] + v[1] + v[2] : 0;
    return ativas ? ((base.baixas.get(m.cod) ?? 0) / ativas) * 100 : null;
  }
  if (base.rais?.size && (ind.id === 'vinculos_mpe' || ind.id === 'remuneracao')) {
    const r = base.rais.get(m.cod);
    if (ind.id === 'vinculos_mpe') return r ? r[0] : 0;
    return r && r[0] ? r[1] / r[0] : null;
  }
  if (base.atend?.size && (ind.id === 'atendimentos' || ind.id === 'atend_por_mil')) {
    const a = base.atend.get(m.cod);
    if (ind.id === 'atendimentos') return a ? a[0] : 0;
    const v = base.mpe?.get(m.cod);
    const ativas = v ? v[0] + v[1] + v[2] : 0;
    return a && ativas ? (a[2] / ativas) * 100 : null;
  }
  if (base.caged?.size && (ind.id === 'empregos' || ind.id === 'vagas_mpe')) {
    const c = base.caged.get(m.cod);
    if (!c) return ind.id === 'empregos' ? 0 : null;
    return ind.id === 'empregos' ? c[0] : participacaoVagas(c[0], c[1]);
  }
  if (base.setor?.size && ind.id.startsWith('setor_')) {
    const st = base.setor.get(m.cod);
    if (!st) return 0;
    return ind.id === 'setor_industria' ? st.industria + st.construcao : st[ind.id.slice(6)] ?? 0;
  }
  const rf = base.mpe?.get(m.cod);
  if (base.mpe?.size && (ind.id === 'ativas' || ind.id in PORTE_POS)) {
    if (!rf) return 0;
    const total = rf[0] + rf[1] + rf[2];
    if (ind.id === 'ativas') return total;
    return total ? (rf[PORTE_POS[ind.id]] / total) * 100 : null;
  }
  if (ind.biomaId) return m.biomas[ind.biomaId] || 0;
  const uf = DADOS[m.uf];
  if (!uf) return null;
  const v = uf[ind.id];
  if (ind.unidade === 'n') return Math.max(0, Math.round(v * base.peso.get(m.cod)));
  // razões/índices: valor da UF com variação local
  const r = rng(m.cod + ind.id);
  const f = 1 + (r() - 0.5) * 0.36 + (m.cap ? 0.06 : 0);
  if (ind.unidade === '%') return Math.min(100, Math.max(0, v * f));
  if (ind.unidade === 'idx') return Math.min(1, Math.max(0, v * f));
  return v * f;
}

export function buscarMunicipios(base, q, limite = 6) {
  const n = normaliza(q);
  if (n.length < 2) return [];
  const comeca = [];
  const contem = [];
  for (const m of base.lista) {
    if (m.busca.startsWith(n)) comeca.push(m);
    else if (m.busca.includes(n)) contem.push(m);
    if (comeca.length >= limite) break;
  }
  return [...comeca, ...contem].slice(0, limite);
}

export function normaliza(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

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
