import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

export interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  ref?: Ref<HTMLSelectElement>;
}

/**
 * Liste déroulante native. Le chevron reste celui du système : le remplacer
 * demanderait une image, et la librairie s'interdit toute ressource — même
 * une `url()` en ligne. Le liseré, la hauteur et le rayon sont ceux d'`Input`.
 */
export function Select({ className, ...rest }: SelectProps) {
  return <select className={cx('tc-select', className)} {...rest} />;
}
