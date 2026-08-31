import { createClient } from '@/utils/supabase/server';
import { Card } from './db';

export async function findCardById(cardId: string): Promise<Card | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('card_id', cardId)
    .single();
  
  if (error || !data) return undefined;
  return data as Card;
}

export async function activateCard(
  cardId: string,
  businessName: string,
  destinationUrl: string,
  pinHash: string,
  email: string
): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cards')
    .update({
      status: 'ACTIVE',
      business_name: businessName,
      destination_url: destinationUrl,
      pin_hash: pinHash,
      email: email,
      activated_at: now,
      updated_at: now,
    })
    .eq('card_id', cardId)
    .eq('status', 'UNACTIVATED')
    .select();

  return !error && data && data.length > 0;
}

export async function updateDestination(cardId: string, newUrl: string): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cards')
    .update({ destination_url: newUrl, updated_at: now })
    .eq('card_id', cardId)
    .eq('status', 'ACTIVE')
    .select();

  return !error && data && data.length > 0;
}

export async function updatePin(cardId: string, newPinHash: string): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cards')
    .update({ pin_hash: newPinHash, updated_at: now })
    .eq('card_id', cardId)
    .eq('status', 'ACTIVE')
    .select();

  return !error && data && data.length > 0;
}

export async function disableCard(cardId: string): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cards')
    .update({ status: 'DISABLED', disabled_at: now, updated_at: now })
    .eq('card_id', cardId)
    .select();

  return !error && data && data.length > 0;
}

export async function reactivateCard(cardId: string): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cards')
    .update({ status: 'ACTIVE', disabled_at: null, updated_at: now })
    .eq('card_id', cardId)
    .eq('status', 'DISABLED')
    .select();

  return !error && data && data.length > 0;
}

export async function generateCards(prefix: string, count: number): Promise<string[]> {
  const supabase = await createClient();
  const cardIds: string[] = [];
  
  // Find the highest existing number for this prefix
  const { data: existing } = await supabase
    .from('cards')
    .select('card_id')
    .like('card_id', `${prefix}%`)
    .order('card_id', { ascending: false })
    .limit(1)
    .single();
  
  let startNum = 1;
  if (existing) {
    const numPart = existing.card_id.replace(prefix, '');
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) {
      startNum = parsed + 1;
    }
  }
  
  const toInsert = [];
  for (let i = 0; i < count; i++) {
    const num = startNum + i;
    const cardId = `${prefix}${num.toString().padStart(4, '0')}`;
    toInsert.push({ card_id: cardId, status: 'UNACTIVATED' });
    cardIds.push(cardId);
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('cards').insert(toInsert);
    if (error) throw new Error(error.message);
  }
  
  return cardIds;
}

export async function getAllCards(search?: string, status?: string): Promise<Card[]> {
  const supabase = await createClient();
  let query = supabase.from('cards').select('*');

  if (search) {
    query = query.or(`card_id.ilike.%${search}%,business_name.ilike.%${search}%`);
  }

  if (status && status !== 'ALL') {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error || !data) return [];
  return data as Card[];
}

export async function getCardStats(): Promise<{ total: number; active: number; unactivated: number; disabled: number }> {
  const supabase = await createClient();
  
  const [totalRes, activeRes, unactivatedRes, disabledRes] = await Promise.all([
    supabase.from('cards').select('*', { count: 'exact', head: true }),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'UNACTIVATED'),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'DISABLED'),
  ]);

  return {
    total: totalRes.count || 0,
    active: activeRes.count || 0,
    unactivated: unactivatedRes.count || 0,
    disabled: disabledRes.count || 0,
  };
}

export async function storeOtp(cardId: string, otpHash: string, expiresAt: string): Promise<void> {
  const supabase = await createClient();
  // Invalidate previous OTPs
  await supabase
    .from('otp_codes')
    .update({ used: 1 })
    .eq('card_id', cardId)
    .eq('used', 0);
    
  // Store new OTP
  await supabase
    .from('otp_codes')
    .insert({ card_id: cardId, otp_hash: otpHash, expires_at: expiresAt });
}

export async function getLatestOtp(cardId: string): Promise<{ id: number; otp_hash: string; expires_at: string } | undefined> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('card_id', cardId)
    .eq('used', 0)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return data as { id: number; otp_hash: string; expires_at: string };
}

export async function markOtpUsed(otpId: number): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('otp_codes')
    .update({ used: 1 })
    .eq('id', otpId);
}

export async function adminResetPin(cardId: string, newPinHash: string): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cards')
    .update({ pin_hash: newPinHash, updated_at: now })
    .eq('card_id', cardId)
    .select();

  return !error && data && data.length > 0;
}
