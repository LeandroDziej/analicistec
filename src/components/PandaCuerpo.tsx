/** Pandi de cuerpo entero: un osito panda original, sentado, con pañuelo y un brazo que saluda. */
export default function PandaCuerpo({ className = "h-28 w-24", saludando = false }: { className?: string; saludando?: boolean }) {
  const negro = "#1f2a2e";
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden="true" focusable="false">
      {/* sombra en el piso */}
      <ellipse cx="60" cy="144" rx="38" ry="5" fill="#12303a" opacity="0.18" />

      {/* patas */}
      <ellipse cx="38" cy="130" rx="15" ry="11" fill={negro} />
      <ellipse cx="82" cy="130" rx="15" ry="11" fill={negro} />
      <ellipse cx="38" cy="132" rx="7" ry="5" fill="#3b4a50" />
      <ellipse cx="82" cy="132" rx="7" ry="5" fill="#3b4a50" />

      {/* cuerpo */}
      <ellipse cx="60" cy="104" rx="34" ry="32" fill="#ffffff" stroke="#d3e0e3" strokeWidth="2" />
      <ellipse cx="60" cy="110" rx="18" ry="16" fill="#f3f7f8" />

      {/* brazo izquierdo (quieto) */}
      <ellipse cx="29" cy="104" rx="10" ry="16" transform="rotate(18 29 104)" fill={negro} />

      {/* brazo derecho (saluda) */}
      <g className={saludando ? "panda-saludo" : undefined} style={{ transformOrigin: "88px 92px" }}>
        <ellipse cx="96" cy="80" rx="9.5" ry="17" transform="rotate(-28 96 80)" fill={negro} />
        <circle cx="103" cy="66" r="7" fill={negro} />
      </g>

      {/* pañuelo */}
      <path d="M30 78c12 9 48 9 60 0l-3 11c-15 7-39 7-54 0z" fill="#0b5a68" />
      <path d="M56 84l4 12 4-12z" fill="#0f7080" />

      {/* orejas */}
      <circle cx="31" cy="20" r="13" fill={negro} />
      <circle cx="89" cy="20" r="13" fill={negro} />
      <circle cx="31" cy="20" r="6" fill="#3b4a50" />
      <circle cx="89" cy="20" r="6" fill="#3b4a50" />

      {/* cabeza */}
      <ellipse cx="60" cy="46" rx="36" ry="32" fill="#ffffff" stroke="#d3e0e3" strokeWidth="2" />
      <ellipse cx="45" cy="44" rx="10.5" ry="13" transform="rotate(-22 45 44)" fill={negro} />
      <ellipse cx="75" cy="44" rx="10.5" ry="13" transform="rotate(22 75 44)" fill={negro} />
      <g className="panda-ojos">
        <circle cx="46.5" cy="43" r="4.5" fill="#ffffff" />
        <circle cx="73.5" cy="43" r="4.5" fill="#ffffff" />
        <circle cx="47.3" cy="44" r="2.2" fill={negro} />
        <circle cx="72.7" cy="44" r="2.2" fill={negro} />
        <circle cx="48" cy="42.6" r="0.9" fill="#ffffff" />
        <circle cx="73.4" cy="42.6" r="0.9" fill="#ffffff" />
      </g>
      <circle cx="36" cy="58" r="4" fill="#f6b8b0" opacity="0.7" />
      <circle cx="84" cy="58" r="4" fill="#f6b8b0" opacity="0.7" />
      <ellipse cx="60" cy="56" rx="5" ry="3.5" fill={negro} />
      <path d="M54 62c3 3.5 9 3.5 12 0" fill="none" stroke={negro} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
