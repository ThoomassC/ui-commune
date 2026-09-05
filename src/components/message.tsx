import type { ComponentPropsWithoutRef, Ref } from 'react';
import { cx } from './cx.js';

export type MessageTone = 'ok' | 'warn' | 'error';

/**
 * Politesse de la région dynamique.
 * - `off` (défaut) : message statique, présent au chargement. Aucun rôle.
 * - `polite` → `role="status"` : annoncé quand le lecteur d'écran a fini sa
 *   phrase. Le bon choix pour une confirmation.
 * - `assertive` → `role="alert"` : interrompt. À réserver à ce qui bloque
 *   l'utilisateur.
 */
export type MessageLive = 'off' | 'polite' | 'assertive';

const MESSAGE_GLYPH: Record<MessageTone, string> = {
  ok: '✓',
  warn: '▲',
  error: '✕',
};

/**
 * Le ton, en toutes lettres, pour les technologies d'assistance.
 *
 * Le glyphe est `aria-hidden` et la classe est purement visuelle : sans ce
 * préfixe, rien ne distinguait un succès d'une erreur à l'oreille — pas même
 * `role="status"`, qui transporte l'urgence et non la nature. Le préfixe est
 * masqué à l'œil par `.tc-visually-hidden`, qui doublonnerait le glyphe.
 */
const MESSAGE_TONE_LABEL: Record<MessageTone, string> = {
  ok: 'Succès :',
  warn: 'Attention :',
  error: 'Erreur :',
};

const MESSAGE_ROLE: Record<MessageLive, 'status' | 'alert' | undefined> = {
  off: undefined,
  polite: 'status',
  assertive: 'alert',
};

export interface MessageProps extends ComponentPropsWithoutRef<'div'> {
  tone: MessageTone;
  /** @default 'off' */
  live?: MessageLive;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Bandeau d'état : glyphe + texte, jamais la couleur seule.
 *
 * Le ton est doublé par un préfixe masqué visuellement (« Erreur : »,
 * « Attention : », « Succès : ») : il fait partie du nom accessible du bandeau
 * et de toute description qui le référence par `aria-describedby`.
 *
 * Le conteneur d'une région dynamique doit exister dans le DOM **avant** que
 * son contenu change ; montez `Message` vide ou rendez-le en permanence si
 * vous comptez sur `live`.
 */
export function Message({
  tone,
  live = 'off',
  className,
  children,
  ...rest
}: MessageProps) {
  return (
    <div
      role={MESSAGE_ROLE[live]}
      className={cx('tc-message', `tc-message--${tone}`, className)}
      {...rest}
    >
      <span className="tc-message__glyph" aria-hidden="true">
        {MESSAGE_GLYPH[tone]}
      </span>
      <span className="tc-visually-hidden">{MESSAGE_TONE_LABEL[tone]} </span>
      <div className="tc-message__body">{children}</div>
    </div>
  );
}
