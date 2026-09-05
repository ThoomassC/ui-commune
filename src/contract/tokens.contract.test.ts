import { describe, expect, it } from 'vitest';

import { compositeLayers, contrastRatio, deltaEOklab, oklab } from './color';
import { parseThemes, resolveToken } from './stylesheet';
import type { Theme, ThemeName } from './stylesheet';
import primitivesSource from '../tokens/primitives.css?raw';
import rolesSource from '../tokens/roles.css?raw';

/* ============================================================================
   Seuils. Chaque constante nomme la règle qu'elle applique : un rouge doit
   dire quelle exigence tombe, pas seulement quel nombre est trop petit.
   ========================================================================== */

const AAA_TEXT = 7; // WCAG 1.4.6 — texte, niveau AAA
const AA_TEXT = 4.5; // WCAG 1.4.3 — texte, niveau AA
const AA_NON_TEXT = 3; // WCAG 1.4.11 — composants d'interface et graphiques
const MIN_ROLE_DELTA_E = 5; // plancher de hiérarchie entre encres voisines
const MIN_WARM_LIGHTNESS_GAP = 0.08; // écart OKLab L imposé entre le cuivre et l'accent

const THEME_NAMES = ['light', 'dark-os', 'dark-explicit'] as const satisfies readonly ThemeName[];

/* ============================================================================
   Chargement de la vraie feuille.

   `tokens.css` n'est qu'un point d'entrée : ses deux `@import` ne sont PAS
   résolus par `?raw`. On concatène donc les deux couches dans l'ordre du
   document, primitives puis rôles — `parseThemes` fusionne les blocs `:root`
   des deux fichiers, le dernier déclarant l'emportant.
   ========================================================================== */

const stylesheet = `${primitivesSource}\n${rolesSource}`;
const themes = parseThemes(stylesheet);

function themeNamed(name: ThemeName): Theme {
  const found = themes.find((theme) => theme.name === name);

  if (found === undefined) {
    throw new Error(
      `thème « ${name} » absent — reçus : ${themes.map((theme) => theme.name).join(', ') || '(aucun)'}`,
    );
  }

  return found;
}

function tokenOf(themeName: ThemeName, token: string): string {
  return resolveToken(themeNamed(themeName), token);
}

function ratioOf(themeName: ThemeName, ink: string, backdrop: string): number {
  return contrastRatio(tokenOf(themeName, ink), tokenOf(themeName, backdrop));
}

/** Asserts a contrast floor and reports the measured value plus the shortfall. */
function expectRatio(measured: number, minimum: number, subject: string): void {
  expect(
    measured,
    `${subject} — mesuré ${measured.toFixed(2)}:1, exigé ${minimum}:1 (manque ${Math.max(
      0,
      minimum - measured,
    ).toFixed(2)})`,
  ).toBeGreaterThanOrEqual(minimum);
}

/** Cross product of the three themes with a list of token names. */
function perTheme<T>(items: readonly T[]): readonly { theme: ThemeName; item: T }[] {
  return THEME_NAMES.flatMap((theme) => items.map((item) => ({ theme, item })));
}

/* ========================================================================== */

describe('0. La suite lit bien la vraie feuille', () => {
  // Sans ces gardes, toute la suite peut virer au vert en ne lisant rien :
  // une source vide, ou des blocs sombres jamais trouvés, feraient mesurer
  // trois fois le thème clair.

  it('devrait charger une source non vide', () => {
    expect(stylesheet.length).toBeGreaterThan(1000);
  });

  it('devrait produire les trois thèmes du contrat', () => {
    expect(themes.map((theme) => theme.name)).toEqual(['light', 'dark-os', 'dark-explicit']);
  });

  it('devrait charger un thème clair réellement peuplé', () => {
    expect(themeNamed('light').tokens.size).toBeGreaterThan(20);
  });

  it.each(['dark-os', 'dark-explicit'] as const)(
    '%s devrait réellement surcharger le clair et non le recopier',
    (name) => {
      expect(tokenOf(name, '--site-background')).not.toBe(tokenOf('light', '--site-background'));
    },
  );
});

describe('1. Les encres tiennent leur seuil contre le fond de page', () => {
  const AA_INKS = ['--text-strong', '--text-body', '--text-muted', '--text-accent'] as const;
  const AAA_INKS = ['--text-strong', '--text-body'] as const;

  it.each(perTheme(AA_INKS))(
    '$item devrait tenir AA_TEXT contre --site-background en $theme',
    ({ theme, item }) => {
      expectRatio(ratioOf(theme, item, '--site-background'), AA_TEXT, `${item} / fond en ${theme}`);
    },
  );

  it.each(perTheme(AAA_INKS))(
    '$item devrait tenir AAA_TEXT contre --site-background en $theme',
    ({ theme, item }) => {
      expectRatio(ratioOf(theme, item, '--site-background'), AAA_TEXT, `${item} / fond en ${theme}`);
    },
  );
});

describe("2. L'encre posée sur l'accent tient dans les trois états du contrôle", () => {
  const ACCENT_STATES = ['--accent', '--accent-hover', '--accent-active'] as const;

  it.each(perTheme(ACCENT_STATES))(
    '--text-on-accent devrait tenir AA_TEXT contre $item en $theme',
    ({ theme, item }) => {
      expectRatio(
        ratioOf(theme, '--text-on-accent', item),
        AA_TEXT,
        `--text-on-accent / ${item} en ${theme}`,
      );
    },
  );
});

describe('3. Le trait de contrôle tient AA_NON_TEXT sur ses deux supports', () => {
  const BACKDROPS = ['--site-background', '--panel-surface'] as const;

  it.each(perTheme(BACKDROPS))(
    '--control-border devrait tenir AA_NON_TEXT contre $item en $theme',
    ({ theme, item }) => {
      expectRatio(
        ratioOf(theme, '--control-border', item),
        AA_NON_TEXT,
        `--control-border / ${item} en ${theme}`,
      );
    },
  );
});

describe('4. Les encres sémantiques tiennent AA_TEXT sur le fond et sur la carte', () => {
  const SEMANTIC_INKS = ['--danger', '--success', '--warning'] as const;
  const BACKDROPS = ['--site-background', '--surface'] as const;
  const cases = THEME_NAMES.flatMap((theme) =>
    SEMANTIC_INKS.flatMap((ink) => BACKDROPS.map((backdrop) => ({ theme, ink, backdrop }))),
  );

  it.each(cases)(
    '$ink devrait tenir AA_TEXT contre $backdrop en $theme',
    ({ theme, ink, backdrop }) => {
      expectRatio(ratioOf(theme, ink, backdrop), AA_TEXT, `${ink} / ${backdrop} en ${theme}`);
    },
  );
});

describe('5. La hiérarchie des encres survit à la résolution des contrastes', () => {
  const NEIGHBOURS = [
    ['--text-strong', '--text-body'],
    ['--text-body', '--text-muted'],
  ] as const;
  const cases = THEME_NAMES.flatMap((theme) =>
    NEIGHBOURS.map(([one, other]) => ({ theme, one, other })),
  );

  it.each(cases)(
    'ΔE OKLab entre $one et $other devrait atteindre MIN_ROLE_DELTA_E en $theme',
    ({ theme, one, other }) => {
      const measured = deltaEOklab(tokenOf(theme, one), tokenOf(theme, other));

      expect(
        measured,
        `${one} vs ${other} en ${theme} — ΔE mesuré ${measured.toFixed(2)}, exigé ${MIN_ROLE_DELTA_E} (manque ${Math.max(
          0,
          MIN_ROLE_DELTA_E - measured,
        ).toFixed(2)})`,
      ).toBeGreaterThanOrEqual(MIN_ROLE_DELTA_E);
    },
  );
});

describe('6. Le contrat teal & cuivre : les deux accents ne se confondent jamais', () => {
  it.each(THEME_NAMES)(
    "l'écart de clarté OKLab entre --accent et --accent-secondary devrait atteindre MIN_WARM_LIGHTNESS_GAP en %s",
    (theme) => {
      const accent = oklab(tokenOf(theme, '--accent')).lightness;
      const secondary = oklab(tokenOf(theme, '--accent-secondary')).lightness;
      const gap = Math.abs(accent - secondary);

      expect(
        gap,
        `en ${theme} — L(--accent) ${accent.toFixed(3)}, L(--accent-secondary) ${secondary.toFixed(
          3,
        )}, écart ${gap.toFixed(3)}, exigé ${MIN_WARM_LIGHTNESS_GAP} (manque ${Math.max(
          0,
          MIN_WARM_LIGHTNESS_GAP - gap,
        ).toFixed(3)})`,
      ).toBeGreaterThanOrEqual(MIN_WARM_LIGHTNESS_GAP);
    },
  );
});

describe("7. L'anneau de focus reste lisible sur chacun de ses supports", () => {
  it.each(THEME_NAMES)(
    "--focus-inner devrait tenir AA_NON_TEXT contre l'aplat --accent en %s",
    (theme) => {
      expectRatio(
        ratioOf(theme, '--focus-inner', '--accent'),
        AA_NON_TEXT,
        `--focus-inner / --accent en ${theme}`,
      );
    },
  );

  it.each(THEME_NAMES)(
    '--focus-outer devrait tenir AA_NON_TEXT contre --site-background en %s',
    (theme) => {
      expectRatio(
        ratioOf(theme, '--focus-outer', '--site-background'),
        AA_NON_TEXT,
        `--focus-outer / --site-background en ${theme}`,
      );
    },
  );

  it.each(THEME_NAMES)(
    "les deux anneaux devraient tenir AA_NON_TEXT l'un contre l'autre en %s",
    (theme) => {
      expectRatio(
        ratioOf(theme, '--focus-inner', '--focus-outer'),
        AA_NON_TEXT,
        `--focus-inner / --focus-outer en ${theme}`,
      );
    },
  );
});

describe('8. Complétude : aucun jeton ne vit uniquement dans un bloc sombre', () => {
  it.each(['dark-os', 'dark-explicit'] as const)(
    'tout jeton de %s devrait aussi être déclaré dans le bloc :root nu',
    (name) => {
      const light = themeNamed('light');
      const orphans = [...themeNamed(name).tokens.keys()].filter(
        (token) => !light.tokens.has(token),
      );

      expect(
        orphans,
        `déclarés uniquement en ${name}, donc jamais appliqués dans l'état non marqué : ${orphans.join(', ')}`,
      ).toEqual([]);
    },
  );
});

describe('9. Les deux blocs sombres ne divergent pas', () => {
  /*
   * On compare `overrides`, jamais `tokens`. Les maps fusionnées partagent
   * toujours leurs clés dès lors que le test 8 passe : supprimer
   * `--accent` du bloc `[data-theme="dark"]` laisse la valeur claire prendre
   * sa place, et une comparaison sur `tokens` reste verte alors que le thème
   * explicite a réellement divergé. Vérifié : cette mutation-là passait.
   */
  const sortedEntries = (theme: Theme): readonly (readonly [string, string])[] =>
    [...theme.overrides.entries()].sort(([one], [other]) => one.localeCompare(other));

  it.each(['dark-os', 'dark-explicit'] as const)(
    'devrait trouver un bloc %s réellement peuplé',
    (name) => {
      expect(
        themeNamed(name).overrides.size,
        `le bloc \`${name}\` n'a été trouvé avec aucune surcharge : sélecteur introuvable ?`,
      ).toBeGreaterThan(0);
    },
  );

  it('devrait redéclarer exactement les mêmes jetons dans les deux blocs sombres', () => {
    expect([...themeNamed('dark-os').overrides.keys()].sort()).toEqual(
      [...themeNamed('dark-explicit').overrides.keys()].sort(),
    );
  });

  it('devrait leur donner les mêmes valeurs', () => {
    expect(sortedEntries(themeNamed('dark-os'))).toEqual(sortedEntries(themeNamed('dark-explicit')));
  });
});

describe('11. Une encre sémantique tient son seuil sur SON PROPRE lavis', () => {
  /*
   * Le substrat que le contrat ne regardait pas, et qui a coûté un échec réel :
   * une pastille pose son encre sur `--x-quiet`, c'est-à-dire sur elle-même à
   * alpha faible, composé sur la surface. Mesuré contre le fond de page seul,
   * `--warning` annonçait 4,90:1 ; sur son lavis posé sur `--panel-surface`, il
   * tombait à 4,20:1. Le fond de page n'est jamais le pire cas.
   */
  const TONES = ['danger', 'success', 'warning'] as const;
  const SUBSTRATES = ['--site-background', '--surface', '--panel-surface'] as const;

  it.each(
    perTheme(TONES).flatMap(({ theme, item }) =>
      SUBSTRATES.map((substrate) => ({ theme, tone: item, substrate })),
    ),
  )('$tone sur son lavis posé sur $substrate — thème $theme', ({ theme, tone, substrate }) => {
    const ink = tokenOf(theme, `--${tone}`);
    const composed = compositeLayers([tokenOf(theme, substrate), tokenOf(theme, `--${tone}-quiet`)]);

    expectRatio(
      contrastRatio(ink, composed),
      AA_TEXT,
      `--${tone} sur --${tone}-quiet composé sur ${substrate} (${composed}) en ${theme}`,
    );
  });
});

/*
 * 10. « Aucun hexadécimal littéral hors de primitives.css » vit dans
 *     `src/tokens/primitives.contract.test.ts`, qui appartient à la couche des
 *     jetons et y ajoute le garde du nommage par clarté OKLab. Pas de doublon
 *     ici : deux tests du même invariant divergent tôt ou tard.
 */
