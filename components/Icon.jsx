'use client';
// Ícones.
// - Ícones de conteúdo (setores, grupos, indicadores) vêm do UI Kit — ver DO_KIT.
// - Ícones de sistema (busca, zoom, setas, filtros…) vêm do Iconly, família Regular:
//   aparência "border" (Light) por padrão e duotone (Two-tone) nos estados ativos,
//   controlada pela variável CSS --icon-2 (cor do tom secundário).
import KIT from '@/lib/icones/iconesKit';
import ICONLY from '@/lib/icones/iconly';

const P = {
  // setores
  agro: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5Z" />
      <path d="M12 14.5c0-3.2-2.4-5.2-5.6-5.2 0 3.2 2.4 5.2 5.6 5.2Z" />
      <path d="M7 21h10" />
    </>
  ),
  comercio: (
    <>
      <path d="M3.5 9.5 5 4h14l1.5 5.5" />
      <path d="M3.5 9.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0 1.4 1.1 2.5 2.5 2.5h2c1.4 0 2.5-1.1 2.5-2.5 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" />
      <path d="M5 12v8h14v-8" />
      <path d="M10 20v-4.5h4V20" />
    </>
  ),
  industria: (
    <>
      <path d="M3 20V10l5 3V10l5 3V10l5 3V4h3v16Z" />
      <path d="M7 17h2M11 17h2M15 17h2" />
    </>
  ),
  servicos: (
    <>
      <path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6L20 12l-8 8-4-4 8-8-.9-.9a3.5 3.5 0 0 0-.6-.6Z" />
      <path d="M4 20l3.2-3.2" />
      <path d="M6.5 3.5 9 6l-1.5 1.5L5 5" />
    </>
  ),
  admpub: (
    <>
      <path d="M3 9h18L12 4Z" />
      <path d="M5.5 9v8M9.8 9v8M14.2 9v8M18.5 9v8" />
      <path d="M3 20h18" />
    </>
  ),
  // grupos
  setores: (
    <>
      <path d="M4 20V11M10 20V6M16 20v-6M21 20H3" />
    </>
  ),
  sebrae: (
    <>
      <path d="M8 13.5 11 16.5c.6.6 1.5.6 2.1 0l5.4-5.4" />
      <path d="m2.5 11 4-4 3 1.5L12 7l3 .8L21.5 11" />
      <path d="M2.5 11 6 14.5M21.5 11 18 14.5" />
    </>
  ),
  localizacao: (
    <>
      <path d="M12 21s-7-6-7-11.5a7 7 0 0 1 14 0C19 15 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  bioma: (
    <>
      <path d="M5 19c0-8 5-13 14-14-.5 9-5.5 14-14 14Z" />
      <path d="M5 19 13 11" />
    </>
  ),
  empresa: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M3 12.5h18" />
    </>
  ),
  registro: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  pessoas: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5M17.5 14.5a5.5 5.5 0 0 1 3 5.5" />
    </>
  ),
  moeda: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2c-.5-.8-1.5-1.2-2.8-1.2-1.6 0-2.7.8-2.7 2s1 1.7 2.7 2 2.8.8 2.8 2.1-1.2 2-2.8 2c-1.3 0-2.4-.5-2.9-1.3M12 6.5V8M12 16v1.5" />
    </>
  ),
  relogio: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  // interface
  busca: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  'seta-dir': <path d="m9 5 7 7-7 7" />,
  'seta-esq': <path d="M19 12H5M11 6l-6 6 6 6" />,
  filtros: <path d="M3 7h18M3 12h18M3 17h18M8 5v4M15 10v4M10 15v4" />,
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  lua: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  voltar: <path d="m15 6-6 6 6 6" />,
  mais: <path d="M12 5v14M5 12h14" />,
  menos: <path d="M5 12h14" />,
  expandir: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  recentrar: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </>
  ),
  pino: (
    <>
      <path d="M12 21s-7-6-7-11.5a7 7 0 0 1 14 0C19 15 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  camadas: (
    <>
      <path d="m12 3 9 5-9 5-9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  pontos: (
    <>
      <circle cx="7" cy="8" r="3" />
      <circle cx="16.5" cy="7" r="2" />
      <circle cx="14" cy="16" r="4" />
    </>
  ),
  coropletico: (
    <>
      <path d="M4 5h7v6H4ZM13 5h7v4h-7ZM13 11h7v8h-7ZM4 13h7v6H4Z" />
    </>
  ),
  tabela: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10" />
    </>
  ),
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  robo: (
    <>
      <rect x="4.5" y="8" width="15" height="11" rx="3" />
      <path d="M12 8V5M12 5h.01" />
      <circle cx="9.2" cy="13.2" r="1.2" />
      <circle cx="14.8" cy="13.2" r="1.2" />
      <path d="M9.5 16.5h5M2.5 12.5v2.5M21.5 12.5v2.5" />
    </>
  ),
  tijolos: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="0.8" />
      <path d="M3 12h18M9 7v5M15 7v5M6 12v5M12 12v5M18 12v5" />
    </>
  ),
  ferramenta: (
    <>
      <path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6L20 12l-8 8-4-4 8-8-.9-.9a3.5 3.5 0 0 0-.6-.6Z" />
      <path d="M4 20l3.2-3.2" />
      <path d="M6.5 3.5 9 6l-1.5 1.5L5 5" />
    </>
  ),
  mulher: (
    <>
      <circle cx="12" cy="5.5" r="2.5" />
      <path d="M12 9c-2 0-3 1.3-3.5 3L7 17h3v4h4v-4h3l-1.5-5c-.5-1.7-1.5-3-3.5-3Z" />
    </>
  ),
  construcao: (
    <>
      <path d="M5 15a7 7 0 0 1 14 0" />
      <path d="M10 8.4V15M14 8.4V15" />
      <path d="M3 15h18v1.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
    </>
  ),
};

// Ícones do UI Kit (SVGs exportados do Figma, ver scripts/gerar-icones.mjs).
// Mapeia o nome usado no código → arquivo do kit.
const DO_KIT = {
  // setores (versão linha)
  agro: 'Ativo_44',
  comercio: 'Ativo_46',
  industria: 'Ativo_81',
  servicos: 'Ativo_45',
  admpub: 'Ativo_69',
  // grupos
  setores: 'Ativo_62',
  sebrae: 'Ativo_60',
  localizacao: 'Ativo_53',
  bioma: 'Ativo_48',
  empresa: 'Ativo_67',
  registro: 'Ativo_54',
  // indicadores
  pessoas: 'Ativo_80',
  moeda: 'Ativo_61',
  predio: 'Ativo_65',
  rede: 'Ativo_56',
  documento: 'Ativo_52',
  gravata: 'Ativo_50',
  maleta: 'Ativo_69',
  calculadora: 'Ativo_68',
  empresas: 'Ativo_64',
  // novos no kit (ainda sem uso na página)
  direcoes: 'Ativo_55',
  selo: 'Ativo_57',
  contrato: 'Ativo_70',
  caneta: 'Ativo_71',
  bicicleta: 'Ativo_47',
};

// Ilustrações coloridas dos setores
export const ILUSTRACAO_SETOR = {
  setor_agro: 'agro',
  setor_comercio: 'comercio',
  setor_industria: 'industria',
  setor_servicos: 'servico',
  setor_admpub: 'servico_publico',
};

export function KitSvg({ nome, size = 20, className, title }) {
  const ic = KIT[nome];
  if (!ic) return null;
  return (
    <svg
      className={className}
      height={size}
      width={size}
      viewBox={ic.vb}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      dangerouslySetInnerHTML={{ __html: (title ? `<title>${title}</title>` : '') + ic.svg }}
    />
  );
}

export function IconlyIcon({ name, size = 20, className, title }) {
  const partes = ICONLY[name];
  return (
    <svg
      className={`iconly${className ? ' ' + className : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {partes.map((p, i) => (
        <path key={i} className={p.s ? 'iconly__2' : 'iconly__1'} transform={`matrix(${p.t.join(' ')})`} d={p.d} />
      ))}
    </svg>
  );
}

export default function Icon({ name, size = 20, stroke = 1.75, className, title }) {
  if (DO_KIT[name]) return <KitSvg nome={DO_KIT[name]} size={size} className={className} title={title} />;
  if (ICONLY[name]) return <IconlyIcon name={name} size={size} className={className} title={title} />;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {P[name] || P.info}
    </svg>
  );
}
