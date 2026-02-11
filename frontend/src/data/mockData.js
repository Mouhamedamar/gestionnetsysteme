// Données fictives pour le frontend

export const mockProducts = [
  {
    id: 1,
    name: "Ordinateur Portable Dell",
    description: "Laptop haute performance avec processeur Intel i7",
    category: "Informatique",
    quantity: 45,
    purchase_price: 800.00,
    sale_price: 1200.00,
    alert_threshold: 10,
    photo: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-12-10T14:20:00Z"
  },
  {
    id: 2,
    name: "Souris Sans Fil Logitech",
    description: "Souris ergonomique sans fil",
    category: "Informatique",
    quantity: 8,
    purchase_price: 15.00,
    sale_price: 25.00,
    alert_threshold: 10,
    photo: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400",
    is_active: true,
    created_at: "2024-02-20T09:15:00Z",
    updated_at: "2024-12-05T11:45:00Z"
  },
  {
    id: 3,
    name: "Clavier Mécanique",
    description: "Clavier mécanique RGB",
    category: "Informatique",
    quantity: 25,
    purchase_price: 60.00,
    sale_price: 95.00,
    alert_threshold: 10,
    photo: "https://images.unsplash.com/photo-1587829741302-dc52908decf0?w=400",
    is_active: true,
    created_at: "2024-03-10T16:00:00Z",
    updated_at: "2024-12-01T10:30:00Z"
  },
  {
    id: 4,
    name: "Écran 27 pouces 4K",
    description: "Moniteur 4K IPS",
    category: "Informatique",
    quantity: 5,
    purchase_price: 300.00,
    sale_price: 450.00,
    alert_threshold: 10,
    photo: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400",
    is_active: true,
    created_at: "2024-04-05T12:20:00Z",
    updated_at: "2024-11-28T15:10:00Z"
  },
  {
    id: 5,
    name: "Bureau Moderne",
    description: "Bureau en bois massif",
    category: "Mobilier",
    quantity: 12,
    purchase_price: 200.00,
    sale_price: 350.00,
    alert_threshold: 5,
    photo: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
    is_active: true,
    created_at: "2024-05-12T08:45:00Z",
    updated_at: "2024-11-25T09:20:00Z"
  },
  {
    id: 6,
    name: "Chaise Ergonomique",
    description: "Chaise de bureau ergonomique",
    category: "Mobilier",
    quantity: 18,
    purchase_price: 150.00,
    sale_price: 250.00,
    alert_threshold: 5,
    photo: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400",
    is_active: true,
    created_at: "2024-06-18T14:30:00Z",
    updated_at: "2024-11-20T11:15:00Z"
  },
  {
    id: 7,
    name: "Imprimante Multifonction",
    description: "Imprimante laser couleur",
    category: "Informatique",
    quantity: 3,
    purchase_price: 250.00,
    sale_price: 400.00,
    alert_threshold: 5,
    photo: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400",
    is_active: true,
    created_at: "2024-07-22T10:00:00Z",
    updated_at: "2024-11-15T13:45:00Z"
  },
  {
    id: 8,
    name: "Tablette Graphique",
    description: "Tablette graphique Wacom",
    category: "Informatique",
    quantity: 15,
    purchase_price: 120.00,
    sale_price: 200.00,
    alert_threshold: 10,
    photo: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400",
    is_active: true,
    created_at: "2024-08-30T15:20:00Z",
    updated_at: "2024-11-10T16:30:00Z"
  }
];

export const mockStockMovements = [
  {
    id: 1,
    product: 1,
    product_name: "Ordinateur Portable Dell",
    movement_type: "ENTREE",
    quantity: 20,
    date: "2024-12-01T10:00:00Z",
    comment: "Réapprovisionnement fournisseur",
    created_at: "2024-12-01T10:00:00Z"
  },
  {
    id: 2,
    product: 2,
    product_name: "Souris Sans Fil Logitech",
    movement_type: "SORTIE",
    quantity: 5,
    date: "2024-12-02T14:30:00Z",
    comment: "Vente directe",
    created_at: "2024-12-02T14:30:00Z"
  },
  {
    id: 3,
    product: 3,
    product_name: "Clavier Mécanique",
    movement_type: "ENTREE",
    quantity: 15,
    date: "2024-12-03T09:15:00Z",
    comment: "Nouvelle commande",
    created_at: "2024-12-03T09:15:00Z"
  },
  {
    id: 4,
    product: 1,
    product_name: "Ordinateur Portable Dell",
    movement_type: "SORTIE",
    quantity: 2,
    date: "2024-12-04T11:20:00Z",
    comment: "Vente en ligne",
    created_at: "2024-12-04T11:20:00Z"
  },
  {
    id: 5,
    product: 5,
    product_name: "Bureau Moderne",
    movement_type: "ENTREE",
    quantity: 8,
    date: "2024-12-05T13:45:00Z",
    comment: "Livraison fournisseur",
    created_at: "2024-12-05T13:45:00Z"
  }
];

export const mockInvoices = [
  {
    id: 1,
    invoice_number: "INV-20241201-A1B2C3D4",
    date: "2024-12-01T10:00:00Z",
    client_name: "Jean Dupont",
    total_ht: 2400.00,
    total_ttc: 2880.00,
    status: "PAYE",
    is_cancelled: false,
    created_at: "2024-12-01T10:00:00Z",
    updated_at: "2024-12-01T10:05:00Z",
    items: [
      {
        id: 1,
        product: 1,
        product_name: "Ordinateur Portable Dell",
        quantity: 2,
        unit_price: 1200.00,
        subtotal: 2400.00
      }
    ]
  },
  {
    id: 2,
    invoice_number: "INV-20241202-B2C3D4E5",
    date: "2024-12-02T14:30:00Z",
    client_name: "Marie Martin",
    total_ht: 125.00,
    total_ttc: 150.00,
    status: "NON_PAYE",
    is_cancelled: false,
    created_at: "2024-12-02T14:30:00Z",
    updated_at: "2024-12-02T14:30:00Z",
    items: [
      {
        id: 2,
        product: 2,
        product_name: "Souris Sans Fil Logitech",
        quantity: 5,
        unit_price: 25.00,
        subtotal: 125.00
      }
    ]
  },
  {
    id: 3,
    invoice_number: "INV-20241203-C3D4E5F6",
    date: "2024-12-03T09:15:00Z",
    client_name: "Pierre Durand",
    total_ht: 190.00,
    total_ttc: 228.00,
    status: "PAYE",
    is_cancelled: false,
    created_at: "2024-12-03T09:15:00Z",
    updated_at: "2024-12-03T09:20:00Z",
    items: [
      {
        id: 3,
        product: 3,
        product_name: "Clavier Mécanique",
        quantity: 2,
        unit_price: 95.00,
        subtotal: 190.00
      }
    ]
  },
  {
    id: 4,
    invoice_number: "INV-20241204-D4E5F6G7",
    date: "2024-12-04T11:20:00Z",
    client_name: "Sophie Bernard",
    total_ht: 600.00,
    total_ttc: 720.00,
    status: "PAYE",
    is_cancelled: false,
    created_at: "2024-12-04T11:20:00Z",
    updated_at: "2024-12-04T11:25:00Z",
    items: [
      {
        id: 4,
        product: 4,
        product_name: "Écran 27 pouces 4K",
        quantity: 1,
        unit_price: 450.00,
        subtotal: 450.00
      },
      {
        id: 5,
        product: 2,
        product_name: "Souris Sans Fil Logitech",
        quantity: 6,
        unit_price: 25.00,
        subtotal: 150.00
      }
    ]
  }
];

export const mockDashboardStats = {
  total_products: 8,
  low_stock_products: 2,
  stock_value: 15650.00,
  total_invoices: 4,
  revenue: 3978.00,
  recent_invoices: mockInvoices.slice(0, 5)
};

export const mockMonthlyRevenue = [
  { month: "2024-07", total: 12000.00 },
  { month: "2024-08", total: 15000.00 },
  { month: "2024-09", total: 18000.00 },
  { month: "2024-10", total: 22000.00 },
  { month: "2024-11", total: 25000.00 },
  { month: "2024-12", total: 3978.00 }
];

export const mockTopProducts = [
  { id: 1, name: "Ordinateur Portable Dell", total_sold: 45 },
  { id: 2, name: "Souris Sans Fil Logitech", total_sold: 35 },
  { id: 3, name: "Clavier Mécanique", total_sold: 28 },
  { id: 4, name: "Écran 27 pouces 4K", total_sold: 15 },
  { id: 5, name: "Bureau Moderne", total_sold: 12 }
];

