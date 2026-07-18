import { CATALOGO_PLATOS, CATEGORIAS } from './catalogoPlatos.js'

// ── Servicios ────────────────────────────────────────────────────────────────
export const SERVICES = [
  {
    id: 'cocinera',
    name: 'Cocinera a Domicilio',
    tagline: 'Cocino en tu hogar',
    icon: '🏠',
    price: 55000,
    priceLabel: '$55.000',
    description:
      'Cocino directamente en tu hogar usando tus propios ingredientes. Eliges hasta 5 preparaciones y yo me encargo del resto.',
    features: [
      'Hasta 5 preparaciones a elegir',
      'Duración: 2 a 5 horas',
      'Usas tus propios ingredientes',
      'Dejo la cocina limpia y ordenada',
    ],
    gradient: 'from-bark via-ember to-amber',
    highlight: true,
    communes: ['Las Condes', 'Providencia', 'Vitacura', 'Ñuñoa'],
  },
  {
    id: 'mealprep',
    name: 'Meal Prep',
    tagline: 'Listo para toda la semana',
    icon: '📦',
    price: 60000,
    priceLabel: '$60.000',
    description:
      'Preparo tus comidas en mi cocina, porcionadas individualmente y selladas al vacío. Tú eliges y yo cocino.',
    features: [
      'Hasta 5 preparaciones a elegir',
      'Porcionado y sellado al vacío',
      'Envías ingredientes vía delivery',
      'Entrega a domicilio (costo adicional)',
    ],
    gradient: 'from-espresso via-bark to-terracotta',
    highlight: false,
    communes: ['Las Condes', 'Providencia', 'La Reina', 'Ñuñoa', 'Vitacura', 'Santiago', 'Lo Barnechea', 'San Miguel'],
  },
]

// ── Categorías de platos (disponibles en ambos servicios) ─────────────────────
// Iconos por categoría para el menú público.
const CATEGORIA_ICONOS = {
  'Carnes y Pollo': '🍗',
  'Legumbres y Caldos': '🥘',
  'Quiches y Tortillas': '🥧',
  Pastas: '🍝',
  Ensaladas: '🥗',
  'Otros Platos': '🍽️',
  Acompañamientos: '🍚',
}

// Categorías del menú público, DERIVADAS del catálogo (fuente única
// src/data/catalogoPlatos.js). Muestra todos los platos ofrecidos.
export const DISH_CATEGORIES = CATEGORIAS.map((label) => ({
  id: label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-'),
  label,
  icon: CATEGORIA_ICONOS[label] || '🍽️',
  items: CATALOGO_PLATOS.filter((p) => p.categoria === label).map((p) => p.nombre),
})).filter((c) => c.items.length > 0)

// ── Descripciones breves por plato ───────────────────────────────────────────
export const DISH_DESCRIPTIONS = {
  // Carnes y Pollo
  'Pollo al jugo':        'Presas cocidas lentamente en su propio jugo con verduras.',
  'Pollo a la mostaza':   'Pollo en salsa cremosa de mostaza con toque de crema.',
  'Asado alemán':         'Falda de vacuno cocida al horno con salsa espesa y papas.',
  'Escalopa':             'Filete de vacuno apanado, dorado y crocante.',
  'Albóndigas':           'Bolitas de carne en salsa de tomate casera.',
  'Pollo asado':          'Pollo al horno con especias, jugoso por dentro.',
  'Strogonof':            'Carne o pollo en salsa cremosa con champiñones.',
  'Pollo arvejado':       'Presas de pollo guisadas con arvejas en salsa suave.',
  'Ají de gallina':       'Clásico peruano cremoso con ají amarillo y nueces.',
  'Croquetas de atún':    'Bolitas crujientes de atún con puré de papa.',
  'Carne mechada':        'Vacuno deshilachado cocido en salsa con verduras.',
  'Pollo al curry':       'Pollo en salsa aromática de especias y leche de coco.',
  'Pollo teriyaki':       'Pollo marinado en salsa japonesa dulce y brillante.',
  // Legumbres y Caldos
  'Cazuela':              'Caldo reconfortante con carne, papa, zapallo y choclo.',
  'Lentejas':             'Guiso espeso con aliños caseros y verduras.',
  'Porotos':              'Porotos bayos en salsa con chorizo y pimentón.',
  'Garbanzos':            'Garbanzos guisados con verduras salteadas.',
  'Porotos granados':     'Porotos frescos con choclo, albahaca y zapallo.',
  'Ajiaco':               'Caldo chileno de papas, zapallo y carnes variadas.',
  'Carbonada':            'Caldo con carne y verduras en trozos generosos.',
  'Pantrucas':            'Masa irregular en caldo de vacuno casero.',
  'Crema de zapallo':     'Sopa aterciopelada de zapallo con especias.',
  'Estofado':             'Carne con verduras en salsa oscura y especiada.',
  'Lentejas guisadas':    'Lentejas con chorizo, tocino y pimentón ahumado.',
  // Quiches y Tortillas
  'Quiche queso jamón':           'Tarta salada clásica con relleno cremoso de queso y jamón.',
  'Quiche cebolla tocino':        'Quiche con cebolla caramelizada y tocino.',
  'Quiche espinaca pollo':        'Tarta verde con pollo desmenuzado y queso.',
  'Quiche pollo choclo espinaca': 'Triple relleno colorido, nutritivo y suave.',
  'Quiche brócoli choclo':        'Vegetariana con toque dulce del choclo.',
  'Quiche salmón espinaca':       'Relleno suave con toque ahumado del salmón.',
  'Tortilla española':            'Tortilla jugosa de papa y huevo a la española.',
  'Tortilla de espinaca':         'Tortilla verde con espinaca, queso y hierbas.',
  'Tortilla de acelga':           'Acelga salteada y huevo en tortilla jugosa.',
  'Tortilla de zanahoria':        'Dulce y colorida con zanahoria rallada.',
  'Tortilla de porotos verdes':   'Porotos verdes frescos con huevo y especias.',
  // Otros Platos
  'Lasaña boloñesa':              'Capas de pasta con carne y bechamel gratinada.',
  'Pasta Alfredo':                'Fettuccine en salsa cremosa de queso parmesano.',
  'Canelones boloñesa':           'Tubos de pasta rellenos con carne en salsa de tomate.',
  'Pastel de papa':               'Carne molida bajo cobertura de puré dorado al horno.',
  'Pastel de choclo':             'Clásico chileno con carne, pollo y albahaca.',
  'Budín de zapallo':             'Preparación suave y dulce de zapallo al horno.',
  'Zapallo italiano relleno':     'Zucchini relleno de carne y queso gratinado.',
  'Choclo a la crema':            'Granos de choclo en crema suave y mantequilla.',
  'Charquicán':                   'Guiso chileno de papa, zapallo y carne picada.',
  'Tomaticán':                    'Tomates con choclo y carne en guiso veraniego.',
  'Ceviche':                      'Pescado marinado en limón con cebolla y cilantro.',
  'Ensalada de fideos fría':      'Pasta fría con verduras y aderezo.',
  'Salpicón':                     'Carne fría con verduras en vinagreta.',
  'Palta reina':                  'Palta rellena de ave en mayonesa.',
  'Tomate relleno':               'Tomate con atún, pollo o ensalada de ave.',
  'Pimentón relleno':             'Pimiento con arroz y carne al horno.',
  'Canelones ricotta espinaca':   'Pasta rellena vegetariana con queso y espinaca.',
  'Canelones pollo salsa blanca': 'Pasta rellena con pollo y bechamel.',
  'Camote relleno champiñón':     'Camote asado con champiñones salteados.',
  'Camote asado':                 'Camote al horno con mantequilla y hierbas.',
  'Ravioles con salsa':           'Pasta rellena en salsa de tomate o crema.',
  // Acompañamientos
  'Arroz':           'Arroz blanco esponjoso, cocido a punto.',
  'Arroz árabe':     'Arroz con fideos tostados al estilo árabe.',
  'Fideos':          'Pasta al dente en mantequilla u aceite de oliva.',
  'Papas cocidas':   'Papas hervidas o al vapor con perejil.',
  'Quinoa':          'Quinoa cocida con aceite de oliva y hierbas.',
  'Papas fritas':    'Papas doradas y crocantes.',
  'Puré':            'Puré cremoso de papa con mantequilla.',
  'Cuscús':          'Sémola de trigo cocida al vapor.',
  'Zanahoria asada': 'Zanahorias al horno con miel y tomillo.',
}

// ── Preparaciones listas (exclusivo Meal Prep) ────────────────────────────────
export const MEAL_PREP_READY = [
  {
    id: 'pollos',
    label: 'Pollos Marinados',
    icon: '🍗',
    note: '2 preparaciones = 1 plato',
    items: [
      'Pollo mostaza miel', 'Pollo al curry', 'Pollo cilantro miel',
      'Pollo barbecue', 'Pollo Teriyaki', 'Pollo a la mostaza',
    ],
  },
  {
    id: 'carnes-ready',
    label: 'Carnes',
    icon: '🥩',
    note: '2 preparaciones = 1 plato',
    items: ['Escalopa', 'Albóndigas', 'Croquetas de atún', 'Hamburguesas de carne', 'Nugget de pollo'],
  },
  {
    id: 'platos-ready',
    label: 'Platos',
    icon: '🍽️',
    note: '2 preparaciones = 1 plato',
    items: ['Lasaña', 'Canelones', 'Pastel de choclo', 'Zapallo relleno'],
  },
]

// ── Extras ────────────────────────────────────────────────────────────────────
export const EXTRAS = {
  ensaladas: {
    price: 1500,
    priceLabel: '$1.500 c/u',
    maxItems: 2,
    items: [
      { name: 'Mediterránea', desc: 'Tomate cherry, pepino, aceitunas negras, queso feta o fresco' },
      { name: 'Sabores de Mamá', desc: 'Lechuga, nueces tostadas, manzana verde, queso en trozo, miel y mostaza' },
      { name: 'Sabor de Casa', desc: 'Rúcula, pera, nueces o almendras, queso azul o de cabra, miel' },
      { name: 'Crunsh', desc: 'Repollo, zanahoria, manzana verde, yogurt natural, miel' },
    ],
  },
  postres: {
    note: 'Valor adicional · 1 opción por menú',
    items: [
      'Arroz con leche', 'Leche asada', 'Leche nevada', 'Bavarois',
      'Kuchen', 'Cheesecake', 'Tartaleta de frutas', 'Pie de limón', 'Turrón de vino',
    ],
  },
}

// ── Dulces Saludables ─────────────────────────────────────────────────────────
export const DULCES_FAMILIAR = [
  { name: 'Pie de Limón',         subtitle: 'Yogurt y avena',   price: 8500, priceLabel: '$8.500', emoji: '🍋', gradient: 'from-gold via-amber to-wheat',           image: '/assets/images/pie-limon.jpg' },
  { name: 'Pie Limón Frambuesa',  subtitle: 'Yogurt y avena',   price: 8500, priceLabel: '$8.500', emoji: '🫐', gradient: 'from-terracotta via-ember to-amber',      image: '/assets/images/pie-limon-frambuesa.jpg' },
  { name: 'Brownie Nuez',         subtitle: 'Nuez',             price: 9000, priceLabel: '$9.000', emoji: '🍫', gradient: 'from-espresso via-bark to-terracotta',    image: '/assets/images/brownie-nuez.jpg' },
  { name: 'Queque Manzana Canela',subtitle: 'Manzana y canela', price: 7500, priceLabel: '$7.500', emoji: '🍎', gradient: 'from-bark via-ember to-gold',             image: '/assets/images/queque-manzana.jpg' },
  { name: 'Queque Frutos Rojos',  subtitle: 'Frutos rojos',     price: 8500, priceLabel: '$8.500', emoji: '🫐', gradient: 'from-terracotta via-bark to-amber',       image: '/assets/images/queque-frutos-rojos.jpg' },
]

export const DULCES_SNACKS = [
  { name: 'Barritas',                  subtitle: 'Mantequilla de maní', price: 8500, priceLabel: '$8.500', emoji: '🥜', gradient: 'from-bark via-amber to-wheat',          image: null },
  { name: 'Cocadas Manjar',            subtitle: 'Sin azúcar',          price: 7500, priceLabel: '$7.500', emoji: '🥥', gradient: 'from-espresso via-ember to-amber',      image: '/assets/images/cocadas.jpg' },
  { name: 'Galletas Avena Frambuesa',  subtitle: 'Avena y frambuesa',   price: 8000, priceLabel: '$8.000', emoji: '🍪', gradient: 'from-terracotta via-ember to-gold',     image: '/assets/images/galletas-avena.jpg' },
  { name: 'Cocadas Frutos Rojos',      subtitle: 'Frutos rojos',        price: 7500, priceLabel: '$7.500', emoji: '🫐', gradient: 'from-bark via-terracotta to-amber',     image: '/assets/images/cocadas.jpg' },
  { name: 'Galleta Avena Plátano',     subtitle: 'Plátano y miel',      price: 7500, priceLabel: '$7.500', emoji: '🍌', gradient: 'from-gold via-amber to-wheat',          image: '/assets/images/galleta-platano.jpg' },
]

// ── Comunas ───────────────────────────────────────────────────────────────────
export const COMMUNES = {
  mealPrep:  ['Las Condes', 'Providencia', 'La Reina', 'Ñuñoa', 'Vitacura', 'Santiago', 'Lo Barnechea', 'San Miguel', 'Huechuraba', 'Puente Alto', 'La Florida', 'Macul', 'Cerrillos'],
  cocinera:  ['Las Condes', 'Providencia', 'Vitacura', 'Ñuñoa'],
}

// ── Precios de delivery Meal Prep (clave normalizada: sin tildes, minúscula) ──
export const DELIVERY_PRICES = {
  'santiago':     5000,
  'providencia':  6000,
  'nunoa':        7000,
  'la reina':     7000,
  'vitacura':     8000,
  'las condes':   8000,
  'lo barnechea': 10000,
  'huechuraba':   8000,
  'san miguel':   8000,
  'macul':        9000,
  'cerrillos':    10000,
  'la florida':   12000,
  'puente alto':  14000,
}
