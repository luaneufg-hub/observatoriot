// URL absoluta de um arquivo em /public/geo, resolvida a partir do endereço da página.
// Assim o mesmo código funciona na raiz do site (Next.js) e numa subpasta (versão estática).
// Precisa ser absoluta porque o MapLibre baixa o GeoJSON dentro de um Web Worker.
export const geo = (arquivo) =>
  typeof document === 'undefined' ? `/geo/${arquivo}` : new URL(`geo/${arquivo}`, document.baseURI).href;
