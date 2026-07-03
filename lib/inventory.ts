import Papa from 'papaparse';
import { supabase } from './supabase';

export interface InventoryItem {
  id: string;
  merchant_id: string;
  sku: string;
  name: string;
  stock_qty: number;
  price: number;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  merchant_id: string;
  type: 'sale' | 'restock' | 'adjustment';
  qty_change: number;
  created_at: string;
}

export interface InventoryCsvRow {
  sku: string;
  name: string;
  stock_qty: number;
  price: number;
}

export async function getInventoryItems(merchantId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('name');

  if (error) return [];
  return (data ?? []) as InventoryItem[];
}

export async function upsertInventoryItems(
  merchantId: string,
  rows: InventoryCsvRow[],
): Promise<InventoryItem[]> {
  const payload = rows.map((row) => ({
    merchant_id: merchantId,
    sku: row.sku,
    name: row.name,
    stock_qty: row.stock_qty,
    price: row.price,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('inventory_items')
    .upsert(payload, { onConflict: 'merchant_id,sku' })
    .select('*');

  if (error) return [];
  return (data ?? []) as InventoryItem[];
}

export async function sellOne(
  itemId: string,
  merchantId: string,
  currentQty: number,
): Promise<number | null> {
  const newQty = Math.max(0, currentQty - 1);

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (updateError) return null;

  const { error: txError } = await supabase
    .from('inventory_transactions')
    .insert({ inventory_item_id: itemId, merchant_id: merchantId, type: 'sale', qty_change: -1 });

  if (txError) return null;
  return newQty;
}

export function parseInventoryCsv(text: string): InventoryCsvRow[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  return result.data
    .map((row): InventoryCsvRow => ({
      sku: (row.sku ?? '').trim(),
      name: (row.name ?? '').trim(),
      stock_qty: Number(row.stock ?? row.stock_qty ?? 0) || 0,
      price: Number(row.price ?? 0) || 0,
    }))
    .filter((row) => row.sku && row.name);
}

export function inventoryToCsv(items: InventoryItem[]): string {
  return Papa.unparse(items.map((item) => ({
    sku: item.sku,
    name: item.name,
    stock: item.stock_qty,
    price: item.price,
  })));
}
