/**
 * Concatène des classes en ignorant les valeurs vides.
 *
 * Seul utilitaire partagé de la couche composants : il existe pour que
 * `className` reçu en prop soit toujours FUSIONNÉ avec les classes internes,
 * jamais écrasé. Aucune dépendance, aucun runtime — utilisable tel quel dans
 * un Server Component.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
