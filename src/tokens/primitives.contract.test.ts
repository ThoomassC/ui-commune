import { describe, expect, it } from 'vitest';

import primitivesSource from './primitives.css?raw';
import rolesSource from './roles.css?raw';
import { oklab, oklchHue } from '../contract/color';
import { parseCustomProperties, ruleBodies, stripComments } from '../contract/stylesheet';

/**
 * Primitives are named `--tc-<family>-<L>`, where `<L>` is the measured OKLab
 * lightness ×1000. The number is a fact, not a rank — which only holds while
 * something checks it. Rename a primitive without remeasuring and this fails.
 */

const OPAQUE_PRIMITIVE = /^--tc-([a-z]+)-(\d{3})$/;
const HEX_ANYWHERE = /#[0-9a-f]{3,8}\b/i;

/** Families whose members must stay on the cool ink hue: the neutral field. */
const COOL_HUE_RANGE = { min: 205, max: 225 } as const;

function primitives(): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const body of ruleBodies(stripComments(primitivesSource), ':root')) {
    for (const [name, value] of parseCustomProperties(body)) {
      tokens.set(name, value);
    }
  }
  return tokens;
}

describe('la couche primitives', () => {
  it('déclare au moins une primitive', () => {
    expect(primitives().size).toBeGreaterThan(0);
  });

  it.each([...primitives()].filter(([name]) => OPAQUE_PRIMITIVE.test(name)))(
    'le nombre de %s est sa luminosité OKLab mesurée',
    (name, value) => {
      const claimed = Number(OPAQUE_PRIMITIVE.exec(name)?.[2]);
      const measured = Math.round(oklab(value).lightness * 1000);
      expect(
        measured,
        `${name} vaut ${value}, dont la luminosité OKLab mesure ${measured} et non ${claimed}`,
      ).toBe(claimed);
    },
  );

  it.each(
    [...primitives()].filter(([name]) => name.startsWith('--tc-mist-') && !name.endsWith('-a')),
  )('%s reste sur la teinte froide du champ', (name, value) => {
    const hue = oklchHue(value);
    expect(
      hue,
      `${name} (${value}) est à ${hue.toFixed(1)}° : hors de la plage froide, le neutre devient sale`,
    ).toBeGreaterThanOrEqual(COOL_HUE_RANGE.min);
    expect(hue).toBeLessThanOrEqual(COOL_HUE_RANGE.max);
  });
});

describe('la direction de dépendance entre couches', () => {
  it("roles.css ne contient aucun hexadécimal : la couche rôle ne cite que des primitives", () => {
    const offenders: string[] = [];
    for (const body of [
      ...ruleBodies(stripComments(rolesSource), ':root'),
      ...ruleBodies(stripComments(rolesSource), ':root:not([data-theme="light"])'),
      ...ruleBodies(stripComments(rolesSource), ':root[data-theme="dark"]'),
    ]) {
      for (const [name, value] of parseCustomProperties(body)) {
        if (HEX_ANYWHERE.test(value)) offenders.push(`${name}: ${value}`);
      }
    }
    expect(offenders, `hexadécimaux trouvés dans roles.css :\n  ${offenders.join('\n  ')}`).toEqual(
      [],
    );
  });

  it("primitives.css ne cite aucun jeton de rôle : la dépendance ne remonte pas", () => {
    const rolePrefixes = ['--text-', '--accent', '--surface', '--site-', '--panel-', '--focus-'];
    const offenders = [...primitives()].filter(([, value]) =>
      rolePrefixes.some((prefix) => value.includes(`var(${prefix}`)),
    );
    expect(offenders.map(([name]) => name)).toEqual([]);
  });
});
