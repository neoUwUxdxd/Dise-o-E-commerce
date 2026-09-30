/* Engarce · datos del catálogo.
   CONTENIDO DE EJEMPLO: talleres, lotes, medidas y precios son marcadores para el prototipo.
   Sustitúyelos por los datos reales (y usa el nombre de cada taller solo con su permiso).
   Este archivo también lo carga el servidor de pagos (server/pago.js) para calcular los precios:
   el total que se cobra nunca sale del navegador. */
(function (TL) {
  'use strict';

  TL.families = {
    floral: { label: 'Floral' },
    geometrico: { label: 'Geométrico' },
    poblano: { label: 'Clásico Poblano' },
    moderno: { label: 'Moderno' }
  };

  TL.designs = [
    { id: 'cholula', name: 'Flor de Cholula', family: 'floral' },
    { id: 'margarita', name: 'Margarita', family: 'floral' },
    { id: 'enredadera', name: 'Enredadera', family: 'floral' },
    { id: 'estrella', name: 'Estrella de ocho', family: 'geometrico' },
    { id: 'rombo', name: 'Rombo', family: 'geometrico' },
    { id: 'celosia', name: 'Celosía', family: 'geometrico' },
    { id: 'poblano', name: 'Medallón poblano', family: 'poblano' },
    { id: 'imperial', name: 'Imperial', family: 'poblano' },
    { id: 'cenefa', name: 'Cenefa', family: 'poblano' },
    { id: 'arco', name: 'Arco', family: 'moderno' },
    { id: 'eclipse', name: 'Eclipse', family: 'moderno' },
    { id: 'diagonal', name: 'Diagonal', family: 'moderno' }
  ];
  TL.design = (id) => TL.designs.find((d) => d.id === id);

  // Precio de la ficha en el taller de combinaciones, según su forma.
  TL.shapes = {
    square: { label: 'Cuadrada', price: 240, repuesto: 180 },
    round: { label: 'Redonda', price: 240, repuesto: 180 },
    hex: { label: 'Hexagonal', price: 280, repuesto: 200 },
    drop: { label: 'Lágrima', price: 320, repuesto: 220 }
  };

  TL.metals = {
    plata: { label: 'Plata .925', color: '#A7AEB8', light: '#EEF1F5', dark: '#6E7581', price: 0 },
    oro: { label: 'Chapa de oro 14k', color: '#C79A45', light: '#F3DC9C', dark: '#8A6424', price: 180 },
    hilo: { label: 'Hilo encerado', color: '#7B4A2D', light: '#B07B55', dark: '#4E2D19', price: -140, cord: true }
  };

  TL.bases = {
    collar: { label: 'Collar', medida: '45 cm', price: 690 },
    pulsera: { label: 'Pulsera', medida: '18 cm', price: 490 }
  };

  // Envío (MXN). Valores de ejemplo: ajústalos a la política real.
  TL.envioGratis = 1500;   // pedido mínimo para envío gratis
  TL.envioCosto = 150;     // costo por debajo de ese mínimo
  TL.costoEnvio = (subtotal) => (subtotal >= TL.envioGratis ? 0 : TL.envioCosto);

  TL.estados = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
    'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero',
    'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
    'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
    'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
  ];

  const BARRO = 'Barro negro y blanco de la región, mezclado y reposado en el taller';

  TL.talleres = {
    a: { lugar: 'San Pablo del Monte, Tlax.', nota: 'Taller aliado con certificado D.O.' },
    b: { lugar: 'San Pedro Cholula, Pue.', nota: 'Taller aliado con certificado D.O.' },
    c: { lugar: 'Atlixco, Pue.', nota: 'Taller aliado con certificado D.O.' },
    d: { lugar: 'Barrio de la Luz, Puebla', nota: 'Taller aliado con certificado D.O.' }
  };

  TL.products = [
    {
      id: 'collar-cholula', name: 'Collar Cholula', type: 'collar', design: 'cholula', shape: 'drop', metal: 'oro',
      fichas: 1, price: 1190, medida: '45 cm', ficha: '2.6 × 1.8 cm', taller: 'b', lote: '24-117',
      desc: 'Lágrima de talavera con la flor de ocho pétalos pintada a mano. La recortamos de un azulejo completo y la colgamos de una cadena fina.'
    },
    {
      id: 'pulsera-margarita', name: 'Pulsera Margarita', type: 'pulsera', design: 'margarita', shape: 'square', metal: 'hilo',
      fichas: 3, price: 590, medida: '16 a 21 cm, ajustable', ficha: '1.2 × 1.2 cm', taller: 'b', lote: '24-121',
      desc: 'Tres fichas cuadradas con margaritas y hojas verdes en hilo encerado con nudo corredizo. Para usar todos los días.'
    },
    {
      id: 'pulsera-enredadera', name: 'Pulsera Enredadera', type: 'pulsera', design: 'enredadera', shape: 'round', metal: 'oro',
      fichas: 3, price: 890, medida: '18 cm', ficha: '1.4 cm de diámetro', taller: 'c', lote: '24-098',
      desc: 'Fichas redondas con una enredadera que da la vuelta al borde. Cuelgan como dijes de una cadena con chapa de oro.'
    },
    {
      id: 'collar-estrella', name: 'Collar Estrella', type: 'collar', design: 'estrella', shape: 'round', metal: 'plata',
      fichas: 1, price: 890, medida: '45 cm', ficha: '2.2 cm de diámetro', taller: 'a', lote: '24-102',
      desc: 'La estrella de ocho puntas de los azulejos de fachada, en una ficha redonda sobre cadena de plata .925.'
    },
    {
      id: 'pulsera-rombo', name: 'Pulsera Rombo', type: 'pulsera', design: 'rombo', shape: 'square', metal: 'plata',
      fichas: 3, price: 790, medida: '18 cm', ficha: '1.2 × 1.2 cm', taller: 'a', lote: '24-109',
      desc: 'Rombos concéntricos en azul, blanco y terracota. Tres fichas en cadena de plata con broche de langosta.'
    },
    {
      id: 'pulsera-celosia', name: 'Pulsera Celosía', type: 'pulsera', design: 'celosia', shape: 'hex', metal: 'plata',
      fichas: 3, price: 820, medida: '18 cm', ficha: '1.4 cm entre vértices', taller: 'd', lote: '24-126',
      desc: 'Círculos entrelazados como en una celosía de azulejo. Fichas hexagonales en cadena de plata .925.'
    },
    {
      id: 'collar-poblano', name: 'Collar Poblano', type: 'collar', design: 'poblano', shape: 'square', metal: 'oro',
      fichas: 1, price: 1090, medida: '45 cm', ficha: '2.2 × 2.2 cm', taller: 'd', lote: '24-088',
      desc: 'El medallón azul de los azulejos poblanos, con sus cuartos de círculo en las esquinas. Cadena con chapa de oro.'
    },
    {
      id: 'collar-imperial', name: 'Collar Imperial', type: 'collar', design: 'imperial', shape: 'round', metal: 'oro',
      fichas: 3, price: 1450, medida: '45 cm', ficha: '2 cm y 1.3 cm', taller: 'd', lote: '24-091',
      desc: 'Tres fichas en azul cobalto casi total, el estilo más cargado de la talavera. La central mide 2 cm.'
    },
    {
      id: 'pulsera-cenefa', name: 'Pulsera Cenefa', type: 'pulsera', design: 'cenefa', shape: 'square', metal: 'oro',
      fichas: 5, price: 980, medida: '18 cm', ficha: '1 × 1 cm', taller: 'b', lote: '24-130',
      desc: 'Cinco fichas pequeñas cortadas de una cenefa: la franja decorativa que remata los muros de azulejo.'
    },
    {
      id: 'collar-arco', name: 'Collar Arco', type: 'collar', design: 'arco', shape: 'hex', metal: 'hilo',
      fichas: 1, price: 690, medida: '50 cm, ajustable', ficha: '2.4 cm entre vértices', taller: 'c', lote: '24-114',
      desc: 'Un medio sol terracota y un arco azul. Diseño nuestro, pintado a mano por el taller, en hilo encerado.'
    },
    {
      id: 'collar-eclipse', name: 'Collar Eclipse', type: 'collar', design: 'eclipse', shape: 'round', metal: 'plata',
      fichas: 1, price: 890, medida: '45 cm', ficha: '2.2 cm de diámetro', taller: 'a', lote: '24-119',
      desc: 'Una luna creciente en azul con un punto terracota. La ficha más sencilla del catálogo, sobre plata .925.'
    },
    {
      id: 'pulsera-diagonal', name: 'Pulsera Diagonal', type: 'pulsera', design: 'diagonal', shape: 'square', metal: 'hilo',
      fichas: 1, price: 490, medida: '16 a 21 cm, ajustable', ficha: '1.6 × 1.6 cm', taller: 'c', lote: '24-133',
      desc: 'Una sola ficha partida en diagonal, azul y blanco. Hilo encerado con nudo corredizo.'
    }
  ];

  // La familia (patrón) de cada producto sale de su ficha.
  TL.products.forEach((p) => { p.family = TL.design(p.design).family; });

  TL.producto = (id) => TL.products.find((p) => p.id === id);

  /* Precio y nombre de una línea de la caja a partir de su clave:
       <id de producto>                              pieza del catálogo
       taller-<base>-<ficha>-<forma>-<metal>         combinación del taller
       repuesto-<ficha>-<forma>                      ficha de repuesto
     Devuelve null si la clave no corresponde a nada que se venda. */
  const propia = (obj, k) => (Object.prototype.hasOwnProperty.call(obj, k) ? obj[k] : null);
  TL.lineaPedido = (key) => {
    const p = TL.producto(key);
    if (p) {
      return { titulo: p.name, detalle: `${TL.design(p.design).name} · ${TL.metals[p.metal].label}`, precio: p.price };
    }
    const partes = String(key).split('-');
    if (partes[0] === 'taller' && partes.length === 5) {
      const [, base, ficha, forma, metal] = partes;
      const b = propia(TL.bases, base), d = TL.design(ficha), f = propia(TL.shapes, forma), m = propia(TL.metals, metal);
      if (!b || !d || !f || !m) return null;
      return {
        titulo: `${b.label} a tu medida`,
        detalle: `${d.name} · ${f.label} · ${m.label} · ${b.medida}`,
        precio: b.price + f.price + m.price
      };
    }
    if (partes[0] === 'repuesto' && partes.length === 3) {
      const d = TL.design(partes[1]), f = propia(TL.shapes, partes[2]);
      if (!d || !f) return null;
      return { titulo: 'Repuesto de ficha', detalle: `${d.name} · ${f.label} · incluye aro de cambio`, precio: f.repuesto };
    }
    return null;
  };

  TL.viaje = (p) => {
    const t = TL.talleres[p.taller];
    return [
      { etapa: 'Origen del barro', lugar: 'Puebla-Tlaxcala', nota: BARRO },
      { etapa: 'Taller aliado', lugar: t.lugar, nota: t.nota },
      { etapa: 'Nuestro ensamble', lugar: 'Banco Engarce', nota: 'Corte, pasador y montaje. Lote ' + p.lote }
    ];
  };
})(typeof window !== 'undefined' ? window.TL : module.exports);
