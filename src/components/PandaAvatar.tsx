/** Pandi, la mascota de AntiEstafa AR: un panda original con pañuelo en los colores de la app. */
export default function PandaAvatar({ className = "h-12 w-12", parpadeo = false }: { className?: string; parpadeo?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      {/* orejas */}
      <circle cx="28" cy="30" r="17" fill="#1f2a2e" />
      <circle cx="92" cy="30" r="17" fill="#1f2a2e" />
      <circle cx="28" cy="30" r="8" fill="#3b4a50" />
      <circle cx="92" cy="30" r="8" fill="#3b4a50" />
      {/* cabeza */}
      <ellipse cx="60" cy="62" rx="44" ry="40" fill="#ffffff" stroke="#d3e0e3" strokeWidth="2" />
      {/* manchas de los ojos */}
      <ellipse cx="41" cy="58" rx="13" ry="16" transform="rotate(-22 41 58)" fill="#1f2a2e" />
      <ellipse cx="79" cy="58" rx="13" ry="16" transform="rotate(22 79 58)" fill="#1f2a2e" />
      {/* ojos */}
      <g className={parpadeo ? "panda-ojos" : undefined}>
        <circle cx="43" cy="57" r="5.5" fill="#ffffff" />
        <circle cx="77" cy="57" r="5.5" fill="#ffffff" />
        <circle cx="44" cy="58" r="2.6" fill="#1f2a2e" />
        <circle cx="76" cy="58" r="2.6" fill="#1f2a2e" />
        <circle cx="45" cy="56.5" r="1" fill="#ffffff" />
        <circle cx="77" cy="56.5" r="1" fill="#ffffff" />
      </g>
      {/* mejillas */}
      <circle cx="32" cy="76" r="5" fill="#f6b8b0" opacity="0.7" />
      <circle cx="88" cy="76" r="5" fill="#f6b8b0" opacity="0.7" />
      {/* nariz y sonrisa */}
      <ellipse cx="60" cy="72" rx="6" ry="4.2" fill="#1f2a2e" />
      <path d="M53 79c3 4 11 4 14 0" fill="none" stroke="#1f2a2e" strokeWidth="2.6" strokeLinecap="round" />
      {/* pañuelo */}
      <path d="M26 96c10 8 58 8 68 0l-4 12c-14 7-46 7-60 0z" fill="#0b5a68" />
      <path d="M56 101l4 9 4-9z" fill="#0f7080" />
    </svg>
  );
}
