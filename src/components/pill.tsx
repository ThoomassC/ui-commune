import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

export type PillTone = 'success' | 'warning' | 'danger';

const PILL_GLYPH: Record<PillTone, string> = {
  success: '✓',
  warning: '▲',
  danger: '✕',
};

export interface PillProps extends ComponentPropsWithoutRef<'span'> {
  tone: PillTone;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * Pastille d'état. `tone` est **requis** : une pastille sans état n'existe
 * pas dans cette charte.
 *
 * La bordure est en `currentColor`, donc toujours de la teinte de l'encre
 * sémantique. Le sens ne repose jamais sur la couleur : chaque pastille porte
 * un glyphe (masqué aux technologies d'assistance, il double le texte) **et**
 * un libellé lisible. En niveaux de gris, les trois restent distinguables.
 */
export function Pill({ tone, className, children, ...rest }: PillProps) {
  return (
    <span className={cx('tc-pill', `tc-pill--${tone}`, className)} {...rest}>
      <span className="tc-pill__glyph" aria-hidden="true">
        {PILL_GLYPH[tone]}
      </span>
      <span className="tc-pill__label">{children}</span>
    </span>
  );
}
