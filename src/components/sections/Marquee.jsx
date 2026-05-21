import { useReducedMotion } from '../../hooks/useReducedMotion'

const ITEMS = [
  '🥘 Cazuela de Vacuno',
  '🌽 Pastel de Choclo',
  '🥟 Empanadas de Pino',
  '🍜 Sopa de Abuela',
  '🍞 Pan Amasado',
  '🍮 Leche Asada',
  '🥬 Charquicán',
  '🫘 Porotos Granados',
]

export default function Marquee() {
  const prefersReduced = useReducedMotion()
  const doubled = [...ITEMS, ...ITEMS]

  return (
    <div
      className="bg-amber overflow-hidden py-3.5"
      aria-label="Nuestros platos destacados"
    >
      <div
        className="flex items-center gap-12"
        style={prefersReduced ? {} : { animation: 'marquee 28s linear infinite' }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="font-body text-espresso text-sm font-medium tracking-wide whitespace-nowrap flex-shrink-0"
          >
            {item}
            <span className="ml-12 text-espresso/30" aria-hidden="true">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
