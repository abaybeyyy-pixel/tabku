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
  email: string,
  placeId?: string,
  businessAddress?: string
): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    status: 'ACTIVE',
    business_name: businessName,
    destination_url: destinationUrl,
    pin_hash: pinHash,
    email: email,
    activated_at: now,
    updated_at: now,
  };
  if (placeId) updateData.place_id = placeId;
  if (businessAddress) updateData.business_address = businessAddress;

  const { data, error } = await supabase
    .from('cards')
    .update(updateData)
    .eq('card_id', cardId)
    .eq('status', 'UNACTIVATED')
    .select();

  return !error && data && data.length > 0;
}

export async function updateDestination(
  cardId: string,
  newUrl?: string,
  placeId?: string,
  businessName?: string,
  businessAddress?: string
): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    updated_at: now,
  };
  if (newUrl) updateData.destination_url = newUrl;
  if (placeId) updateData.place_id = placeId;
  if (businessName !== undefined) updateData.business_name = businessName;
  if (businessAddress !== undefined) updateData.business_address = businessAddress;

  const { data, error } = await supabase
    .from('cards')
    .update(updateData)
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

export async function deleteCard(cardId: string): Promise<boolean> {
  const supabase = await createClient();
  // Delete related OTPs first
  await supabase.from('otp_codes').delete().eq('card_id', cardId);
  // Delete card
  const { error } = await supabase.from('cards').delete().eq('card_id', cardId);
  return !error;
}

export async function deleteCards(cardIds: string[]): Promise<boolean> {
  if (!cardIds || cardIds.length === 0) return true;
  const supabase = await createClient();
  // Delete related OTPs first
  await supabase.from('otp_codes').delete().in('card_id', cardIds);
  // Delete cards
  const { error } = await supabase.from('cards').delete().in('card_id', cardIds);
  return !error;
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

function generateRandomCode(length: number): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateCards(prefix: string = '', count: number = 1): Promise<string[]> {
  const supabase = await createClient();
  const cardIds: string[] = [];
  const cleanPrefix = (prefix || '').trim().toUpperCase();
  const randomLength = Math.max(1, 6 - cleanPrefix.length);

  // Fetch existing card IDs to guarantee zero collision
  const { data: existingRows } = await supabase
    .from('cards')
    .select('card_id');
  
  const existingSet = new Set((existingRows || []).map((r: { card_id: string }) => r.card_id.toUpperCase()));
  const generatedSet = new Set<string>();

  const toInsert = [];
  for (let i = 0; i < count; i++) {
    let candidate = '';
    let attempts = 0;
    do {
      const rand = generateRandomCode(randomLength);
      candidate = `${cleanPrefix}${rand}`;
      attempts++;
    } while ((existingSet.has(candidate) || generatedSet.has(candidate)) && attempts < 1000);

    generatedSet.add(candidate);
    existingSet.add(candidate);
    toInsert.push({ card_id: candidate, status: 'UNACTIVATED' });
    cardIds.push(candidate);
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
    const cleanSearch = search.trim();
    query = query.or(`card_id.ilike.%${cleanSearch}%,business_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`);
  }

  if (status && status !== 'ALL') {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error || !data) return [];
  return data as Card[];
}

export async function getCardStats(): Promise<{ total: number; active: number; unactivated: number; disabled: number; totalTaps: number }> {
  const supabase = await createClient();
  
  const [totalRes, activeRes, unactivatedRes, disabledRes, tapsRes] = await Promise.all([
    supabase.from('cards').select('*', { count: 'exact', head: true }),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'UNACTIVATED'),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'DISABLED'),
    supabase.from('cards').select('tap_count'),
  ]);

  const totalTaps = (tapsRes.data || []).reduce((acc, curr: { tap_count?: number | null }) => acc + (Number(curr.tap_count) || 0), 0);

  return {
    total: totalRes.count || 0,
    active: activeRes.count || 0,
    unactivated: unactivatedRes.count || 0,
    disabled: disabledRes.count || 0,
    totalTaps,
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

export async function incrementCardTap(cardId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    
    // First attempt to call RPC if registered
    const { error: rpcError } = await supabase.rpc('increment_card_tap', { target_card_id: cardId });
    
    // If RPC is not available in Postgres, fallback to direct query increment
    if (rpcError) {
      const { data } = await supabase
        .from('cards')
        .select('tap_count')
        .eq('card_id', cardId)
        .single();
      
      const currentCount = data && data.tap_count ? Number(data.tap_count) : 0;
      await supabase
        .from('cards')
        .update({
          tap_count: currentCount + 1,
          last_tapped_at: now,
        })
        .eq('card_id', cardId);
    }
  } catch (err) {
    // Non-blocking for client redirect
    console.error('[Tap Tracking Error]', err);
  }
}

