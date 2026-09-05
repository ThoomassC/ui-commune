import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('devrait exposer une zone de texte portant son libellé', () => {
    render(
      <>
        <label htmlFor="name">Nom</label>
        <Input id="name" />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Nom' })).toBeInTheDocument();
  });

  it('devrait valoir type=text par défaut', () => {
    render(<Input aria-label="Nom" />);

    expect(screen.getByRole('textbox', { name: 'Nom' })).toHaveAttribute(
      'type',
      'text',
    );
  });

  it('devrait accepter un type fourni par l’appelant', () => {
    render(<Input aria-label="Adresse e-mail" type="email" />);

    expect(
      screen.getByRole('textbox', { name: 'Adresse e-mail' }),
    ).toHaveAttribute('type', 'email');
  });

  it('devrait recevoir la saisie de l’utilisateur', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Nom" />);

    const input = screen.getByRole('textbox', { name: 'Nom' });
    await user.type(input, 'Thomas');

    expect(input).toHaveValue('Thomas');
  });

  it('devrait s’annoncer invalide quand aria-invalid est posé', () => {
    render(<Input aria-label="Nom" aria-invalid />);

    expect(screen.getByRole('textbox', { name: 'Nom' })).toBeInvalid();
  });

  it('ne devrait pas recevoir de saisie quand il est désactivé', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Nom" disabled />);

    const input = screen.getByRole('textbox', { name: 'Nom' });
    await user.type(input, 'Thomas');

    expect(input).toBeDisabled();
    expect(input).toHaveValue('');
  });
});
