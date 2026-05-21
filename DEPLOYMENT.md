# Sabores de Mamá — Guía de Despliegue

## Stack
- React 18 + Vite 5
- TailwindCSS 3
- GSAP + Framer Motion
- Lenis Smooth Scroll
- react-helmet-async (SEO)

---

## Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Editar .env con tus datos reales
VITE_WHATSAPP_NUMBER=56912345678
VITE_SITE_URL=https://saboresdemama.com

# 4. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:5173
```

---

## Build de producción

```bash
npm run build
# Genera /dist listo para deploy
```

---

## Despliegue en Railway

### Opción A — Deploy desde GitHub (Recomendado)

1. Sube el proyecto a GitHub
2. En [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Selecciona el repositorio
4. Railway detecta Vite automáticamente
5. En **Variables** agrega:
   - `VITE_WHATSAPP_NUMBER` = tu número real
   - `VITE_SITE_URL` = tu dominio
6. Deploy automático en cada push a `main`

### Opción B — Deploy manual con CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Deploy
railway up
```

### Configuración Railway

Archivo `railway.toml` (opcional, Railway lo detecta solo):
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npx serve dist -p $PORT"
healthcheckPath = "/"
```

---

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_WHATSAPP_NUMBER` | Número WhatsApp sin `+` ni espacios | `56912345678` |
| `VITE_SITE_URL` | URL del sitio sin `/` final | `https://saboresdemama.com` |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics (opcional) | `G-XXXXXXXXXX` |

---

## Dominio personalizado en Railway

1. Railway → tu proyecto → Settings → Domains
2. Agregar dominio personalizado: `saboresdemama.com`
3. En tu DNS provider, agregar:
   - `CNAME www → tu-proyecto.up.railway.app`
   - `A @ → IP de Railway`
4. SSL automático con Let's Encrypt

---

## Optimización Pre-Deploy

```bash
# Analizar bundle
npm run build
npx vite-bundle-visualizer

# Preview del build
npm run preview
```

### Lighthouse checklist antes de deploy:
- [ ] Performance > 90
- [ ] SEO > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90

---

## Reemplazar contenido multimedia

### Imágenes
Reemplazar placeholders en `/public/assets/images/`:
```
hero-bg.webp        → Foto principal (1920×1080)
og-image.jpg        → Open Graph (1200×630)
storytelling-1.webp → Sección nosotros
apple-touch-icon.png → 180×180px
```

### Video
En `VideoSection.jsx` línea donde dice `<source src="" />`:
```jsx
<source src="/videos/cocina.mp4" type="video/mp4" />
<source src="/videos/cocina.webm" type="video/webm" />
```

Recomendaciones de video:
- Formato: MP4 (H.264) + WebM como fallback
- Resolución: 1080p max
- Duración: 60-90 segundos
- Tamaño: < 10MB
- Temática: cocina en acción, vapor, ingredientes frescos

---

## Roadmap Futuro

### Fase 2 — Backend básico
- [ ] API de pedidos (Node.js + Express)
- [ ] Panel admin para menú
- [ ] Integración con MercadoPago / WebPay
- [ ] Sistema de reservas

### Fase 3 — Ecommerce
- [ ] Carrito de compras
- [ ] Perfil de usuario
- [ ] Historial de pedidos
- [ ] Programa de puntos / fidelización

### Fase 4 — Expansión
- [ ] App móvil (React Native)
- [ ] Sistema de delivery tracking
- [ ] Integración con plataformas de delivery
- [ ] Módulo de reseñas nativo

---

## Convenciones del Proyecto

### Componentes
- PascalCase: `MenuSection.jsx`
- Un componente por archivo
- Props tipadas con JSDoc cuando es necesario

### CSS
- TailwindCSS utility-first
- Clases personalizadas en `globals.css`
- Variables CSS en `:root` para colores y valores de diseño

### Animaciones
- Framer Motion para transiciones de componentes
- GSAP + ScrollTrigger para animaciones de scroll complejas
- CSS animations para efectos simples (smoke, float)
- Siempre respetar `prefers-reduced-motion`

### Estructura de carpetas
```
src/
├── components/
│   ├── layout/     # Navbar, Footer
│   ├── sections/   # Hero, Menu, etc.
│   ├── ui/         # Button, Badge, etc.
│   └── seo/        # SEOHead, StructuredData
├── data/           # Datos del negocio
├── hooks/          # Custom hooks
├── pages/          # Rutas de React Router
└── styles/         # globals.css
```
