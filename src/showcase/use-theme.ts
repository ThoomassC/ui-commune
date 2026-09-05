import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * Le seul état de tout le dépôt, et il vit dans la VITRINE — pas dans
 * `src/components`. La librairie reste sans hook pour rester utilisable telle
 * quelle en Server Component ; c'est le document qui se paie une bascule.
 */
export type ThemeChoice = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'tc-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function isThemeChoice(value: string | null): value is ThemeChoice {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Lecture initiale. `system` par défaut : ne rien imposer tant que
 * l'utilisateur n'a pas choisi, c'est laisser `prefers-color-scheme` faire son
 * travail sans une ligne de JavaScript.
 */
function readStoredChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isThemeChoice(stored) ? stored : 'system';
  } catch {
    // Stockage refusé (navigation privée, cookies bloqués) : on n'insiste pas.
    return 'system';
  }
}

function subscribeSystemTheme(onStoreChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onStoreChange);
  return () => query.removeEventListener('change', onStoreChange);
}

function readSystemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

/** Rendu serveur : pas de `matchMedia`, on part du clair. */
function readSystemPrefersDarkOnServer(): boolean {
  return false;
}

export interface ThemeControl {
  /** Ce que l'utilisateur a demandé. */
  readonly choice: ThemeChoice;
  /** Ce qui est réellement à l'écran, `system` résolu. */
  readonly resolved: ResolvedTheme;
  readonly setChoice: (choice: ThemeChoice) => void;
}

/**
 * Bascule clair / sombre / système.
 *
 * `useSyncExternalStore` plutôt qu'un `useEffect` + `useState` : la préférence
 * système est un magasin extérieur, pas un état dérivé, et l'abonnement se
 * nettoie tout seul. Le seul `useEffect` ici synchronise deux systèmes
 * extérieurs — l'attribut `data-theme` du document et `localStorage` — ce pour
 * quoi il est fait.
 */
export function useTheme(): ThemeControl {
  const [choice, setChoice] = useState<ThemeChoice>(readStoredChoice);

  const prefersDark = useSyncExternalStore(
    subscribeSystemTheme,
    readSystemPrefersDark,
    readSystemPrefersDarkOnServer,
  );

  // Dérivé pendant le rendu, jamais dans un effet.
  const resolved: ResolvedTheme =
    choice === 'system' ? (prefersDark ? 'dark' : 'light') : choice;

  /**
   * Le dernier choix effectivement PERSISTÉ, ou `null` tant que l'effet n'a pas
   * tourné une première fois.
   *
   * Une simple sentinelle « premier passage » ne suffirait pas : en mode strict,
   * React monte, démonte et remonte les effets, si bien que le second passage
   * écrirait la valeur par défaut. En mémorisant la valeur au lieu du rang, le
   * remontage se reconnaît comme un non-changement.
   */
  const persistedChoice = useRef<ThemeChoice | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (choice === 'system') {
      // Retirer l'attribut rend la main à `prefers-color-scheme`.
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', choice);
    }

    // Au montage, on synchronise le DOM mais on n'écrit RIEN : persister
    // « system » avant tout geste de l'utilisateur effacerait la différence
    // entre « n'a jamais choisi » et « a choisi le thème système ». Le premier
    // cas doit rester réversible sans trace.
    if (persistedChoice.current === null) {
      persistedChoice.current = choice;
      return;
    }

    if (persistedChoice.current === choice) return;
    persistedChoice.current = choice;

    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Le thème vivra le temps de la session, et c'est acceptable.
    }
  }, [choice]);

  return { choice, resolved, setChoice };
}
