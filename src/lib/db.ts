export interface Card {
  id: number;
  card_id: string;
  status: 'UNACTIVATED' | 'ACTIVE' | 'DISABLED';
  business_name: string | null;
  destination_url: string | null;
  pin_hash: string | null;
  email: string | null;
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
