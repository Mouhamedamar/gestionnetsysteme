/**
 * Retourne un nom de fichier sûr à partir du nom du client.
 * Ex. "Jean-François Dupont" → "Jean_Francois_Dupont"
 */
export function sanitizeClientNameForFilename(name) {
  if (!name || typeof name !== 'string') return 'Client';
  return name
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Client';
}

export function getInvoicePdfFilename(clientName) {
  return `Facture_${sanitizeClientNameForFilename(clientName)}.pdf`;
}

export function getQuotePdfFilename(clientName) {
  return `Devis_${sanitizeClientNameForFilename(clientName)}.pdf`;
}

export function getProformaPdfFilename(clientName) {
  return `Proforma_${sanitizeClientNameForFilename(clientName)}.pdf`;
}
