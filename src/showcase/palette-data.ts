/**
 * Les mesures de la palette, en dur.
 *
 * Ces hexadécimaux sont **littéraux et le resteront** : les deux plaques
 * documentent le thème clair ET le thème sombre en même temps, quel que soit
 * le thème que le lecteur a choisi pour la page. Une plaque qui suivrait
 * `var(--accent)` ne montrerait jamais qu'une moitié de la palette — et
 * mentirait sur l'autre.
 *
 * Les ratios sont ceux recalculés par `src/contract/` sur la feuille de
 * jetons ; s'ils divergent, c'est la feuille qui a raison et cette page qui
 * est à corriger.
 */

export interface Swatch {
  /** Nom du jeton, sans `var()`. */
  readonly token: string;
  readonly hex: string;
  /** Ratio de contraste mesuré, notation française. */
  readonly ratio: string;
  /** Support contre lequel le ratio est mesuré. */
  readonly against: string;
}

export interface PlateGroup {
  readonly title: string;
  readonly note: string;
  readonly swatches: readonly Swatch[];
}

export interface Plate {
  readonly id: string;
  readonly title: string;
  readonly groundLabel: string;
  /** Fond littéral de la plaque. */
  readonly ground: string;
  /** Encre littérale de la plaque. */
  readonly ink: string;
  /** Encre atténuée, pour les notes. */
  readonly inkMuted: string;
  /** Filet littéral. */
  readonly rule: string;
  readonly groups: readonly PlateGroup[];
}

const NEUTRALS_NOTE =
  'Les neutres sont le teal vidé de sa chroma : la même teinte, la saturation retirée. Rien ne jure avec l’accent parce que rien n’en est étranger.';

const TEAL_NOTE =
  'Le teal est l’encre des actions : bouton, lien, focus, état. S’il apparaît, quelque chose est actionnable ou vient de changer.';

const COPPER_NOTE =
  'Le cuivre est le décor et l’éditorial — filet, lettrine, chiffre de section. Il ne porte jamais un contrôle : une couleur chaude sur un bouton rompt le contrat.';

const TRACE_NOTE =
  'Le double anneau inverse ses deux tons entre les thèmes : l’un des deux contraste toujours avec le fond local, quel qu’il soit.';

export const LIGHT_PLATE: Plate = {
  id: 'plate-light',
  title: 'Thème clair',
  groundLabel: 'sol #deedf0',
  ground: '#deedf0',
  ink: '#193940',
  inkMuted: '#3e5359',
  rule: 'rgba(25, 57, 64, 0.22)',
  groups: [
    {
      title: 'Neutres — les encres',
      note: NEUTRALS_NOTE,
      swatches: [
        { token: '--text-strong', hex: '#193940', ratio: '10,28:1', against: 'sur le sol' },
        { token: '--text-body', hex: '#2b464c', ratio: '8,39:1', against: 'sur le sol' },
        { token: '--text-muted', hex: '#3e5359', ratio: '6,76:1', against: 'sur le sol' },
      ],
    },
    {
      title: 'Primaire — le teal',
      note: TEAL_NOTE,
      swatches: [
        { token: '--text-accent', hex: '#0e5968', ratio: '6,60:1', against: 'sur le sol' },
        { token: '--accent', hex: '#087487', ratio: '5,44:1', against: 'blanc sur l’aplat' },
        { token: '--accent-hover', hex: '#00687b', ratio: '6,43:1', against: 'blanc sur l’aplat' },
        { token: '--accent-active', hex: '#005d6f', ratio: '7,51:1', against: 'blanc sur l’aplat' },
      ],
    },
    {
      title: 'Secondaire — le cuivre',
      note: COPPER_NOTE,
      swatches: [
        { token: '--accent-secondary', hex: '#723e32', ratio: '7,13:1', against: 'sur le sol' },
      ],
    },
    {
      title: 'Traits et focus',
      note: TRACE_NOTE,
      swatches: [
        { token: '--control-border', hex: '#59696d', ratio: '4,77:1', against: 'sur le sol' },
        { token: '--focus-outer', hex: '#000000', ratio: '17,48:1', against: 'sur le sol' },
        { token: '--focus-inner', hex: '#f6ffde', ratio: '5,26:1', against: 'sur l’aplat accent' },
      ],
    },
  ],
};

export const DARK_PLATE: Plate = {
  id: 'plate-dark',
  title: 'Thème sombre',
  groundLabel: 'sol #0f191c',
  ground: '#0f191c',
  ink: '#b6dae3',
  inkMuted: '#9eb7bd',
  rule: 'rgba(182, 218, 227, 0.22)',
  groups: [
    {
      title: 'Neutres — les encres',
      note: NEUTRALS_NOTE,
      swatches: [
        { token: '--text-strong', hex: '#b6dae3', ratio: '12,01:1', against: 'sur le sol' },
        { token: '--text-body', hex: '#aac8d0', ratio: '10,10:1', against: 'sur le sol' },
        { token: '--text-muted', hex: '#9eb7bd', ratio: '8,47:1', against: 'sur le sol' },
      ],
    },
    {
      title: 'Primaire — le teal',
      note: TEAL_NOTE,
      swatches: [
        { token: '--text-accent', hex: '#78bbca', ratio: '8,30:1', against: 'sur le sol' },
        { token: '--accent', hex: '#087487', ratio: '5,44:1', against: 'blanc sur l’aplat' },
        { token: '--accent-hover', hex: '#208093', ratio: '4,59:1', against: 'blanc sur l’aplat' },
        { token: '--accent-active', hex: '#00677a', ratio: '6,52:1', against: 'blanc sur l’aplat' },
      ],
    },
    {
      title: 'Secondaire — le cuivre',
      note: COPPER_NOTE,
      swatches: [
        { token: '--accent-secondary', hex: '#bf8576', ratio: '5,81:1', against: 'sur le sol' },
      ],
    },
    {
      title: 'Traits et focus',
      note: TRACE_NOTE,
      swatches: [
        { token: '--control-border', hex: '#8d9ea2', ratio: '6,42:1', against: 'sur le sol' },
        { token: '--focus-outer', hex: '#f6ffde', ratio: '17,24:1', against: 'sur le sol' },
        { token: '--focus-inner', hex: '#000000', ratio: '3,86:1', against: 'sur l’aplat accent' },
      ],
    },
  ],
};

export const PLATES: readonly Plate[] = [LIGHT_PLATE, DARK_PLATE];

export interface SemanticRow {
  readonly theme: 'Clair' | 'Sombre';
  readonly token: string;
  readonly hex: string;
  /** Ratio contre `--site-background`. */
  readonly onGround: string;
  /** Ratio contre `--surface`. */
  readonly onCard: string;
  /** Fond littéral de la vignette, pour que le carré se lise. */
  readonly plateGround: string;
  readonly plateInk: string;
  readonly role: string;
  readonly glyph: string;
}

export const SEMANTIC_ROWS: readonly SemanticRow[] = [
  {
    theme: 'Clair',
    token: '--danger',
    hex: '#66151a',
    onGround: '10,36:1',
    onCard: '11,15:1',
    plateGround: '#deedf0',
    plateInk: '#193940',
    role: 'Échec, perte, action irréversible',
    glyph: '✕',
  },
  {
    theme: 'Clair',
    token: '--success',
    hex: '#0d4f2c',
    onGround: '8,05:1',
    onCard: '8,66:1',
    plateGround: '#deedf0',
    plateInk: '#193940',
    role: 'Confirmation, mesure validée',
    glyph: '✓',
  },
  {
    // Assombri de #845d22 à #7b5620 : l'ancienne valeur échouait AA à 4,20:1
    // sur son PROPRE lavis (--warning-quiet) posé sur --panel-surface, un
    // substrat que le contrat ne mesurait pas. Pire cas désormais : 4,66:1.
    theme: 'Clair',
    token: '--warning',
    hex: '#7b5620',
    onGround: '5,47:1',
    onCard: '5,89:1',
    plateGround: '#deedf0',
    plateInk: '#193940',
    role: 'Réserve, valeur à vérifier',
    glyph: '▲',
  },
  {
    theme: 'Sombre',
    token: '--danger',
    hex: '#f2a3a3',
    onGround: '8,96:1',
    onCard: '9,28:1',
    plateGround: '#0f191c',
    plateInk: '#b6dae3',
    role: 'Échec, perte, action irréversible',
    glyph: '✕',
  },
  {
    theme: 'Sombre',
    token: '--success',
    hex: '#88d6a4',
    onGround: '10,37:1',
    onCard: '10,74:1',
    plateGround: '#0f191c',
    plateInk: '#b6dae3',
    role: 'Confirmation, mesure validée',
    glyph: '✓',
  },
  {
    theme: 'Sombre',
    token: '--warning',
    hex: '#e0c489',
    onGround: '10,57:1',
    onCard: '10,94:1',
    plateGround: '#0f191c',
    plateInk: '#b6dae3',
    role: 'Réserve, valeur à vérifier',
    glyph: '▲',
  },
];
