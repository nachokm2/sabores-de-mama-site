import SEOHead from '../components/seo/SEOHead'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import Marquee from '../components/sections/Marquee'
import Storytelling from '../components/sections/Storytelling'
import MenuSection from '../components/sections/MenuSection'
import FamilyStory from '../components/sections/FamilyStory'
import Testimonials from '../components/sections/Testimonials'
import Gallery from '../components/sections/Gallery'
import FAQ from '../components/sections/FAQ'
import WhatsAppCTA from '../components/sections/WhatsAppCTA'

export default function Home() {
  return (
    <>
      {/* El JSON-LD del negocio (Restaurant/LocalBusiness/WebSite) va estático en
          index.html para que lo lean también los rastreadores sin JS. */}
      <SEOHead
        title="Comida Casera a Domicilio en Santiago"
        description="Comida casera a domicilio en Santiago: almuerzos y preparaciones caseras, porcionadas y selladas al vacío, listas para disfrutar en tu hogar. Pide en línea."
        canonical="https://saboresdemama.com/"
      />

      {/* Skip to content - accessibility */}
      <a
        href="#inicio"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-amber focus:text-espresso focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold"
      >
        Ir al contenido principal
      </a>

      <Navbar />

      <main id="main-content">
        <Hero />
        <Marquee />
        <Storytelling />
        <MenuSection />
        <FamilyStory />
        <Gallery />
        <FAQ />
        <WhatsAppCTA />
        <Testimonials />
      </main>

      <Footer />
    </>
  )
}
