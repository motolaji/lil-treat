import Papa from 'papaparse';
import { supabase } from './supabase';

export interface InventoryItem {
  id: string;
  merchant_id: string;
  sku: string;
  name: string;
  stock_qty: number;
  price: number;
  treats_value: number;
  image_url: string | null;
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
  treats_value: number;
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
    treats_value: row.treats_value,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('inventory_items')
    .upsert(payload, { onConflict: 'merchant_id,sku' })
    .select('*');

  if (error) return [];
  return (data ?? []) as InventoryItem[];
}

export async function createInventoryItem(
  merchantId: string,
  item: { name: string; price: number; treatsValue: number; imageUrl?: string | null },
): Promise<InventoryItem | null> {
  // Ad-hoc items created from the POS quick-add (e.g. "Americano") don't come
  // with a vendor-chosen SKU the way CSV rows do — generate one that's always
  // unique so it never collides with an existing row on (merchant_id, sku).
  const sku = `ITEM-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      merchant_id: merchantId,
      sku,
      name: item.name,
      stock_qty: 0,
      price: item.price,
      treats_value: item.treatsValue,
      image_url: item.imageUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) return null;
  return data as InventoryItem;
}

export async function sellOne(
  itemId: string,
  merchantId: string,
  currentQty: number,
): Promise<number | null> {
  return sellQty(itemId, merchantId, currentQty, 1);
}

export async function sellQty(
  itemId: string,
  merchantId: string,
  currentQty: number,
  qty: number,
): Promise<number | null> {
  const newQty = Math.max(0, currentQty - qty);

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (updateError) return null;

  const { error: txError } = await supabase
    .from('inventory_transactions')
    .insert({ inventory_item_id: itemId, merchant_id: merchantId, type: 'sale', qty_change: -qty });

  if (txError) return null;
  return newQty;
}

export async function updateItemTreatsValue(
  itemId: string,
  merchantId: string,
  treatsValue: number,
): Promise<boolean> {
  const { error } = await supabase
    .from('inventory_items')
    .update({ treats_value: treatsValue, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('merchant_id', merchantId);

  return !error;
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
      treats_value: Number(row.treats ?? row.treats_value ?? 0) || 0,
    }))
    .filter((row) => row.sku && row.name);
}

export function inventoryToCsv(items: InventoryItem[]): string {
  return Papa.unparse(items.map((item) => ({
    sku: item.sku,
    name: item.name,
    stock: item.stock_qty,
    price: item.price,
    treats: item.treats_value,
  })));
}
