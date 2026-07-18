// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de platos — FUENTE ÚNICA (transcrito del documento de recetas).
// Cada plato: { nombre, categoria, servicios, ingredientes: [{ nombre, unidad, p }] }
//   - servicios: 'meal_prep' y/o 'cocinera'.
//   - p: [1 persona, 2, 3, 4, 5]. `null` = el documento no trae ese valor.
//   - Cantidades EXACTAS del documento (no lineales). Se normalizaron nombres a
//     Title Case con acentos, unidades (gr→g, ML→ml, kg, cda, unidad…) y typos.
//   - Masa unificada a g y volumen a ml dentro de una misma fila; cuando la unidad
//     de medida cambia de tipo entre columnas se guarda el texto por columna (t()).
// ─────────────────────────────────────────────────────────────────────────────

// Orden de categorías para el despliegue.
export const CATEGORIAS = [
  'Carnes y Pollo',
  'Legumbres y Caldos',
  'Quiches y Tortillas',
  'Pastas',
  'Ensaladas',
  'Otros Platos',
  'Acompañamientos',
]

const AMBOS = ['meal_prep', 'cocinera']
const COCINERA = ['cocinera']
const A = 'A gusto'

// Helpers de ingredientes (p = [1p,2p,3p,4p,5p]).
const i = (nombre, unidad, ...p) => ({ nombre, unidad, p })
const g = (nombre) => ({ nombre, unidad: '', p: [A, A, A, A, A] }) // "A gusto" en todas
const t = (nombre, ...p) => ({ nombre, unidad: '', p }) // texto por columna (unidad mixta)
const o5 = (nombre, unidad, v) => ({ nombre, unidad, p: [null, null, null, null, v] }) // solo 5 personas

export const CATALOGO_PLATOS = [
  // ── Carnes y Pollo ──────────────────────────────────────────────────────────
  {
    nombre: 'Carne Desmechada',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Carne (pollo ganso)', 'g', '260', '520', '780', '1000', '1300'),
      i('Zanahoria', 'unidad', '½', '1', '1', '1', '1'),
      i('Cebolla', 'unidad', '½', '1', '1', '1', '1'),
      i('Pimentón', 'unidad', '¼', '½', '1', '1', '1'),
      i('Laurel', 'hoja', '1', '1', '2', '2', '2'),
      g('Sal, pimienta, orégano'),
      i('Aceite', 'cda', '1', '2', '3', '4', '5'),
      i('Vino tinto', 'ml', '150', '150', '150', '150', '150'),
    ],
  },
  {
    nombre: 'Albóndigas',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Carne molida', 'g', '100', '200', '300', '400', '500'),
      i('Pan rallado', 'g', '20', '40', '100', '120', '200'),
      i('Huevo', 'unidad', '1', '1', '2', '2', '2'),
      g('Aliños'),
    ],
  },
  {
    nombre: 'Ají de Gallina',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Pechuga de pollo', 'g', '200', '400', '600', '850', '850'),
      i('Galletas de soda', 'paquete', '1', '1', '1', '1', '1'),
      i('Leche evaporada', 'tarro', '1', '1', '1', '1', '1'),
      i('Pasta de ají amarillo', 'g', '20', '40', '40', '40', '40'),
    ],
  },
  {
    nombre: 'Milanesa',
    categoria: 'Carnes y Pollo',
    servicios: COCINERA,
    ingredientes: [
      i('Filete de carne o pollo (bistec delgados)', 'unidad', '1', '2', '3', '4', '5'),
      i('Huevo', 'unidad', '1', '2', '2', '3', '4'),
      i('Harina', 'g', '100', '100', '150', '150', '200'),
      i('Pan rallado', 'g', '100', '100', '100', '250', '250'),
      i('Aceite para freír', 'L', '½', '½', '½', '1', '1'),
      g('Sal, pimienta, ajo en polvo'),
    ],
  },
  {
    nombre: 'Pollo al Jugo',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Presas de pollo', 'unidad', '1', '2', '3', '4', '5'),
      i('Cebolla', 'unidad', '¼', '½', '¾', '1', '1'),
      i('Zanahoria', 'unidad', '½', '½', '1', '1', '1'),
      i('Sobre o cubo de pollo', 'cubo', '1', '1', '1', '1', '1'),
      g('Aliños'),
    ],
  },
  {
    nombre: 'Pollo Arvejado',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Presas de pollo', 'unidad', '1', '2', '3', '4', '5'),
      i('Cebolla', 'unidad', '¼', '½', '¾', '1', '1'),
      i('Zanahoria', 'unidad', '½', '½', '1', '1', '1'),
      i('Sobre o cubo de pollo', 'cubo', '1', '1', '1', '1', '1'),
      i('Arvejas', 'g', '50', '50', '100', '100', '100'),
      g('Aliños'),
    ],
  },
  {
    nombre: 'Pollo Asado',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Presas de pollo', 'unidad', '1', '2', '3', '4', '5'),
      i('Limón', 'unidad', '1', '1', '1', '1', '1'),
      g('Sal, pimienta, comino, orégano'),
      i('Cebolla', 'unidad', '½', '½', '1', '1', '1'),
      i('Cerveza (opcional)', 'ml', '200', '200', '200', '200', '200'),
    ],
  },
  {
    nombre: 'Pollo a la Mostaza',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Trutro de pollo', 'unidad', '1', '2', '3', '4', '5'),
      i('Mostaza', 'g', '40', '60', '80', '100', '120'),
    ],
  },
  {
    nombre: 'Pollo Teriyaki',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Filetitos de pollo', 'g', '350', '450', '500', '600', '850'),
      i('Teriyaki', 'g', '40', '60', '80', '100', '120'),
    ],
  },
  {
    nombre: 'Pollo al Curry',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Filetitos de pollo', 'g', '350', '450', '500', '600', '850'),
      i('Curry', 'g', '20', '20', '40', '40', '40'),
      i('Crema', 'g', '100', '100', '100', '200', '200'),
      i('Salsa de tomate', 'g', '20', '20', '40', '40', '40'),
      i('Cebolla', 'unidad', '½', '½', '½', '1', '1'),
    ],
  },
  {
    nombre: 'Estofado',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Papas', 'unidad', '1', '2', '3', '4', '4'),
      i('Cebolla', 'unidad', '½', '½', '1', '1', '1'),
      i('Carne posta rosada', 'g', '300', '400', '500', '600', '1000'),
      i('Zanahoria', 'unidad', '½', '½', '1', '1', '1'),
      i('Vino blanco', 'ml', '100', '100', '100', '100', '100'),
      g('Aliños'),
    ],
  },
  {
    nombre: 'Asado Alemán',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      o5('Carne molida', 'g', '1500'),
      o5('Pan rallado', 'g', '150'),
      o5('Mostaza', 'g', '40'),
      o5('Salsa de soya', 'ml', '50'),
      o5('Huevos', 'unidad', '7'),
    ],
  },
  {
    nombre: 'Stroganoff',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Cebolla', 'unidad', '1', '1', '1', '2', '2'),
      i('Pollo', 'g', '350', '400', '500', '600', '750'),
      i('Crema', 'ml', '200', '200', '200', '400', '400'),
      t('Salsa de tomate', '2 cdas', '2 cdas', '2 cdas', '2 cdas', '200 g'),
      i('Champiñón', 'g', '200', '200', '200', '400', '400'),
    ],
  },
  {
    nombre: 'Croqueta de Atún',
    categoria: 'Carnes y Pollo',
    servicios: AMBOS,
    ingredientes: [
      i('Atún', 'lata', '1', '1', '2', '2', '3'),
      i('Huevo', 'unidad', '1', '1', '2', '2', '2'),
      i('Harina', 'g', '40', '80', '120', '140', '150'),
      g('Aliños'),
    ],
  },

  // ── Legumbres y Caldos ──────────────────────────────────────────────────────
  {
    nombre: 'Cazuela',
    categoria: 'Legumbres y Caldos',
    servicios: COCINERA,
    ingredientes: [
      i('Carne (pollo o vacuno: ossobuco o tapapecho)', 'presa', '1', '2', '3', '4', '5'),
      i('Papa', 'unidad', '1', '2', '3', '4', '5'),
      i('Zapallo', 'g', '100', '200', '300', '400', '500'),
      i('Choclo', 'trozo', '1', '2', '3', '4', '5'),
      i('Arroz o fideos', 'g', '30', '60', '90', '120', '150'),
    ],
  },
  {
    nombre: 'Porotos',
    categoria: 'Legumbres y Caldos',
    servicios: AMBOS,
    ingredientes: [
      i('Poroto', 'g', '100', '100', '200', '200', '200'),
      i('Zapallo', 'g', '100', '100', '150', '200', '200'),
      i('Cebolla', 'unidad', '¼', '½', '½', '½', '½'),
      g('Condimentos'),
      i('Fideos', 'g', '150', '150', '150', '200', '200'),
    ],
  },
  {
    nombre: 'Porotos Granados',
    categoria: 'Legumbres y Caldos',
    servicios: AMBOS,
    ingredientes: [
      i('Porotos granados congelados', 'g', '500', '500', '500', '1000', '1000'),
      i('Zapallo', 'g', '100', '100', '150', '200', '200'),
      i('Cebolla', 'unidad', '¼', '½', '½', '½', '½'),
      g('Condimentos'),
      i('Albahaca', 'rama', '1', '1', '1', '1', '1'),
      i('Choclo', 'g', '200', '200', '200', '300', '400'),
    ],
  },
  {
    nombre: 'Lentejas',
    categoria: 'Legumbres y Caldos',
    servicios: AMBOS,
    ingredientes: [
      i('Lentejas', 'g', '100', '150', '150', '200', '200'),
      i('Zapallo', 'g', '100', '100', '150', '200', '200'),
      i('Cebolla', 'unidad', '½', '½', '½', '½', '½'),
      g('Condimentos'),
      i('Arroz', 'g', '150', '150', '150', '200', '200'),
    ],
  },
  {
    nombre: 'Lentejas Guisadas',
    categoria: 'Legumbres y Caldos',
    servicios: AMBOS,
    ingredientes: [
      i('Lentejas', 'g', '100', '150', '150', '200', '200'),
      i('Zapallo', 'g', '100', '100', '150', '200', '200'),
      i('Cebolla', 'unidad', '½', '½', '½', '½', '½'),
      g('Condimentos'),
      i('Pimentón', 'unidad', '½', '½', '½', '1', '1'),
      i('Zanahoria', 'unidad', '½', '½', '½', '1', '1'),
      i('Zapallo italiano', 'unidad', '½', '½', '½', '1', '1'),
    ],
  },
  {
    nombre: 'Garbanzo',
    categoria: 'Legumbres y Caldos',
    servicios: AMBOS,
    ingredientes: [
      i('Garbanzo', 'g', '100', '150', '150', '200', '200'),
      i('Zapallo', 'g', '100', '100', '150', '200', '200'),
      i('Cebolla', 'unidad', '½', '½', '½', '½', '½'),
      g('Condimentos'),
      i('Arroz', 'g', '150', '150', '150', '200', '200'),
    ],
  },
  {
    nombre: 'Carbonada',
    categoria: 'Legumbres y Caldos',
    servicios: AMBOS,
    ingredientes: [
      i('Carne picada', 'g', '100', '200', '300', '400', '500'),
      i('Papa', 'unidad', '1', '2', '3', '4', '5'),
      i('Choclo', 'g', '100', '100', '100', '200', '200'),
      i('Cubo o sobre de costilla', 'unidad', '1', '1', '1', '1', '1'),
      i('Zapallo', 'g', '100', '100', '150', '200', '200'),
      g('Aliños'),
      i('Arroz', 'g', '30', '60', '90', '120', '150'),
    ],
  },
  {
    nombre: 'Pantrucas',
    categoria: 'Legumbres y Caldos',
    servicios: COCINERA,
    ingredientes: [
      i('Huevo', 'unidad', '1', '1', '1', '2', '2'),
      i('Zapallo', 'g', '100', '100', '150', '150', '200'),
      i('Bolsa de pantrucas (Carozzi)', 'g', '100', '100', '150', '150', '200'),
      i('Papas', 'unidad', '1', '1', '2', '2', '3'),
      i('Carne molida', 'g', '50', '100', '150', '200', '300'),
      g('Aliños'),
      i('Caldo o cubo de costilla', 'unidad', '1', '1', '1', '1', '1'),
    ],
  },

  // ── Quiches y Tortillas (solo 5 personas en el documento) ───────────────────
  {
    nombre: 'Tortilla Española',
    categoria: 'Quiches y Tortillas',
    servicios: AMBOS,
    ingredientes: [
      o5('Huevos', 'unidad', '4'),
      o5('Papas', 'unidad', '2'),
      o5('Cebolla grande', 'unidad', '1'),
      o5('Longaniza', 'unidad', '2'),
    ],
  },
  {
    nombre: 'Tortilla de Espinaca',
    categoria: 'Quiches y Tortillas',
    servicios: AMBOS,
    ingredientes: [o5('Huevos', 'unidad', '4'), o5('Espinaca', 'g', '350')],
  },
  {
    nombre: 'Tortilla de Acelga',
    categoria: 'Quiches y Tortillas',
    servicios: AMBOS,
    ingredientes: [o5('Huevos', 'unidad', '4'), o5('Acelga', 'g', '300')],
  },
  {
    nombre: 'Tortilla de Zanahoria',
    categoria: 'Quiches y Tortillas',
    servicios: AMBOS,
    ingredientes: [o5('Huevos', 'unidad', '4'), o5('Zanahoria', 'unidad', '5')],
  },
  {
    nombre: 'Tortilla de Porotos Verdes',
    categoria: 'Quiches y Tortillas',
    servicios: AMBOS,
    ingredientes: [o5('Huevos', 'unidad', '4'), o5('Porotos verdes', 'g', '500')],
  },
  {
    nombre: 'Quiche Salmón Espinaca',
    categoria: 'Quiches y Tortillas',
    servicios: AMBOS,
    ingredientes: [
      o5('Huevos', 'unidad', '2'),
      o5('Crema', 'ml', '400'),
      o5('Queso granulado', 'g', '250'),
      o5('Espinaca', 'g', '250'),
      o5('Salmón', 'g', '250'),
      o5('Harina', 'g', '250'),
    ],
  },
  {
    nombre: 'Quiche Lorraine',
    categoria: 'Quiches y Tortillas',
    servicios: AMBOS,
    ingredientes: [
      o5('Huevos', 'unidad', '2'),
      o5('Crema', 'ml', '400'),
      o5('Queso granulado', 'g', '250'),
      o5('Cebolla', 'unidad', '1½'),
      o5('Tocino', 'g', '180'),
      o5('Harina', 'g', '250'),
    ],
  },
  {
    nombre: 'Quiche Pollo Choclo Espinaca',
    categoria: 'Quiches y Tortillas',
    servicios: AMBOS,
    ingredientes: [
      o5('Huevos', 'unidad', '2'),
      o5('Crema', 'ml', '400'),
      o5('Queso granulado', 'g', '250'),
      o5('Pollo', 'g', '300'),
      o5('Choclo', 'g', '200'),
      o5('Espinaca', 'g', '300'),
      o5('Harina', 'g', '250'),
    ],
  },
  {
    nombre: 'Quiche Queso Jamón',
    categoria: 'Quiches y Tortillas',
    servicios: AMBOS,
    ingredientes: [
      o5('Huevos', 'unidad', '2'),
      o5('Crema', 'ml', '400'),
      o5('Queso granulado', 'g', '350'),
      o5('Jamón', 'g', '300'),
      o5('Harina', 'g', '250'),
    ],
  },
  {
    nombre: 'Quiche Espinaca Pollo',
    categoria: 'Quiches y Tortillas',
    servicios: AMBOS,
    ingredientes: [
      o5('Huevos', 'unidad', '2'),
      o5('Crema', 'ml', '400'),
      o5('Queso granulado', 'g', '250'),
      o5('Espinaca', 'g', '300'),
      o5('Pollo', 'g', '300'),
      o5('Harina', 'g', '250'),
    ],
  },
  {
    nombre: 'Quiche Brócoli Choclo',
    categoria: 'Quiches y Tortillas',
    servicios: AMBOS,
    ingredientes: [
      o5('Huevos', 'unidad', '2'),
      o5('Crema', 'ml', '400'),
      o5('Queso granulado', 'g', '250'),
      o5('Brócoli', 'unidad', '1'),
      o5('Choclo', 'g', '200'),
      o5('Harina', 'g', '250'),
    ],
  },

  // ── Pastas ──────────────────────────────────────────────────────────────────
  {
    nombre: 'Lasaña',
    categoria: 'Pastas',
    servicios: AMBOS,
    ingredientes: [
      i('Láminas de lasaña (pre-cocida)', 'unidad', '6', '8', '10', '12', '15'),
      i('Carne molida', 'g', '100', '200', '300', '400', '500'),
      i('Salsa de tomate', 'unidad', '1', '1', '3', '4', '5'),
      i('Queso para gratinar (chanco o mantecoso)', 'g', '100', '150', '200', '250', '250'),
      i('Maicena', 'g', '80', '80', '100', '100', '100'),
      i('Mantequilla', 'g', '50', '100', '100', '100', '100'),
      i('Leche', 'ml', '200', '200', '200', '300', '300'),
      g('Nuez moscada'),
      i('Cebolla', 'unidad', '1', '1', '1', '1', '1'),
    ],
  },
  {
    nombre: 'Canelones Boloñesa',
    categoria: 'Pastas',
    servicios: AMBOS,
    ingredientes: [
      i('Canelones', 'unidad', '3', '6', '9', '12', '15'),
      i('Carne molida', 'g', '100', '200', '300', '400', '500'),
      i('Salsa de tomate', 'g', '200', '200', '600', '800', '1000'),
      i('Queso para gratinar (chanco o mantecoso)', 'g', '100', '150', '200', '250', '250'),
      i('Maicena', 'g', '80', '80', '100', '100', '100'),
      i('Mantequilla', 'g', '50', '100', '100', '100', '100'),
      i('Leche', 'ml', '200', '200', '200', '300', '300'),
      g('Nuez moscada'),
      i('Cebolla', 'unidad', '1', '1', '1', '1', '1'),
    ],
  },
  {
    nombre: 'Ravioles Salsa Tomate',
    categoria: 'Pastas',
    servicios: AMBOS,
    ingredientes: [
      i('Ravioles', 'g', '250', '350', '450', '550', '650'),
      i('Salsa de tomate', 'g', '200', '200', '400', '400', '400'),
    ],
  },
  {
    nombre: 'Pasta Alfredo',
    categoria: 'Pastas',
    servicios: AMBOS,
    ingredientes: [
      i('Pasta', 'g', '200', '200', '300', '400', '400'),
      i('Jamón', 'g', '100', '200', '200', '350', '350'),
      i('Queso', 'g', '100', '100', '200', '200', '350'),
      i('Crema', 'ml', '200', '200', '200', '400', '400'),
    ],
  },
  {
    nombre: 'Pasta al Pesto',
    categoria: 'Pastas',
    servicios: AMBOS,
    ingredientes: [
      i('Pasta', 'g', '80', '160', '240', '320', '400'),
      i('Aceite de oliva', 'ml', '24', '48', '72', '96', '120'),
      i('Albahaca', 'g', '12', '24', '36', '48', '60'),
      i('Ajo', 'diente', '½', '½', '½', '1', '1'),
      i('Nueces', 'g', '10', '20', '30', '40', '50'),
      i('Queso parmesano', 'g', '16', '32', '48', '64', '80'),
    ],
  },
  {
    nombre: 'Pasta con Camarones a la Crema',
    categoria: 'Pastas',
    servicios: COCINERA,
    ingredientes: [
      i('Pasta', 'g', '80', '160', '240', '320', '400'),
      t('Crema', '80 g', '160 g', '240 g', '320 g', '400 ml'),
      i('Camarones', 'g', '150', '300', '450', '600', '750'),
      i('Queso mantecoso', 'g', '10', '20', '30', '40', '50'),
      i('Mantequilla', 'g', '10', '20', '30', '40', '50'),
    ],
  },

  // ── Ensaladas (solo 5 personas en el documento) ─────────────────────────────
  {
    nombre: 'Ensalada Sabores de Mamá',
    categoria: 'Ensaladas',
    servicios: AMBOS,
    ingredientes: [
      o5('Lechuga', 'unidad', '1'),
      o5('Nueces tostadas', 'taza', '½'),
      o5('Manzana verde', 'unidad', '1'),
      o5('Queso gauda (trozo)', 'g', '150'),
      o5('Miel', 'cda', '2'),
      o5('Mostaza', 'cda', '2'),
      o5('Aliños', '', A),
    ],
  },
  {
    nombre: 'Ensalada Mediterránea',
    categoria: 'Ensaladas',
    servicios: AMBOS,
    ingredientes: [
      o5('Tomate cherry', 'g', '250'),
      o5('Pepino', 'unidad', '1'),
      o5('Aceitunas negras (sin corazón)', 'g', '100'),
      o5('Queso fresco o feta', 'g', '150'),
      o5('Aliños', '', A),
    ],
  },
  {
    nombre: 'Ensalada Sabor de Casa',
    categoria: 'Ensaladas',
    servicios: AMBOS,
    ingredientes: [
      o5('Rúcula', 'unidad', '1'),
      o5('Pera', 'unidad', '2'),
      o5('Nueces', 'g', '100'),
      o5('Queso azul', 'g', '200'),
      o5('Miel', 'g', '40'),
    ],
  },
  {
    nombre: 'Ensalada Crunch',
    categoria: 'Ensaladas',
    servicios: AMBOS,
    ingredientes: [
      o5('Repollo blanco', 'unidad', '½'),
      o5('Zanahoria (medianas)', 'unidad', '2'),
      o5('Manzana verde', 'unidad', '2'),
      o5('Yogurt natural', 'ml', '200'),
      o5('Miel', 'g', '40'),
    ],
  },
  {
    nombre: 'Ensalada Fría',
    categoria: 'Ensaladas',
    servicios: COCINERA,
    ingredientes: [
      i('Pasta', 'g', '60', '120', '180', '240', '300'),
      i('Tomate cherry', 'g', '20', '40', '60', '80', '100'),
      i('Atún', 'g', '80', '80', '80', '160', '160'),
      i('Choclo', 'g', '40', '80', '120', '160', '200'),
      i('Queso', 'g', '30', '60', '90', '120', '150'),
    ],
  },

  // ── Otros Platos ────────────────────────────────────────────────────────────
  {
    nombre: 'Pastel de Choclo',
    categoria: 'Otros Platos',
    servicios: AMBOS,
    ingredientes: [
      i('Carne molida', 'g', '100', '200', '300', '400', '500'),
      i('Cebolla', 'unidad', '1', '1', '1', '1', '1'),
      i('Pastelera', 'kg', '1', '1', '1', '2', '2'),
      i('Huevo duro', 'unidad', '1', '1', '2', '2', '3'),
      i('Aceituna', 'unidad', '1', '2', '3', '4', '5'),
      i('Pechuga de pollo deshuesada', 'g', '350', '350', '350', '350', '350'),
    ],
  },
  {
    nombre: 'Pastel de Papa',
    categoria: 'Otros Platos',
    servicios: AMBOS,
    ingredientes: [
      i('Papa (medianas)', 'unidad', '2', '4', '6', '8', '8'),
      i('Mantequilla', 'g', '20', '20', '40', '60', '60'),
      i('Leche', 'ml', '100', '100', '100', '150', '150'),
      i('Carne molida', 'g', '100', '200', '300', '400', '500'),
      i('Cebolla', 'unidad', '¼', '½', '¾', '1', '1'),
      i('Huevo duro (opcional)', 'unidad', '1', '1', '2', '2', '3'),
      i('Queso laminado o granulado (mantecoso o chanco)', 'g', '100', '150', '200', '200', '250'),
    ],
  },
  {
    nombre: 'Zapallo Relleno',
    categoria: 'Otros Platos',
    servicios: AMBOS,
    ingredientes: [
      i('Zapallo italiano', 'unidad', '1', '2', '3', '4', '5'),
      i('Carne molida', 'g', '100', '200', '300', '400', '500'),
      i('Cebolla', 'unidad', '¼', '¼', '¼', '¼', '¼'),
      i('Queso para gratinar', 'g', '50', '100', '150', '200', '250'),
      g('Aliños'),
      i('Arroz', 'g', '150', '150', '150', '200', '200'),
    ],
  },
  {
    nombre: 'Pimentón Relleno',
    categoria: 'Otros Platos',
    servicios: AMBOS,
    ingredientes: [
      i('Pimentón', 'unidad', '1', '2', '3', '4', '5'),
      i('Carne molida', 'g', '100', '200', '300', '400', '500'),
      i('Cebolla', 'unidad', '¼', '¼', '¼', '¼', '¼'),
      i('Queso para gratinar', 'g', '50', '100', '150', '200', '250'),
      g('Aliños'),
      i('Arroz', 'g', '150', '150', '150', '200', '200'),
    ],
  },
  {
    nombre: 'Budín de Zapallo',
    categoria: 'Otros Platos',
    servicios: AMBOS,
    ingredientes: [
      i('Zapallo italiano', 'unidad', '1', '2', '3', '3', '3'),
      i('Pan rallado', 'g', '100', '100', '150', '150', '150'),
      i('Huevo', 'unidad', '1', '2', '3', '4', '5'),
      i('Queso rallado (mantecoso o parmesano)', 'g', '100', '150', '200', '250', '250'),
      g('Sal, nuez moscada'),
    ],
  },
  {
    nombre: 'Charquicán',
    categoria: 'Otros Platos',
    servicios: AMBOS,
    ingredientes: [
      i('Carne molida', 'g', '100', '200', '300', '400', '500'),
      i('Papas (medianas)', 'unidad', '2', '3', '4', '5', '6'),
      i('Zapallo', 'g', '100', '100', '100', '200', '200'),
      i('Choclo', 'g', '100', '100', '100', '200', '200'),
      i('Porotos verdes', 'g', '100', '100', '100', '200', '200'),
      i('Cebolla', 'unidad', '¼', '¼', '¼', '½', '½'),
      g('Aliños'),
    ],
  },
  {
    nombre: 'Tomaticán',
    categoria: 'Otros Platos',
    servicios: AMBOS,
    ingredientes: [
      i('Choclo', 'g', '50', '100', '150', '200', '200'),
      i('Carne picada', 'g', '100', '200', '300', '400', '500'),
      i('Tomate (maduro)', 'unidad', '1', '1', '1', '2', '3'),
      i('Cebolla', 'unidad', '¼', '¼', '¼', '½', '½'),
    ],
  },
  {
    nombre: 'Crema de Zapallo',
    categoria: 'Otros Platos',
    servicios: COCINERA,
    ingredientes: [
      i('Zapallo', 'g', '300', '500', '760', '1000', '1000'),
      i('Crema', 'ml', '200', '200', '400', '400', '400'),
      i('Mantequilla', 'g', '20', '20', '40', '60', '60'),
      g('Sal, nuez moscada'),
    ],
  },
  {
    nombre: 'Guiso de Zapallo',
    categoria: 'Otros Platos',
    servicios: COCINERA,
    ingredientes: [
      i('Zapallo italiano', 'unidad', '1', '2', '3', '3', '4'),
      g('Sal, orégano, ajo en polvo'),
      i('Huevo', 'unidad', '1', '2', '3', '3', '3'),
      i('Queso rallado (mantecoso)', 'g', '50', '100', '150', '200', '200'),
      i('Pan rallado', 'g', '40', '40', '60', '80', '100'),
    ],
  },
  {
    nombre: 'Choclo a la Crema',
    categoria: 'Otros Platos',
    servicios: COCINERA,
    ingredientes: [
      i('Choclo en grano', 'g', '100', '200', '300', '400', '500'),
      i('Crema', 'ml', '100', '200', '300', '400', '400'),
    ],
  },
  {
    nombre: 'Chili',
    categoria: 'Otros Platos',
    servicios: AMBOS,
    ingredientes: [
      i('Carne molida', 'g', '200', '200', '300', '400', '500'),
      i('Choclo', 'g', '100', '100', '200', '200', '200'),
      i('Concentrado de tomate', 'g', '100', '100', '210', '210', '210'),
      i('Porotos negros', 'g', '100', '100', '150', '230', '230'),
      i('Sazonador de chile', 'g', '15', '15', '35', '35', '35'),
      i('Cebolla', 'unidad', '½', '½', '1', '1', '1'),
      i('Pimentón', 'unidad', '½', '½', '1', '1', '1'),
    ],
  },

  // ── Acompañamientos ─────────────────────────────────────────────────────────
  {
    nombre: 'Arroz Árabe',
    categoria: 'Acompañamientos',
    servicios: AMBOS,
    ingredientes: [
      i('Arroz', 'g', '40', '80', '120', '160', '200'),
      i('Mantequilla', 'g', '20', '40', '60', '80', '100'),
      i('Fideos', 'g', '60', '120', '180', '240', '300'),
      i('Caldo de pollo (cubo o sobre)', 'unidad', '1', '1', '1', '1', '1'),
      i('Curry', '', 'Opcional', 'Opcional', 'Opcional', 'Opcional', 'Opcional'),
    ],
  },
  {
    nombre: 'Arroz',
    categoria: 'Acompañamientos',
    servicios: AMBOS,
    ingredientes: [
      i('Arroz', 'g', '60', '120', '180', '240', '300'),
      i('Zanahoria', 'unidad', '¼', '¼', '¼', '½', '½'),
      i('Pimentón', 'unidad', '¼', '¼', '¼', '¼', '¼'),
      i('Caldo de pollo', 'unidad', '1', '1', '1', '1', '1'),
    ],
  },
  {
    nombre: 'Pasta',
    categoria: 'Acompañamientos',
    servicios: AMBOS,
    ingredientes: [i('Pasta', 'g', '80', '160', '240', '320', '400')],
  },
  {
    nombre: 'Papas Cocidas',
    categoria: 'Acompañamientos',
    servicios: AMBOS,
    ingredientes: [i('Papas (medianas)', 'unidad', '2', '3', '4', '5', '6')],
  },
  {
    nombre: 'Papas Fritas',
    categoria: 'Acompañamientos',
    servicios: COCINERA,
    ingredientes: [
      i('Papas (medianas)', 'unidad', '2', '3', '4', '5', '6'),
      i('Aceite para freír', 'L', '½', '½', '½', '1', '1'),
    ],
  },
  {
    nombre: 'Puré',
    categoria: 'Acompañamientos',
    servicios: AMBOS,
    ingredientes: [
      i('Papas', 'unidad', '2', '3', '4', '5', '6'),
      i('Mantequilla', 'g', '12', '24', '36', '48', '60'),
      i('Leche', 'ml', '40', '80', '120', '160', '200'),
    ],
  },
  {
    nombre: 'Cuscús',
    categoria: 'Acompañamientos',
    servicios: AMBOS,
    ingredientes: [
      i('Cuscús', 'g', '40', '80', '120', '160', '200'),
      i('Mantequilla', 'g', '20', '20', '20', '20', '20'),
    ],
  },
  {
    nombre: 'Quinoa',
    categoria: 'Acompañamientos',
    servicios: AMBOS,
    ingredientes: [i('Quinoa', 'g', '40', '80', '120', '160', '200')],
  },
  {
    nombre: 'Salteado de Verduras',
    categoria: 'Acompañamientos',
    servicios: AMBOS,
    ingredientes: [
      i('Zanahoria', 'unidad', '½', '½', '½', '½', '1'),
      i('Pimentón', 'unidad', '½', '½', '½', '½', '1'),
      i('Cebollín', 'paquete', '1', '1', '1', '1', '1'),
      i('Brócoli', 'unidad', '½', '½', '½', '½', '1'),
      i('Zapallo italiano', 'unidad', '½', '½', '½', '½', '1'),
      t('Champiñón', '½ unidad', '½ unidad', '½ unidad', '½ unidad', '1 bandeja'),
    ],
  },
  {
    nombre: 'Zanahorias Asadas',
    categoria: 'Acompañamientos',
    servicios: AMBOS,
    ingredientes: [
      i('Zanahoria', 'unidad', '2', '4', '6', '8', '10'),
      i('Miel', 'g', '8', '16', '24', '32', '40'),
    ],
  },
  {
    nombre: 'Papas Rústicas',
    categoria: 'Acompañamientos',
    servicios: AMBOS,
    ingredientes: [
      i('Papas', 'unidad', '2', '3', '4', '5', '6'),
      i('Mantequilla', 'g', '20', '40', '40', '60', '60'),
      g('Romero'),
    ],
  },
  {
    nombre: 'Camote',
    categoria: 'Acompañamientos',
    servicios: AMBOS,
    ingredientes: [
      i('Camote', 'unidad', '1', '2', '3', '4', '5'),
      i('Canela', 'g', '20', '20', '40', '40', '40'),
    ],
  },
]
