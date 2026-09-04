'use client';

import React, { useState } from 'react';

interface OnboardingFormProps {
  cardId: string;
}

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
}

export default function OnboardingForm({ cardId }: OnboardingFormProps) {
  // Destination Link Type: 'google_review' | 'custom_url'
  const [linkType, setLinkType] = useState<'google_review' | 'custom_url'>('google_review');
  const [customUrl, setCustomUrl] = useState('');

  // Business search state (Google Places)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected business state & customizable name
  const [selectedBusiness, setSelectedBusiness] = useState<PlaceResult | null>(null);
  const [businessName, setBusinessName] = useState('');

  // Form state
  const [email, setEmail] = useState('');
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

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('Masukkan minimal 2 karakter untuk mencari bisnis.');
      return;
    }
    setError('');
    setSearching(true);
    setHasSearched(true);
    setSearchResults([]);

    try {
      const res = await fetch('/api/places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencari bisnis.');
      setSearchResults(data.results || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mencari bisnis.';
      setError(message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBusiness = (place: PlaceResult) => {
    setSelectedBusiness(place);
    setBusinessName(place.name);
    setSearchResults([]);
    setHasSearched(false);
    setError('');
  };

  const handleChangeBusiness = () => {
    setSelectedBusiness(null);
    setBusinessName('');
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (linkType === 'google_review') {
      if (!selectedBusiness) {
        setError('Silakan cari dan pilih bisnis Google Maps Anda terlebih dahulu.');
        return;
      }
      if (!businessName.trim()) {
        setError('Nama bisnis wajib diisi.');
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
      if (!businessName.trim()) {
        setError('Nama usaha atau label kartu wajib diisi.');
        return;
      }
    }

    if (!email.trim()) {
      setError('Alamat email pemulihan wajib diisi.');
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
      let finalCustomUrl = customUrl.trim();
      if (linkType === 'custom_url' && !/^https?:\/\//i.test(finalCustomUrl)) {
        finalCustomUrl = `https://${finalCustomUrl}`;
      }

      const response = await fetch('/api/cards/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          linkType,
          businessName: businessName.trim(),
          placeId: linkType === 'google_review' ? selectedBusiness?.placeId : undefined,
          businessAddress: linkType === 'google_review' ? selectedBusiness?.address : undefined,
          customUrl: linkType === 'custom_url' ? finalCustomUrl : undefined,
          email: email.trim(),
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
        businessAddress: linkType === 'google_review' ? selectedBusiness?.address : undefined,
        placeId: linkType === 'google_review' ? selectedBusiness?.placeId : null,
        destinationUrl: data.card?.destinationUrl || (linkType === 'custom_url' ? finalCustomUrl : `https://search.google.com/local/writereview?placeid=${selectedBusiness?.placeId}`),
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
            ? 'Kartu fisik NFC dan kode QR Anda sudah terhubung ke ulasan Google.'
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

          {/* Alamat Terdaftar (Google Places) */}
          {activatedData.businessAddress && (
            <div className="summary-card-row">
              <span className="summary-label">Alamat Lokasi</span>
              <div className="summary-val-sub">
                {activatedData.businessAddress}
              </div>
            </div>
          )}

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
            {activatedData.linkType === 'google_review' ? 'Buka Halaman Ulasan Google' : 'Buka Tautan Tujuan'}
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

  const isFormReadyForPin = linkType === 'google_review' ? !!selectedBusiness : !!customUrl.trim();

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

        {/* TAB 1: GOOGLE MAPS REVIEW */}
        {linkType === 'google_review' && (
          <>
            {!selectedBusiness ? (
              <div className="input-group">
                <label htmlFor="businessSearch">Cari Tempat / Usaha di Google Maps</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="businessSearch"
                    placeholder="contoh: Kedai Kopi Joni"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    disabled={searching || loading}
                    style={{ flex: 1 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="btn btn-secondary mt-1 w-full py-2 text-xs font-semibold"
                >
                  {searching ? 'Mencari di Google Maps...' : 'Cari Tempat'}
                </button>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((place) => (
                      <div key={place.placeId} className="search-result-item">
                        <div className="search-result-info">
                          <span className="search-result-name">{place.name}</span>
                          <span className="search-result-address">{place.address}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectBusiness(place)}
                          className="btn btn-primary py-1 px-3 text-xs font-semibold"
                        >
                          Pilih
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results */}
                {hasSearched && !searching && searchResults.length === 0 && (
                  <div className="info-alert mt-2">
                    Tidak ditemukan tempat dengan nama tersebut. Coba kata kunci atau lokasi yang lebih spesifik.
                  </div>
                )}
              </div>
            ) : (
              /* Selected Business Confirmation & Name Customization */
              <div className="input-group">
                <div className="flex justify-between items-center mb-1">
                  <label>Lokasi Google Review Terpilih</label>
                  <button
                    type="button"
                    onClick={handleChangeBusiness}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Ganti Lokasi
                  </button>
                </div>
                <div className="selected-business-box mb-2">
                  <div className="selected-business-check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="selected-business-info">
                    <span className="selected-business-name">{selectedBusiness.name}</span>
                    <span className="selected-business-address">{selectedBusiness.address}</span>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="businessNameInput">Nama Usaha pada Kartu</label>
                  <input
                    type="text"
                    id="businessNameInput"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Nama usaha Anda"
                    disabled={loading}
                    required
                  />
                  <span className="help-text">Nama bisnis yang akan terdaftar pada kartu Anda.</span>
                </div>
              </div>
            )}
          </>
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

        {/* Common Security & PIN Fields (Shown once business/URL is ready) */}
        {isFormReadyForPin && (
          <div className="animate-fade-in">
            <div className="input-group">
              <label htmlFor="email">Email Pemulihan</label>
              <input
                type="email"
                id="email"
                placeholder="pemilik@bisnisku.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              <span className="help-text">Digunakan untuk verifikasi dan pemulihan PIN kartu jika lupa.</span>
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
              disabled={loading}
            >
              {loading ? 'Mengaktifkan Kartu...' : 'Aktifkan Kartu Sekarang'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
