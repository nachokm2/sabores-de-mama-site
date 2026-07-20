// Botón de "play" superpuesto, para indicar que una imagen enlaza a un video
// (reel de Instagram). Decorativo: el enlace/clic lo maneja el contenedor.
export default function PlayBadge() {
  return (
    <span
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <span className="w-16 h-16 rounded-full bg-espresso/50 backdrop-blur-sm border border-ivory/50 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-ivory ml-0.5">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  )
}
