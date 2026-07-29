import { Link, useParams, Navigate } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { getPost, fmtFecha } from '../lib/blog'

export default function BlogPost() {
  const { slug } = useParams()
  const post = getPost(slug)
  // Slug desconocido → al índice del blog (los slugs válidos se pre-renderizan).
  if (!post) return <Navigate to="/blog" replace />

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Sabores de Mamá',
      logo: { '@type': 'ImageObject', url: 'https://saboresdemama.com/assets/images/logo.jpg' },
    },
    mainEntityOfPage: `https://saboresdemama.com/blog/${post.slug}`,
    inLanguage: 'es-CL',
  }
  const jsonLd = JSON.stringify(schema).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

  return (
    <>
      <SEOHead
        title={post.title}
        description={post.description}
        canonical={`https://saboresdemama.com/blog/${post.slug}`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <Navbar />

      <main>
        <article className="bg-background">
          <header className="bg-background-warm border-b border-espresso/10 pt-24 pb-10">
            <div className="container-site max-w-2xl">
              <Link to="/blog" className="text-sm text-warm-gray hover:text-terracotta">← Volver al blog</Link>
              <div className="flex items-center gap-3 mt-4 mb-3 text-xs text-warm-gray">
                <span className="uppercase tracking-wide text-terracotta font-semibold">{post.type === 'recipe' ? 'Receta' : 'Guía'}</span>
                <span aria-hidden="true">·</span>
                <span>{fmtFecha(post.date)}</span>
                <span aria-hidden="true">·</span>
                <span>{post.author}</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-espresso leading-tight">{post.title}</h1>
            </div>
          </header>

          <div className="container-site max-w-2xl py-10">
            {/* Contenido del artículo (Markdown → HTML, generado en el build). */}
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.html }} />
          </div>

          <div className="container-site max-w-2xl pb-16">
            <div className="rounded-2xl bg-cream border border-wheat/50 p-6 text-center">
              <p className="font-body text-espresso mb-4">¿Prefieres que cocinemos por ti? Comida casera lista para tu semana.</p>
              <Link to="/menu" className="btn-primary">Ver el menú</Link>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </>
  )
}
