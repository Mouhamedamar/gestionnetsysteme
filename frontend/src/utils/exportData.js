/**
 * Convertit un tableau de données en format CSV
 * @param {Array} data - Tableau d'objets à convertir
 * @param {Array} headers - En-têtes des colonnes [{key: 'nom', label: 'Nom'}, ...]
 * @param {string} filename - Nom du fichier à télécharger
 */
export const exportToCSV = (data, headers, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    console.warn('Aucune donnée à exporter');
    return;
  }

  // Créer la ligne d'en-tête
  const headerRow = headers.map(h => h.label).join(',');

  // Créer les lignes de données
  const dataRows = data.map(item => {
    return headers.map(header => {
      let value = item[header.key];
      
      // Gérer les valeurs nulles/undefined
      if (value === null || value === undefined) {
        value = '';
      }
      
      // Gérer les objets et tableaux
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      
      // Échapper les guillemets et les virgules
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""'); // Échapper les guillemets doubles
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`; // Entourer de guillemets si nécessaire
        }
      }
      
      return value;
    }).join(',');
  });

  // Combiner en-tête et données
  const csvContent = [headerRow, ...dataRows].join('\n');

  // Ajouter BOM pour Excel (UTF-8 avec BOM)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Créer le lien de téléchargement
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Libérer l'URL
  URL.revokeObjectURL(url);
};

/**
 * Exporte les factures en CSV
 * @param {Array} invoices - Tableau de factures
 * @param {string} filename - Nom du fichier
 */
export const exportInvoicesToCSV = (invoices, filename = 'factures.csv') => {
  const headers = [
    { key: 'invoice_number', label: 'Numéro Facture' },
    { key: 'client_name', label: 'Client' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Statut' },
    { key: 'total_ttc', label: 'Montant TTC (FCFA)' },
    { key: 'is_proforma', label: 'Pro Forma' }
  ];

  const formattedData = invoices.map(invoice => ({
    ...invoice,
    date: invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : '',
    total_ttc: typeof invoice.total_ttc === 'string' 
      ? parseFloat(invoice.total_ttc) || 0 
      : Number(invoice.total_ttc) || 0,
    is_proforma: invoice.is_proforma ? 'Oui' : 'Non'
  }));

  exportToCSV(formattedData, headers, filename);
};

/**
 * Exporte les produits en CSV
 * @param {Array} products - Tableau de produits
 * @param {string} filename - Nom du fichier
 */
export const exportProductsToCSV = (products, filename = 'produits.csv') => {
  const headers = [
    { key: 'name', label: 'Nom' },
    { key: 'category', label: 'Catégorie' },
    { key: 'quantity', label: 'Quantité' },
    { key: 'purchase_price', label: 'Prix d\'achat (FCFA)' },
    { key: 'sale_price', label: 'Prix de vente (FCFA)' },
    { key: 'alert_threshold', label: 'Seuil d\'alerte' },
    { key: 'total_sold', label: 'Total vendu' }
  ];

  exportToCSV(products, headers, filename);
};

/**
 * Exporte les clients en CSV
 * @param {Array} clients - Tableau de clients
 * @param {string} filename - Nom du fichier
 */
export const exportClientsToCSV = (clients, filename = 'clients.csv') => {
  const headers = [
    { key: 'name', label: 'Nom' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Adresse' }
  ];

  exportToCSV(clients, headers, filename);
};

/**
 * Exporte les mouvements de stock en CSV
 * @param {Array} movements - Tableau de mouvements
 * @param {string} filename - Nom du fichier
 */
export const exportStockMovementsToCSV = (movements, filename = 'mouvements_stock.csv') => {
  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'product_name', label: 'Produit' },
    { key: 'movement_type', label: 'Type' },
    { key: 'quantity', label: 'Quantité' },
    { key: 'comment', label: 'Commentaire' }
  ];

  const formattedData = movements.map(movement => ({
    ...movement,
    date: movement.date ? new Date(movement.date).toLocaleDateString('fr-FR') : '',
    movement_type: movement.movement_type === 'ENTREE' ? 'Entrée' : 'Sortie'
  }));

  exportToCSV(formattedData, headers, filename);
};

/**
 * Exporte les devis en CSV
 * @param {Array} quotes - Tableau de devis
 * @param {string} filename - Nom du fichier
 */
export const exportQuotesToCSV = (quotes, filename = 'devis.csv') => {
  const headers = [
    { key: 'quote_number', label: 'Numéro Devis' },
    { key: 'client_name', label: 'Client' },
    { key: 'date', label: 'Date' },
    { key: 'expiration_date', label: 'Date d\'expiration' },
    { key: 'status', label: 'Statut' },
    { key: 'total_ttc', label: 'Montant TTC (FCFA)' }
  ];

  const formattedData = quotes.map(quote => ({
    ...quote,
    date: quote.date ? new Date(quote.date).toLocaleDateString('fr-FR') : '',
    expiration_date: quote.expiration_date ? new Date(quote.expiration_date).toLocaleDateString('fr-FR') : '',
    total_ttc: typeof quote.total_ttc === 'string' 
      ? parseFloat(quote.total_ttc) || 0 
      : Number(quote.total_ttc) || 0
  }));

  exportToCSV(formattedData, headers, filename);
};

/**
 * Exporte les dépenses en CSV
 * @param {Array} expenses - Tableau de dépenses
 * @param {string} filename - Nom du fichier
 */
export const exportExpensesToCSV = (expenses, filename = 'depenses.csv') => {
  const headers = [
    { key: 'title', label: 'Titre' },
    { key: 'category', label: 'Catégorie' },
    { key: 'amount', label: 'Montant (FCFA)' },
    { key: 'status', label: 'Statut' },
    { key: 'date', label: 'Date' },
    { key: 'supplier', label: 'Fournisseur' },
    { key: 'receipt_number', label: 'N° reçu' },
    { key: 'description', label: 'Description' }
  ];

  const formattedData = expenses.map(expense => ({
    ...expense,
    date: expense.date ? new Date(expense.date).toLocaleDateString('fr-FR') : '',
    amount: typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : Number(expense.amount) || 0,
    status: expense.status === 'PAYE' ? 'Payé' : expense.status === 'NON_PAYE' ? 'Non payé' : expense.status || '',
    category: expense.category || ''
  }));

  exportToCSV(formattedData, headers, filename);
};
