import { createClient } from '@/utils/supabase/server';
import { Card } from './db';

export async function findCardById(cardId: string): Promise<Card | undefined> {
  if (!cardId) return undefined;
  const normalized = cardId.trim().toUpperCase();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('card_id', normalized)
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
  const normalized = cardId.trim().toUpperCase();
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
    .eq('card_id', normalized)
    .eq('status', 'UNACTIVATED')
    .select();

  return !error && data && data.length > 0;
}

export async function updateDestination(
  cardId: string,
  newUrl?: string,
  placeId?: string | null,
  businessName?: string,
  businessAddress?: string | null
): Promise<boolean> {
  const normalized = cardId.trim().toUpperCase();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    updated_at: now,
  };
  if (newUrl) updateData.destination_url = newUrl;
  if (placeId !== undefined) updateData.place_id = placeId;
  if (businessName !== undefined) updateData.business_name = businessName;
  if (businessAddress !== undefined) updateData.business_address = businessAddress;

  const { data, error } = await supabase
    .from('cards')
    .update(updateData)
    .eq('card_id', normalized)
    .eq('status', 'ACTIVE')
    .select();

  return !error && data && data.length > 0;
}

export async function updatePin(cardId: string, newPinHash: string): Promise<boolean> {
  const normalized = cardId.trim().toUpperCase();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('cards')
    .update({ pin_hash: newPinHash, updated_at: now })
    .eq('card_id', normalized)
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
  const cleanPrefix = (prefix || '').trim().toUpperCase();
  const randomLength = Math.max(1, 6 - cleanPrefix.length);

  const cardIds: string[] = [];
  const generatedSet = new Set<string>();

  // High-volume collision prevention using indexed WHERE card_id IN (...)
  // Scales to 1,000,000+ cards without downloading all rows into memory
  let needed = count;
  let loopCount = 0;

  while (needed > 0 && loopCount < 10) {
    loopCount++;
    const candidates: string[] = [];
    while (candidates.length < needed) {
      const rand = generateRandomCode(randomLength);
      const candidate = `${cleanPrefix}${rand}`;
      if (!generatedSet.has(candidate)) {
        generatedSet.add(candidate);
        candidates.push(candidate);
      }
    }

    const { data: collidedRows } = await supabase
      .from('cards')
      .select('card_id')
      .in('card_id', candidates);

    const collidedSet = new Set(
      (collidedRows || []).map((r: { card_id: string }) => r.card_id.toUpperCase())
    );

    for (const id of candidates) {
      if (!collidedSet.has(id.toUpperCase())) {
        cardIds.push(id);
      } else {
        generatedSet.delete(id);
      }
    }

    needed = count - cardIds.length;
  }

  if (cardIds.length === 0) {
    throw new Error('Gagal menghasilkan ID kartu unik.');
  }

  const toInsert = cardIds.map((id) => ({ card_id: id, status: 'UNACTIVATED' }));

  // Chunk inserts in batches of 500 for safety and speed
  const chunkSize = 500;
  for (let i = 0; i < toInsert.length; i += chunkSize) {
    const chunk = toInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('cards').insert(chunk);
    if (error) throw new Error(error.message);
  }

  return cardIds;
}

export interface PaginatedCardsResult {
  cards: Card[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getCardsPaginated(
  search?: string,
  status?: string,
  printedFilter?: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedCardsResult> {
  const supabase = await createClient();
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = supabase.from('cards').select('*', { count: 'exact' });

  if (search) {
    const cleanSearch = search.trim();
    query = query.or(`card_id.ilike.%${cleanSearch}%,business_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`);
  }

  if (status && status !== 'ALL') {
    query = query.eq('status', status);
  }

  if (printedFilter === 'PRINTED') {
    query = query.eq('is_printed', true);
  } else if (printedFilter === 'UNPRINTED') {
    query = query.or('is_printed.is.null,is_printed.eq.false');
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  if (error || !data) {
    return {
      cards: [],
      total: 0,
      page: safePage,
      limit: safeLimit,
      totalPages: 1,
    };
  }

  return {
    cards: data as Card[],
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
  };
}

export async function getAllCards(
  search?: string,
  status?: string,
  printedFilter?: string,
  limit: number = 1000
): Promise<Card[]> {
  const supabase = await createClient();
  let query = supabase.from('cards').select('*');

  if (search) {
    const cleanSearch = search.trim();
    query = query.or(`card_id.ilike.%${cleanSearch}%,business_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`);
  }

  if (status && status !== 'ALL') {
    query = query.eq('status', status);
  }

  if (printedFilter === 'PRINTED') {
    query = query.eq('is_printed', true);
  } else if (printedFilter === 'UNPRINTED') {
    query = query.or('is_printed.is.null,is_printed.eq.false');
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Card[];
}

export async function getCardStats(): Promise<{
  total: number;
  active: number;
  unactivated: number;
  disabled: number;
  totalTaps: number;
  printed: number;
  unprinted: number;
}> {
  const supabase = await createClient();

  const [totalRes, activeRes, unactivatedRes, disabledRes] = await Promise.all([
    supabase.from('cards').select('*', { count: 'exact', head: true }),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'UNACTIVATED'),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'DISABLED'),
  ]);

  let printedCount = 0;
  let unprintedCount = 0;
  try {
    const [pRes, uRes] = await Promise.all([
      supabase.from('cards').select('*', { count: 'exact', head: true }).eq('is_printed', true),
      supabase.from('cards').select('*', { count: 'exact', head: true }).or('is_printed.is.null,is_printed.eq.false'),
    ]);
    if (!pRes.error && pRes.count !== null) printedCount = pRes.count;
    if (!uRes.error && uRes.count !== null) unprintedCount = uRes.count;
  } catch {
    // Fallback if column not yet added
  }

  // Attempt DB-level RPC sum for 1M scale
  let totalTaps = 0;
  try {
    const { data: rpcTaps, error: rpcErr } = await supabase.rpc('get_total_taps');
    if (!rpcErr && rpcTaps !== null) {
      totalTaps = Number(rpcTaps);
    } else {
      // Safe fallback sample
      const { data: sampleTaps } = await supabase.from('cards').select('tap_count').limit(1000);
      totalTaps = (sampleTaps || []).reduce(
        (acc, curr: { tap_count?: number | null }) => acc + (Number(curr.tap_count) || 0),
        0
      );
    }
  } catch {
    totalTaps = 0;
  }

  return {
    total: totalRes.count || 0,
    active: activeRes.count || 0,
    unactivated: unactivatedRes.count || 0,
    disabled: disabledRes.count || 0,
    totalTaps,
    printed: printedCount,
    unprinted: unprintedCount,
  };
}

export async function updateCardPrintedStatus(cardIds: string[], isPrinted: boolean): Promise<boolean> {
  if (!cardIds || cardIds.length === 0) return true;
  const supabase = await createClient();
  const now = isPrinted ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from('cards')
    .update({ is_printed: isPrinted, printed_at: now })
    .in('card_id', cardIds)
    .select();

  return !error && !!data;
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

export async function incrementCardTap(cardId: string, isQr: boolean = false): Promise<void> {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    
    // First attempt RPC with is_qr
    let { error: rpcError } = await supabase.rpc('increment_card_tap', { 
      target_card_id: cardId,
      is_qr: isQr
    });
    
    // If RPC signature with is_qr not found, try single arg RPC
    if (rpcError) {
      const fallbackRpc = await supabase.rpc('increment_card_tap', { target_card_id: cardId });
      rpcError = fallbackRpc.error;
    }

    // If RPC is still not available or errored, fallback to direct table update
    if (rpcError) {
      const { data } = await supabase
        .from('cards')
        .select('tap_count, qr_count')
        .eq('card_id', cardId)
        .single();
      
      const currentTap = data && data.tap_count ? Number(data.tap_count) : 0;
      const currentQr = data && (data as any).qr_count ? Number((data as any).qr_count) : 0;
      
      const updatePayload: Record<string, unknown> = {
        tap_count: currentTap + 1,
        last_tapped_at: now,
      };

      if (isQr) {
        updatePayload.qr_count = currentQr + 1;
      }

      const { error: updateError } = await supabase
        .from('cards')
        .update(updatePayload)
        .eq('card_id', cardId);

      // If qr_count column doesn't exist yet, retry updating tap_count only
      if (updateError) {
        await supabase
          .from('cards')
          .update({
            tap_count: currentTap + 1,
            last_tapped_at: now,
          })
          .eq('card_id', cardId);
      }
    }
  } catch (err) {
    // Non-blocking for client redirect
    console.error('[Tap Tracking Error]', err);
  }
}

