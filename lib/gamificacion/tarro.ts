/**
 * Hero de Wallet (1032×336) con un tarro de cerveza que se llena por etapas. SVG puro, sin texto
 * (así no depende de las fuentes del servidor); el número va en los textos del pase.
 */
export type TarroOpts = { etapa: number; total: number; color: string; acento?: string };

const W = 1032;
const H = 336;

export function tarroSvg({ etapa, total, color, acento = '#F5B83D' }: TarroOpts): string {
  const t = Math.max(1, Math.round(total));
  const ef = Math.max(0, Math.min(t, etapa)); // admite fracciones (animación del video)
  const e = Math.floor(ef + 1e-6);
  const f = ef / t;
  const lleno = ef >= t - 1e-6;
  // Interior del vaso
  const x0 = 190, x1 = 350, yTop = 62, yBot = 296;
  const alto = yBot - yTop;
  const yLiq = yBot - f * (alto - 34); // deja lugar para la espuma
  const espuma: string[] = [];
  if (ef > 0.02) {
    const yE = yLiq;
    const r = 24;
    for (let i = 0; i < 5; i++) {
      const cx = x0 + 16 + i * 32;
      espuma.push(`<circle cx="${cx}" cy="${yE - (i % 2 ? 4 : 10)}" r="${r}" fill="#FFF8EA"/>`);
    }
    if (lleno) {
      espuma.push(
        `<circle cx="${x0 - 6}" cy="${yE + 4}" r="20" fill="#FFF8EA"/><circle cx="${x1 + 6}" cy="${yE + 2}" r="22" fill="#FFF8EA"/>`,
        `<path d="M${x1 + 4} ${yE + 10}q10 30 0 54" stroke="#FFF8EA" stroke-width="14" stroke-linecap="round" fill="none"/>`,
        `<circle cx="${x0 + 40}" cy="${yE - 40}" r="14" fill="#FFF8EA"/><circle cx="${x0 + 100}" cy="${yE - 46}" r="18" fill="#FFF8EA"/>`,
      );
    }
  }
  const burbujas = ef > 0.02
    ? [0, 1, 2, 3, 4, 5]
        .map((i) => {
          const by = yBot - 14 - ((i * 53) % Math.max(20, yBot - yLiq - 30));
          return by > yLiq + 10 ? `<circle cx="${x0 + 22 + ((i * 37) % 120)}" cy="${by}" r="${3 + (i % 3)}" fill="#fff" opacity=".45"/>` : '';
        })
        .join('')
    : '';
  // Marcador de etapas (2 filas)
  const cols = Math.ceil(t / 2);
  const cs = 70, gx = 560, gy = 100;
  const marcas: string[] = [];
  for (let i = 0; i < t; i++) {
    const cx = gx + (i % cols) * (cs + 18) + cs / 2;
    const cy = gy + Math.floor(i / cols) * (cs + 26) + cs / 2;
    const on = i < e;
    marcas.push(
      on
        ? `<circle cx="${cx}" cy="${cy}" r="${cs / 2}" fill="${acento}"/><path d="M${cx - 16} ${cy + 2}l11 12 21-26" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
        : `<circle cx="${cx}" cy="${cy}" r="${cs / 2 - 3}" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.55)" stroke-width="5" stroke-dasharray="3 11" stroke-linecap="round"/>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><clipPath id="vaso"><rect x="${x0}" y="${yTop}" width="${x1 - x0}" height="${alto}" rx="16"/></clipPath>
<linearGradient id="cer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC94D"/><stop offset="1" stop-color="#E8901A"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="${color}"/>
<ellipse cx="270" cy="312" rx="130" ry="12" fill="rgba(0,0,0,.18)"/>
<path d="M${x1 + 6} 110h38q34 0 34 38v40q0 38-34 38h-38" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="16" stroke-linecap="round"/>
<rect x="${x0 - 8}" y="${yTop - 8}" width="${x1 - x0 + 16}" height="${alto + 16}" rx="22" fill="rgba(255,255,255,.22)" stroke="rgba(255,255,255,.9)" stroke-width="7"/>
<g clip-path="url(#vaso)">${ef > 0.02 ? `<rect x="${x0}" y="${yLiq}" width="${x1 - x0}" height="${yBot - yLiq + 4}" fill="url(#cer)"/>${burbujas}` : ''}</g>
${espuma.join('')}
<rect x="${x0 + 12}" y="${yTop + 10}" width="10" height="${alto - 40}" rx="5" fill="#fff" opacity=".28"/>
${marcas.join('')}
</svg>`;
}
