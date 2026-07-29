// Contenido DIFERENCIADO por comuna para las landing pages de SEO local
// (/comida-a-domicilio/:comuna). Cada una tiene su propio enfoque, sectores
// reales y público — no son clones (evita la penalización por "doorway pages").
// El slug es la clave (URL-safe, sin ñ ni tildes).

export const COMUNAS_LANDING = {
  'las-condes': {
    nombre: 'Las Condes',
    intro:
      'Llevamos comida casera a domicilio a Las Condes: almuerzos y preparaciones caseras, porcionadas y selladas al vacío, listas para calentar. Perfecto para el ritmo del sector, entre oficinas y hogares.',
    sectores: ['El Golf', 'Escuela Militar', 'Apoquindo', 'Manquehue', 'Los Dominicos', 'Estoril', 'San Carlos de Apoquindo'],
    publico:
      'Ideal para ejecutivos y equipos de oficina del eje El Golf–Apoquindo, y para familias de Las Condes que quieren comer casero sin gastar tiempo en cocinar.',
  },
  providencia: {
    nombre: 'Providencia',
    intro:
      'Comida casera a domicilio en Providencia: recibe tus almuerzos caseros, porcionados y sellados al vacío, listos para el día a día entre el trabajo y el departamento.',
    sectores: ['Los Leones', 'Pedro de Valdivia', 'Manuel Montt', 'Salvador', 'Tobalaba', 'Barrio Italia'],
    publico:
      'Pensado para profesionales y equipos de oficina de Providencia, y para quienes viven solos o en pareja y quieren comer rico sin cocinar todos los días.',
  },
  nunoa: {
    nombre: 'Ñuñoa',
    intro:
      'Llevamos comida casera a domicilio a Ñuñoa: platos caseros de verdad, porcionados y sellados al vacío, para que disfrutes el sabor de siempre sin cocinar.',
    sectores: ['Plaza Ñuñoa', 'Irarrázaval', 'Estadio Nacional', 'Villa Frei', 'Chile-España', 'Suárez Mujica'],
    publico:
      'Ideal para familias de Ñuñoa y para estudiantes y profesionales del sector que buscan comida casera, sana y a buen precio.',
  },
  vitacura: {
    nombre: 'Vitacura',
    intro:
      'Comida casera a domicilio en Vitacura: almuerzos y preparaciones caseras, porcionadas y selladas al vacío, listas para tu hogar.',
    sectores: ['Alonso de Córdova', 'Nueva Costanera', 'Bicentenario', 'Santa María de Manquehue', 'Jardín del Este'],
    publico:
      'Pensado para hogares y familias de Vitacura que quieren comer casero y saludable, con la comodidad de recibirlo listo en casa.',
  },
}

export const COMUNA_SLUGS = Object.keys(COMUNAS_LANDING)
