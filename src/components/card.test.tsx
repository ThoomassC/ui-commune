import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './card';
import type { CardElevation } from './card';

describe('Card', () => {
  it('devrait rendre son contenu', () => {
    render(
      <Card>
        <h2>Titre</h2>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: 'Titre' })).toBeInTheDocument();
  });

  it("ne devrait imposer aucun rôle : la sémantique appartient à l'appelant", () => {
    render(
      <Card>
        <article>Contenu</article>
      </Card>,
    );

    // Une carte purement présentationnelle ne doit pas apparaître comme
    // région ou article dans l'arbre d'accessibilité — seul l'enfant compte.
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  // L'élévation est purement visuelle : la classe est ici tout le contrat.
  describe('élévation', () => {
    it.each<[CardElevation, string]>([
      [0, 'tc-card--elev-0'],
      [1, 'tc-card--elev-1'],
      [2, 'tc-card--elev-2'],
      [3, 'tc-card--elev-3'],
    ])('devrait porter la classe du cran %i', (elevation, expected) => {
      const { container } = render(<Card elevation={elevation}>Contenu</Card>);
      const root = container.firstElementChild;

      expect(root).toHaveClass('tc-card');
      expect(root).toHaveClass(expected);
    });

    it('devrait retomber sur le cran 0 sans élévation fournie', () => {
      const { container } = render(<Card>Contenu</Card>);

      expect(container.firstElementChild).toHaveClass('tc-card--elev-0');
    });

    it('devrait ne poser qu’un seul cran à la fois', () => {
      const { container } = render(<Card elevation={2}>Contenu</Card>);
      const root = container.firstElementChild;

      expect(root).toHaveClass('tc-card--elev-2');
      expect(root).not.toHaveClass('tc-card--elev-0');
    });
  });
});
