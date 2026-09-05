import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

export interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  ref?: Ref<HTMLTextAreaElement>;
}

/**
 * Zone de saisie multiligne. Redimensionnable **en hauteur seulement**
 * (`resize: vertical`) : un élargissement libre ferait déborder la grille et
 * casserait la largeur de ligne bornée du formulaire.
 */
export function Textarea({ className, rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea rows={rows} className={cx('tc-textarea', className)} {...rest} />
  );
}
