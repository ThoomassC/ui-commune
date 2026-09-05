import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Message } from './message';
import type { MessageTone } from './message';

describe('Message', () => {
  describe('politesse de la région dynamique', () => {
    it("ne devrait poser aucun rôle live par défaut", () => {
      render(<Message tone="ok">Enregistré</Message>);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('Enregistré')).toBeInTheDocument();
    });

    it('ne devrait poser aucun rôle live quand live vaut off', () => {
      render(
        <Message tone="ok" live="off">
          Enregistré
        </Message>,
      );

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('devrait poser role=status quand live vaut polite', () => {
      render(
        <Message tone="ok" live="polite">
          Enregistré
        </Message>,
      );

      expect(screen.getByRole('status')).toHaveTextContent('Enregistré');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('devrait poser role=alert quand live vaut assertive', () => {
      render(
        <Message tone="error" live="assertive">
          Échec de l’envoi
        </Message>,
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Échec de l’envoi');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('glyphe', () => {
    it.each<[MessageTone, string]>([
      ['ok', '✓'],
      ['warn', '▲'],
      ['error', '✕'],
    ])('devrait afficher le glyphe %s sans l’annoncer', (tone, glyph) => {
      render(
        <Message tone={tone} live="polite">
          Message
        </Message>,
      );

      const marker = screen.getByText(glyph);

      expect(marker).toBeInTheDocument();
      expect(marker).toHaveAttribute('aria-hidden', 'true');
    });

    it("ne devrait pas laisser le glyphe entrer dans le texte accessible d'une description", () => {
      render(
        <>
          <Message tone="error" live="assertive" id="msg">
            Échec de l’envoi
          </Message>
          <input aria-label="Nom" aria-describedby="msg" />
        </>,
      );

      // La description résolue exclut tout nœud aria-hidden : c'est
      // exactement ce qu'entend un lecteur d'écran. Le glyphe « ✕ » n'y est
      // donc pas — en revanche le préfixe de ton, lui, y EST : masqué à l'œil
      // par `.tc-visually-hidden`, il reste dans l'arbre d'accessibilité,
      // parce que sans lui rien ne distingue un succès d'une erreur à
      // l'oreille. Le test attendait auparavant le seul corps du message,
      // c'est-à-dire l'absence de cette information.
      const description = screen.getByRole('textbox', { name: 'Nom' });

      expect(description).toHaveAccessibleDescription('Erreur : Échec de l’envoi');
      expect(description).not.toHaveAccessibleDescription(
        expect.stringContaining('✕'),
      );
    });

    it.each<[MessageTone, string]>([
      ['ok', 'Succès :'],
      ['warn', 'Attention :'],
      ['error', 'Erreur :'],
    ])('devrait annoncer le ton %s en toutes lettres', (tone, prefix) => {
      render(
        <>
          <Message tone={tone} id="msg">
            Palette enregistrée
          </Message>
          <input aria-label="Nom" aria-describedby="msg" />
        </>,
      );

      expect(screen.getByRole('textbox', { name: 'Nom' })).toHaveAccessibleDescription(
        `${prefix} Palette enregistrée`,
      );
    });
  });

  describe('tonalité', () => {
    // La tonalité n'a pas d'écho accessible ; la classe est son seul contrat.
    it.each<[MessageTone, string]>([
      ['ok', 'tc-message--ok'],
      ['warn', 'tc-message--warn'],
      ['error', 'tc-message--error'],
    ])('devrait porter la classe de la tonalité %s', (tone, expected) => {
      render(
        <Message tone={tone} live="polite">
          Message
        </Message>,
      );

      const region = screen.getByRole('status');

      expect(region).toHaveClass('tc-message');
      expect(region).toHaveClass(expected);
    });
  });
});
