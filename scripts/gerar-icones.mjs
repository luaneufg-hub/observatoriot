// Converte os SVGs exportados do Figma (lib/icones/icones-kit) em um módulo JS
// com cores inline (sem <style>/.cls-N, que colidem quando há vários SVGs na página).
// Navy vira `currentColor` (ou variável CSS nas ilustrações) para acompanhar o tema.
//
// Uso:  node scripts/gerar-icones.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const DIR = 'lib/icones/icones-kit';
const OUT = 'lib/icones/iconesKit.js';

// Ilustrações coloridas dos setores (mantêm a paleta; navy/lima viram variáveis)
const ILUSTRACOES = new Set(['agro', 'comercio', 'industria', 'servico', 'servico_publico']);

const NAVY = ['#0b2574', '#080568', '#070568', '#0a2474'];

function cor(c, ilustracao) {
  const v = c.trim().toLowerCase();
  if (NAVY.includes(v)) return ilustracao ? 'var(--ilu-navy, #0B2574)' : 'currentColor';
  if (!ilustracao) return v;
  if (v === '#cadf61') return 'var(--ilu-lima, #CADF61)';
  if (v === '#95a047') return 'var(--ilu-oliva, #95A047)';
  if (v === '#2a4fda') return 'var(--ilu-azul, #2A4FDA)';
  return v;
}

const saida = {};
for (const arq of readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort()) {
  const nome = basename(arq, '.svg');
  const ilu = ILUSTRACOES.has(nome);
  let src = readFileSync(join(DIR, arq), 'utf8');
  const vb = src.match(/viewBox="([^"]+)"/)[1];

  // regras .cls-N { ... }
  const regras = {};
  const style = (src.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  for (const m of style.matchAll(/((?:\.cls-\d+\s*,?\s*)+)\{([^}]*)\}/g)) {
    const decl = Object.fromEntries(
      m[2]
        .split(';')
        .map((d) => d.split(':').map((x) => x.trim()))
        .filter(([k, v]) => k && v),
    );
    for (const sel of m[1].split(',').map((s) => s.trim().slice(1)).filter(Boolean)) {
      regras[sel] = { ...(regras[sel] || {}), ...decl };
    }
  }

  let corpo = src
    .replace(/<\?xml[^>]*>/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<defs>[\s\S]*?<\/defs>/, '')
    .replace(/\s(id|data-name)="[^"]*"/g, '')
    .replace(/class="([^"]+)"/g, (_, cls) => {
      const d = cls.split(/\s+/).reduce((acc, c) => ({ ...acc, ...(regras[c] || {}) }), {});
      return Object.entries(d)
        .map(([k, v]) => `${k}="${/^(fill|stroke)$/.test(k) && v !== 'none' ? cor(v, ilu) : v}"`)
        .join(' ');
    })
    .replace(/\s+/g, ' ')
    .trim();

  saida[nome] = { vb, ilu, svg: corpo };
}

writeFileSync(
  OUT,
  `// GERADO por scripts/gerar-icones.mjs — não edite à mão.\n// Origem: ${DIR} (UI Kit Observatório)\nexport default ${JSON.stringify(saida, null, 0)};\n`,
);
console.log(`${Object.keys(saida).length} ícones → ${OUT}`);
