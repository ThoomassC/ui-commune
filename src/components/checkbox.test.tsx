import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('devrait exposer une case à cocher portant son libellé', () => {
    render(<Checkbox label="Recevoir les actualités" />);

    expect(
      screen.getByRole('checkbox', { name: 'Recevoir les actualités' }),
    ).toBeInTheDocument();
  });

  it("devrait être décochée par défaut", () => {
    render(<Checkbox label="Recevoir les actualités" />);

    expect(
      screen.getByRole('checkbox', { name: 'Recevoir les actualités' }),
    ).not.toBeChecked();
  });

  it('devrait se cocher au clic sur le libellé', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Recevoir les actualités" />);

    await user.click(screen.getByText('Recevoir les actualités'));

    expect(
      screen.getByRole('checkbox', { name: 'Recevoir les actualités' }),
    ).toBeChecked();
  });

  it('devrait remonter le changement à l’appelant', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Recevoir les actualités" onChange={onChange} />);

    await user.click(
      screen.getByRole('checkbox', { name: 'Recevoir les actualités' }),
    );

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('devrait refléter l’état contrôlé fourni par l’appelant', () => {
    render(<Checkbox label="Recevoir les actualités" checked readOnly />);

    expect(
      screen.getByRole('checkbox', { name: 'Recevoir les actualités' }),
    ).toBeChecked();
  });

  it('ne devrait pas se cocher quand elle est désactivée', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Recevoir les actualités" disabled />);

    const checkbox = screen.getByRole('checkbox', {
      name: 'Recevoir les actualités',
    });
    await user.click(checkbox);

    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toBeChecked();
  });
});
