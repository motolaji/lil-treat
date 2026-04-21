export interface LineItem {
  name: string;
  price: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  qty: number;
  category: string;
  checked: boolean;
}

export interface ProcessedReceipt {
  merchant: string;
  date: string;
  total: number;
  lineItems: LineItem[];
}

// STUB — simulates Mindee OCR response. Week 1: replace with POST to /api/receipt
export async function processReceipt(_imageBase64: string): Promise<ProcessedReceipt> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    merchant: 'Verde Coffee',
    date: new Date().toLocaleDateString('en-GB'),
    total: 24.60,
    lineItems: [
      { name: 'Oat milk flat white', price: 4.50 },
      { name: 'Oat milk flat white', price: 4.50 },
      { name: 'Sourdough toast', price: 6.50 },
      { name: 'Sparkling water 500ml', price: 2.80 },
      { name: 'Banana bread slice', price: 3.20 },
      { name: 'Filter coffee', price: 3.10 },
    ],
  };
}

// STUB — simulates Claude AI clustering. Week 1: replace with Anthropic API call
export async function generateShoppingList(_receipt: ProcessedReceipt): Promise<ShoppingItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return [
    { id: crypto.randomUUID(), name: 'Oat milk flat white', qty: 2, category: 'Drinks', checked: false },
    { id: crypto.randomUUID(), name: 'Filter coffee',        qty: 1, category: 'Drinks', checked: false },
    { id: crypto.randomUUID(), name: 'Sparkling water',      qty: 1, category: 'Drinks', checked: false },
    { id: crypto.randomUUID(), name: 'Sourdough toast',      qty: 1, category: 'Food',   checked: false },
    { id: crypto.randomUUID(), name: 'Banana bread slice',   qty: 1, category: 'Food',   checked: false },
  ];
}
