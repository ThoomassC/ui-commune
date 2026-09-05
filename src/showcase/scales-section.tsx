import { Card } from '../components/card';
import { Section, Specimen } from './section';

interface TypeStep {
  readonly token: string;
  readonly size: string;
  readonly usage: string;
}

const TYPE_STEPS: readonly TypeStep[] = [
  { token: '--text-xs', size: '12 px', usage: 'mention légale, unité, note de bas de tableau' },
  { token: '--text-sm', size: '14 px', usage: 'étiquette, aide de champ, méta' },
  { token: '--text-base', size: '16 px', usage: 'texte courant — le pas de référence' },
  { token: '--text-md', size: '19 px', usage: 'chapeau, intertitre de spécimen' },
  { token: '--text-lg', size: '23 px', usage: 'titre de carte' },
  { token: '--text-xl', size: '28 px', usage: 'titre de section' },
  { token: '--text-display-sm', size: '24 → 34 px (fluide)', usage: 'titre de page secondaire' },
  { token: '--text-display-md', size: '30 → 52 px (fluide)', usage: 'titre d’ouverture' },
];

interface FontFamily {
  readonly token: string;
  readonly name: string;
  readonly note: string;
}

const FAMILIES: readonly FontFamily[] = [
  {
    token: '--font-display',
    name: 'Iowan Old Style, Palatino, Georgia',
    note: 'Les titres. Une serif de système, donc zéro requête et zéro décalage au chargement.',
  },
  {
    token: '--font-sans',
    name: 'ui-sans-serif, system-ui, Segoe UI, Roboto',
    note: 'Tout le reste : texte courant, contrôles, étiquettes.',
  },
  {
    token: '--font-mono',
    name: 'ui-monospace, SF Mono, Menlo, Consolas',
    note: 'Les mesures : hexadécimaux, ratios, noms de jetons.',
  },
];

const SPACE_STEPS: readonly { token: string; px: string }[] = [
  { token: '--space-1', px: '4 px' },
  { token: '--space-2', px: '8 px' },
  { token: '--space-3', px: '12 px' },
  { token: '--space-4', px: '16 px' },
  { token: '--space-5', px: '24 px' },
  { token: '--space-6', px: '32 px' },
  { token: '--space-7', px: '48 px' },
  { token: '--space-8', px: '64 px' },
];

const RADII: readonly { token: string; px: string; usage: string }[] = [
  { token: '--radius-sm', px: '10 px', usage: 'champ, étiquette, message' },
  { token: '--radius-md', px: '16 px', usage: 'carte, panneau' },
  { token: '--radius-lg', px: '24 px', usage: 'plaque, grande surface' },
  { token: '--radius-pill', px: '999 px', usage: 'bouton, pastille' },
];

const ELEVATIONS: readonly { level: 0 | 1 | 2 | 3; token: string; usage: string }[] = [
  { level: 0, token: '--elevation-0', usage: 'au sol — la carte ne se détache que par son liseré' },
  { level: 1, token: '--elevation-1', usage: 'posé — liste de cartes, vignette' },
  { level: 2, token: '--elevation-2', usage: 'soulevé — panneau flottant, menu' },
  { level: 3, token: '--elevation-3', usage: 'détaché — modale, calque' },
];

export function TypographySection() {
  return (
    <Section
      id="typographie"
      index="03"
      title="Typographie"
      lede={
        <>
          Huit pas, rapports 1,15 en bas d’échelle et 1,20 en haut : l’échelle n’est pas
          géométrique, et c’est voulu — les petits pas doivent rester distinguables sans
          que les grands deviennent grotesques. Trois familles, toutes systèmes : la
          librairie ne fait aucune requête hors origine.
        </>
      }
    >
      <Specimen
        title="Les huit pas"
        note="Le texte courant est borné à --measure (66 caractères), quelle que soit la largeur de la fenêtre."
      >
        <ul className="tc-doc-scale">
          {TYPE_STEPS.map((step) => (
            <li className="tc-doc-scale__row" key={step.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{step.token}</code>
                <span className="tc-doc-scale__value">{step.size}</span>
                <span className="tc-doc-scale__usage">{step.usage}</span>
              </div>
              <p className="tc-doc-scale__sample" style={{ fontSize: `var(${step.token})` }}>
                Teal &amp; cuivre
              </p>
            </li>
          ))}
        </ul>
      </Specimen>

      <Specimen title="Les trois familles">
        <ul className="tc-doc-scale">
          {FAMILIES.map((family) => (
            <li className="tc-doc-scale__row" key={family.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{family.token}</code>
                <span className="tc-doc-scale__usage">{family.note}</span>
              </div>
              <p
                className="tc-doc-scale__sample tc-doc-scale__sample--family"
                style={{ fontFamily: `var(${family.token})` }}
              >
                Portfolio &amp; travels — 0123456789
                <span className="tc-doc-scale__stack">{family.name}</span>
              </p>
            </li>
          ))}
        </ul>
      </Specimen>
    </Section>
  );
}

export function SpacingSection() {
  return (
    <Section
      id="espacement"
      index="04"
      title="Espacement et rayons"
      lede={
        <>
          Une grille de 4 px, huit pas, et aucune valeur hors liste. Deux exceptions
          assumées, hors échelle parce qu’elles répondent au doigt et non à l’œil :
          <code className="tc-doc-inlinecode">--target-min</code> (44 px) et
          <code className="tc-doc-inlinecode">--target-button</code> (48 px).
        </>
      }
    >
      <Specimen title="Les huit pas d’espacement">
        <ul className="tc-doc-scale">
          {SPACE_STEPS.map((step) => (
            <li className="tc-doc-scale__row tc-doc-scale__row--bar" key={step.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{step.token}</code>
                <span className="tc-doc-scale__value">{step.px}</span>
              </div>
              <span
                className="tc-doc-bar"
                style={{ inlineSize: `var(${step.token})` }}
                aria-hidden="true"
              />
            </li>
          ))}
        </ul>
      </Specimen>

      <Specimen title="Les quatre rayons" inline>
        {RADII.map((radius) => (
          <figure className="tc-doc-radius" key={radius.token}>
            <div
              className="tc-doc-radius__box"
              style={{ borderRadius: `var(${radius.token})` }}
              aria-hidden="true"
            />
            <figcaption className="tc-doc-radius__caption">
              <code className="tc-doc-scale__token">{radius.token}</code>
              <span className="tc-doc-scale__value">{radius.px}</span>
              <span className="tc-doc-scale__usage">{radius.usage}</span>
            </figcaption>
          </figure>
        ))}
      </Specimen>
    </Section>
  );
}

export function ElevationSection() {
  return (
    <Section
      id="elevation"
      index="05"
      title="Élévation"
      lede={
        <>
          Quatre crans, et une inversion de polarité qu’il faut connaître : <strong>en
          clair, c’est l’ombre qui sépare</strong> la carte du sol (ΔE 20,6 ; un liseré
          blanc y plafonne à ΔE 4,0), <strong>en sombre, c’est le liseré</strong> — une
          ombre composée y mesure ΔE 2,2, sous le seuil de perceptibilité. Une échelle
          d’ombres seule ne suffit jamais : les deux sont toujours posés ensemble.
        </>
      }
    >
      <Specimen title="Les quatre crans" note="Basculez le thème pour voir la polarité s’inverser.">
        <div className="tc-doc-grid tc-doc-grid--elev">
          {ELEVATIONS.map((elevation) => (
            <Card elevation={elevation.level} key={elevation.token}>
              <h4 className="tc-doc-cardtitle">Cran {elevation.level}</h4>
              <p className="tc-doc-cardmeta">
                <code className="tc-doc-scale__token">{elevation.token}</code>
              </p>
              <p className="tc-doc-cardtext">{elevation.usage}</p>
            </Card>
          ))}
        </div>
      </Specimen>
    </Section>
  );
}
