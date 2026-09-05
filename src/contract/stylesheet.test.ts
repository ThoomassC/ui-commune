import { describe, expect, it } from 'vitest';

import { parseThemes, resolveToken } from './stylesheet';
import type { Theme, ThemeName } from './stylesheet';

/**
 * Picks a theme by name and fails loudly when it is missing, so a suite that
 * expects three blocks never silently degrades to two.
 */
function themeNamed(themes: readonly Theme[], name: ThemeName): Theme {
  const found = themes.find((theme) => theme.name === name);

  if (found === undefined) {
    throw new Error(
      `thème « ${name} » absent — reçus : ${themes.map((theme) => theme.name).join(', ') || '(aucun)'}`,
    );
  }

  return found;
}

/** A minimal but structurally faithful stylesheet: the three blocks, in order. */
const THREE_BLOCKS = `
:root {
  --site-background: #deedf0;
  --accent: #087487;
  --text-body: #2b464c;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --site-background: #0f191c;
    --text-body: #aac8d0;
  }
}

:root[data-theme='dark'] {
  --site-background: #0f191c;
  --text-body: #aac8d0;
}
`;

describe('parseThemes — extraction des trois blocs', () => {
  it('devrait rendre exactement trois thèmes', () => {
    expect(parseThemes(THREE_BLOCKS)).toHaveLength(3);
  });

  it('devrait nommer les trois thèmes light, dark-os et dark-explicit', () => {
    expect(parseThemes(THREE_BLOCKS).map((theme) => theme.name)).toEqual([
      'light',
      'dark-os',
      'dark-explicit',
    ]);
  });

  it('devrait alimenter le thème clair depuis le bloc :root nu', () => {
    const light = themeNamed(parseThemes(THREE_BLOCKS), 'light');

    expect(light.tokens.get('--site-background')).toBe('#deedf0');
  });

  it("devrait alimenter dark-os depuis le bloc imbriqué dans l'@media", () => {
    const darkOs = themeNamed(parseThemes(THREE_BLOCKS), 'dark-os');

    expect(darkOs.tokens.get('--site-background')).toBe('#0f191c');
  });

  it('devrait alimenter dark-explicit depuis le bloc :root[data-theme="dark"]', () => {
    const darkExplicit = themeNamed(parseThemes(THREE_BLOCKS), 'dark-explicit');

    expect(darkExplicit.tokens.get('--site-background')).toBe('#0f191c');
  });

  it.each(['dark-os', 'dark-explicit'] as const)(
    'devrait faire hériter %s des jetons du clair non redéfinis',
    (name) => {
      const dark = themeNamed(parseThemes(THREE_BLOCKS), name);

      expect(dark.tokens.get('--accent')).toBe('#087487');
    },
  );

  it.each(['dark-os', 'dark-explicit'] as const)(
    'devrait rendre pour %s la carte complète et non les seules redéfinitions',
    (name) => {
      const light = themeNamed(parseThemes(THREE_BLOCKS), 'light');
      const dark = themeNamed(parseThemes(THREE_BLOCKS), name);

      expect([...dark.tokens.keys()].sort()).toEqual([...light.tokens.keys()].sort());
    },
  );

  it('devrait ne retenir que les propriétés personnalisées, pas les déclarations ordinaires', () => {
    const css = `
      :root {
        --accent: #087487;
        color-scheme: light;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme='light']) { --accent: #208093; }
      }
      :root[data-theme='dark'] { --accent: #208093; }
    `;
    const light = themeNamed(parseThemes(css), 'light');

    expect([...light.tokens.keys()]).toEqual(['--accent']);
  });

  it('devrait ignorer un bloc :root imbriqué dans un @media clair', () => {
    const css = `
      :root { --accent: #087487; }
      @media (prefers-color-scheme: light) {
        :root { --accent: #ff0000; }
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme='light']) { --accent: #208093; }
      }
      :root[data-theme='dark'] { --accent: #208093; }
    `;

    expect(themeNamed(parseThemes(css), 'light').tokens.get('--accent')).toBe('#087487');
  });
});

describe('parseThemes — les commentaires sont retirés avant extraction', () => {
  it('devrait ignorer une valeur citée dans un commentaire précédant la vraie déclaration', () => {
    const css = `
      :root {
        /* --accent: #ff0000; ancienne valeur, conservée pour mémoire */
        --accent: #087487;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme='light']) { --accent: #208093; }
      }
      :root[data-theme='dark'] { --accent: #208093; }
    `;

    expect(themeNamed(parseThemes(css), 'light').tokens.get('--accent')).toBe('#087487');
  });

  it('devrait ignorer une valeur citée dans un commentaire suivant la vraie déclaration', () => {
    const css = `
      :root {
        --accent: #087487;
        /* --accent: #ff0000; */
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme='light']) { --accent: #208093; }
      }
      :root[data-theme='dark'] { --accent: #208093; }
    `;

    expect(themeNamed(parseThemes(css), 'light').tokens.get('--accent')).toBe('#087487');
  });

  it("devrait ne pas compter une accolade fermante vivant dans un commentaire", () => {
    const css = `
      :root {
        /* une accolade } perdue dans un commentaire */
        --accent: #087487;
        --text-body: #2b464c;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme='light']) { --accent: #208093; }
      }
      :root[data-theme='dark'] { --accent: #208093; }
    `;

    expect(themeNamed(parseThemes(css), 'light').tokens.get('--text-body')).toBe('#2b464c');
  });

  it('devrait ne pas laisser un commentaire fabriquer un jeton inexistant', () => {
    const css = `
      :root {
        --accent: #087487;
        /* --ghost: #ff0000; jamais déclaré pour de vrai */
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme='light']) { --accent: #208093; }
      }
      :root[data-theme='dark'] { --accent: #208093; }
    `;

    expect(themeNamed(parseThemes(css), 'light').tokens.has('--ghost')).toBe(false);
  });

  it('devrait ne pas laisser un commentaire tronquer le commentaire de bandeau du fichier', () => {
    const css = `
      /* ===========================================================
         Bandeau : --accent: #ff0000; est une valeur d'exemple.
         =========================================================== */
      :root { --accent: #087487; }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme='light']) { --accent: #208093; }
      }
      :root[data-theme='dark'] { --accent: #208093; }
    `;

    expect(themeNamed(parseThemes(css), 'light').tokens.get('--accent')).toBe('#087487');
  });
});

describe('parseThemes — le corps des règles se trouve par comptage d’accolades', () => {
  const NESTED = `
    :root {
      --text-display-md: clamp(1.875rem, 3.9vw, 3.25rem);
      --accent-quiet: rgba(8, 116, 135, 0.1);
      --sheen: linear-gradient(180deg, rgba(255, 255, 255, 0.4), rgba(0, 0, 0, 0));
      --last-of-light: #deedf0;
    }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme='light']) {
        --accent-quiet: rgba(8, 116, 135, 0.16);
        --last-of-dark: #0f191c;
      }
    }

    :root[data-theme='dark'] {
      --accent-quiet: rgba(8, 116, 135, 0.16);
      --last-of-dark: #0f191c;
    }
  `;

  it('devrait conserver intacte une valeur contenant des parenthèses', () => {
    expect(themeNamed(parseThemes(NESTED), 'light').tokens.get('--text-display-md')).toBe(
      'clamp(1.875rem, 3.9vw, 3.25rem)',
    );
  });

  it('devrait conserver intacte une valeur contenant des parenthèses imbriquées', () => {
    expect(themeNamed(parseThemes(NESTED), 'light').tokens.get('--sheen')).toBe(
      'linear-gradient(180deg, rgba(255, 255, 255, 0.4), rgba(0, 0, 0, 0))',
    );
  });

  it('devrait lire le dernier jeton du bloc clair, celui qu’une regex courte laisserait tomber', () => {
    expect(themeNamed(parseThemes(NESTED), 'light').tokens.get('--last-of-light')).toBe('#deedf0');
  });

  it("devrait lire tous les jetons du bloc imbriqué dans l'@media, y compris après la première accolade fermante", () => {
    const darkOs = themeNamed(parseThemes(NESTED), 'dark-os');

    expect(darkOs.tokens.get('--accent-quiet')).toBe('rgba(8, 116, 135, 0.16)');
    expect(darkOs.tokens.get('--last-of-dark')).toBe('#0f191c');
  });

  it("devrait ne pas confondre la fin du bloc :root avec la fin de l'@media qui le contient", () => {
    expect(themeNamed(parseThemes(NESTED), 'dark-os').tokens.get('--text-display-md')).toBe(
      'clamp(1.875rem, 3.9vw, 3.25rem)',
    );
  });
});

describe('parseThemes — un jeton déclaré seulement en sombre est détectable', () => {
  const DARK_ONLY = `
    :root { --accent: #087487; }
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme='light']) {
        --accent: #208093;
        --dark-only-ink: #b6dae3;
      }
    }
    :root[data-theme='dark'] {
      --accent: #208093;
      --dark-only-ink: #b6dae3;
    }
  `;

  it('devrait rendre le jeton présent dans le thème sombre', () => {
    expect(themeNamed(parseThemes(DARK_ONLY), 'dark-os').tokens.has('--dark-only-ink')).toBe(true);
  });

  it('devrait rendre le jeton absent du thème clair, ce qui rend la divergence visible', () => {
    expect(themeNamed(parseThemes(DARK_ONLY), 'light').tokens.has('--dark-only-ink')).toBe(false);
  });

  it('devrait faire jeter resolveToken sur ce jeton dans le thème clair', () => {
    const light = themeNamed(parseThemes(DARK_ONLY), 'light');

    expect(() => resolveToken(light, '--dark-only-ink')).toThrow(/--dark-only-ink/);
  });
});

describe('resolveToken', () => {
  function themeOf(declarations: string): Theme {
    const css = `
      :root { ${declarations} }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme='light']) { --unused: 0; }
      }
      :root[data-theme='dark'] { --unused: 0; }
    `;

    return themeNamed(parseThemes(css), 'light');
  }

  it('devrait rendre telle quelle une valeur littérale', () => {
    expect(resolveToken(themeOf('--accent: #087487;'), '--accent')).toBe('#087487');
  });

  it('devrait suivre un alias var() simple', () => {
    const theme = themeOf('--teal-600: #087487; --accent: var(--teal-600);');

    expect(resolveToken(theme, '--accent')).toBe('#087487');
  });

  it('devrait suivre une chaîne de cinq alias', () => {
    const theme = themeOf(
      '--a: #087487; --b: var(--a); --c: var(--b); --d: var(--c); --e: var(--d); --f: var(--e);',
    );

    expect(resolveToken(theme, '--f')).toBe('#087487');
  });

  it("devrait résoudre un var() enchâssé dans une valeur composite", () => {
    const theme = themeOf(
      '--shadow-ink: rgba(4, 15, 19, 0.3); --elevation-1: 0 0.125rem 0.375rem var(--shadow-ink);',
    );

    expect(resolveToken(theme, '--elevation-1')).toBe('0 0.125rem 0.375rem rgba(4, 15, 19, 0.3)');
  });

  it('devrait tolérer les espaces à l’intérieur de var( --nom )', () => {
    const theme = themeOf('--teal-600: #087487; --accent: var( --teal-600 );');

    expect(resolveToken(theme, '--accent')).toBe('#087487');
  });

  it('devrait jeter en nommant le jeton absent', () => {
    expect(() => resolveToken(themeOf('--accent: #087487;'), '--missing')).toThrow(/--missing/);
  });

  it('devrait jeter en nommant l’alias cassé au bout de la chaîne', () => {
    const theme = themeOf('--accent: var(--nowhere);');

    expect(() => resolveToken(theme, '--accent')).toThrow(/--nowhere/);
  });

  it('devrait jeter sur un cycle direct plutôt que de boucler', () => {
    const theme = themeOf('--a: var(--a);');

    expect(() => resolveToken(theme, '--a')).toThrow();
  });

  it('devrait jeter sur un cycle indirect plutôt que de boucler', () => {
    const theme = themeOf('--a: var(--b); --b: var(--c); --c: var(--a);');

    expect(() => resolveToken(theme, '--a')).toThrow();
  });

  it('devrait jeter au-delà de la limite de sauts', () => {
    const chain = [
      '--s0: #087487;',
      ...Array.from({ length: 20 }, (_unused, index) => `--s${index + 1}: var(--s${index});`),
    ].join(' ');

    expect(() => resolveToken(themeOf(chain), '--s20')).toThrow();
  });

  it('devrait résoudre le même jeton avec la valeur propre à chaque thème', () => {
    const themes = parseThemes(THREE_BLOCKS);

    expect(resolveToken(themeNamed(themes, 'light'), '--site-background')).toBe('#deedf0');
    expect(resolveToken(themeNamed(themes, 'dark-os'), '--site-background')).toBe('#0f191c');
    expect(resolveToken(themeNamed(themes, 'dark-explicit'), '--site-background')).toBe('#0f191c');
  });
});
