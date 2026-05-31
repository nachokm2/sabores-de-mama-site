import { Helmet } from 'react-helmet-async'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import Marquee from '../components/sections/Marquee'
import Storytelling from '../components/sections/Storytelling'
import MenuSection from '../components/sections/MenuSection'
import Process from '../components/sections/Process'
import FamilyStory from '../components/sections/FamilyStory'
import VideoSection from '../components/sections/VideoSection'
import Testimonials from '../components/sections/Testimonials'
import Gallery from '../components/sections/Gallery'
import FAQ from '../components/sections/FAQ'
import WhatsAppCTA from '../components/sections/WhatsAppCTA'
import { restaurantSchema } from '../components/seo/StructuredData'
import { SITE } from '../data/siteConfig'

export default function Home() {
  return (
    <>
      <Helmet>
        <title>{SITE.name} | {SITE.tagline}</title>
        <meta name="description" content={SITE.description} />
        <script type="application/ld+json">
          {JSON.stringify(restaurantSchema)}
        </script>
      </Helmet>

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
        <Process />
        <FamilyStory />
        <VideoSection />
        <Testimonials />
        <Gallery />
        <FAQ />
        <WhatsAppCTA />
      </main>

      <Footer />
    </>
  )
}
