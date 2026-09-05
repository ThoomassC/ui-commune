import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  describe('rendu de base', () => {
    it('devrait exposer un bouton portant son libellé', () => {
      render(<Button>Valider</Button>);

      expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
    });

    it("devrait valoir type=button par défaut pour ne pas soumettre un formulaire par accident", () => {
      render(<Button>Valider</Button>);

      expect(screen.getByRole('button', { name: 'Valider' })).toHaveAttribute(
        'type',
        'button',
      );
    });

    it('devrait accepter type=submit fourni par l’appelant', () => {
      render(<Button type="submit">Envoyer</Button>);

      expect(screen.getByRole('button', { name: 'Envoyer' })).toHaveAttribute(
        'type',
        'submit',
      );
    });

    it('devrait déclencher le gestionnaire de clic', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Valider</Button>);

      await user.click(screen.getByRole('button', { name: 'Valider' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('variantes', () => {
    // La variante n'a pas de traduction accessible : elle ne change que
    // l'apparence. La classe EST donc le seul contrat observable ici.
    it.each([
      ['primary par défaut', undefined, 'tc-btn--primary'],
      ['primary', 'primary' as const, 'tc-btn--primary'],
      ['secondary', 'secondary' as const, 'tc-btn--secondary'],
      ['danger', 'danger' as const, 'tc-btn--danger'],
    ])('devrait porter la classe de la variante %s', (_label, variant, expected) => {
      render(<Button variant={variant}>Valider</Button>);

      const button = screen.getByRole('button', { name: 'Valider' });

      expect(button).toHaveClass('tc-btn');
      expect(button).toHaveClass(expected);
    });
  });

  describe('désactivation', () => {
    it('devrait retirer le bouton de la navigation clavier avec disabled', () => {
      render(<Button disabled>Valider</Button>);

      expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
    });

    it('ne devrait pas déclencher le clic quand le bouton est disabled', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button disabled onClick={onClick}>
          Valider
        </Button>,
      );

      await user.click(screen.getByRole('button', { name: 'Valider' }));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('devrait rester focusable avec aria-disabled, contrairement à disabled', async () => {
      const user = userEvent.setup();
      render(<Button aria-disabled="true">Valider</Button>);

      const button = screen.getByRole('button', { name: 'Valider' });
      await user.tab();

      expect(button).toHaveFocus();
      expect(button).not.toBeDisabled();
    });

    // Ces deux tests documentaient le comportement inverse — « au composant de
    // court-circuiter ». C'est le composant, désormais : laisser passer le clic
    // sous `aria-disabled` donnait un bouton d'apparence inerte qui soumettait
    // quand même, soit une double soumission sur tout bouton d'envoi.
    it('ne devrait pas déclencher le clic quand aria-disabled est posé', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button aria-disabled="true" onClick={onClick}>
          Valider
        </Button>,
      );

      await user.click(screen.getByRole('button', { name: 'Valider' }));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('ne devrait pas déclencher la validation clavier quand aria-disabled est posé', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button aria-disabled="true" onClick={onClick}>
          Valider
        </Button>,
      );

      await user.tab();
      await user.keyboard('{Enter}');

      expect(onClick).not.toHaveBeenCalled();
    });

    it('ne devrait pas soumettre son formulaire quand aria-disabled est posé', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit" aria-disabled="true">
            Envoyer
          </Button>
        </form>,
      );

      await user.click(screen.getByRole('button', { name: 'Envoyer' }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('devrait déclencher le clic normalement sans aria-disabled', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button aria-disabled={false} onClick={onClick}>
          Valider
        </Button>,
      );

      await user.click(screen.getByRole('button', { name: 'Valider' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('devrait exposer aria-disabled aux technologies d’assistance', () => {
      render(<Button aria-disabled="true">Valider</Button>);

      expect(screen.getByRole('button', { name: 'Valider' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });

  describe('attente', () => {
    it('devrait exposer aria-busy et garder un libellé de substitution', () => {
      render(<Button aria-busy="true">Envoi…</Button>);

      const button = screen.getByRole('button', { name: 'Envoi…' });

      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });
});
