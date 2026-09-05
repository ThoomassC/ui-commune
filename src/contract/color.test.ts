import { describe, expect, it } from 'vitest';

import {
  MID_GREY_LUMINANCE,
  compositeLayers,
  compositeOver,
  contrastRatio,
  deltaEOklab,
  oklab,
  oklchHue,
  oklchHueDistance,
  parseColor,
  parseRgba,
  relativeLuminance,
  withAlpha,
} from './color';

/**
 * Anchors used across this suite. Every one is a value the WCAG / OKLab
 * definitions pin down exactly, so a failure means the implementation is
 * wrong — never that the anchor drifted.
 */
const BLACK = '#000000';
const WHITE = '#ffffff';
const TEAL = '#087487';

/** OKLCH hues of the sRGB primaries, degrees. Reference values. */
const RED_HUE = 29.23;
const GREEN_HUE = 142.5;
const BLUE_HUE = 264.05;
const MAGENTA_HUE = 328.36;

describe('parseRgba', () => {
  it('devrait lire un hexadécimal à trois chiffres en développant chaque canal', () => {
    expect(parseRgba('#08a')).toEqual({ red: 0, green: 136, blue: 170, alpha: 1 });
  });

  it('devrait lire un hexadécimal à quatre chiffres en développant aussi le canal alpha', () => {
    const parsed = parseRgba('#0f8a');

    expect(parsed.red).toBe(0);
    expect(parsed.green).toBe(255);
    expect(parsed.blue).toBe(136);
    expect(parsed.alpha).toBeCloseTo(170 / 255, 4);
  });

  it('devrait lire un hexadécimal à six chiffres', () => {
    expect(parseRgba(TEAL)).toEqual({ red: 8, green: 116, blue: 135, alpha: 1 });
  });

  it('devrait lire un hexadécimal à huit chiffres et normaliser alpha entre 0 et 1', () => {
    const parsed = parseRgba('#08748780');

    expect(parsed.red).toBe(8);
    expect(parsed.green).toBe(116);
    expect(parsed.blue).toBe(135);
    expect(parsed.alpha).toBeCloseTo(128 / 255, 4);
  });

  it("devrait lire une notation rgb() et poser un alpha opaque par défaut", () => {
    expect(parseRgba('rgb(8, 116, 135)')).toEqual({
      red: 8,
      green: 116,
      blue: 135,
      alpha: 1,
    });
  });

  it('devrait lire une notation rgba() avec son alpha décimal', () => {
    expect(parseRgba('rgba(8, 116, 135, 0.42)')).toEqual({
      red: 8,
      green: 116,
      blue: 135,
      alpha: 0.42,
    });
  });

  it('devrait tolérer les espaces surnuméraires autour des composantes', () => {
    expect(parseRgba('  rgba( 8 , 116 , 135 , 0.42 )  ')).toEqual({
      red: 8,
      green: 116,
      blue: 135,
      alpha: 0.42,
    });
  });

  it.each([
    ['une chaîne vide', ''],
    ['un mot-clé non résolu', 'currentColor'],
    ['un hexadécimal de longueur invalide', '#12345'],
    ['un hexadécimal contenant un caractère hors base 16', '#gg0000'],
    ['une notation hsl() non supportée', 'hsl(200 80% 40%)'],
    ['une notation rgb() incomplète', 'rgb(8, 116)'],
  ])('devrait jeter quand on lui passe %s', (_label, input) => {
    expect(() => parseRgba(input)).toThrow();
  });
});

describe('parseColor', () => {
  it('devrait rendre le triplet des canaux 0-255 sans le canal alpha', () => {
    expect(parseColor(TEAL)).toEqual([8, 116, 135]);
  });

  it("devrait rendre les mêmes canaux qu'une couleur translucide, l'alpha étant ignoré", () => {
    expect(parseColor('rgba(8, 116, 135, 0.42)')).toEqual([8, 116, 135]);
  });
});

describe('withAlpha', () => {
  it("devrait appliquer le facteur à une couleur opaque", () => {
    expect(parseRgba(withAlpha(TEAL, 0.4)).alpha).toBeCloseTo(0.4, 6);
  });

  it('devrait préserver les canaux chromatiques', () => {
    expect(parseColor(withAlpha(TEAL, 0.4))).toEqual([8, 116, 135]);
  });

  it("devrait multiplier l'alpha existant plutôt que l'écraser", () => {
    expect(parseRgba(withAlpha('rgba(8, 116, 135, 0.5)', 0.4)).alpha).toBeCloseTo(0.2, 6);
  });

  it('devrait laisser la couleur inchangée avec un facteur de 1', () => {
    expect(parseRgba(withAlpha('rgba(8, 116, 135, 0.5)', 1)).alpha).toBeCloseTo(0.5, 6);
  });

  it('devrait rendre une couleur totalement transparente avec un facteur de 0', () => {
    expect(parseRgba(withAlpha(TEAL, 0)).alpha).toBe(0);
  });

  it('devrait rendre une couleur relisible par parseRgba', () => {
    expect(() => parseRgba(withAlpha(TEAL, 0.42))).not.toThrow();
  });
});

describe('compositeOver', () => {
  it('devrait rendre une couleur opaque', () => {
    expect(parseRgba(compositeOver('rgba(255, 255, 255, 0.5)', BLACK)).alpha).toBe(1);
  });

  it('devrait rendre le gris médian pour du blanc à 50 % sur du noir', () => {
    const [red, green, blue] = parseColor(compositeOver('rgba(255, 255, 255, 0.5)', BLACK));

    expect(red).toBeGreaterThanOrEqual(127);
    expect(red).toBeLessThanOrEqual(128);
    expect(green).toBe(red);
    expect(blue).toBe(red);
  });

  it('devrait rendre la couche supérieure quand elle est déjà opaque', () => {
    expect(parseColor(compositeOver(TEAL, WHITE))).toEqual([8, 116, 135]);
  });

  it('devrait rendre le support quand la couche supérieure est totalement transparente', () => {
    expect(parseColor(compositeOver('rgba(255, 255, 255, 0)', TEAL))).toEqual([8, 116, 135]);
  });

  it('devrait jeter quand le support est translucide', () => {
    expect(() => compositeOver('rgba(255, 255, 255, 0.5)', 'rgba(0, 0, 0, 0.5)')).toThrow();
  });
});

describe('compositeLayers', () => {
  it('devrait rendre la couche unique quand elle est opaque', () => {
    expect(parseColor(compositeLayers([TEAL]))).toEqual([8, 116, 135]);
  });

  it('devrait composer de bas en haut, le premier élément étant la couche la plus basse', () => {
    const [red] = parseColor(compositeLayers([BLACK, 'rgba(255, 255, 255, 0.5)']));

    expect(red).toBeGreaterThanOrEqual(127);
    expect(red).toBeLessThanOrEqual(128);
  });

  it('devrait empiler plusieurs couches translucides successivement', () => {
    const [red] = parseColor(
      compositeLayers([BLACK, 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.5)']),
    );

    expect(red).toBeGreaterThanOrEqual(191);
    expect(red).toBeLessThanOrEqual(192);
  });

  it("devrait donner le même résultat qu'un compositeOver équivalent", () => {
    expect(parseColor(compositeLayers([WHITE, 'rgba(8, 116, 135, 0.42)']))).toEqual(
      parseColor(compositeOver('rgba(8, 116, 135, 0.42)', WHITE)),
    );
  });

  it('devrait rendre une couleur opaque', () => {
    expect(parseRgba(compositeLayers([WHITE, 'rgba(8, 116, 135, 0.42)'])).alpha).toBe(1);
  });

  it('devrait jeter quand la couche la plus basse est translucide', () => {
    expect(() => compositeLayers(['rgba(0, 0, 0, 0.5)', TEAL])).toThrow();
  });

  it("devrait jeter quand il n'y a aucune couche", () => {
    expect(() => compositeLayers([])).toThrow();
  });
});

describe('relativeLuminance', () => {
  it('devrait valoir 1 pour le blanc', () => {
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 6);
  });

  it('devrait valoir 0 pour le noir', () => {
    expect(relativeLuminance(BLACK)).toBeCloseTo(0, 6);
  });

  it('devrait appliquer la linéarisation sRGB et non la valeur brute du canal', () => {
    // #808080 : 128/255 = 0,502 en sRGB, 0,2159 une fois linéarisé.
    expect(relativeLuminance('#808080')).toBeCloseTo(0.2159, 3);
  });

  it('devrait croître avec la clarté', () => {
    expect(relativeLuminance('#404040')).toBeLessThan(relativeLuminance('#808080'));
  });
});

describe('MID_GREY_LUMINANCE', () => {
  it('devrait se situer strictement entre le noir et le blanc', () => {
    expect(MID_GREY_LUMINANCE).toBeGreaterThan(0);
    expect(MID_GREY_LUMINANCE).toBeLessThan(1);
  });

  it('devrait valoir la luminance du gris moyen #808080', () => {
    expect(MID_GREY_LUMINANCE).toBeCloseTo(0.2159, 4);
  });

  it('devrait ranger un fond de page clair au-dessus du seuil', () => {
    expect(relativeLuminance('#deedf0')).toBeGreaterThan(MID_GREY_LUMINANCE);
  });

  it('devrait ranger un fond de page sombre en dessous du seuil', () => {
    expect(relativeLuminance('#0f191c')).toBeLessThan(MID_GREY_LUMINANCE);
  });
});

describe('contrastRatio', () => {
  it('devrait valoir 21 entre le noir et le blanc', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 6);
  });

  it('devrait valoir 1 entre une couleur et elle-même', () => {
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 6);
  });

  it("devrait être symétrique quel que soit l'ordre des arguments", () => {
    expect(contrastRatio(TEAL, WHITE)).toBeCloseTo(contrastRatio(WHITE, TEAL), 10);
  });

  it("devrait jeter quand le premier argument n'est pas opaque", () => {
    expect(() => contrastRatio('rgba(0, 0, 0, 0.99)', WHITE)).toThrow();
  });

  it("devrait jeter quand le second argument n'est pas opaque", () => {
    expect(() => contrastRatio(BLACK, 'rgba(255, 255, 255, 0.99)')).toThrow();
  });

  it('devrait accepter une couleur explicitement opaque en notation rgba()', () => {
    expect(contrastRatio('rgba(0, 0, 0, 1)', WHITE)).toBeCloseTo(21, 6);
  });
});

describe('oklab', () => {
  it('devrait donner une clarté de 1 pour le blanc', () => {
    expect(oklab(WHITE).lightness).toBeCloseTo(1, 3);
  });

  it('devrait donner une clarté de 0 pour le noir', () => {
    expect(oklab(BLACK).lightness).toBeCloseTo(0, 3);
  });

  it('devrait donner des composantes chromatiques nulles pour un gris neutre', () => {
    const grey = oklab('#808080');

    expect(grey.a).toBeCloseTo(0, 3);
    expect(grey.b).toBeCloseTo(0, 3);
  });

  it('devrait donner une clarté croissante avec la clarté perçue', () => {
    expect(oklab('#404040').lightness).toBeLessThan(oklab('#808080').lightness);
  });
});

describe('deltaEOklab', () => {
  it('devrait valoir 0 entre une couleur et elle-même', () => {
    expect(deltaEOklab(TEAL, TEAL)).toBeCloseTo(0, 6);
  });

  it('devrait valoir 100 entre le noir et le blanc, échelle ×100', () => {
    expect(deltaEOklab(BLACK, WHITE)).toBeCloseTo(100, 1);
  });

  it("devrait être symétrique quel que soit l'ordre des arguments", () => {
    expect(deltaEOklab(TEAL, WHITE)).toBeCloseTo(deltaEOklab(WHITE, TEAL), 10);
  });

  it("devrait croître quand les couleurs s'écartent", () => {
    expect(deltaEOklab('#193940', '#2b464c')).toBeLessThan(deltaEOklab('#193940', '#ffffff'));
  });
});

describe('oklchHue', () => {
  it.each([
    ['le rouge', '#ff0000', RED_HUE],
    ['le vert', '#00ff00', GREEN_HUE],
    ['le bleu', '#0000ff', BLUE_HUE],
    ['le magenta', '#ff00ff', MAGENTA_HUE],
  ])('devrait donner la teinte de référence pour %s', (_label, color, expected) => {
    expect(oklchHue(color)).toBeCloseTo(expected, 0);
  });

  it.each(['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#808080', TEAL])(
    'devrait rester dans [0, 360[ pour %s',
    (color) => {
      expect(oklchHue(color)).toBeGreaterThanOrEqual(0);
      expect(oklchHue(color)).toBeLessThan(360);
    },
  );
});

describe('oklchHueDistance', () => {
  it('devrait valoir 0 entre une couleur et elle-même', () => {
    expect(oklchHueDistance(TEAL, TEAL)).toBeCloseTo(0, 6);
  });

  it("devrait franchir le zéro plutôt que de faire le tour long", () => {
    // Rouge 29,2° et magenta 328,4° : la différence brute vaut 299,1°,
    // la distance cyclique 60,9°. Une soustraction naïve échoue ici.
    expect(oklchHueDistance('#ff0000', '#ff00ff')).toBeCloseTo(360 - (MAGENTA_HUE - RED_HUE), 0);
  });

  it("devrait être symétrique quel que soit l'ordre des arguments", () => {
    expect(oklchHueDistance('#ff0000', '#0000ff')).toBeCloseTo(
      oklchHueDistance('#0000ff', '#ff0000'),
      10,
    );
  });

  it.each([
    ['#ff0000', '#00ff00'],
    ['#ff0000', '#0000ff'],
    ['#ff0000', '#ff00ff'],
    ['#00ff00', '#0000ff'],
  ])('devrait rester dans [0, 180] entre %s et %s', (one, other) => {
    expect(oklchHueDistance(one, other)).toBeGreaterThanOrEqual(0);
    expect(oklchHueDistance(one, other)).toBeLessThanOrEqual(180);
  });
});
