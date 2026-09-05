import type { ThemeChoice } from './use-theme';
import { useTheme } from './use-theme';

interface ThemeOption {
  readonly value: ThemeChoice;
  readonly label: string;
  readonly glyph: string;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'light', label: 'Clair', glyph: '☀' },
  { value: 'dark', label: 'Sombre', glyph: '☾' },
  { value: 'system', label: 'Système', glyph: '◐' },
];

/**
 * Bascule de thème. **Le seul composant à état de tout le dépôt**, et il vit
 * dans la vitrine : `src/components` reste sans hook.
 *
 * Trois radios natives plutôt que trois boutons : le groupe est annoncé comme
 * tel, les flèches du clavier fonctionnent sans une ligne de JavaScript, et
 * l'option retenue est lisible par un lecteur d'écran sans `aria-pressed`.
 */
export function ThemeToggle() {
  const { choice, resolved, setChoice } = useTheme();

  return (
    <div className="tc-doc-themetoggle">
      <fieldset className="tc-doc-themetoggle__set">
        <legend className="tc-doc-themetoggle__legend">Thème du document</legend>
        <div className="tc-doc-themetoggle__options">
          {THEME_OPTIONS.map((option) => (
            <label key={option.value} className="tc-doc-themetoggle__option">
              <input
                className="tc-doc-themetoggle__input"
                type="radio"
                name="tc-doc-theme"
                value={option.value}
                checked={choice === option.value}
                onChange={() => setChoice(option.value)}
              />
              <span className="tc-doc-themetoggle__face">
                <span className="tc-doc-themetoggle__glyph" aria-hidden="true">
                  {option.glyph}
                </span>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="tc-doc-themetoggle__state">
        Rendu actif :{' '}
        <strong>{resolved === 'dark' ? 'sombre' : 'clair'}</strong>
        {choice === 'system'
          ? ' — suit la préférence du système.'
          : ' — choix explicite, retenu pour la prochaine visite.'}
      </p>
    </div>
  );
}
