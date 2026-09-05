import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from './use-theme';

const STORAGE_KEY = 'tc-theme';

/**
 * Le setup global fournit un `matchMedia` figé sur `matches: false`. Pour
 * piloter la préférence système on le remplace ici — le setup ne nous
 * appartient pas.
 */
function stubSystemDarkPreference(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();

  const query = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  };

  vi.spyOn(window, 'matchMedia').mockReturnValue(
    query as unknown as MediaQueryList,
  );

  return {
    set(next: boolean) {
      matches = next;
      act(() => {
        listeners.forEach((listener) => listener());
      });
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTheme', () => {
  describe('valeur initiale', () => {
    it('devrait partir de system quand le stockage est vide', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.choice).toBe('system');
    });

    it.each(['light', 'dark'] as const)(
      'devrait restaurer le choix %s trouvé dans le stockage',
      (stored) => {
        window.localStorage.setItem(STORAGE_KEY, stored);

        const { result } = renderHook(() => useTheme());

        expect(result.current.choice).toBe(stored);
      },
    );

    it('devrait restaurer system trouvé dans le stockage', () => {
      window.localStorage.setItem(STORAGE_KEY, 'system');

      const { result } = renderHook(() => useTheme());

      expect(result.current.choice).toBe('system');
    });

    it('devrait retomber sur system quand la valeur stockée est inconnue', () => {
      window.localStorage.setItem(STORAGE_KEY, 'purple');

      const { result } = renderHook(() => useTheme());

      expect(result.current.choice).toBe('system');
    });

    it('devrait retomber sur system quand la lecture du stockage échoue', () => {
      vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        throw new Error('storage blocked');
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.choice).toBe('system');
    });
  });

  describe('écriture dans le stockage', () => {
    it('ne devrait rien écrire au montage, avant tout choix de l’utilisateur', () => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

      renderHook(() => useTheme());

      // Le test disait l'inverse et documentait le défaut : l'effet de
      // synchronisation persistait la valeur par défaut dès le montage, et le
      // stockage ne distinguait plus « n'a jamais choisi » de « a choisi
      // system ». L'effet ne persiste désormais qu'un changement effectif.
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('ne devrait pas réécrire un choix restauré tel quel', () => {
      window.localStorage.setItem(STORAGE_KEY, 'dark');
      const setItem = vi.spyOn(window.localStorage, 'setItem');

      renderHook(() => useTheme());

      expect(setItem).not.toHaveBeenCalled();
    });

    it('devrait écrire le nouveau choix au changement', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setChoice('dark');
      });

      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark');
    });

    it('devrait réécrire system quand l’utilisateur revient au système', () => {
      window.localStorage.setItem(STORAGE_KEY, 'dark');
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setChoice('system');
      });

      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('system');
    });

    it('devrait rester fonctionnel quand l’écriture est refusée', () => {
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('storage blocked');
      });
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setChoice('dark');
      });

      expect(result.current.choice).toBe('dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
  });

  describe('attribut data-theme sur documentElement', () => {
    it.each(['light', 'dark'] as const)(
      'devrait poser data-theme=%s quand ce thème est choisi',
      (choice) => {
        const { result } = renderHook(() => useTheme());

        act(() => {
          result.current.setChoice(choice);
        });

        expect(document.documentElement).toHaveAttribute('data-theme', choice);
      },
    );

    it('devrait retirer data-theme quand on revient au système', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setChoice('dark');
      });
      act(() => {
        result.current.setChoice('system');
      });

      expect(document.documentElement).not.toHaveAttribute('data-theme');
    });

    it('ne devrait poser aucun data-theme au montage en mode système', () => {
      renderHook(() => useTheme());

      expect(document.documentElement).not.toHaveAttribute('data-theme');
    });

    it('devrait poser data-theme dès le montage quand un choix est restauré', () => {
      window.localStorage.setItem(STORAGE_KEY, 'dark');

      renderHook(() => useTheme());

      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
  });

  describe('mode système', () => {
    it('devrait résoudre en light quand le système ne préfère pas le sombre', () => {
      stubSystemDarkPreference(false);

      const { result } = renderHook(() => useTheme());

      expect(result.current.choice).toBe('system');
      expect(result.current.resolved).toBe('light');
    });

    it('devrait résoudre en dark quand le système préfère le sombre', () => {
      stubSystemDarkPreference(true);

      const { result } = renderHook(() => useTheme());

      expect(result.current.resolved).toBe('dark');
    });

    it('devrait suivre un changement de préférence système sans intervention', () => {
      const system = stubSystemDarkPreference(false);
      const { result } = renderHook(() => useTheme());

      expect(result.current.resolved).toBe('light');

      system.set(true);

      expect(result.current.resolved).toBe('dark');
      expect(document.documentElement).not.toHaveAttribute('data-theme');
    });

    it('ne devrait pas suivre le système quand un thème explicite est choisi', () => {
      const system = stubSystemDarkPreference(false);
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setChoice('light');
      });
      system.set(true);

      expect(result.current.resolved).toBe('light');
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    it('devrait se désabonner du média au démontage', () => {
      const system = stubSystemDarkPreference(false);
      const { unmount } = renderHook(() => useTheme());

      expect(system.listenerCount).toBe(1);

      unmount();

      expect(system.listenerCount).toBe(0);
    });
  });

  describe('résolution du choix explicite', () => {
    it.each([
      ['light', 'light'],
      ['dark', 'dark'],
    ] as const)(
      'devrait résoudre le choix %s en %s quel que soit le système',
      (choice, expected) => {
        stubSystemDarkPreference(true);
        const { result } = renderHook(() => useTheme());

        act(() => {
          result.current.setChoice(choice);
        });

        expect(result.current.resolved).toBe(expected);
      },
    );
  });
});
