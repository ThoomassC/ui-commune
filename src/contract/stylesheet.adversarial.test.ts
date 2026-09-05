import { describe, expect, it } from 'vitest';

import { colourTokens, parseCustomProperties, parseThemes, resolveToken } from './stylesheet';

/**
 * Les feuilles que le contrat a déjà mal lues.
 *
 * Chaque cas ci-dessous a réellement produit un faux vert ou une perte
 * silencieuse dans une version antérieure du parseur. Ils sont réunis ici
 * parce qu'ils partagent une même nature : ce ne sont pas des bugs de calcul,
 * ce sont des endroits où le contrat croyait avoir lu la feuille.
 *
 * `stylesheet.test.ts` couvre le comportement nominal. Ce fichier couvre les
 * régressions.
 */

/** Une feuille minimale valide : `parseThemes` exige un thème clair peuplé. */
function sheet(body: string): string {
  return `:root { --site-background: #ffffff; ${body} }`;
}

function lightOf(css: string) {
  return parseThemes(css)[0];
}

describe('un `@media` sombre qualifié est refusé, jamais lu comme inconditionnel', () => {
  const QUALIFIED = [
    ['nié', '@media not all and (prefers-color-scheme: dark)'],
    ['conditionné à une largeur', '@media (min-width: 40em) and (prefers-color-scheme: dark)'],
  ] as const;

  it.each(QUALIFIED)('devrait jeter sur un `@media` %s', (_label, query) => {
    const css = `:root { --site-background: #ffffff; }
      ${query} { :root:not([data-theme="light"]) { --site-background: #ff0000; } }`;

    // Le lire silencieusement était le pire des trois comportements possibles :
    // le contrat mesurait alors les contrastes d'un thème sombre qu'aucun
    // navigateur ne peint jamais, et les 240 tests restaient verts.
    expect(() => parseThemes(css)).toThrow(/sous condition/);
  });

  it('devrait accepter un `@media (prefers-color-scheme: dark)` nu', () => {
    const css = `:root { --site-background: #ffffff; }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]) { --site-background: #0f191c; }
      }`;

    const [, darkOs] = parseThemes(css);
    expect(darkOs.overrides.get('--site-background')).toBe('#0f191c');
  });

  it("devrait accepter `screen and (…)`, qui n'ajoute aucune condition utile", () => {
    const css = `:root { --site-background: #ffffff; }
      @media screen and (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]) { --site-background: #0f191c; }
      }`;

    expect(parseThemes(css)[1].overrides.size).toBe(1);
  });

  it('devrait ignorer un `@media (prefers-color-scheme: light)`', () => {
    const css = `:root { --site-background: #ffffff; }
      @media (prefers-color-scheme: light) {
        :root:not([data-theme="light"]) { --site-background: #ff0000; }
      }`;

    expect(parseThemes(css)[1].overrides.size).toBe(0);
  });
});

describe('une accolade dans une chaîne ne referme rien', () => {
  it("devrait garder la règle qui suit un `content: '}'`", () => {
    const css = `:root { --site-background: #ffffff; }
      .quote::after { content: "}"; color: red; }
      :root { --late: #abcdef; }`;

    // Le compteur d'accolades naïf fermait `.quote::after` sur l'accolade de la
    // chaîne, repartait au milieu d'une déclaration, et `--late` disparaissait
    // sans la moindre exception.
    expect(lightOf(css).tokens.get('--late')).toBe('#abcdef');
  });

  it("devrait survivre à un `content: '{'`", () => {
    const css = `:root { --site-background: #ffffff; }
      .quote::before { content: "{"; }
      :root { --late: 1px; }`;

    expect(lightOf(css).tokens.get('--late')).toBe('1px');
  });
});

describe('le prélude est celui de la règle, et rien de ce qui la précède', () => {
  it('devrait trouver un `:root` précédé d’un `@import`', () => {
    const css = `@import "reset.css";
      :root { --a: 1px; }
      :root { --site-background: #ffffff; }`;

    // Le prélude partait de la fin de la règle précédente et absorbait le
    // `@import` : le premier `:root` n'était jamais reconnu, et comme le second
    // existait, aucun garde ne se déclenchait.
    expect(lightOf(css).tokens.get('--a')).toBe('1px');
  });

  it('devrait reconnaître `:root` dans une liste de sélecteurs', () => {
    expect(lightOf(':root, body { --site-background: #fff; --a: 2px; }').tokens.get('--a')).toBe(
      '2px',
    );
  });

  it('devrait descendre dans un `@layer`, qui groupe sans conditionner', () => {
    const css = '@layer tokens { :root { --site-background: #ffffff; --a: 3px; } }';

    expect(lightOf(css).tokens.get('--a')).toBe('3px');
  });

  it('devrait tolérer les espaces dans un sélecteur d’attribut', () => {
    const css = `:root { --site-background: #ffffff; }
      @media (prefers-color-scheme: dark) {
        :root:not( [data-theme="light"] ) { --site-background: #0f191c; }
      }`;

    expect(parseThemes(css)[1].overrides.size).toBe(1);
  });
});

describe('une valeur se lit en entier ou pas du tout', () => {
  it('devrait garder une dernière déclaration écrite sans point-virgule', () => {
    expect(lightOf(':root { --a: 1px; --last: #abcdef }').tokens.get('--last')).toBe('#abcdef');
  });

  it('devrait ignorer un point-virgule situé dans une chaîne', () => {
    const parsed = parseCustomProperties('--font: "a;b", serif; --next: 1px;');

    expect(parsed.get('--font')).toBe('"a;b", serif');
    expect(parsed.get('--next')).toBe('1px');
  });

  it('devrait résoudre un var() imbriqué dans un fallback sans parenthèse orpheline', () => {
    const theme = lightOf(sheet('--a: var(--b, var(--c)); --b: 2px; --c: 3px;'));

    // `[^)]*` s'arrêtait à la parenthèse interne et laissait `"2px)"`, qui
    // traverse une comparaison de chaînes sans rien casser de visible.
    expect(resolveToken(theme, '--a')).toBe('2px');
  });

  it('devrait résoudre une valeur composite sans la tronquer', () => {
    const theme = lightOf(sheet('--shadow: rgba(0, 0, 0, 0.3); --elevation: 0 2px 6px var(--shadow);'));

    expect(resolveToken(theme, '--elevation')).toBe('0 2px 6px rgba(0, 0, 0, 0.3)');
  });

  it('devrait jeter sur un cycle direct plutôt que de rendre la valeur non résolue', () => {
    const theme = lightOf(sheet('--a: var(--a);'));

    // Une substitution en place fait de `--a: var(--a)` un point fixe : « la
    // valeur n'a pas changé » ne peut donc pas servir de condition d'arrêt.
    expect(() => resolveToken(theme, '--a')).toThrow(/circulaire/);
  });
});

describe('rien ne se classe silencieusement comme « pas une couleur »', () => {
  it('devrait jeter plutôt que d’écarter un jeton dont la référence est cassée', () => {
    const theme = lightOf(sheet('--brand: var(--absent); --ok: #ff0000;'));

    // Un `catch {}` en faisait « pas une couleur » : un appelant qui itère
    // `colourTokens()` pour vérifier ses contrastes vérifiait alors tout sauf
    // les jetons cassés.
    expect(() => colourTokens(theme)).toThrow(/--absent/);
  });

  it('devrait retenir les couleurs et écarter les longueurs', () => {
    const theme = lightOf(sheet('--ink: #123456; --gap: 1rem; --wash: rgba(1, 2, 3, 0.5);'));

    expect(colourTokens(theme)).toEqual(
      expect.arrayContaining(['--site-background', '--ink', '--wash']),
    );
    expect(colourTokens(theme)).not.toContain('--gap');
  });
});
