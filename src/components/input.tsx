import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

export interface InputProps extends ComponentPropsWithoutRef<'input'> {
  ref?: Ref<HTMLInputElement>;
}

/**
 * Champ de saisie sur une ligne. Même liseré, même hauteur
 * (`--target-min`, 44 px) et même rayon (`--radius-sm`) que `Select` et
 * `Textarea`.
 *
 * L'état d'erreur se déclare par `aria-invalid` — posé automatiquement quand
 * le champ est monté dans un `Field` porteur d'un `error`.
 */
export function Input({ className, type = 'text', ...rest }: InputProps) {
  return <input type={type} className={cx('tc-input', className)} {...rest} />;
}
