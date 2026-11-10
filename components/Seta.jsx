'use client';
// Seta com a microinteração do luanedouradodesign.com.br: gira com
// `transition: transform .6s ease-in-out` quando o elemento que a contém (.seta-gatilho)
// recebe hover ou foco, ou quando o item anterior de uma trilha (.trilha) recebe hover.
//   base  ângulo de repouso (ex.: −90 para um chevron apontando para a direita)
//   giro  quanto gira no hover (padrão 360°: um giro completo que termina no lugar)
//   aberto  menus: soma 180° enquanto o menu está aberto
import Icon from './Icon';

export default function Seta({ name = 'chevron', size = 16, base = 0, giro = 360, aberto = false, className = '' }) {
  return (
    <span className={`seta ${className}`} style={{ '--seta-base': `${base + (aberto ? 180 : 0)}deg`, '--seta-giro': `${giro}deg` }} aria-hidden>
      <Icon name={name} size={size} />
    </span>
  );
}
