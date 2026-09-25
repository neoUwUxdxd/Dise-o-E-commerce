# Engarce · e-commerce de joyería con talavera

Diseño y maquetación (UI/UX) de una tienda de pulseras y collares con talavera.
La marca es honesta: **no fabrica la talavera**, la compra a talleres certificados y
su valor está en el diseño y el ensamble de las piezas.

> "Engarce" es un nombre provisional (del verbo *engarzar*: unir piezas en cadena).
> Se cambia en `index.html` (logo, títulos y pie) y en `js/data.js`.

## Cómo verlo

Es un sitio estático, sin dependencias ni paso de compilación.

```bash
python3 -m http.server 8000      # o: npx serve .
# abrir http://localhost:8000
```

También funciona abriendo `index.html` directamente en el navegador (los scripts son clásicos, no módulos).

## Estructura

```
index.html          Estructura de la página y escenas SVG del video animado
css/styles.css      Tokens, layout mobile first y todas las animaciones
js/core.js          Utilidades, almacenamiento seguro, formato de precios, hojas (dialog)
js/data.js          Catálogo, patrones, metales, talleres y el "viaje de la pieza"
js/talavera.js      Generador de fichas de talavera en SVG (12 patrones × 4 formas)
js/sonido.js        Sonidos sintetizados con Web Audio (sin archivos)
js/piezas.js        Composición de piezas colgantes y efecto de despiece
js/caja.js          Carrito "Caja de madera"
js/loader.js        Pantalla de carga
js/cursor.js        Cursor propio con estela
js/reveal.js        Revelado por volteo de baldosas
js/hero3d.js        Collar 3D del hero (canvas 2D, sin librerías)
js/catalogo.js      Catálogo colgante, filtros y detalle con "El viaje de la pieza"
js/taller.js        Taller de combinaciones (personalizador)
js/probador.js      Probador de silueta (física de cadena)
js/ensamble.js      Infografía animada "Ensamblo, luego existo"
js/cuidados.js      Acordeón de cuidados y repuestos
js/main.js          Arranque: cada módulo se inicia aislado
```

## Sistema visual

| Token | Valor | Uso |
|---|---|---|
| `--hueso` | `#F4EEE3` | Fondo principal (barro crudo claro) |
| `--hueso-2` | `#ECE3D4` | Paneles y secciones alternas |
| `--esmalte` | `#FBF8F1` | Superficies tipo esmalte, tarjetas |
| `--azul` | `#1A4B8E` | Azul Talavera: acentos, botones, cursor |
| `--azul-osc` | `#102F5A` | Títulos y la sección de transparencia |
| `--terracota` | `#B4532A` | Etiquetas, precios destacados, repuestos |
| `--ocre` | `#D39A2E` | Detalle mínimo (centro de las flores, progreso) |

- **Tipografía:** Playfair Display para títulos (la cursiva marca la frase clave) y Montserrat para texto y etiquetas.
- **Formas:** esquinas casi rectas (2–4 px), como una ficha cerámica. Nada de tarjetas redondeadas genéricas.
- **Texturas:** ruido de barro en los bordes de la pantalla (SVG `feTurbulence`), tablero perforado de taller en el catálogo.
- **Tono:** artesanal y moderno, sin papel picado ni clichés. El único color fuerte de fondo es el azul de la sección de transparencia.

## Interacciones

| Pedido | Implementación |
|---|---|
| Loading screen 1.5 s | Cuadrado de barro que gira, recibe una capa de azul mate y se "cuece" (resplandor de horno, azul brillante, patrón y reflejo). CSS puro: si el JS falla, se retira solo. Se muestra una vez por sesión y se salta con un clic. |
| Cursor personalizado | Punto azul con estela de esquirlas de esmalte que caen y se disipan. Sobre botones y piezas aparece un disco que se hunde; al hacer clic se hunde más. Solo con ratón o trackpad. |
| Hover explode-view | La ficha se separa del aro y de la cadena en 3D (se adelanta y gira un poco), el aro se abre, y todo vuelve a encajar con rebote elástico. En táctil ocurre cuando la pieza entra en pantalla. |
| Volteo de baldosas | Cada sección que aún no se ve queda cubierta por baldosas del color de su fondo que se voltean al llegar, en cuatro patrones: diagonal, del centro hacia fuera, damero y filas en zigzag (como quien coloca piso). |
| Taller de combinaciones | Menú lateral de 12 fichas. La elegida vuela en arco, gira 360° en 3D (por detrás se ve el barro sin esmaltar) y encaja con un pulso y un "clic" cerámico. Base, forma y metal cambian la joya y el precio en vivo. |
| Probador de silueta | Arrastrar y soltar con ratón. En táctil y teclado es Tap & Select. El collar cae con física de cuerda (Verlet): los extremos se enganchan al cuello, la cadena se descuelga, oscila y se asienta con el peso del dije. La pulsera cae por la mano, rebota en la muñeca y se tambalea. En móvil, cambia sola a la silueta correcta. |
| Caja de madera | La tapa se abre, la ficha vuela y entra, la tapa se cierra con un golpe de madera y la caja tiembla 1 s. El contador se guarda en `localStorage`. |
| Hero 3D | Collar dibujado en canvas: eslabones ordenados por profundidad, fichas con grosor, sombreado y brillo. Gira despacio (más lento cuando las fichas miran al frente), voltea hacia el cursor y se arrastra con el dedo. Las fichas se balancean con la aceleración del giro. |
| Catálogo colgante | Cada pieza cuelga de un gancho de latón en un tablero perforado, a alturas distintas, y se mece. El filtro principal es **Patrón de Talavera**: Floral, Geométrico, Clásico Poblano y Moderno. Al filtrar, las piezas se descuelgan y las nuevas se cuelgan con un vaivén. |
| El viaje de la pieza | En el detalle de cada producto: tres puntos unidos por una línea punteada azul que se dibuja: Origen del barro → Taller aliado → Nuestro ensamble. |
| Ensamblo, luego existo | Infografía en bucle de 4 pasos (recibir, cortar, unir y empacar) con manos, barra de progreso y botón de pausa. |
| Cuidados y repuestos | Acordeón que explica con honestidad que la talavera puede romperse, y un comprador de "Repuesto de ficha" que muestra la ficha rota junto a la nueva. |

El sonido es opcional: se sintetiza al momento (no descarga archivos), solo suena tras un gesto del usuario y se apaga con el botón de la cabecera.

## Mobile first y accesibilidad

- Estilos base para 360–400 px y ampliaciones a 720, 900, 960 y 1080 px. No hay scroll horizontal.
- El arrastre se convierte en **Tap & Select** en pantallas táctiles; las fichas y bandejas se deslizan horizontalmente con scroll-snap.
- `prefers-reduced-motion`: sin loader, sin estela, sin volteo de baldosas ni giro automático; las físicas se resuelven al instante.
- Todo se puede operar con teclado. Los botones llevan etiquetas y `aria-pressed`/`aria-expanded`, los anuncios del carrito van a una región `aria-live` y la animación del video se puede pausar.
- Si un módulo falla, los demás siguen funcionando (`main.js`).

## Rendimiento

- **Cero imágenes:** las 12 fichas, los ganchos, las siluetas y la caja son SVG generado o escrito a mano. Todo el sitio pesa unos 210 KB sin comprimir (bastante menos con gzip), más las fuentes.
- Las animaciones usan `transform` y `opacity`. El canvas del hero y la infografía se detienen fuera de pantalla o con la pestaña oculta, y la física del probador se duerme al asentarse.
- Fuentes con `preconnect` y `display=swap`. Scripts con `defer`.

### Al agregar fotos y video reales

- Fotos de producto en AVIF o WebP, con `srcset`/`sizes`, `loading="lazy"` y `decoding="async"` debajo del primer pantallazo. Reservar el espacio con `aspect-ratio`.
- Video de las manos del equipo: en `index.html`, poner la ruta en `data-src` del `<video class="video__real">` (WebM o MP4 H.264, 720p, sin audio, menos de 2 MB, 8–12 s en bucle) y un `poster`. El script lo carga solo si existe, lo reproduce solo cuando está en pantalla y retira la infografía.

## Contenido de ejemplo que hay que reemplazar

Todo está en `js/data.js`:

- Nombres y ubicación de los **talleres aliados**. Usar el nombre de cada taller solo con su permiso.
- **Lotes**, medidas y precios.
- Descripciones de producto.

También la política de repuestos y roturas en el acordeón de cuidados, y los textos legales del pie.

## Compatibilidad

Navegadores actuales (Chrome, Edge, Safari 16+, Firefox). Las curvas de rebote usan `linear()` y tienen respaldo con `cubic-bezier` en navegadores anteriores.
