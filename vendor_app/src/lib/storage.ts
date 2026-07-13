import { supabase } from './supabase';

export async function uploadMerchantLogo(userId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('merchant-logos').upload(path, file);
  if (error) return null;

  const { data } = supabase.storage.from('merchant-logos').getPublicUrl(path);
  return data.publicUrl;
}
