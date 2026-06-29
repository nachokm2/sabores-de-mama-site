import { Helmet } from 'react-helmet-async'
import Navbar from '../layout/Navbar'
import Footer from '../layout/Footer'
import SectionLabel from '../ui/SectionLabel'

export const cuentaInputCls =
  'w-full rounded-xl border border-espresso/15 bg-background px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

/**
 * Layout compartido del portal de clientes: Navbar + tarjeta centrada + Footer.
 */
export default function CuentaShell({ title, label, subtitle, max = 'max-w-md', children }) {
  return (
    <>
      <Helmet>
        <title>{title} | Sabores de Mamá</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background pt-28 pb-20">
        <div className={`container-site ${max}`}>
          <div className="text-center mb-8">
            {label && <SectionLabel>{label}</SectionLabel>}
            <h1 className="section-title text-espresso mt-3">{title}</h1>
            {subtitle && <p className="font-body text-warm-gray text-sm mt-3">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}
