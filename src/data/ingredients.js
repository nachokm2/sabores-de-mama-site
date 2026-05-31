// Base: 5 personas. cat: 'protein' | 'veggie' | 'dairy' | 'pantry' | 'seasoning' | 'other'
// buy: formato en que se vende en supermercado (null = no aplica / ya se tiene)

export const RECIPE_DB = {

  // ── CARNES Y POLLO ──────────────────────────────────────────────────────────
  'Pollo al jugo': {
    emoji: '🍗', base: 5,
    ingredients: [
      { name: 'Presas de pollo', qty: 5, unit: 'unidades', cat: 'protein', buy: '1 bandeja (5 presas)' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Ajo', qty: 3, unit: 'dientes', cat: 'veggie', buy: '1 cabeza' },
      { name: 'Pimentón', qty: 0.5, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Aceite', qty: 3, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta, orégano, comino', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–6 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Pollo a la mostaza': {
    emoji: '🍗', base: 5,
    ingredients: [
      { name: 'Presas de pollo', qty: 5, unit: 'unidades', cat: 'protein', buy: '1 bandeja' },
      { name: 'Mostaza', qty: 3, unit: 'cdas', cat: 'pantry', buy: '1 frasco' },
      { name: 'Crema', qty: 200, unit: 'ml', cat: 'dairy', buy: '200 ml' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–6 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Pollo mostaza miel': {
    emoji: '🍗', base: 5,
    ingredients: [
      { name: 'Presas de pollo', qty: 5, unit: 'unidades', cat: 'protein', buy: '1 bandeja (5 presas)' },
      { name: 'Mostaza', qty: 2, unit: 'cdas', cat: 'pantry', buy: '1 frasco pequeño' },
      { name: 'Miel', qty: 1, unit: 'cda', cat: 'other', buy: '1 frasco pequeño' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–6 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Pollo al curry': {
    emoji: '🍗', base: 5,
    ingredients: [
      { name: 'Presas de pollo', qty: 5, unit: 'unidades', cat: 'protein', buy: '1 bandeja' },
      { name: 'Curry en polvo', qty: 2, unit: 'cdas', cat: 'pantry', buy: '1 frasco pequeño' },
      { name: 'Leche de coco', qty: 200, unit: 'ml', cat: 'pantry', buy: '200 ml' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Ajo', qty: 2, unit: 'dientes', cat: 'veggie', buy: '1 cabeza' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–6 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Pollo teriyaki': {
    emoji: '🍗', base: 5,
    ingredients: [
      { name: 'Presas de pollo', qty: 5, unit: 'unidades', cat: 'protein', buy: '1 bandeja' },
      { name: 'Salsa de soya', qty: 4, unit: 'cdas', cat: 'pantry', buy: '1 botella pequeña' },
      { name: 'Miel', qty: 2, unit: 'cdas', cat: 'other', buy: '1 frasco pequeño' },
      { name: 'Jengibre rallado', qty: 1, unit: 'cdta', cat: 'seasoning', buy: '1 raíz' },
      { name: 'Ajo', qty: 2, unit: 'dientes', cat: 'veggie', buy: '1 cabeza' },
      { name: 'Aceite de sésamo', qty: 1, unit: 'cda', cat: 'pantry', buy: null },
    ],
    conservation: { fridge: '5–6 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Pollo cilantro miel': {
    emoji: '🍗', base: 5,
    ingredients: [
      { name: 'Presas de pollo', qty: 5, unit: 'unidades', cat: 'protein', buy: '1 bandeja' },
      { name: 'Cilantro fresco', qty: 1, unit: 'atado', cat: 'veggie', buy: '1 atado' },
      { name: 'Miel', qty: 2, unit: 'cdas', cat: 'other', buy: '1 frasco pequeño' },
      { name: 'Ajo', qty: 2, unit: 'dientes', cat: 'veggie', buy: '1 cabeza' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–6 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Pollo barbecue': {
    emoji: '🍗', base: 5,
    ingredients: [
      { name: 'Presas de pollo', qty: 5, unit: 'unidades', cat: 'protein', buy: '1 bandeja' },
      { name: 'Salsa BBQ', qty: 3, unit: 'cdas', cat: 'pantry', buy: '1 frasco' },
      { name: 'Ajo', qty: 2, unit: 'dientes', cat: 'veggie', buy: '1 cabeza' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–6 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Pollo asado': {
    emoji: '🍗', base: 5,
    ingredients: [
      { name: 'Pollo entero o presas', qty: 1200, unit: 'g', cat: 'protein', buy: '1 pollo entero' },
      { name: 'Ajo', qty: 4, unit: 'dientes', cat: 'veggie', buy: '1 cabeza' },
      { name: 'Limón', qty: 1, unit: 'unidad', cat: 'other', buy: '2 unidades' },
      { name: 'Aceite de oliva', qty: 3, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta, romero, tomillo', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–6 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Pollo arvejado': {
    emoji: '🍗', base: 5,
    ingredients: [
      { name: 'Presas de pollo', qty: 5, unit: 'unidades', cat: 'protein', buy: '1 bandeja' },
      { name: 'Arvejas', qty: 1, unit: 'taza', cat: 'veggie', buy: '300 g' },
      { name: 'Zanahoria', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta, orégano', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–6 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Asado alemán': {
    emoji: '🥩', base: 5,
    ingredients: [
      { name: 'Lomo vetado o asado alemán', qty: 800, unit: 'g', cat: 'protein', buy: '1 kg' },
      { name: 'Cebolla', qty: 2, unit: 'unidades', cat: 'veggie', buy: '2 unidades' },
      { name: 'Aceite', qty: 3, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–6 días', freezer: '2–3 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Escalopa': {
    emoji: '🥩', base: 5,
    ingredients: [
      { name: 'Escalopas de cerdo o pollo', qty: 5, unit: 'unidades', cat: 'protein', buy: '5 unidades' },
      { name: 'Harina', qty: 4, unit: 'cdas', cat: 'pantry', buy: '500 g' },
      { name: 'Huevo', qty: 2, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Pan rallado', qty: 6, unit: 'cdas', cat: 'pantry', buy: '1 paquete' },
      { name: 'Aceite para freír', qty: 300, unit: 'ml', cat: 'pantry', buy: '1 litro' },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–4 min', oven: '180°C × 12–15 min' },
  },

  'Albóndigas': {
    emoji: '🥩', base: 5,
    ingredients: [
      { name: 'Carne molida', qty: 600, unit: 'g', cat: 'protein', buy: '600 g' },
      { name: 'Huevo', qty: 1, unit: 'unidad', cat: 'protein', buy: '6 unidades' },
      { name: 'Pan rallado', qty: 4, unit: 'cdas', cat: 'pantry', buy: '1 paquete' },
      { name: 'Salsa de tomate', qty: 3, unit: 'unidades', cat: 'pantry', buy: '1 pack' },
      { name: 'Cebolla', qty: 0.5, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Ajo', qty: 2, unit: 'dientes', cat: 'veggie', buy: '1 cabeza' },
      { name: 'Sal, pimienta, orégano', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–6 días', freezer: '2–3 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Strogonof': {
    emoji: '🥩', base: 5,
    ingredients: [
      { name: 'Carne (lomo o posta)', qty: 600, unit: 'g', cat: 'protein', buy: '600 g' },
      { name: 'Champiñones', qty: 200, unit: 'g', cat: 'veggie', buy: '250 g' },
      { name: 'Crema', qty: 200, unit: 'ml', cat: 'dairy', buy: '200 ml' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Mostaza', qty: 1, unit: 'cda', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta, páprika', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Ají de gallina': {
    emoji: '🍗', base: 5,
    ingredients: [
      { name: 'Pechuga de pollo', qty: 600, unit: 'g', cat: 'protein', buy: '600 g' },
      { name: 'Pan de molde (sin corteza)', qty: 3, unit: 'rebanadas', cat: 'pantry', buy: '1 pan de molde' },
      { name: 'Leche', qty: 250, unit: 'ml', cat: 'dairy', buy: '1 litro' },
      { name: 'Ají amarillo (pasta)', qty: 2, unit: 'cdas', cat: 'pantry', buy: '1 frasco' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Ajo', qty: 2, unit: 'dientes', cat: 'veggie', buy: '1 cabeza' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta, cúrcuma', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Croquetas de atún': {
    emoji: '🐟', base: 5,
    ingredients: [
      { name: 'Atún en lata', qty: 3, unit: 'latas', cat: 'protein', buy: '3 latas (160 g c/u)' },
      { name: 'Huevo', qty: 3, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Harina', qty: 5, unit: 'cdas', cat: 'pantry', buy: '500 g' },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 10–15 min' },
  },

  'Carne mechada': {
    emoji: '🥩', base: 5,
    ingredients: [
      { name: 'Carne (pollo ganso)', qty: 1300, unit: 'g', cat: 'protein', buy: '1,5 kg aprox.' },
      { name: 'Zanahoria', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Cebolla', qty: 1.5, unit: 'unidades', cat: 'veggie', buy: '2 unidades' },
      { name: 'Pimentón', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Laurel', qty: 2, unit: 'hojas', cat: 'seasoning', buy: '1 sobre' },
      { name: 'Vino tinto', qty: 125, unit: 'ml', cat: 'other', buy: '1 botella pequeña' },
      { name: 'Aceite', qty: 5, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta, orégano', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '6–8 días', freezer: '2–3 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Hamburguesas de carne': {
    emoji: '🍔', base: 5,
    ingredients: [
      { name: 'Carne molida', qty: 700, unit: 'g', cat: 'protein', buy: '700 g' },
      { name: 'Huevo', qty: 1, unit: 'unidad', cat: 'protein', buy: '6 unidades' },
      { name: 'Pan rallado', qty: 3, unit: 'cdas', cat: 'pantry', buy: '1 paquete' },
      { name: 'Cebolla', qty: 0.5, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Sal, pimienta, comino', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '2 meses' },
    heating: { microwave: '3–5 min', oven: '180°C × 10–15 min' },
  },

  'Nugget de pollo': {
    emoji: '🍗', base: 5,
    ingredients: [
      { name: 'Pechuga de pollo', qty: 600, unit: 'g', cat: 'protein', buy: '600 g' },
      { name: 'Huevo', qty: 2, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Harina', qty: 4, unit: 'cdas', cat: 'pantry', buy: '500 g' },
      { name: 'Pan rallado', qty: 6, unit: 'cdas', cat: 'pantry', buy: '1 paquete' },
      { name: 'Aceite para freír', qty: 300, unit: 'ml', cat: 'pantry', buy: '1 litro' },
      { name: 'Sal, pimienta, ajo en polvo', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–4 min', oven: '180°C × 12 min' },
  },

  // ── LEGUMBRES Y CALDOS ──────────────────────────────────────────────────────
  'Cazuela': {
    emoji: '🥘', base: 5,
    ingredients: [
      { name: 'Osobuco o asado de tira', qty: 1000, unit: 'g', cat: 'protein', buy: '1 kg' },
      { name: 'Papa', qty: 5, unit: 'unidades medianas', cat: 'veggie', buy: '1 kg' },
      { name: 'Zanahoria', qty: 2, unit: 'unidades', cat: 'veggie', buy: '2 unidades' },
      { name: 'Choclo', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Zapallo', qty: 300, unit: 'g', cat: 'veggie', buy: '500 g' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Porotos verdes', qty: 1, unit: 'puñado', cat: 'veggie', buy: '250 g' },
      { name: 'Condimentos', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '2 meses' },
    heating: { microwave: '6–8 min', oven: '180°C × 20–25 min' },
  },

  'Lentejas': {
    emoji: '🥣', base: 5,
    ingredients: [
      { name: 'Lentejas', qty: 1, unit: 'taza', cat: 'pantry', buy: '500 g' },
      { name: 'Zapallo', qty: 1, unit: 'taza (en cubos)', cat: 'veggie', buy: '500 g aprox.' },
      { name: 'Cebolla', qty: 1.25, unit: 'unidades', cat: 'veggie', buy: '2 unidades' },
      { name: 'Arroz', qty: 1, unit: 'taza', cat: 'pantry', buy: '1 kg' },
      { name: 'Condimentos', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20 min' },
  },

  'Lentejas guisadas': {
    emoji: '🥣', base: 5,
    ingredients: [
      { name: 'Lentejas', qty: 1, unit: 'taza', cat: 'pantry', buy: '500 g' },
      { name: 'Longaniza', qty: 2, unit: 'unidades', cat: 'protein', buy: '250 g' },
      { name: 'Zapallo', qty: 1, unit: 'taza', cat: 'veggie', buy: '500 g' },
      { name: 'Zanahoria', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Condimentos', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20 min' },
  },

  'Porotos': {
    emoji: '🫘', base: 5,
    ingredients: [
      { name: 'Porotos', qty: 1.5, unit: 'tazas', cat: 'pantry', buy: '500 g' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Zanahoria', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Zapallo', qty: 0.5, unit: 'taza', cat: 'veggie', buy: '250 g' },
      { name: 'Condimentos', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20 min' },
  },

  'Porotos granados': {
    emoji: '🫘', base: 5,
    ingredients: [
      { name: 'Porotos granados', qty: 500, unit: 'g', cat: 'veggie', buy: '500 g (frescos o congelados)' },
      { name: 'Choclo', qty: 2, unit: 'unidades', cat: 'veggie', buy: '2 unidades' },
      { name: 'Zapallo', qty: 1, unit: 'taza', cat: 'veggie', buy: '300 g' },
      { name: 'Albahaca', qty: 4, unit: 'hojas', cat: 'seasoning', buy: '1 atado' },
      { name: 'Condimentos', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '2 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20 min' },
  },

  'Garbanzos': {
    emoji: '🫘', base: 5,
    ingredients: [
      { name: 'Garbanzos', qty: 400, unit: 'g', cat: 'pantry', buy: '500 g' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Zanahoria', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Condimentos', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20 min' },
  },

  'Carbonada': {
    emoji: '🥘', base: 5,
    ingredients: [
      { name: 'Carne (osobuco o asado)', qty: 700, unit: 'g', cat: 'protein', buy: '700 g' },
      { name: 'Papa', qty: 4, unit: 'unidades', cat: 'veggie', buy: '800 g' },
      { name: 'Zapallo', qty: 300, unit: 'g', cat: 'veggie', buy: '500 g' },
      { name: 'Zanahoria', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Choclo', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Condimentos', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '2 meses' },
    heating: { microwave: '6–8 min', oven: '180°C × 20–25 min' },
  },

  'Ajiaco': {
    emoji: '🥘', base: 5,
    ingredients: [
      { name: 'Papa', qty: 6, unit: 'unidades', cat: 'veggie', buy: '1 kg' },
      { name: 'Carne cocida o charqui', qty: 300, unit: 'g', cat: 'protein', buy: '300 g' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Condimentos', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '2 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20 min' },
  },

  'Crema de zapallo': {
    emoji: '🎃', base: 5,
    ingredients: [
      { name: 'Zapallo', qty: 800, unit: 'g', cat: 'veggie', buy: '1 kg' },
      { name: 'Crema', qty: 100, unit: 'ml', cat: 'dairy', buy: '200 ml' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Caldo de verduras', qty: 1, unit: 'litro', cat: 'pantry', buy: '1 cajita' },
      { name: 'Sal, pimienta, nuez moscada', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '2 meses' },
    heating: { microwave: '5–7 min', oven: 'Calentar en olla a fuego bajo' },
  },

  'Estofado': {
    emoji: '🥘', base: 5,
    ingredients: [
      { name: 'Carne (osobuco)', qty: 800, unit: 'g', cat: 'protein', buy: '1 kg' },
      { name: 'Papa', qty: 4, unit: 'unidades', cat: 'veggie', buy: '800 g' },
      { name: 'Zanahoria', qty: 2, unit: 'unidades', cat: 'veggie', buy: '2 unidades' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Vino tinto', qty: 125, unit: 'ml', cat: 'other', buy: '1 botella pequeña' },
      { name: 'Condimentos', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2–3 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20 min' },
  },

  // ── QUICHES Y TORTILLAS ─────────────────────────────────────────────────────
  'Quiche queso jamón': {
    emoji: '🥧', base: 5,
    ingredients: [
      { name: 'Masa para tarta / harina', qty: 250, unit: 'g', cat: 'pantry', buy: '500 g' },
      { name: 'Jamón', qty: 150, unit: 'g', cat: 'protein', buy: '200 g' },
      { name: 'Queso mantecoso o chanco', qty: 150, unit: 'g', cat: 'dairy', buy: '200 g' },
      { name: 'Huevo', qty: 4, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Crema', qty: 200, unit: 'ml', cat: 'dairy', buy: '200 ml' },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 15 min' },
  },

  'Quiche cebolla tocino': {
    emoji: '🥧', base: 5,
    ingredients: [
      { name: 'Masa para tarta / harina', qty: 250, unit: 'g', cat: 'pantry', buy: '500 g' },
      { name: 'Tocino o panceta', qty: 150, unit: 'g', cat: 'protein', buy: '200 g' },
      { name: 'Cebolla', qty: 2, unit: 'unidades', cat: 'veggie', buy: '2 unidades' },
      { name: 'Huevo', qty: 4, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Crema', qty: 200, unit: 'ml', cat: 'dairy', buy: '200 ml' },
      { name: 'Queso', qty: 100, unit: 'g', cat: 'dairy', buy: '200 g' },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 15 min' },
  },

  'Quiche espinaca pollo': {
    emoji: '🥧', base: 5,
    ingredients: [
      { name: 'Masa para tarta / harina', qty: 250, unit: 'g', cat: 'pantry', buy: '500 g' },
      { name: 'Espinaca', qty: 200, unit: 'g', cat: 'veggie', buy: '250 g' },
      { name: 'Pechuga de pollo cocida', qty: 200, unit: 'g', cat: 'protein', buy: '250 g' },
      { name: 'Huevo', qty: 4, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Crema', qty: 200, unit: 'ml', cat: 'dairy', buy: '200 ml' },
      { name: 'Queso', qty: 100, unit: 'g', cat: 'dairy', buy: '200 g' },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 15 min' },
  },

  'Quiche pollo choclo espinaca': {
    emoji: '🥧', base: 5,
    ingredients: [
      { name: 'Masa para tarta / harina', qty: 250, unit: 'g', cat: 'pantry', buy: '500 g' },
      { name: 'Pechuga de pollo cocida', qty: 200, unit: 'g', cat: 'protein', buy: '250 g' },
      { name: 'Choclo', qty: 1, unit: 'taza (desgranado)', cat: 'veggie', buy: '1 lata o 1 choclo' },
      { name: 'Espinaca', qty: 150, unit: 'g', cat: 'veggie', buy: '250 g' },
      { name: 'Huevo', qty: 4, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Crema', qty: 200, unit: 'ml', cat: 'dairy', buy: '200 ml' },
      { name: 'Queso', qty: 100, unit: 'g', cat: 'dairy', buy: '200 g' },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 15 min' },
  },

  'Quiche brócoli choclo': {
    emoji: '🥧', base: 5,
    ingredients: [
      { name: 'Masa para tarta / harina', qty: 250, unit: 'g', cat: 'pantry', buy: '500 g' },
      { name: 'Brócoli', qty: 200, unit: 'g', cat: 'veggie', buy: '250 g' },
      { name: 'Choclo', qty: 1, unit: 'taza', cat: 'veggie', buy: '1 lata' },
      { name: 'Huevo', qty: 4, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Crema', qty: 200, unit: 'ml', cat: 'dairy', buy: '200 ml' },
      { name: 'Queso', qty: 100, unit: 'g', cat: 'dairy', buy: '200 g' },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 15 min' },
  },

  'Quiche salmón espinaca': {
    emoji: '🥧', base: 5,
    ingredients: [
      { name: 'Masa para tarta / harina', qty: 250, unit: 'g', cat: 'pantry', buy: '500 g' },
      { name: 'Salmón (fresco o ahumado)', qty: 200, unit: 'g', cat: 'protein', buy: '200 g' },
      { name: 'Espinaca', qty: 150, unit: 'g', cat: 'veggie', buy: '250 g' },
      { name: 'Huevo', qty: 4, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Crema', qty: 200, unit: 'ml', cat: 'dairy', buy: '200 ml' },
      { name: 'Queso crema', qty: 100, unit: 'g', cat: 'dairy', buy: '200 g' },
      { name: 'Sal, pimienta, eneldo', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 15 min' },
  },

  'Quiche Lorraine': {
    emoji: '🥧', base: 5,
    ingredients: [
      { name: 'Masa para tarta / harina', qty: 250, unit: 'g', cat: 'pantry', buy: '500 g' },
      { name: 'Tocino o panceta', qty: 150, unit: 'g', cat: 'protein', buy: '200 g' },
      { name: 'Huevo', qty: 4, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Crema', qty: 200, unit: 'ml', cat: 'dairy', buy: '200 ml' },
      { name: 'Queso gruyere o mantecoso', qty: 150, unit: 'g', cat: 'dairy', buy: '200 g' },
      { name: 'Sal, pimienta, nuez moscada', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 15 min' },
  },

  'Tortilla española': {
    emoji: '🥚', base: 5,
    ingredients: [
      { name: 'Papa', qty: 4, unit: 'unidades medianas', cat: 'veggie', buy: '800 g' },
      { name: 'Huevo', qty: 6, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Aceite de oliva', qty: 4, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–4 min', oven: '180°C × 10 min' },
  },

  'Tortilla de Verduras': {
    emoji: '🥚', base: 5,
    ingredients: [
      { name: 'Huevo', qty: 6, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Pimentón', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Espinaca', qty: 100, unit: 'g', cat: 'veggie', buy: '200 g' },
      { name: 'Cebolla', qty: 0.5, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–4 min', oven: '180°C × 10 min' },
  },

  'Tortilla de espinaca': {
    emoji: '🥚', base: 5,
    ingredients: [
      { name: 'Huevo', qty: 6, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Espinaca', qty: 200, unit: 'g', cat: 'veggie', buy: '250 g' },
      { name: 'Cebolla', qty: 0.5, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–4 min', oven: '180°C × 10 min' },
  },

  'Tortilla de acelga': {
    emoji: '🥚', base: 5,
    ingredients: [
      { name: 'Huevo', qty: 6, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Acelga', qty: 200, unit: 'g', cat: 'veggie', buy: '1 atado' },
      { name: 'Cebolla', qty: 0.5, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–4 min', oven: '180°C × 10 min' },
  },

  'Tortilla de zanahoria': {
    emoji: '🥚', base: 5,
    ingredients: [
      { name: 'Huevo', qty: 6, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Zanahoria', qty: 2, unit: 'unidades ralladas', cat: 'veggie', buy: '2 unidades' },
      { name: 'Cebolla', qty: 0.5, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–4 min', oven: '180°C × 10 min' },
  },

  'Tortilla de porotos verdes': {
    emoji: '🥚', base: 5,
    ingredients: [
      { name: 'Huevo', qty: 6, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Porotos verdes', qty: 200, unit: 'g', cat: 'veggie', buy: '250 g' },
      { name: 'Cebolla', qty: 0.5, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–4 min', oven: '180°C × 10 min' },
  },

  // ── OTROS ───────────────────────────────────────────────────────────────────
  'Lasaña boloñesa': {
    emoji: '🍝', base: 5,
    ingredients: [
      { name: 'Láminas de lasaña (pre-cocida)', qty: 12, unit: 'unidades', cat: 'pantry', buy: '1 caja' },
      { name: 'Carne molida', qty: 500, unit: 'g', cat: 'protein', buy: '500 g' },
      { name: 'Salsa de tomate', qty: 5, unit: 'unidades', cat: 'pantry', buy: '1 pack (6 unidades)' },
      { name: 'Queso para gratinar (chanco o mantecoso)', qty: 300, unit: 'g', cat: 'dairy', buy: '300–500 g' },
      { name: 'Maicena', qty: 10, unit: 'cdas', cat: 'pantry', buy: '1 caja' },
      { name: 'Mantequilla', qty: 200, unit: 'g', cat: 'dairy', buy: '250 g' },
      { name: 'Leche', qty: 500, unit: 'ml', cat: 'dairy', buy: '1 litro' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Sal, orégano, nuez moscada', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–7 días', freezer: '2–3 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20–25 min' },
  },

  'Canelones boloñesa': {
    emoji: '🍝', base: 5,
    ingredients: [
      { name: 'Láminas de canelones', qty: 16, unit: 'unidades', cat: 'pantry', buy: '1 caja' },
      { name: 'Carne molida', qty: 500, unit: 'g', cat: 'protein', buy: '500 g' },
      { name: 'Salsa de tomate', qty: 3, unit: 'unidades', cat: 'pantry', buy: '1 pack' },
      { name: 'Queso para gratinar', qty: 200, unit: 'g', cat: 'dairy', buy: '250 g' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Mantequilla', qty: 100, unit: 'g', cat: 'dairy', buy: '250 g' },
      { name: 'Leche', qty: 500, unit: 'ml', cat: 'dairy', buy: '1 litro' },
      { name: 'Maicena', qty: 5, unit: 'cdas', cat: 'pantry', buy: '1 caja' },
      { name: 'Sal, pimienta, orégano', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–7 días', freezer: '2–3 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20–25 min' },
  },

  'Pasta Alfredo': {
    emoji: '🍝', base: 5,
    ingredients: [
      { name: 'Pasta (fetuccini o penne)', qty: 400, unit: 'g', cat: 'pantry', buy: '500 g' },
      { name: 'Crema', qty: 300, unit: 'ml', cat: 'dairy', buy: '300 ml' },
      { name: 'Mantequilla', qty: 50, unit: 'g', cat: 'dairy', buy: '100 g' },
      { name: 'Queso parmesano rallado', qty: 80, unit: 'g', cat: 'dairy', buy: '100 g' },
      { name: 'Ajo', qty: 2, unit: 'dientes', cat: 'veggie', buy: '1 cabeza' },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 15 min' },
  },

  'Pastel de choclo': {
    emoji: '🌽', base: 5,
    ingredients: [
      { name: 'Choclo (desgranado o congelado)', qty: 1000, unit: 'g', cat: 'veggie', buy: '1 kg' },
      { name: 'Carne molida', qty: 400, unit: 'g', cat: 'protein', buy: '500 g' },
      { name: 'Cebolla', qty: 1.5, unit: 'unidades', cat: 'veggie', buy: '2 unidades' },
      { name: 'Pollo cocido desmenuzado', qty: 2, unit: 'presas', cat: 'protein', buy: '2 presas de pollo' },
      { name: 'Huevo', qty: 3, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Mantequilla', qty: 50, unit: 'g', cat: 'dairy', buy: '100 g' },
      { name: 'Leche', qty: 125, unit: 'ml', cat: 'dairy', buy: '1 litro' },
      { name: 'Aceitunas', qty: 10, unit: 'unidades', cat: 'pantry', buy: '1 frasco pequeño' },
      { name: 'Pasas', qty: 2, unit: 'cdas', cat: 'pantry', buy: '1 paquete pequeño' },
      { name: 'Sal, pimienta, comino, azúcar', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20–25 min' },
  },

  'Pastel de papas': {
    emoji: '🥔', base: 5,
    ingredients: [
      { name: 'Papas', qty: 8, unit: 'unidades medianas', cat: 'veggie', buy: '1,5 kg' },
      { name: 'Carne molida', qty: 500, unit: 'g', cat: 'protein', buy: '500 g' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Leche', qty: 125, unit: 'ml', cat: 'dairy', buy: '1 litro' },
      { name: 'Mantequilla', qty: 50, unit: 'g', cat: 'dairy', buy: '100 g' },
      { name: 'Huevo', qty: 2, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Aceitunas', qty: 10, unit: 'unidades', cat: 'pantry', buy: '1 frasco pequeño' },
      { name: 'Pasas', qty: 2, unit: 'cdas', cat: 'pantry', buy: '1 paquete pequeño' },
      { name: 'Sal, pimienta, comino', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20–25 min' },
  },

  'Charquicán': {
    emoji: '🥕', base: 5,
    ingredients: [
      { name: 'Carne molida o mechada', qty: 400, unit: 'g', cat: 'protein', buy: '500 g' },
      { name: 'Zapallo', qty: 300, unit: 'g', cat: 'veggie', buy: '500 g' },
      { name: 'Papa', qty: 4, unit: 'unidades', cat: 'veggie', buy: '1 kg' },
      { name: 'Zanahoria', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Arvejas', qty: 0.5, unit: 'taza', cat: 'veggie', buy: '250 g' },
      { name: 'Sal, pimienta, comino', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20 min' },
  },

  'Empanadas': {
    emoji: '🥟', base: 5,
    ingredients: [
      { name: 'Harina', qty: 500, unit: 'g', cat: 'pantry', buy: '1 kg' },
      { name: 'Manteca o mantequilla', qty: 100, unit: 'g', cat: 'dairy', buy: '250 g' },
      { name: 'Carne molida', qty: 300, unit: 'g', cat: 'protein', buy: '500 g' },
      { name: 'Cebolla', qty: 2, unit: 'unidades', cat: 'veggie', buy: '2 unidades' },
      { name: 'Aceitunas', qty: 10, unit: 'unidades', cat: 'pantry', buy: '1 frasco pequeño' },
      { name: 'Huevo duro', qty: 2, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Pasas', qty: 2, unit: 'cdas', cat: 'pantry', buy: '1 paquete pequeño' },
      { name: 'Sal, comino, pimienta, orégano', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '2 meses' },
    heating: { microwave: '3–4 min', oven: '180°C × 15 min' },
  },

  'Zapallo italiano relleno': {
    emoji: '🥒', base: 5,
    ingredients: [
      { name: 'Zapallo italiano (zucchini)', qty: 5, unit: 'unidades', cat: 'veggie', buy: '5 unidades' },
      { name: 'Carne molida', qty: 300, unit: 'g', cat: 'protein', buy: '300 g' },
      { name: 'Queso', qty: 100, unit: 'g', cat: 'dairy', buy: '200 g' },
      { name: 'Cebolla', qty: 0.5, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Salsa de tomate', qty: 2, unit: 'unidades', cat: 'pantry', buy: '1 pack' },
      { name: 'Sal, pimienta, orégano', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Pastel de zapallo italiano': {
    emoji: '🥒', base: 5,
    ingredients: [
      { name: 'Zapallo italiano (zucchini)', qty: 600, unit: 'g', cat: 'veggie', buy: '600 g' },
      { name: 'Huevo', qty: 4, unit: 'unidades', cat: 'protein', buy: '6 unidades' },
      { name: 'Queso', qty: 150, unit: 'g', cat: 'dairy', buy: '200 g' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Harina', qty: 4, unit: 'cdas', cat: 'pantry', buy: '500 g' },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Canelones ricotta espinaca': {
    emoji: '🍝', base: 5,
    ingredients: [
      { name: 'Láminas de canelones', qty: 16, unit: 'unidades', cat: 'pantry', buy: '1 caja' },
      { name: 'Ricotta', qty: 300, unit: 'g', cat: 'dairy', buy: '300 g' },
      { name: 'Espinaca', qty: 200, unit: 'g', cat: 'veggie', buy: '250 g' },
      { name: 'Salsa de tomate', qty: 3, unit: 'unidades', cat: 'pantry', buy: '1 pack' },
      { name: 'Queso para gratinar', qty: 150, unit: 'g', cat: 'dairy', buy: '200 g' },
      { name: 'Sal, pimienta, nuez moscada', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '2 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20 min' },
  },

  'Tomaticán': {
    emoji: '🍅', base: 5,
    ingredients: [
      { name: 'Carne molida o pollo', qty: 400, unit: 'g', cat: 'protein', buy: '500 g' },
      { name: 'Tomate', qty: 4, unit: 'unidades', cat: 'veggie', buy: '4 unidades' },
      { name: 'Choclo', qty: 2, unit: 'tazas', cat: 'veggie', buy: '1 choclo o 1 lata' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Zapallo italiano', qty: 2, unit: 'unidades', cat: 'veggie', buy: '2 unidades' },
      { name: 'Condimentos', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '2 meses' },
    heating: { microwave: '4–6 min', oven: '180°C × 15–20 min' },
  },

  'Lasaña': {
    emoji: '🍝', base: 5,
    ingredients: [
      { name: 'Láminas de lasaña (pre-cocida)', qty: 12, unit: 'unidades', cat: 'pantry', buy: '1 caja' },
      { name: 'Carne molida', qty: 500, unit: 'g', cat: 'protein', buy: '500 g' },
      { name: 'Salsa de tomate', qty: 5, unit: 'unidades', cat: 'pantry', buy: '1 pack' },
      { name: 'Queso para gratinar', qty: 300, unit: 'g', cat: 'dairy', buy: '300–500 g' },
      { name: 'Maicena', qty: 10, unit: 'cdas', cat: 'pantry', buy: '1 caja' },
      { name: 'Mantequilla', qty: 200, unit: 'g', cat: 'dairy', buy: '250 g' },
      { name: 'Leche', qty: 500, unit: 'ml', cat: 'dairy', buy: '1 litro' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Sal, orégano, nuez moscada', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–7 días', freezer: '2–3 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20–25 min' },
  },

  'Canelones': {
    emoji: '🍝', base: 5,
    ingredients: [
      { name: 'Láminas de canelones', qty: 16, unit: 'unidades', cat: 'pantry', buy: '1 caja' },
      { name: 'Carne molida', qty: 400, unit: 'g', cat: 'protein', buy: '500 g' },
      { name: 'Salsa de tomate', qty: 3, unit: 'unidades', cat: 'pantry', buy: '1 pack' },
      { name: 'Queso para gratinar', qty: 200, unit: 'g', cat: 'dairy', buy: '250 g' },
      { name: 'Cebolla', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Leche', qty: 500, unit: 'ml', cat: 'dairy', buy: '1 litro' },
      { name: 'Mantequilla', qty: 100, unit: 'g', cat: 'dairy', buy: '250 g' },
      { name: 'Sal, pimienta, orégano', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '5–7 días', freezer: '2–3 meses' },
    heating: { microwave: '5–7 min', oven: '180°C × 20–25 min' },
  },

  // ── ACOMPAÑAMIENTOS ─────────────────────────────────────────────────────────
  'Arroz': {
    emoji: '🍚', base: 5, acomp: true,
    ingredients: [
      { name: 'Arroz', qty: 2, unit: 'tazas', cat: 'pantry', buy: '1 kg' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 10–15 min' },
  },

  'Arroz árabe': {
    emoji: '🍚', base: 5, acomp: true,
    ingredients: [
      { name: 'Arroz', qty: 2, unit: 'tazas', cat: 'pantry', buy: '1 kg' },
      { name: 'Cabellos de ángel', qty: 100, unit: 'g', cat: 'pantry', buy: '1 paquete pequeño' },
      { name: 'Mantequilla', qty: 2, unit: 'cdtas', cat: 'dairy', buy: '100 g' },
      { name: 'Sal', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 10–15 min' },
  },

  'Puré': {
    emoji: '🥔', base: 5, acomp: true,
    ingredients: [
      { name: 'Papas', qty: 8, unit: 'unidades medianas', cat: 'veggie', buy: '1,5 kg' },
      { name: 'Leche', qty: 250, unit: 'ml', cat: 'dairy', buy: '1 litro' },
      { name: 'Mantequilla', qty: 50, unit: 'g', cat: 'dairy', buy: '100 g' },
      { name: 'Sal, nuez moscada', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '3–5 min', oven: '180°C × 15 min' },
  },

  'Papas cocidas': {
    emoji: '🥔', base: 5, acomp: true,
    ingredients: [
      { name: 'Papas', qty: 6, unit: 'medianas', cat: 'veggie', buy: '1 kg' },
    ],
    conservation: { fridge: '4–5 días', freezer: '❌ No recomendado (pierden textura)' },
    heating: { microwave: '3–5 min', oven: '180°C × 15 min' },
  },

  'Papas fritas': {
    emoji: '🍟', base: 5, acomp: true,
    ingredients: [
      { name: 'Papas', qty: 6, unit: 'medianas', cat: 'veggie', buy: '1 kg' },
      { name: 'Aceite', qty: 300, unit: 'ml', cat: 'pantry', buy: '1 litro' },
      { name: 'Sal', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '1–2 días', freezer: '1 mes (sin freír)' },
    heating: { microwave: '2–3 min', oven: '200°C × 10 min' },
  },

  'Quinoa': {
    emoji: '🌾', base: 5, acomp: true,
    ingredients: [
      { name: 'Quinoa', qty: 1.5, unit: 'tazas', cat: 'pantry', buy: '500 g' },
      { name: 'Sal', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '1 mes' },
    heating: { microwave: '2–3 min', oven: '150°C × 10 min' },
  },

  'Cuscús': {
    emoji: '🌾', base: 5, acomp: true,
    ingredients: [
      { name: 'Cuscús', qty: 300, unit: 'g', cat: 'pantry', buy: '500 g' },
      { name: 'Mantequilla', qty: 1, unit: 'cda', cat: 'dairy', buy: '100 g' },
      { name: 'Sal', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '2–3 min', oven: '150°C × 10 min' },
  },

  'Zanahoria asada': {
    emoji: '🥕', base: 5, acomp: true,
    ingredients: [
      { name: 'Zanahoria', qty: 4, unit: 'unidades', cat: 'veggie', buy: '4 unidades' },
      { name: 'Aceite de oliva', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '4–5 días', freezer: '1 mes' },
    heating: { microwave: '2–3 min', oven: '180°C × 10 min' },
  },

  'Salteado de verduras': {
    emoji: '🥦', base: 5, acomp: true,
    ingredients: [
      { name: 'Zapallo italiano', qty: 2, unit: 'unidades', cat: 'veggie', buy: '2 unidades' },
      { name: 'Brócoli', qty: 200, unit: 'g', cat: 'veggie', buy: '250 g' },
      { name: 'Zanahoria', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Pimentón', qty: 1, unit: 'unidad', cat: 'veggie', buy: '1 unidad' },
      { name: 'Aceite', qty: 2, unit: 'cdas', cat: 'pantry', buy: null },
      { name: 'Sal, pimienta', qty: null, unit: 'a gusto', cat: 'seasoning', buy: null },
    ],
    conservation: { fridge: '3–4 días', freezer: '1 mes' },
    heating: { microwave: '2–3 min', oven: '180°C × 10 min' },
  },
}

// Orden de categorías en la lista de compras
export const SHOPPING_CATS = [
  { key: 'protein',   label: 'Proteinas' },
  { key: 'veggie',    label: 'Verduras y frutas' },
  { key: 'dairy',     label: 'Lacteos' },
  { key: 'pantry',    label: 'Abarrotes' },
  { key: 'other',     label: 'Otros' },
]
