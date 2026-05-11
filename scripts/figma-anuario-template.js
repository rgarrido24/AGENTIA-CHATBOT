/**
 * figma-anuario-template.js
 *
 * Script de Figma (Plugin API) que genera una plantilla base vacía para
 * un anuario de Kinder en un Frame A4 vertical.
 *
 * Estructura generada:
 *   - Frame A4 vertical (794 × 1123 px, ~A4 a 96dpi)
 *   - Encabezado de texto "Generación Kinder 202x - 202y"
 *   - 1 rectángulo grande Foto Grupal (ratio 4:3)
 *   - 1 rectángulo grande Individual Toga (ratio 3:4)
 *   - Grid 2x7 = 14 elipses (círculos perfectos) Retratos Rápidos
 *   - Footer de texto "Pequeños hoy, GRANDES MAÑANA"
 *
 * Cómo usar:
 *   1. Abre Figma y crea un nuevo plugin (Menu → Plugins → Development →
 *      New Plugin → Create new... → Empty).
 *   2. Reemplaza el contenido de `code.js` con este archivo.
 *   3. Asegúrate de que el `manifest.json` tenga:
 *        {
 *          "name": "Agentia · Plantilla Anuario Kinder",
 *          "id": "agentia-anuario",
 *          "api": "1.0.0",
 *          "main": "code.js",
 *          "editorType": ["figma"]
 *        }
 *   4. Run plugin desde Figma. El frame se crea centrado en el viewport.
 *
 * Notas:
 *   - El script es async (carga fonts con loadFontAsync antes de crear textos).
 *   - Cierra Figma con figma.closePlugin() al terminar.
 *   - Si el font Inter no está disponible, hace fallback a "Helvetica".
 */

(async function main() {
  // ───────────────────────────────────────────────
  // 1. CONSTANTES DE LAYOUT
  // ───────────────────────────────────────────────
  const A4 = { width: 794, height: 1123 }; // A4 a 96 DPI
  const PAD_X = 60;
  const PAD_TOP = 80;
  const PAD_BOTTOM = 60;
  const GAP_MAIN = 20;

  // Header
  const HEADER_HEIGHT = 86;

  // Main photos band
  // Foto Grupal (4:3) y Individual Toga (3:4) lado a lado
  const MAIN_BAND_HEIGHT = 340;
  const innerWidth = A4.width - PAD_X * 2; // 674

  // Reparto del ancho:
  //   Grupal usa más ancho (es horizontal 4:3)
  //   Toga es estrecha (vertical 3:4)
  // Solucion: forzamos alturas iguales (MAIN_BAND_HEIGHT) y calculamos anchos
  // según ratios.
  const togaHeight = MAIN_BAND_HEIGHT;
  const togaWidth = togaHeight * (3 / 4); // 255

  const grupalHeight = MAIN_BAND_HEIGHT * 0.85; // grupal un poco menor
  const grupalWidth = grupalHeight * (4 / 3);

  // Lo centramos: total = grupal + gap + toga
  const totalMainWidth = grupalWidth + GAP_MAIN + togaWidth;
  const startMainX = PAD_X + (innerWidth - totalMainWidth) / 2;

  // Footer
  const FOOTER_HEIGHT = 60;

  // Grid de círculos (2 filas × 7 cols)
  const GRID_ROWS = 2;
  const GRID_COLS = 7;
  const CIRCLE_GAP = 12;

  // Calculamos diámetro a partir del ancho disponible
  const circlesAreaTop = PAD_TOP + HEADER_HEIGHT + 30 + MAIN_BAND_HEIGHT + 50;
  const circlesAreaBottom = A4.height - PAD_BOTTOM - FOOTER_HEIGHT - 30;
  const circlesAreaHeight = circlesAreaBottom - circlesAreaTop;

  const circlesAreaWidth = innerWidth;
  const maxDiamByWidth = (circlesAreaWidth - CIRCLE_GAP * (GRID_COLS - 1)) / GRID_COLS;
  const maxDiamByHeight = (circlesAreaHeight - CIRCLE_GAP * (GRID_ROWS - 1)) / GRID_ROWS;
  const diameter = Math.floor(Math.min(maxDiamByWidth, maxDiamByHeight));

  // Centrado horizontal del grid
  const gridTotalWidth = GRID_COLS * diameter + (GRID_COLS - 1) * CIRCLE_GAP;
  const gridStartX = PAD_X + (innerWidth - gridTotalWidth) / 2;
  // Centrado vertical en el área disponible
  const gridTotalHeight = GRID_ROWS * diameter + (GRID_ROWS - 1) * CIRCLE_GAP;
  const gridStartY = circlesAreaTop + (circlesAreaHeight - gridTotalHeight) / 2;

  // ───────────────────────────────────────────────
  // 2. COLORES (estilo placeholder sutil)
  // ───────────────────────────────────────────────
  const COLOR_BG = { r: 1, g: 0.972, b: 0.925 }; // cream
  const COLOR_PLACEHOLDER_BG = { r: 0.97, g: 0.95, b: 0.92 };
  const COLOR_PLACEHOLDER_STROKE = { r: 0.78, g: 0.78, b: 0.82 };
  const COLOR_TEXT_PRIMARY = { r: 0.17, g: 0.24, b: 0.44 }; // navy
  const COLOR_TEXT_MUTED = { r: 0.48, g: 0.47, b: 0.58 };

  // ───────────────────────────────────────────────
  // 3. FONT LOADING (con fallback)
  // ───────────────────────────────────────────────
  let primaryFont = { family: 'Inter', style: 'Bold' };
  let bodyFont = { family: 'Inter', style: 'Regular' };
  try {
    await figma.loadFontAsync(primaryFont);
    await figma.loadFontAsync(bodyFont);
  } catch (_e) {
    // Fallback a Helvetica si Inter no está disponible
    primaryFont = { family: 'Helvetica', style: 'Bold' };
    bodyFont = { family: 'Helvetica', style: 'Regular' };
    try {
      await figma.loadFontAsync(primaryFont);
      await figma.loadFontAsync(bodyFont);
    } catch (_e2) {
      figma.closePlugin('No se pudieron cargar las fuentes Inter ni Helvetica.');
      return;
    }
  }

  // ───────────────────────────────────────────────
  // 4. CREAR FRAME A4
  // ───────────────────────────────────────────────
  const frame = figma.createFrame();
  frame.name = 'Anuario Kinder · A4';
  frame.resize(A4.width, A4.height);
  frame.fills = [{ type: 'SOLID', color: COLOR_BG }];
  frame.cornerRadius = 8;
  frame.clipsContent = true;

  // Posicionar centrado en el viewport actual
  const vp = figma.viewport.center;
  frame.x = Math.round(vp.x - A4.width / 2);
  frame.y = Math.round(vp.y - A4.height / 2);

  // ───────────────────────────────────────────────
  // 5. ENCABEZADO
  // ───────────────────────────────────────────────
  const headerText = figma.createText();
  headerText.fontName = primaryFont;
  headerText.characters = 'Generación KINDER 2024 — 2025';
  headerText.fontSize = 28;
  headerText.fills = [{ type: 'SOLID', color: COLOR_TEXT_PRIMARY }];
  headerText.textAlignHorizontal = 'CENTER';
  headerText.resize(innerWidth, HEADER_HEIGHT);
  headerText.x = PAD_X;
  headerText.y = PAD_TOP;
  frame.appendChild(headerText);

  const headerSub = figma.createText();
  headerSub.fontName = bodyFont;
  headerSub.characters = 'NUESTRA PROMO · AÑO ESCOLAR';
  headerSub.fontSize = 11;
  headerSub.letterSpacing = { value: 12, unit: 'PERCENT' };
  headerSub.fills = [{ type: 'SOLID', color: COLOR_TEXT_MUTED }];
  headerSub.textAlignHorizontal = 'CENTER';
  headerSub.resize(innerWidth, 16);
  headerSub.x = PAD_X;
  headerSub.y = PAD_TOP + 44;
  frame.appendChild(headerSub);

  // ───────────────────────────────────────────────
  // 6. FOTO GRUPAL (4:3) + INDIVIDUAL TOGA (3:4)
  // ───────────────────────────────────────────────
  // Alineamos ambos verticalmente al mismo top (banda principal)
  const mainBandTop = PAD_TOP + HEADER_HEIGHT + 30;

  // 6.1 Foto Grupal
  const grupal = createPlaceholderRect({
    name: 'Placeholder · Foto Grupal (4:3)',
    width: grupalWidth,
    height: grupalHeight,
    x: startMainX,
    y: mainBandTop + (MAIN_BAND_HEIGHT - grupalHeight) / 2, // centrada verticalmente
    label: 'FOTO GRUPAL',
    sub: '4 : 3 · Toda la generación',
  });
  frame.appendChild(grupal.group);

  // 6.2 Individual Toga
  const toga = createPlaceholderRect({
    name: 'Placeholder · Individual Toga (3:4)',
    width: togaWidth,
    height: togaHeight,
    x: startMainX + grupalWidth + GAP_MAIN,
    y: mainBandTop,
    label: 'INDIVIDUAL TOGA',
    sub: '3 : 4 · Retrato',
  });
  frame.appendChild(toga.group);

  // ───────────────────────────────────────────────
  // 7. GRID 2×7 DE CÍRCULOS
  // ───────────────────────────────────────────────
  const circlesGroupNodes = [];
  let circleIndex = 1;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cx = gridStartX + c * (diameter + CIRCLE_GAP);
      const cy = gridStartY + r * (diameter + CIRCLE_GAP);

      const ellipse = figma.createEllipse();
      ellipse.name = `Placeholder · Retrato Rápido ${circleIndex}`;
      ellipse.resize(diameter, diameter);
      ellipse.x = cx;
      ellipse.y = cy;
      ellipse.fills = [{ type: 'SOLID', color: COLOR_PLACEHOLDER_BG }];
      ellipse.strokes = [{ type: 'SOLID', color: COLOR_PLACEHOLDER_STROKE }];
      ellipse.strokeWeight = 1;
      ellipse.dashPattern = [4, 3];
      frame.appendChild(ellipse);

      // Número pequeño al centro
      const numText = figma.createText();
      numText.fontName = primaryFont;
      numText.characters = String(circleIndex);
      numText.fontSize = Math.max(10, Math.round(diameter * 0.18));
      numText.fills = [{ type: 'SOLID', color: COLOR_TEXT_MUTED }];
      numText.textAlignHorizontal = 'CENTER';
      numText.textAlignVertical = 'CENTER';
      numText.resize(diameter, diameter);
      numText.x = cx;
      numText.y = cy + Math.round(diameter * 0.30);
      frame.appendChild(numText);

      circlesGroupNodes.push(ellipse, numText);
      circleIndex++;
    }
  }

  // Etiqueta de sección sobre los círculos
  const circlesLabel = figma.createText();
  circlesLabel.fontName = bodyFont;
  circlesLabel.characters = 'INDIVIDUALES RÁPIDAS · LA GENERACIÓN COMPLETA';
  circlesLabel.fontSize = 11;
  circlesLabel.letterSpacing = { value: 10, unit: 'PERCENT' };
  circlesLabel.fills = [{ type: 'SOLID', color: COLOR_TEXT_MUTED }];
  circlesLabel.textAlignHorizontal = 'CENTER';
  circlesLabel.resize(innerWidth, 16);
  circlesLabel.x = PAD_X;
  circlesLabel.y = gridStartY - 24;
  frame.appendChild(circlesLabel);

  // ───────────────────────────────────────────────
  // 8. FOOTER
  // ───────────────────────────────────────────────
  const footerText = figma.createText();
  footerText.fontName = primaryFont;
  footerText.characters = 'Pequeños hoy, GRANDES MAÑANA';
  footerText.fontSize = 18;
  footerText.fills = [{ type: 'SOLID', color: COLOR_TEXT_PRIMARY }];
  footerText.textAlignHorizontal = 'CENTER';
  footerText.resize(innerWidth, FOOTER_HEIGHT);
  footerText.x = PAD_X;
  footerText.y = A4.height - PAD_BOTTOM - FOOTER_HEIGHT;
  frame.appendChild(footerText);

  // ───────────────────────────────────────────────
  // 9. SELECCIONAR Y CENTRAR
  // ───────────────────────────────────────────────
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);

  figma.closePlugin(
    `✅ Plantilla creada: 1 foto grupal (4:3), 1 individual toga (3:4) y ${GRID_ROWS * GRID_COLS} círculos de retratos rápidos.`,
  );

  // ───────────────────────────────────────────────
  // HELPER: rectángulo placeholder con label
  // ───────────────────────────────────────────────
  function createPlaceholderRect(opts) {
    const { name, width, height, x, y, label, sub } = opts;

    const rect = figma.createRectangle();
    rect.name = name;
    rect.resize(width, height);
    rect.x = x;
    rect.y = y;
    rect.cornerRadius = 16;
    rect.fills = [{ type: 'SOLID', color: COLOR_PLACEHOLDER_BG }];
    rect.strokes = [{ type: 'SOLID', color: COLOR_PLACEHOLDER_STROKE }];
    rect.strokeWeight = 1.5;
    rect.dashPattern = [6, 4];

    const labelText = figma.createText();
    labelText.fontName = primaryFont;
    labelText.characters = label;
    labelText.fontSize = 14;
    labelText.letterSpacing = { value: 10, unit: 'PERCENT' };
    labelText.fills = [{ type: 'SOLID', color: COLOR_TEXT_PRIMARY }];
    labelText.textAlignHorizontal = 'CENTER';
    labelText.resize(width, 18);
    labelText.x = x;
    labelText.y = y + height / 2 - 18;

    const subText = figma.createText();
    subText.fontName = bodyFont;
    subText.characters = sub;
    subText.fontSize = 10;
    subText.fills = [{ type: 'SOLID', color: COLOR_TEXT_MUTED }];
    subText.textAlignHorizontal = 'CENTER';
    subText.resize(width, 14);
    subText.x = x;
    subText.y = y + height / 2 + 4;

    // Agrupamos para mantener el placeholder con su label como un objeto
    const group = figma.group([rect, labelText, subText], figma.currentPage);
    group.name = name;
    return { group, rect, labelText, subText };
  }
})();
