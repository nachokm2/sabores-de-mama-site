import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import StructuredData from '../components/seo/StructuredData'

/**
 * El bloque JSON-LD se inyecta con dangerouslySetInnerHTML, así que su
 * serialización tiene que escapar `<` y `>`.
 *
 * JSON.stringify NO los escapa: un valor que contenga "</script>" cerraría la
 * etiqueta antes de tiempo y lo que viniera después se ejecutaría como HTML. Hoy
 * los datos son del propio repositorio y no es explotable, pero el día que un
 * schema tome un dato de la base —el nombre de un plato, un testimonio— el
 * agujero aparece sin que nadie lo note. Este test es la red.
 */
describe('StructuredData (JSON-LD)', () => {
  const CIERRE = '</' + 'script>'

  it('escapa < y > para que no se pueda cerrar la etiqueta', () => {
    const { container } = render(
      <StructuredData schema={{ '@type': 'Restaurant', name: `Plato ${CIERRE}<img src=x onerror=alert(1)>` }} />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeTruthy()

    const contenido = script.innerHTML
    // Lo que importa: el texto inyectado NO puede contener el cierre de etiqueta
    // ni una etiqueta suelta.
    expect(contenido).not.toContain(CIERRE)
    expect(contenido).not.toContain('<img')
    // Y en su lugar quedan los escapes unicode, que son JSON válido.
    expect(contenido).toContain('u003c')
  })

  it('sigue siendo JSON válido y conserva los valores', () => {
    const schema = { '@context': 'https://schema.org', '@type': 'Restaurant', name: 'Sabores de Mamá' }
    const { container } = render(<StructuredData schema={schema} />)
    const contenido = container.querySelector('script[type="application/ld+json"]').innerHTML

    const parseado = JSON.parse(contenido)
    expect(parseado.name).toBe('Sabores de Mamá')
    expect(parseado['@context']).toBe('https://schema.org')
  })
})
