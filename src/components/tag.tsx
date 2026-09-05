import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

export type TagVariant = 'measured' | 'proposed' | 'open';

const TAG_GLYPH: Record<TagVariant, string> = {
  measured: '◆',
  proposed: '◇',
  open: '○',
};

export interface TagProps extends ComponentPropsWithoutRef<'span'> {
  /**
   * Statut d'une donnée de la charte :
   * - `measured` — mesurée, bordure **pleine**, losange plein ;
   * - `proposed` — proposée et non encore vérifiée, bordure **tiretée**,
   *   losange creux ;
   * - `open` — question ouverte, bordure **pointillée**, cercle creux.
   */
  variant: TagVariant;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * Étiquette de statut. Les trois variantes se distinguent par la **forme de
 * la bordure** (pleine / tiretée / pointillée) et par le glyphe, jamais par
 * la seule couleur : imprimé en noir et blanc, le tableau reste lisible.
 */
export function Tag({ variant, className, children, ...rest }: TagProps) {
  return (
    <span className={cx('tc-tag', `tc-tag--${variant}`, className)} {...rest}>
      <span className="tc-tag__glyph" aria-hidden="true">
        {TAG_GLYPH[variant]}
      </span>
      <span className="tc-tag__label">{children}</span>
    </span>
  );
}
