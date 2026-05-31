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
export const DISH_CATEGORIES = [
  {
    id: 'carnes',
    label: 'Carnes y Pollo',
    icon: '🍗',
    items: [
      'Pollo al jugo', 'Pollo a la mostaza', 'Asado alemán', 'Escalopa',
      'Albóndigas', 'Pollo asado', 'Strogonof', 'Pollo arvejado',
      'Ají de gallina', 'Croquetas de atún', 'Carne mechada',
      'Pollo al curry', 'Pollo teriyaki',
    ],
  },
  {
    id: 'legumbres',
    label: 'Legumbres y Caldos',
    icon: '🥘',
    items: [
      'Cazuela', 'Lentejas', 'Porotos', 'Garbanzos',
      'Porotos granados', 'Ajiaco', 'Carbonada',
      'Pantrucas', 'Crema de zapallo', 'Estofado', 'Lentejas guisadas',
    ],
  },
  {
    id: 'quiches',
    label: 'Quiches y Tortillas',
    icon: '🥧',
    items: [
      'Quiche queso jamón', 'Quiche cebolla tocino', 'Quiche espinaca pollo',
      'Quiche pollo choclo espinaca', 'Quiche brócoli choclo', 'Quiche salmón espinaca',
      'Tortilla española', 'Tortilla de espinaca', 'Tortilla de acelga',
      'Tortilla de zanahoria', 'Tortilla de porotos verdes',
    ],
  },
  {
    id: 'otros',
    label: 'Otros Platos',
    icon: '🍽️',
    items: [
      'Lasaña boloñesa', 'Pasta Alfredo', 'Canelones boloñesa',
      'Pastel de papa', 'Pastel de choclo', 'Budín de zapallo',
      'Zapallo italiano relleno', 'Choclo a la crema', 'Charquicán',
      'Tomaticán', 'Ceviche', 'Ensalada de fideos fría', 'Salpicón',
      'Palta reina', 'Tomate relleno', 'Pimentón relleno',
      'Canelones ricotta espinaca', 'Canelones pollo salsa blanca',
      'Camote relleno champiñón', 'Camote asado', 'Ravioles con salsa',
    ],
  },
  {
    id: 'acompañamientos',
    label: 'Acompañamientos',
    icon: '🍚',
    items: [
      'Arroz', 'Arroz árabe', 'Fideos', 'Papas cocidas',
      'Quinoa', 'Papas fritas', 'Puré', 'Cuscús', 'Zanahoria asada',
    ],
  },
]

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
