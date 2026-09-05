import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Pill } from './pill';
import type { PillTone } from './pill';

describe('Pill', () => {
  it('devrait afficher son libellé', () => {
    render(<Pill tone="success">Publié</Pill>);

    expect(screen.getByText('Publié')).toBeInTheDocument();
  });

  it("ne devrait pas s'annoncer comme une région dynamique", () => {
    render(<Pill tone="danger">Bloqué</Pill>);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each<[PillTone, string]>([
    ['success', '✓'],
    ['warning', '▲'],
    ['danger', '✕'],
  ])('devrait afficher le glyphe de la tonalité %s sans l’annoncer', (tone, glyph) => {
    render(<Pill tone={tone}>Statut</Pill>);

    const marker = screen.getByText(glyph);

    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute('aria-hidden', 'true');
  });

  it("devrait ne laisser entendre que le libellé, jamais le glyphe", () => {
    render(
      <>
        <Pill tone="success" id="pill">
          Publié
        </Pill>
        <input aria-label="Titre" aria-describedby="pill" />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Titre' })).toHaveAccessibleDescription(
      'Publié',
    );
  });

  // La tonalité n'a pas d'écho accessible ; la classe est son seul contrat.
  it.each<[PillTone, string]>([
    ['success', 'tc-pill--success'],
    ['warning', 'tc-pill--warning'],
    ['danger', 'tc-pill--danger'],
  ])('devrait porter la classe de la tonalité %s', (tone, expected) => {
    const { container } = render(<Pill tone={tone}>Statut</Pill>);
    const root = container.firstElementChild;

    expect(root).toHaveClass('tc-pill');
    expect(root).toHaveClass(expected);
  });
});
