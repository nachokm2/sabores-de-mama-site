/**
 * Términos y Condiciones del servicio · contenido y versión.
 *
 * Fuente ÚNICA: la usan la página pública (/terminos-y-condiciones) y la casilla
 * de aceptación del formulario de pedido, que envía `TERMINOS_VERSION` al backend
 * para dejar registrado QUÉ versión aceptó cada cliente.
 *
 * Al cambiar el texto hay que subir la versión y la fecha. Si no, dos clientes
 * con condiciones distintas quedarían guardados con la misma versión y el
 * registro dejaría de servir como respaldo.
 */

export const TERMINOS_VERSION = '1.0'
export const TERMINOS_FECHA = '2026-09-05'
export const TERMINOS_RUTA = '/terminos-y-condiciones'

/** Fecha de vigencia en formato legible (es-CL). */
export const TERMINOS_FECHA_LARGA = new Date(TERMINOS_FECHA + 'T00:00:00').toLocaleDateString('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Secciones del documento. Cada una: { id, titulo, bloques[] }, donde un bloque
 * es { p: '…' } (párrafo), { lista: [...] } (viñetas) o { destacado: '…' }.
 */
export const SECCIONES = [
  {
    id: 'quienes-somos',
    titulo: '1. Quiénes somos y qué cubren estos términos',
    bloques: [
      {
        p: 'Sabores de Mamá es un servicio de comida casera en Santiago de Chile. Estos Términos y Condiciones aplican a todos los pedidos realizados a través de este sitio web y describen cómo funciona el servicio, qué puedes esperar de nosotros y qué esperamos de ti.',
      },
      {
        p: 'Al marcar la casilla de aceptación antes de enviar tu pedido, declaras que leíste y aceptas estas condiciones. Guardamos la fecha, la hora y la versión que aceptaste junto a tu pedido.',
      },
    ],
  },
  {
    id: 'servicios',
    titulo: '2. Los servicios que ofrecemos',
    bloques: [
      { p: 'Trabajamos con dos servicios principales, que se piden por separado en el sitio:' },
      {
        lista: [
          'Meal Prep: preparamos tus platos con los ingredientes que tú nos haces llegar, los porcionamos, los sellamos al vacío y te los despachamos a tu domicilio. Eliges hasta 5 preparaciones por pedido y cada preparación rinde 5 porciones individuales.',
          'Cocinera a Domicilio: vamos a tu hogar y cocinamos hasta 5 preparaciones con los ingredientes que tú compras y tienes listos en casa. El servicio dura entre 2 y 5 horas según la cantidad y la complejidad de los platos, y al terminar dejamos la cocina limpia y ordenada. Al armar el pedido indicas para cuántas personas cocinamos (de 1 a 5) y con eso calculamos tu lista de compras.',
        ],
      },
      {
        p: 'Además puedes sumar adicionales opcionales a tu pedido: Postres y Snacks, ensaladas y, en Meal Prep, la compra de ingredientes en el supermercado y el porcionado individual de los platos. Cada adicional tiene su propio valor, que se muestra y se suma al total antes de que confirmes.',
      },
    ],
  },
  {
    id: 'como-pedir',
    titulo: '3. Cómo se hace un pedido',
    bloques: [
      {
        p: 'El pedido se arma paso a paso en el sitio: dirección y comuna, fecha de entrega, elección de platos (en Cocinera a Domicilio, además, el número de personas y tu lista de compras), preferencias alimentarias, entrega y, por último, el resumen con tus datos de contacto y la aceptación de estos términos.',
      },
      {
        lista: [
          'Solo mostramos las fechas que tienen cupo disponible. Al confirmar tu pedido, ese cupo queda reservado para ti.',
          'Solo aparecen las comunas con cobertura para el servicio que elegiste. Si tu comuna no aparece en la lista, significa que por ahora no tenemos despacho disponible para ese servicio.',
          'Puedes elegir hasta 5 preparaciones por pedido. Si quieres un plato que no está en el menú, escríbenos y lo conversamos.',
        ],
      },
    ],
  },
  {
    id: 'tus-datos',
    titulo: '4. La información que nos entregas',
    bloques: [
      {
        p: 'Para preparar y entregar tu pedido necesitamos tu nombre, correo electrónico, teléfono, dirección y comuna, además de la fecha, los platos y las preferencias o restricciones que quieras indicarnos.',
      },
      {
        p: 'Es tu responsabilidad que esos datos estén correctos y completos. Si la dirección está equivocada o incompleta, si el teléfono no recibe llamadas o si el correo está mal escrito, la entrega puede retrasarse o no poder realizarse en la fecha comprometida, y tendremos que coordinar contigo un nuevo despacho.',
      },
      {
        p: 'Tomamos en cuenta las preferencias y restricciones alimentarias que declares al armar el pedido. Si tienes una alergia, indícala expresamente en el campo de observaciones para que podamos considerarla. Cocinamos en una cocina donde se preparan distintos alimentos, así que no podemos garantizar la ausencia total de trazas.',
      },
    ],
  },
  {
    id: 'pago',
    titulo: '5. Confirmación del pedido y pago',
    bloques: [
      {
        p: 'El pago se realiza por transferencia bancaria. Al enviar el formulario recibes de inmediato, en pantalla y por correo, los datos de la cuenta y el monto exacto a transferir; tu pedido queda en estado "Solicitud recibida".',
      },
      {
        lista: [
          'Transfiere el monto exacto que indica el sitio.',
          'Envía el comprobante al correo que aparece en la página de pago, señalando tu número de pedido.',
          'Cuando validamos la transferencia te enviamos el correo de pago confirmado, con el detalle de tu pedido y las indicaciones que correspondan.',
        ],
      },
      {
        destacado:
          'Tu pedido queda confirmado solo una vez que validamos el pago. Antes de eso, el cupo está reservado pero el pedido todavía no está confirmado.',
      },
      {
        p: 'El monto a transferir es el que calcula e informa el sistema: valor del servicio, más el despacho de tu comuna, más los adicionales que hayas elegido. Los valores vigentes son los que muestra el sitio al momento en que armas el pedido. Si no recibimos el comprobante, te contactamos antes de liberar el cupo.',
      },
    ],
  },
  {
    id: 'ingredientes',
    titulo: '6. Los ingredientes',
    bloques: [
      {
        p: 'En ambos servicios los ingredientes los pones tú y no están incluidos en el valor del servicio: lo que cobramos es el trabajo de cocinar.',
      },
      {
        lista: [
          'Meal Prep: debes hacernos llegar los ingredientes a la dirección y dentro del plazo que te indicamos en el correo de pago confirmado, usando la aplicación de delivery de tu preferencia o la forma que acordemos. Si los ingredientes no llegan a tiempo o llegan incompletos, no podremos preparar tu pedido en la fecha acordada y tendremos que reprogramarlo.',
          'Cocinera a Domicilio: según los platos que elegiste y el número de personas te entregamos tu lista de compras. Los ingredientes deben estar en tu casa el día del servicio.',
          'Opcional en Meal Prep: puedes contratar el adicional de compra de ingredientes en el supermercado. Ese valor corresponde al servicio de compra; el detalle de los productos y su costo lo coordinamos contigo.',
          'Los Postres y Snacks los elaboramos nosotros por completo: no requieren ningún ingrediente de tu parte.',
        ],
      },
      {
        p: 'No respondemos por la calidad, el estado o la cantidad de los ingredientes que nos entregas. Si al momento de cocinar detectamos que un ingrediente está en mal estado o falta, te avisamos y buscamos una solución contigo.',
      },
    ],
  },
  {
    id: 'preparacion-entrega',
    titulo: '7. Preparación y entrega',
    bloques: [
      {
        p: 'Los pedidos del sitio se entregan con despacho a domicilio. El costo del despacho depende de tu comuna y se muestra en el total antes de que confirmes.',
      },
      {
        p: 'En Meal Prep los platos van porcionados y sellados al vacío. En el correo de pago confirmado te indicamos la duración y la forma de conservación recomendada de cada preparación, junto con las indicaciones de descongelación y recalentado. Una vez recibido el pedido, conservar y calentar la comida según esas indicaciones es responsabilidad tuya.',
      },
      {
        p: 'Documentamos la entrega con una o más fotografías del pedido, que te enviamos por correo junto con el aviso de que va en camino.',
      },
    ],
  },
  {
    id: 'horarios',
    titulo: '8. Horarios de entrega',
    bloques: [
      {
        destacado:
          'Nos comprometemos con la FECHA de entrega que elegiste y confirmaste, no con una hora exacta. No trabajamos con horas de entrega garantizadas ni con un rango horario fijo.',
      },
      {
        p: 'Los tiempos de despacho varían según la comuna y la ruta del día, por lo que no existe un rango de entrega igual para todos. Así funciona el día de tu entrega:',
      },
      {
        lista: [
          'Te avisamos por correo en el momento en que tu pedido sale a reparto ("Tu pedido va en camino").',
          'A partir de ese aviso, la entrega se realiza dentro de un plazo estimado que varía según tu comuna, con un máximo aproximado de 2 horas y 30 minutos.',
          'Ese plazo es una estimación, no una garantía de llegada a una hora determinada. Cualquier hora que te indiquemos por WhatsApp, correo o teléfono tiene el mismo carácter: es referencial.',
        ],
      },
      {
        p: 'Al aceptar estos términos te comprometes a estar disponible para recibir tu pedido el día de la entrega, o a dejar a alguien encargado de recibirlo, y a mantener tu teléfono disponible por si el repartidor necesita contactarte. Si al llegar no hay quien reciba el pedido, el repartidor intentará comunicarse contigo y coordinaremos la forma de completar la entrega.',
      },
      {
        p: 'Pueden ocurrir retrasos por tráfico, condiciones del clima, dificultades de acceso a la dirección, alta demanda u otras causas fuera de nuestro control. Si vemos que la entrega se va a atrasar de forma relevante o que no va a poder realizarse ese día, te avisamos por correo o WhatsApp y coordinamos contigo una solución.',
      },
      {
        p: 'En Cocinera a Domicilio la hora de llegada se acuerda directamente contigo por WhatsApp al coordinar la visita. Igual que en el despacho, esa hora es estimada y puede variar; si hay algún cambio te avisamos lo antes posible.',
      },
      {
        p: 'Nuestro horario de atención para responderte consultas es de lunes a viernes de 11:00 a 20:00 y los fines de semana de 11:00 a 17:00. Ese es el horario en que te contestamos, y no corresponde a un horario garantizado de entrega.',
      },
    ],
  },
  {
    id: 'nuestras-responsabilidades',
    titulo: '9. Nuestras responsabilidades',
    bloques: [
      { p: 'Nos comprometemos a:' },
      {
        lista: [
          'Preparar los platos que elegiste, con los ingredientes acordados y el cuidado de siempre.',
          'Cumplir con la fecha de entrega que confirmaste.',
          'Avisarte oportunamente cualquier cambio, retraso o imprevisto que afecte tu pedido.',
          'Entregarte la información de conservación y manipulación que corresponda a tu pedido.',
          'Usar tus datos únicamente para gestionar tu pedido y comunicarnos contigo.',
        ],
      },
      { p: 'No respondemos por:' },
      {
        lista: [
          'La calidad, el estado o la cantidad de los ingredientes que tú nos entregas.',
          'La conservación y manipulación de la comida después de que la recibes.',
          'Retrasos o entregas fallidas causados por datos de contacto o de dirección incorrectos o incompletos.',
          'Hechos fuera de nuestro control razonable, como cortes de suministro, emergencias sanitarias, condiciones climáticas extremas o cortes de tránsito.',
        ],
      },
    ],
  },
  {
    id: 'tus-responsabilidades',
    titulo: '10. Tus responsabilidades',
    bloques: [
      { p: 'Para que tu pedido salga bien, te pedimos:' },
      {
        lista: [
          'Entregar datos de contacto y dirección correctos y completos.',
          'Declarar tus restricciones alimentarias y, muy especialmente, cualquier alergia.',
          'Hacer llegar los ingredientes a tiempo, completos y en buen estado (Meal Prep), o tenerlos listos en tu casa el día del servicio (Cocinera a Domicilio).',
          'Transferir el monto exacto y enviarnos el comprobante indicando tu número de pedido.',
          'Estar disponible para recibir el pedido el día de la entrega, o dejar a alguien encargado de recibirlo.',
          'Conservar y calentar la comida siguiendo las indicaciones que te entregamos.',
          'En Cocinera a Domicilio, tener la cocina y el espacio de trabajo disponibles a la hora acordada.',
        ],
      },
    ],
  },
  {
    id: 'cambios-cancelaciones',
    titulo: '11. Cambios y cancelaciones',
    bloques: [
      {
        p: 'Si necesitas cambiar la fecha, los platos o cancelar tu pedido, escríbenos lo antes posible por WhatsApp o correo indicando tu número de pedido. Mientras antes nos avises, más opciones tenemos de acomodar tu pedido.',
      },
      {
        p: 'Mientras el pedido no haya entrado en preparación, haremos todo lo posible por cambiar la fecha o los platos, sujeto a la disponibilidad de cupos. Una vez que el pedido está en preparación, los ingredientes ya están comprometidos y no es posible modificarlo.',
      },
      {
        p: 'Si somos nosotros quienes no podemos cumplir con la fecha comprometida, te avisamos y coordinamos contigo una nueva fecha o la alternativa que prefieras.',
      },
      {
        p: 'Nada de lo señalado en estos términos limita los derechos que te reconoce la Ley 19.496 sobre Protección de los Derechos de los Consumidores.',
      },
    ],
  },
  {
    id: 'reclamos',
    titulo: '12. Reclamos y canales de contacto',
    bloques: [
      {
        p: 'Si algo no salió como esperabas, queremos saberlo. Escríbenos por WhatsApp o al correo de contacto que aparece en el sitio, indicando siempre tu número de pedido y lo que ocurrió. Te respondemos dentro de nuestro horario de atención.',
      },
      {
        p: 'También puedes revisar el estado de tu pedido en cualquier momento en la sección "Consultar pedido" del sitio, con tu número de pedido y el correo con el que pediste. Y después de cada entrega te enviamos una breve encuesta: ese es un buen lugar para contarnos cómo estuvo todo.',
      },
    ],
  },
  {
    id: 'datos-personales',
    titulo: '13. Tratamiento de tus datos personales',
    bloques: [
      {
        p: 'Los datos que entregas en el formulario (nombre, correo, teléfono, dirección, comuna, preferencias alimentarias y el detalle de tu pedido) los guardamos en nuestra base de datos y los usamos exclusivamente para preparar y entregar tu pedido, cobrarlo, comunicarnos contigo sobre él y responder tus consultas o reclamos.',
      },
      {
        p: 'Para enviarte los correos del pedido usamos un proveedor de correo transaccional. No vendemos ni cedemos tus datos a terceros con fines comerciales.',
      },
      {
        p: 'Junto a tu pedido guardamos también el respaldo de tu aceptación de estos términos: la fecha y la hora, la versión aceptada, la dirección IP y el navegador desde el que se envió. Ese registro existe únicamente como constancia de que aceptaste estas condiciones antes de pedir.',
      },
      {
        p: 'Puedes pedirnos en cualquier momento acceder a tus datos, corregirlos o solicitar su eliminación, escribiéndonos por los canales de contacto del sitio.',
      },
    ],
  },
  {
    id: 'cambios-terminos',
    titulo: '14. Cambios a estos términos',
    bloques: [
      {
        p: 'Podemos actualizar estos Términos y Condiciones cuando cambie la forma en que funciona el servicio. Cada versión tiene su número y su fecha de vigencia, visibles al comienzo de esta página.',
      },
      {
        destacado:
          'La versión que aplica a tu pedido es la que aceptaste al enviarlo, y queda registrada junto a él. Los cambios posteriores rigen solo para los pedidos que se hagan después de su publicación.',
      },
    ],
  },
]
