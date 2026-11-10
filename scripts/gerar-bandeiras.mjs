// Converte as bandeiras (src/assets/bandeiras/<UF>.svg) em um módulo JS com cores inline
// e ids prefixados por UF (evita colisão de .cls-N e de clipPath entre SVGs na mesma página).
// Fonte: github.com/pierrelapalu/icones-bandeiras-br-uf — estilo "full", licença CC0.
// Uso: node scripts/gerar-bandeiras.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const DIR = process.argv[2] || 'src/assets/bandeiras';
const OUT = process.argv[3] || 'src/components/bandeiras.js';
const PREF = process.argv[4] || '';
const saida = {};

for (const arq of readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort()) {
  const uf = basename(arq, '.svg');
  const src = readFileSync(join(DIR, arq), 'utf8');
  const vb = src.match(/viewBox="([^"]+)"/)[1];
  const regras = {};
  for (const st of src.matchAll(/<style>([\s\S]*?)<\/style>/g)) {
    for (const m of st[1].matchAll(/((?:\.cls-\d+\s*,?\s*)+)\{([^}]*)\}/g)) {
      const decl = Object.fromEntries(
        m[2].split(';').map((d) => d.split(':').map((x) => x.trim())).filter(([k, v]) => k && v),
      );
      for (const sel of m[1].split(',').map((s) => s.trim().slice(1)).filter(Boolean)) regras[sel] = { ...(regras[sel] || {}), ...decl };
    }
  }
  const corpo = src
    .replace(/<\?xml[^>]*>/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/<defs>\s*<\/defs>/g, '')
    .replace(/\sdata-name="[^"]*"/g, '')
    .replace(/\sid="([^"]+)"/g, (_, id) => ` id="${PREF}${uf}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${PREF}${uf}-${id})`)
    .replace(/class="([^"]+)"/g, (_, cls) => {
      const d = cls.split(/\s+/).reduce((acc, c) => ({ ...acc, ...(regras[c] || {}) }), {});
      return Object.entries(d).map(([k, v]) => `${k}="${v}"`).join(' ');
    })
    .replace(/\s+/g, ' ')
    .trim();
  saida[uf] = { vb, svg: corpo };
}

writeFileSync(OUT, `// GERADO por scripts/gerar-bandeiras.mjs — não edite à mão.\n// Bandeiras das UFs: github.com/pierrelapalu/icones-bandeiras-br-uf (CC0)\nexport default ${JSON.stringify(saida)};\n`);
console.log(`${Object.keys(saida).length} bandeiras → ${OUT}`);
