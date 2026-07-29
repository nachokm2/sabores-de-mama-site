import { Link } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageHero from '../components/ui/PageHero'
import { POSTS, fmtFecha } from '../lib/blog'

export default function Blog() {
  return (
    <>
      <SEOHead
        title="Blog — Guías y recetas caseras"
        description="Guías y recetas de comida casera chilena: meal prep, conservación al vacío, recetas paso a paso y consejos para comer casero sin gastar tiempo en cocinar."
        canonical="https://saboresdemama.com/blog"
      />
      <Navbar />
      <main>
        <PageHero
          label="Blog"
          title="Guías y recetas"
          titleHighlight="para comer casero."
          subtitle="Meal prep, conservación, recetas chilenas y consejos para disfrutar comida de casa sin gastar tiempo."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Blog', href: '/blog' }]}
        />
        <section className="section-padding bg-cream" aria-label="Artículos del blog">
          <div className="container-site max-w-3xl">
            <div className="grid grid-cols-1 gap-5">
              {POSTS.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="block bg-ivory border border-wheat/50 rounded-2xl p-6 hover:border-terracotta/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-2 text-xs text-warm-gray">
                    <span className="uppercase tracking-wide text-terracotta font-semibold">{p.type === 'recipe' ? 'Receta' : 'Guía'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{fmtFecha(p.date)}</span>
                  </div>
                  <h2 className="font-display text-espresso text-xl font-bold mb-2">{p.title}</h2>
                  <p className="font-body text-warm-gray text-sm leading-relaxed">{p.description}</p>
                  <span className="inline-block mt-3 text-terracotta text-sm font-semibold">Leer más →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
