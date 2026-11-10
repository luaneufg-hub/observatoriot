// URL de um arquivo de /public resolvida pelo endereço da página (funciona na raiz e em subpasta).
export const asset = (caminho) => (typeof document === 'undefined' ? `/${caminho}` : new URL(caminho, document.baseURI).href);
