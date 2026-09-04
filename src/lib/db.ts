export interface Card {
  id: number;
  card_id: string;
  status: 'UNACTIVATED' | 'ACTIVE' | 'DISABLED';
  business_name: string | null;
  destination_url: string | null;
  place_id: string | null;
  business_address: string | null;
  pin_hash: string | null;
  email: string | null;
  tap_count?: number;
  last_tapped_at?: string | null;
  is_printed?: boolean;
  printed_at?: string | null;
  created_at: string;
  activated_at: string | null;
  updated_at: string | null;
  disabled_at: string | null;
}

export interface OtpCode {
  id: number;
  card_id: string;
  otp_hash: string;
  expires_at: string;
  used: number;
  created_at: string;
}
