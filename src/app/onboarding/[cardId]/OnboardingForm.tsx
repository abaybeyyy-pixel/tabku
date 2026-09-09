'use client';

import React, { useState } from 'react';

interface OnboardingFormProps {
  cardId: string;
}

interface ConvertedReview {
  name: string;
  placeId: string | null;
  reviewUrl: string;
  address?: string;
}

export default function OnboardingForm({ cardId }: OnboardingFormProps) {
  // Destination Link Type: 'google_review' | 'custom_url'
  const [linkType, setLinkType] = useState<'google_review' | 'custom_url'>('google_review');
  const [customUrl, setCustomUrl] = useState('');

  // Google Maps link & auto-convert state
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertedReview, setConvertedReview] = useState<ConvertedReview | null>(null);

  // Business Name on Card
  const [businessName, setBusinessName] = useState('');

  // Form state
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activatedData, setActivatedData] = useState<{
    businessName: string;
    businessAddress?: string;
    placeId?: string | null;
    destinationUrl?: string;
    linkType: 'google_review' | 'custom_url';
  } | null>(null);

  const handleConvertLink = async (urlOverride?: string): Promise<ConvertedReview | null> => {
    const rawUrl = (urlOverride !== undefined ? urlOverride : googleMapsUrl).trim();
    if (!rawUrl) {
      setError('Masukkan tautan Google Maps usaha Anda terlebih dahulu.');
      return null;
    }

    setConverting(true);
    setError('');

    try {
      const response = await fetch('/api/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses tautan Google Maps.');
      }

      const reviewData: ConvertedReview = {
        name: data.name || 'Usaha Google Maps',
        placeId: data.placeId || null,
        reviewUrl: data.destinationUrl || rawUrl,
        address: data.address || 'Terverifikasi dari tautan Google Maps',
      };

      setConvertedReview(reviewData);

      // Auto-fill business name if not edited yet
      if (!businessName.trim() && data.name && data.name !== 'Usaha Google Maps') {
        setBusinessName(data.name);
      }

      return reviewData;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Tautan tidak valid atau gagal diproses.';
      setError(message);
      return null;
    } finally {
      setConverting(false);
    }
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && (pastedText.includes('google.com/maps') || pastedText.includes('goo.gl') || pastedText.includes('http'))) {
      setGoogleMapsUrl(pastedText);
      setTimeout(() => {
        handleConvertLink(pastedText);
      }, 50);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let finalDestinationUrl = '';
    let finalPlaceId: string | null = null;
    let finalAddress = '';

    if (linkType === 'google_review') {
      if (!googleMapsUrl.trim()) {
        setError('Tautan Google Maps usaha wajib diisi.');
        return;
      }

      let currentReview = convertedReview;
      if (!currentReview || currentReview.reviewUrl === '') {
        currentReview = await handleConvertLink(googleMapsUrl);
        if (!currentReview) {
          return;
        }
      }

      finalDestinationUrl = currentReview.reviewUrl;
      finalPlaceId = currentReview.placeId;
      finalAddress = currentReview.address || '';

      if (!businessName.trim()) {
        setError('Nama usaha wajib diisi.');
        return;
      }
    } else {
      if (!customUrl.trim()) {
        setError('URL tautan tujuan wajib diisi.');
        return;
      }
      let formattedUrl = customUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      try {
        new URL(formattedUrl);
      } catch {
        setError('Format URL tidak valid. Contoh: https://instagram.com/tokoanda');
        return;
      }
      finalDestinationUrl = formattedUrl;
      if (!businessName.trim()) {
        setError('Nama usaha atau label kartu wajib diisi.');
        return;
      }
    }

    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    if (!phone.trim() || cleanPhone.length < 9 || cleanPhone.length > 16 || !/^[0-9]+$/.test(cleanPhone)) {
      setError('Nomor WhatsApp wajib diisi dengan benar (minimal 9 digit, contoh: 081234567890).');
      return;
    }

    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN harus terdiri dari 4 hingga 6 digit angka.');
      return;
    }

    if (pin !== confirmPin) {
      setError('Konfirmasi PIN tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/cards/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          linkType,
          businessName: businessName.trim(),
          placeId: linkType === 'google_review' ? (finalPlaceId || undefined) : undefined,
          businessAddress: linkType === 'google_review' ? finalAddress : undefined,
          customUrl: finalDestinationUrl,
          phone: phone.trim(),
          pin,
          confirmPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengaktifkan kartu.');
      }

      setActivatedData({
        businessName: businessName.trim(),
        businessAddress: linkType === 'google_review' ? finalAddress : undefined,
        placeId: linkType === 'google_review' ? finalPlaceId : null,
        destinationUrl: data.card?.destinationUrl || finalDestinationUrl,
        linkType,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat aktivasi.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success && activatedData) {
    const directUrl = activatedData.destinationUrl || (activatedData.placeId ? `https://search.google.com/local/writereview?placeid=${activatedData.placeId}` : `/c/${cardId}`);
    return (
      <div className="text-center animate-fade-in">
        <div className="success-icon mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Kartu Anda Telah Aktif!</h2>
        <p className="text-muted text-xs mb-4">
          {activatedData.linkType === 'google_review'
            ? 'Kartu fisik NFC dan kode QR Anda sudah terhubung ke ulasan bintang 5 Google Maps.'
            : 'Kartu fisik NFC dan kode QR Anda sudah terhubung ke tautan khusus Anda.'}
        </p>

        <div className="summary-box mb-4 text-left">
          {/* Nama Bisnis */}
          <div className="summary-card-row">
            <span className="summary-label">Nama Bisnis / Label</span>
            <div className="summary-val-main">
              {activatedData.businessName}
            </div>
          </div>

          {/* ID Kartu & Status */}
          <div className="summary-card-grid-2">
            <div>
              <span className="summary-label block mb-1">ID Kartu</span>
              <div className="summary-val-sub font-mono font-bold" style={{ color: 'var(--primary-color)', fontSize: '0.85rem' }}>
                {cardId}
              </div>
            </div>
            <div>
              <span className="summary-label block mb-1">Status Kartu</span>
              <span className="status-tag active">Aktif</span>
            </div>
          </div>

          {/* Tujuan Redirect */}
          <div className="summary-card-row">
            <span className="summary-label">Tujuan Redirect</span>
            {activatedData.linkType === 'google_review' ? (
              <div className="text-xs font-bold text-success flex items-center gap-1 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Google Write a Review (Bintang 5 Langsung)
              </div>
            ) : (
              <div className="text-xs font-mono font-semibold text-blue-600 break-all mt-0.5 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                {activatedData.destinationUrl}
              </div>
            )}
          </div>
        </div>

        <div className="info-alert mb-4 text-left">
          Simpan PIN Anda dengan aman. PIN dan ID Kartu <strong>{cardId}</strong> digunakan untuk mengedit tujuan link kapan saja di portal kelola <strong>mycarrd.com/manage</strong>.
        </div>

        <div className="flex gap-3 flex-col mt-4">
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary w-full text-center py-3.5 px-4 font-bold text-sm"
            style={{ fontSize: '0.9rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {activatedData.linkType === 'google_review' ? 'Buka Halaman Ulasan Bintang 5' : 'Buka Tautan Tujuan'}
          </a>
          <a
            href={`/c/${cardId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary w-full text-center py-3 px-3 font-bold text-xs"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
            Tes Redirect Kartu
          </a>
        </div>
      </div>
    );
  }

  const isFormReadyForPin = linkType === 'google_review' ? !!googleMapsUrl.trim() : !!customUrl.trim();

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-3">
        <h1 className="text-xl font-bold mb-1">Aktivasi Kartu Smart</h1>
        <p className="text-muted text-xs">Pilih tujuan tautan untuk kartu fisik NFC dan kode QR Anda.</p>
      </div>

      {/* LINK TYPE SELECTOR TABS */}
      <div className="link-type-selector mb-3.5">
        <button
          type="button"
          className={`link-type-tab ${linkType === 'google_review' ? 'active' : ''}`}
          onClick={() => {
            setLinkType('google_review');
            setError('');
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Google Maps
        </button>
        <button
          type="button"
          className={`link-type-tab ${linkType === 'custom_url' ? 'active' : ''}`}
          onClick={() => {
            setLinkType('custom_url');
            setError('');
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Custom Link
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-group">
        {error && <div className="error-alert">{error}</div>}

        {/* TAB 1: GOOGLE MAPS REVIEW (COPY LINK TO 5-STAR DIRECT) */}
        {linkType === 'google_review' && (
          <div className="animate-fade-in">
            <div className="input-group">
              <label htmlFor="googleMapsUrl">Tautan Google Maps Usaha</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="googleMapsUrl"
                  placeholder="https://maps.app.goo.gl/... atau google.com/maps/place/..."
                  value={googleMapsUrl}
                  onChange={(e) => {
                    setGoogleMapsUrl(e.target.value);
                    if (convertedReview) setConvertedReview(null);
                  }}
                  onPaste={handleUrlPaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConvertLink();
                    }
                  }}
                  disabled={loading || converting}
                  style={{ flex: 1 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleConvertLink()}
                  disabled={converting || loading || !googleMapsUrl.trim()}
                  className="btn btn-primary py-2 px-4 text-xs font-semibold whitespace-nowrap"
                >
                  {converting ? 'Memproses...' : 'Cek Link'}
                </button>
              </div>
              <span className="help-text">
                Buka Google Maps &gt; cari usaha Anda &gt; klik Bagikan &gt; Salin Link lalu tempel di sini.
              </span>
            </div>

            {/* Converted 5-Star Status Preview */}
            {convertedReview && (
              <div className="selected-business-box mb-3 animate-fade-in">
                <div className="selected-business-check">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="selected-business-info">
                  <span className="selected-business-name">{businessName || convertedReview.name}</span>
                  <span className="selected-business-address">
                    Otomatis diubah menjadi tautan ulasan bintang 5 langsung
                  </span>
                  <a
                    href={convertedReview.reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold mt-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Uji Buka Link Ulasan Bintang 5
                  </a>
                </div>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="businessNameInput">Nama Usaha pada Kartu</label>
              <input
                type="text"
                id="businessNameInput"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="contoh: Kopi Kenangan Grand Indonesia"
                disabled={loading}
                required
              />
              <span className="help-text">Nama bisnis yang akan terdaftar pada kartu fisik Anda.</span>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM LINK */}
        {linkType === 'custom_url' && (
          <div className="animate-fade-in">
            <div className="input-group">
              <label htmlFor="customUrlInput">URL Tujuan Bebas (Website / Medsos / WA)</label>
              <input
                type="text"
                id="customUrlInput"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://instagram.com/tokoanda atau https://wa.me/..."
                disabled={loading}
                required
              />
              <span className="help-text">
                Masukkan tautan lengkap apa pun yang ingin dibuka saat kartu di-tap atau QR di-scan.
              </span>
            </div>

            <div className="input-group">
              <label htmlFor="customBusinessName">Nama Usaha / Label Kartu</label>
              <input
                type="text"
                id="customBusinessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="contoh: Kedai Kopi Joni / Portofolio Saya"
                disabled={loading}
                required
              />
              <span className="help-text">Nama atau judul yang mewakili kartu ini.</span>
            </div>
          </div>
        )}

        {/* Common Security & PIN Fields (Shown once Google Maps link or Custom URL is filled) */}
        {isFormReadyForPin && (
          <div className="animate-fade-in">
            <div className="input-group">
              <label htmlFor="phone" className="flex items-center justify-between">
                <span>Nomor WhatsApp Pemilik</span>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-5.514 0-10 4.486-10 10 0 1.761.459 3.417 1.258 4.865l-1.297 4.735 4.856-1.273c1.393.759 2.977 1.173 4.683 1.173 5.514 0 10-4.486 10-10s-4.486-10-10-10z" />
                  </svg>
                  Pemulihan &amp; Layanan
                </span>
              </label>
              <input
                type="tel"
                id="phone"
                placeholder="contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                disabled={loading}
                required
              />
              <span className="help-text">
                Digunakan untuk verifikasi pemulihan PIN kartu &amp; bantuan layanan resmi via WhatsApp.
              </span>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label htmlFor="pin">Buat PIN (4-6 digit)</label>
                <input
                  type="password"
                  id="pin"
                  pattern="\d*"
                  maxLength={6}
                  placeholder="4-6 digit angka"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="confirmPin">Konfirmasi PIN</label>
                <input
                  type="password"
                  id="confirmPin"
                  pattern="\d*"
                  maxLength={6}
                  placeholder="Ulangi PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-3 font-semibold mt-1"
              disabled={loading || converting}
            >
              {loading ? 'Mengaktifkan Kartu...' : 'Aktifkan Kartu Sekarang'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
