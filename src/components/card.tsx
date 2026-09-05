import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

export type CardElevation = 0 | 1 | 2 | 3;

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  /**
   * Cran d'élévation, 0 à 3. @default 0
   *
   * La polarité s'inverse entre les thèmes : en clair c'est l'ombre qui
   * détache la carte du sol, en sombre c'est le liseré — une ombre composée
   * y mesure ΔE 2,2, sous le seuil de perceptibilité. Les deux sont donc
   * toujours posés ensemble.
   */
  elevation?: CardElevation;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Surface de contenu : fond `--surface`, liseré `--border-subtle`, rayon
 * `--radius-md`. Purement présentationnelle — c'est à l'appelant de rendre le
 * bon élément sémantique à l'intérieur (`<article>`, `<section>`, un titre).
 */
export function Card({ elevation = 0, className, ...rest }: CardProps) {
  return (
    <div
      className={cx('tc-card', `tc-card--elev-${elevation}`, className)}
      {...rest}
    />
  );
}
