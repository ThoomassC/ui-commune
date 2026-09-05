import type { ComponentPropsWithoutRef, MouseEvent, Ref } from 'react';
import { cx } from './cx.js';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  /**
   * `primary` : l'aplat teal. **Un seul par vue.**
   * `secondary` : liseré teal, fond transparent.
   * `danger` : liseré rouge, fond transparent — l'aplat plein reste le
   * monopole du teal, une action destructrice ne se peint pas.
   */
  variant?: ButtonVariant;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Bouton de la librairie. Sans état React, sans hook : rendu tel quel comme
 * Server Component. Survol, appui, focus et désactivation sont entièrement
 * portés par la feuille de style (`:hover`, `:active`, `:focus-visible`,
 * `:disabled`, `[aria-disabled]`, `[aria-busy]`).
 *
 * Hauteur minimale `--target-button` (48 px), bordure en pilule.
 *
 * ### `disabled` ou `aria-disabled` ?
 * `disabled` retire le bouton de l'ordre de tabulation : l'utilisateur au
 * clavier ne le trouve plus et ne peut pas lire pourquoi il est inerte.
 * Dans une **modale**, un **formulaire en cours d'envoi** ou toute vue où le
 * bouton est la sortie attendue, préférez `aria-disabled="true"` : le bouton
 * reste focusable et annoncé « indisponible ». Les deux reçoivent le même
 * rendu. C'est une recommandation, pas une contrainte : `disabled` reste
 * correct sur un bouton secondaire d'une page tranquille.
 *
 * **`aria-disabled` neutralise l'activation, et c'est le composant qui s'en
 * charge.** Le clic à la souris comme la validation au clavier passent par le
 * même événement `click` ; il est intercepté, `preventDefault()` est appelé —
 * ce qui annule aussi la soumission d'un `type="submit"` — et `onClick` n'est
 * pas invoqué. Sans cette interception, poser `aria-disabled` sur un bouton
 * d'envoi donnait un bouton d'apparence inerte qui soumettait quand même :
 * double soumission garantie. Le comportement sûr est celui par défaut.
 *
 * `aria-busy="true"` marque l'attente ; ajoutez un texte de substitution
 * (« Envoi… ») plutôt que de vider le libellé. Il ne neutralise rien : si vous
 * voulez qu'un bouton en attente refuse le second clic, posez aussi
 * `aria-disabled`.
 *
 * @example
 * <Button variant="secondary" onClick={close}>Annuler</Button>
 * @example
 * <Button aria-disabled={isSending} aria-busy={isSending} onClick={send}>
 *   {isSending ? 'Envoi…' : 'Envoyer'}
 * </Button>
 */
export function Button({
  variant = 'primary',
  className,
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  // `aria-disabled` accepte le booléen comme la chaîne : les deux comptent.
  const ariaDisabled = rest['aria-disabled'];
  const inert = ariaDisabled === true || ariaDisabled === 'true';

  // Une fonction recréée à chaque rendu, sans `useCallback` : le composant doit
  // rester utilisable en Server Component, donc sans le moindre hook.
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (inert) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      type={type}
      className={cx('tc-btn', `tc-btn--${variant}`, className)}
      onClick={handleClick}
      {...rest}
    />
  );
}
