import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Select } from './select';

function renderSelect(props: { disabled?: boolean } = {}) {
  return render(
    <>
      <label htmlFor="country">Pays</label>
      <Select id="country" defaultValue="fr" {...props}>
        <option value="fr">France</option>
        <option value="be">Belgique</option>
      </Select>
    </>,
  );
}

describe('Select', () => {
  it('devrait exposer une liste déroulante portant son libellé', () => {
    renderSelect();

    expect(screen.getByRole('combobox', { name: 'Pays' })).toBeInTheDocument();
  });

  it('devrait exposer ses options', () => {
    renderSelect();

    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('option', { name: 'France' })).toBeInTheDocument();
  });

  it('devrait refléter la valeur choisie par l’utilisateur', async () => {
    const user = userEvent.setup();
    renderSelect();

    const select = screen.getByRole('combobox', { name: 'Pays' });
    await user.selectOptions(select, 'be');

    expect(select).toHaveValue('be');
  });

  it('devrait être annoncé désactivé quand disabled est posé', () => {
    renderSelect({ disabled: true });

    expect(screen.getByRole('combobox', { name: 'Pays' })).toBeDisabled();
  });
});
