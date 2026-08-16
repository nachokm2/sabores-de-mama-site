import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import { WHATSAPP, getWhatsAppLink } from '../data/siteConfig'

// Preguntas y respuestas factuales y citables (comunas, precios, duración, cómo
// pedir/pagar). Este mismo contenido alimenta el FAQPage schema de abajo, para
// que Google y los buscadores de IA (ChatGPT, Perplexity…) puedan extraer y
// citar las respuestas.
const FAQ_ITEMS = [
  {
    q: '¿Qué es Sabores de Mamá?',
    a: 'Sabores de Mamá es un servicio de comida casera a domicilio en Santiago de Chile. Preparamos almuerzos y platos caseros, porcionados y sellados al vacío, listos para disfrutar en tu hogar.',
  },
  {
    q: '¿En qué consiste el servicio de Meal Prep?',
    a: 'Preparamos tus platos caseros, los porcionamos y los sellamos al vacío para que los conserves durante la semana. Eliges hasta 5 preparaciones. Valor: $60.000; el despacho depende de tu comuna.',
  },
  {
    q: '¿En qué consiste la Cocinera a Domicilio?',
    a: 'Mamá va a tu hogar y cocina hasta 5 preparaciones con tus ingredientes. Recibes tu lista de compras, y al terminar deja la cocina limpia. Valor: $55.000 + movilización según comuna.',
  },
  {
    q: '¿En qué comunas entregan?',
    a: 'Meal Prep: Las Condes, Providencia, La Reina, Ñuñoa, Vitacura, Santiago, Lo Barnechea y San Miguel. Cocinera a Domicilio: Las Condes, Providencia, Vitacura y Ñuñoa.',
  },
  {
    q: '¿Cuántas preparaciones puedo elegir?',
    a: 'Hasta 5 preparaciones por pedido, de un menú de más de 60 platos caseros. Si tienes un plato en mente que no está en el listado, nos adaptamos y armamos un menú personalizado.',
  },
  {
    // Va en la página de FAQ además de en la home: es la pregunta que decide la
    // compra y esta página es la que aparece en las búsquedas de Google.
    q: '¿Cuántas porciones rinde cada preparación?',
    a: 'En Meal Prep cada preparación rinde 5 porciones individuales, porcionadas y selladas al vacío una por una. Como eliges hasta 5 preparaciones por pedido, son hasta 25 porciones para tu semana. En la Cocinera a Domicilio lo eliges tú: al armar el pedido indicas para cuántas personas cocinamos (de 1 a 5) y con eso calculamos la lista de compras.',
  },
  {
    q: '¿Cómo hago un pedido?',
    a: 'Eliges tus platos, la fecha de entrega y tu comuna directamente en el sitio web. Al confirmar coordinamos el pago. También puedes escribirnos por WhatsApp para hacer tu pedido.',
  },
  {
    q: '¿Cómo se paga?',
    a: 'El pago se realiza por transferencia bancaria al confirmar el pedido: te enviamos los datos por correo. Una vez validado el pago, preparamos y despachamos tu pedido.',
  },
  {
    q: '¿Cuánto dura la comida sellada al vacío?',
    a: 'Viene porcionada y sellada al vacío. Refrigerada dura entre 3 y 4 días; congelada, de 1 a 3 meses según el plato. En cada pedido te indicamos la duración recomendada y cómo conservarla.',
  },
  {
    q: '¿La comida es realmente casera y sin conservantes?',
    a: 'Sí. Son recetas caseras de Estela, cocinadas con ingredientes frescos y sin conservantes: comida como la de casa, lista para disfrutar.',
  },
  {
    q: '¿Hacen comida para empresas u oficinas?',
    a: 'Sí. Ofrecemos almuerzos y colaciones caseras para oficinas y empresas en Santiago, con menú a medida y pedidos recurrentes. Coordinamos la cotización por WhatsApp.',
  },
  {
    q: '¿Puedo agregar ensaladas o postres saludables?',
    a: 'Sí. Puedes sumar ensaladas y postres/dulces saludables a tu pedido; se agregan como adicionales al momento de armarlo. Los dulces saludables no requieren ingredientes de tu parte.',
  },
]

// FAQPage schema (estático, en el HTML pre-renderizado). Se escapan < > para
// evitar cualquier riesgo de romper el bloque <script> (defensa en profundidad).
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((it) => ({
    '@type': 'Question',
    name: it.q,
    acceptedAnswer: { '@type': 'Answer', text: it.a },
  })),
}
const faqJsonLd = JSON.stringify(faqSchema).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

function QA({ item, index }) {
  return (
    <motion.div
      className="bg-ivory border border-wheat/50 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: [0.19, 1, 0.22, 1] }}
    >
      <h3 className="font-display text-espresso text-lg font-bold mb-2">{item.q}</h3>
      <p className="font-body text-warm-gray text-sm leading-relaxed">{item.a}</p>
    </motion.div>
  )
}

export default function PreguntasFrecuentes() {
  return (
    <>
      <SEOHead
        title="Preguntas Frecuentes"
        description="Preguntas frecuentes de Sabores de Mamá: comunas de entrega, precios, cómo pedir y pagar, cuánto dura la comida sellada al vacío, comida para empresas y más."
        canonical="https://saboresdemama.com/preguntas-frecuentes"
      />
      {/* FAQPage schema estático (lo leen Google y los buscadores de IA) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />

      <Navbar />

      <main>
        <PageHero
          label="Preguntas frecuentes"
          title="Todo lo que"
          titleHighlight="necesitas saber."
          subtitle="Comunas de entrega, precios, cómo pedir y pagar, y cuánto dura la comida. Si te queda una duda, escríbenos por WhatsApp."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Preguntas frecuentes', href: '/preguntas-frecuentes' }]}
        >
          <a href={getWhatsAppLink(WHATSAPP.faqMessage)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp text-sm">
            Consultar por WhatsApp
          </a>
        </PageHero>

        <section className="section-padding bg-cream" aria-labelledby="faq-heading">
          <div className="container-site max-w-3xl">
            <div className="text-center mb-10">
              <SectionLabel>Resolvemos tus dudas</SectionLabel>
              <h2 id="faq-heading" className="section-title text-espresso mt-4">Preguntas frecuentes</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {FAQ_ITEMS.map((item, i) => (
                <QA key={item.q} item={item} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-20 bg-background-warm border-t border-espresso/10">
          <div className="container-site text-center max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-espresso mb-4">
              ¿Te queda otra duda?
            </h2>
            <p className="font-body text-warm-gray text-base mb-8">
              Escríbenos por WhatsApp y te respondemos en minutos, o revisa el menú para armar tu pedido.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={getWhatsAppLink(WHATSAPP.faqMessage)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                Consultar por WhatsApp
              </a>
              <Link to="/menu" className="btn-outline">Ver el menú</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
