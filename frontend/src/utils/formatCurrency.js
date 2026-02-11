/**
 * Formate un montant : entier (sans décimales) avec point comme séparateur de milliers pour une meilleure lisibilité.
 * Exemple : 10000 → "10.000" ; 1690000 → "1.690.000"
 * @param {number} amount - Le montant à formater
 * @returns {string} Le montant formaté (ex: "1.690.000")
 */
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  const rounded = Math.round(num);
  return rounded.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
