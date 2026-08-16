import { SITE } from '../../data/siteConfig'

export const restaurantSchema = {
  '@context': 'https://schema.org',
  '@type': 'FoodEstablishment',
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  telephone: `+${SITE.whatsapp}`,
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'CL',
    addressLocality: 'Santiago',
    addressRegion: 'Región Metropolitana',
  },
  servesCuisine: ['Comida Chilena', 'Comida Casera'],
  priceRange: '$$',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '11:00',
      closes: '20:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday'],
      opens: '11:00',
      closes: '17:00',
    },
  ],
  sameAs: [SITE.social.instagram, SITE.social.tiktok].filter(Boolean),
  hasMenu: `${SITE.url}/menu`,
  potentialAction: {
    '@type': 'OrderAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `https://wa.me/${SITE.whatsapp}`,
      actionPlatform: ['https://schema.org/MobileWebPlatform'],
    },
  },
}

export const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})

/**
 * Escapes de `<` y `>` para el bloque JSON-LD.
 *
 * La barra invertida se arma con su código de carácter (92) a propósito. Escrita
 * como literal, la secuencia de escape unicode se interpreta al leer el archivo y
 * el reemplazo termina produciendo el MISMO carácter que quería evitar: un no-op
 * silencioso que se ve idéntico al código correcto. Construyéndola así no hay
 * ambigüedad posible, y de todos modos hay un test que comprueba el resultado
 * (src/tests/StructuredData.test.jsx).
 */
const BARRA = String.fromCharCode(92)
const ESCAPES = { '<': `${BARRA}u003c`, '>': `${BARRA}u003e` }

/**
 * Serializa el schema escapando `<` y `>`.
 *
 * JSON.stringify NO los escapa, así que un valor que contuviera "</script>"
 * cerraría la etiqueta antes de tiempo y lo que viniera después se ejecutaría
 * como HTML. Hoy los datos son del propio repositorio y no es explotable; se
 * escapa igual porque el día que un schema tome un dato de la base —el nombre de
 * un plato, un testimonio— el agujero aparece sin que nadie lo note. Los escapes
 * unicode son JSON válido y Google los interpreta igual.
 */
function serializar(schema) {
  return JSON.stringify(schema).replace(/[<>]/g, (c) => ESCAPES[c])
}

export default function StructuredData({ schema }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializar(schema) }} />
}
