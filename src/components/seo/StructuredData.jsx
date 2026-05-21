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
  sameAs: [SITE.social.instagram, SITE.social.facebook],
  hasMenu: `${SITE.url}/#menu`,
  potentialAction: {
    '@type': 'OrderAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `https://wa.me/${SITE.whatsapp}`,
      actionPlatform: ['http://schema.org/MobileWebPlatform'],
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

export default function StructuredData({ schema }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
