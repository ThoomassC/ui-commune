import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('devrait exposer une zone de texte portant son libellé', () => {
    render(
      <>
        <label htmlFor="bio">Biographie</label>
        <Textarea id="bio" />
      </>,
    );

    expect(
      screen.getByRole('textbox', { name: 'Biographie' }),
    ).toBeInTheDocument();
  });

  it('devrait afficher quatre lignes par défaut', () => {
    render(<Textarea aria-label="Biographie" />);

    expect(screen.getByRole('textbox', { name: 'Biographie' })).toHaveAttribute(
      'rows',
      '4',
    );
  });

  it('devrait accepter une hauteur fournie par l’appelant', () => {
    render(<Textarea aria-label="Biographie" rows={10} />);

    expect(screen.getByRole('textbox', { name: 'Biographie' })).toHaveAttribute(
      'rows',
      '10',
    );
  });

  it('devrait recevoir la saisie de l’utilisateur', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Biographie" />);

    const textarea = screen.getByRole('textbox', { name: 'Biographie' });
    await user.type(textarea, 'Bonjour');

    expect(textarea).toHaveValue('Bonjour');
  });

  it('ne devrait pas recevoir de saisie quand il est désactivé', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Biographie" disabled />);

    const textarea = screen.getByRole('textbox', { name: 'Biographie' });
    await user.type(textarea, 'Bonjour');

    expect(textarea).toBeDisabled();
    expect(textarea).toHaveValue('');
  });
});
