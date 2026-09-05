import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tag } from './tag';
import type { TagVariant } from './tag';

describe('Tag', () => {
  it('devrait afficher son libellé', () => {
    render(<Tag variant="measured">Contraste 7,1</Tag>);

    expect(screen.getByText('Contraste 7,1')).toBeInTheDocument();
  });

  it("ne devrait pas s'annoncer comme une région dynamique", () => {
    render(<Tag variant="open">À vérifier</Tag>);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each<[TagVariant, string]>([
    ['measured', '◆'],
    ['proposed', '◇'],
    ['open', '○'],
  ])('devrait afficher le glyphe de la variante %s sans l’annoncer', (variant, glyph) => {
    render(<Tag variant={variant}>Statut</Tag>);

    const marker = screen.getByText(glyph);

    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute('aria-hidden', 'true');
  });

  it("devrait ne laisser entendre que le libellé, jamais le glyphe", () => {
    render(
      <>
        <Tag variant="measured" id="tag">
          Mesuré
        </Tag>
        <input aria-label="Jeton" aria-describedby="tag" />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Jeton' })).toHaveAccessibleDescription(
      'Mesuré',
    );
  });

  // La variante ne s'entend pas : elle se voit à la forme de la bordure, donc
  // la classe est ici le contrat observable.
  it.each<[TagVariant, string]>([
    ['measured', 'tc-tag--measured'],
    ['proposed', 'tc-tag--proposed'],
    ['open', 'tc-tag--open'],
  ])('devrait porter la classe de la variante %s', (variant, expected) => {
    const { container } = render(<Tag variant={variant}>Statut</Tag>);
    const root = container.firstElementChild;

    expect(root).toHaveClass('tc-tag');
    expect(root).toHaveClass(expected);
  });
});
