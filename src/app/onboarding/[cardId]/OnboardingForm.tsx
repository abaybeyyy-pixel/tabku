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
  // Business search state
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
    businessAddress: string;
    placeId: string;
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

    if (!selectedBusiness) {
      setError('Silakan cari dan pilih bisnis Anda terlebih dahulu.');
      return;
    }

    if (!businessName.trim()) {
      setError('Nama bisnis wajib diisi.');
      return;
    }

    if (!email.trim()) {
      setError('Alamat email wajib diisi.');
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
          businessName: businessName.trim(),
          placeId: selectedBusiness.placeId,
          businessAddress: selectedBusiness.address,
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
        businessAddress: selectedBusiness.address,
        placeId: selectedBusiness.placeId,
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
    const reviewUrl = `https://search.google.com/local/writereview?placeid=${activatedData.placeId}`;
    return (
      <div className="text-center animate-fade-in">
        <div className="success-icon mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Kartu Review Anda Telah Aktif</h2>
        <p className="text-muted text-xs mb-4">Kartu fisik NFC dan kode QR Anda sudah terhubung ke ulasan Google.</p>

        <div className="summary-box mb-4">
          <div className="summary-item">
            <span className="label">Nama Bisnis</span>
            <span className="value">{activatedData.businessName}</span>
          </div>
          {activatedData.businessAddress && (
            <div className="summary-item">
              <span className="label">Alamat</span>
              <span className="value text-xs text-muted">{activatedData.businessAddress}</span>
            </div>
          )}
          <div className="summary-item">
            <span className="label">ID Kartu</span>
            <span className="value font-mono">{cardId}</span>
          </div>
          <div className="summary-item">
            <span className="label">Tujuan</span>
            <span className="value text-success font-semibold">Google Write a Review</span>
          </div>
        </div>

        <div className="info-alert mb-4">
          Simpan PIN Anda dengan aman. PIN dan ID Kartu <strong>{cardId}</strong> digunakan untuk mengedit pengaturan di portal kelola.
        </div>

        <div className="flex gap-2 flex-col">
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary w-full text-center py-2.5 font-semibold text-xs"
          >
            Buka Halaman Ulasan Google
          </a>
          <a
            href={`/c/${cardId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary w-full text-center py-2.5 font-semibold text-xs"
          >
            Tes Redirect Kartu
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-group animate-fade-in">
      {error && <div className="error-alert">{error}</div>}

      {/* Business Search Section */}
      {!selectedBusiness ? (
        <div className="input-group">
          <label htmlFor="businessSearch">Cari Tempat / Usaha Anda</label>
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
          <label>Lokasi Google Review Terpilih</label>
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
            <span className="help-text">Anda dapat menyesuaikan nama yang tampil sesuai kebutuhan.</span>
          </div>
        </div>
      )}

      {/* Only show remaining fields after business is selected */}
      {selectedBusiness && (
        <>
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
        </>
      )}
    </form>
  );
}
