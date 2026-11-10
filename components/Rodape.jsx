'use client';
// Rodapé do site, a partir do modelo do Figma (nov. 2026).
// Conteúdo: rodapé de observatorio.sebrae.com.br e Carta de Serviços ao Usuário do Sebrae (2023).
// Endereço: sede atual do Sebrae Nacional (SGAS 605), confirmado pela equipe em nov. 2026.
import Icon from './Icon';
import Seta from './Seta';
import { LogoDatawheel, LogoSebrae } from './LogosParceiros';

const OST = 'https://observatorio.sebrae.com.br';

const SEBRAE = [
  { rotulo: 'Portal Sebrae', href: 'https://sebrae.com.br/' },
  { rotulo: 'Fale conosco', href: 'https://sebrae.com.br/contato' },
  { rotulo: 'Data Sebrae', href: 'https://datasebrae.com.br/' },
  {
    rotulo: 'Privacidade e LGPD',
    href: 'https://datasebrae.com.br/wp-content/uploads/2023/11/Politica-de-Privacidade-e-Tratamento-de-Dados-Pessoais-do-Sistema-SEBRAE-Resolucao-CDN-357.2020.pdf',
  },
];

const OBSERVATORIO = [
  { rotulo: 'Página Brasil', href: '#/', interno: true },
  { rotulo: 'Estudos', href: '#/estudos', interno: true },
  { rotulo: 'Calendário', href: '#/calendario', interno: true },
  { rotulo: 'Territórios', href: `${OST}/explore?report=Geography` },
  { rotulo: 'Setores', href: `${OST}/explore?report=Industry` },
  { rotulo: 'Data Explorer', href: `${OST}/data-explorer` },
  { rotulo: 'Midiateca', href: `${OST}/dashboard/midiateca` },
];

const INSTITUCIONAL = [
  { rotulo: 'Sobre o Observatório', href: `${OST}/about#o-projeto` },
  { rotulo: 'Fontes de dados', href: `${OST}/about/fontes-de-dados` },
  { rotulo: 'Glossário', href: `${OST}/about/glossario` },
  { rotulo: 'Contato', href: `${OST}/about#contato` },
];

const EMAIL = 'apoiodados@sebrae.com.br';
const ASSUNTO = encodeURIComponent('Contato - Observatório Setorial Territorial Brasil');

// Ícones de redes em traço, no mesmo peso dos ícones Iconly Light.
const REDES = [
  {
    nome: 'LinkedIn',
    href: 'https://www.linkedin.com/company/sebrae',
    icone: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <path d="M8 10.5V16M8 7.75v.01M11.5 16v-5.5M11.5 13c0-1.5 1-2.5 2.25-2.5S16 11.25 16 12.75V16" />
      </>
    ),
  },
  {
    nome: 'Instagram',
    href: 'https://www.instagram.com/sebrae/',
    icone: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.25 6.75v.01" />
      </>
    ),
  },
  {
    nome: 'Facebook',
    href: 'https://facebook.com/sebrae',
    icone: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M13 21v-8.5h2.5M13 12.5V10c0-1.4.8-2.25 2.25-2.25H16M10.5 12.5H13" />
      </>
    ),
  },
  {
    nome: 'X',
    href: 'https://x.com/sebrae',
    icone: (
      <>
        <path d="M4 4h4.5L20 20h-4.5Z" />
        <path d="M19.5 4l-6.25 7.1M4.5 20l6.25-7.1" />
      </>
    ),
  },
];

function Link({ href, interno, children, className = '' }) {
  const externo = !interno && !href.startsWith('mailto:') && !href.startsWith('tel:');
  return (
    <a
      href={href}
      {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`rounded-sm underline-offset-4 transition hover:text-lima hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima ${className}`}
    >
      {children}
      {externo && <span className="sr-only"> (abre em nova aba)</span>}
    </a>
  );
}

function Coluna({ titulo, itens }) {
  return (
    <nav aria-label={titulo}>
      <h2 className="mb-4 font-display text-[12px] font-bold uppercase tracking-[0.12em] text-white">{titulo}</h2>
      <ul className="space-y-3 text-[14px] text-[#e6e3f2]">
        {itens.map((l) => (
          <li key={l.rotulo}>
            <Link href={l.href} interno={l.interno}>
              {l.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Contato({ icone, rotulo, children }) {
  return (
    <div className="flex gap-3">
      <Icon name={icone} size={20} className="mt-0.5 flex-none text-lima" />
      <div>
        <p className="text-[12px] font-semibold text-white">{rotulo}</p>
        <div className="mt-1 text-[14px] leading-snug text-[#e6e3f2]">{children}</div>
      </div>
    </div>
  );
}

export default function Rodape() {
  return (
    <footer className="relative bg-navy font-body text-white [[data-theme=escuro]_&]:bg-[#0d0d0d] [[data-theme=navy]_&]:bg-[#0c0b3a]">
      <div aria-hidden="true" className="h-[3px] bg-gradient-to-r from-[#36BF76] via-[#60B466] to-[#2A4FDA]" />

      <div className="mx-auto max-w-[1240px] px-4 pb-8 pt-12 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.1fr_1fr_1fr_1.3fr] lg:gap-8">
          {/* Logos */}
          <div className="col-span-2 flex flex-col items-start gap-7 lg:col-span-1">
            <a href="https://sebrae.com.br/" target="_blank" rel="noopener noreferrer" className="block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lima">
              <span className="mb-2 block text-[12px] text-[#c3c5ec]">Um projeto</span>
              <LogoSebrae className="h-12 w-auto" title="Sebrae (abre em nova aba)" />
            </a>
            <a href="https://www.datawheel.us/" target="_blank" rel="noopener noreferrer" className="block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lima">
              <span className="mb-2 block text-[12px] text-[#c3c5ec]">Desenvolvido por</span>
              <LogoDatawheel className="h-8 w-auto" title="Datawheel (abre em nova aba)" />
            </a>
          </div>

          <Coluna titulo="Sebrae" itens={SEBRAE} />
          <Coluna titulo="Observatório" itens={OBSERVATORIO} />

          {/* Contato */}
          <div className="col-span-2 space-y-6 lg:col-span-1">
            <Contato icone="telefone" rotulo="Central de relacionamento">
              <Link href="tel:08005700800">0800 570 0800</Link>
              <span className="block text-[12px] text-[#c3c5ec]">telefone e WhatsApp, gratuito</span>
            </Contato>
            <Contato icone="mensagem" rotulo="Dados do Observatório">
              <Link href={`mailto:${EMAIL}?subject=${ASSUNTO}`}>{EMAIL}</Link>
            </Contato>
            <Contato icone="pino" rotulo="Sebrae Nacional">
              <address className="not-italic">
                SGAS 605, Conjunto A, Asa Sul
                <br />
                Brasília/DF · CEP 70200-904
              </address>
            </Contato>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/15 pt-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <nav aria-label="Institucional">
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[#e6e3f2]">
                {INSTITUCIONAL.map((l) => (
                  <li key={l.rotulo}>
                    <Link href={l.href}>{l.rotulo}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <ul aria-label="Sebrae nas redes sociais" className="-ml-2.5 flex gap-2">
              {REDES.map((r) => (
                <li key={r.nome}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${r.nome} do Sebrae (abre em nova aba)`}
                    className="grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/10 hover:text-lima focus-visible:outline focus-visible:outline-2 focus-visible:outline-lima"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {r.icone}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            {/* só em telas pequenas: volta para a versão mobile (o desktop não muda) */}
            <a href="#/m" className="inline-flex items-center gap-2 rounded-full bg-lima px-4 py-2 text-[13px] font-semibold text-navy md:hidden">
              voltar à versão mobile
            </a>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="seta-gatilho inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-white/10 hover:text-lima focus-visible:outline focus-visible:outline-2 focus-visible:outline-lima -ml-3 lg:ml-0 lg:-mr-3"
            >
              <Seta name="seta-dir" size={14} base={-90} />
              voltar ao topo
            </button>
            <p className="text-[12px] text-[#c3c5ec]">
              © 2026 Sebrae · Serviço Brasileiro de Apoio às Micro e Pequenas Empresas. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
