import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { cx } from './cx.js';

export interface CheckboxProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'type'> {
  /** Libellé cliquable. La case est imbriquée dans son `<label>`. */
  label: ReactNode;
  /**
   * `className` est fusionné sur la **ligne** (le `<label>` racine), pas sur
   * la case : c'est la ligne qui se place dans une grille ou une liste.
   */
  className?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Case à cocher. Le contrôle est imbriqué dans son libellé : pas d'`id` à
 * fournir, pas de `useId` à appeler, et toute la ligne — d'au moins
 * `--target-min` (44 px) — est cliquable.
 *
 * La coche utilise `accent-color: var(--accent)` : le rendu natif du système
 * reste, teinté au teal de la marque.
 */
export function Checkbox({ label, className, ref, ...rest }: CheckboxProps) {
  return (
    <label className={cx('tc-checkbox', className)}>
      <input ref={ref} type="checkbox" className="tc-checkbox__input" {...rest} />
      <span className="tc-checkbox__label">{label}</span>
    </label>
  );
}
