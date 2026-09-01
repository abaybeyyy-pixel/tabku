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

  // Selected business state
  const [selectedBusiness, setSelectedBusiness] = useState<PlaceResult | null>(null);

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
    setSearchResults([]);
    setHasSearched(false);
    setError('');
  };

  const handleChangeBusiness = () => {
    setSelectedBusiness(null);
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
          businessName: selectedBusiness.name,
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
        businessName: selectedBusiness.name,
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="h3 font-bold mb-2">Kartu Review Anda Siap Digunakan!</h2>
        <p className="text-muted mb-4">Kartu NFC dan kode QR Anda sudah aktif dan terhubung.</p>

        <div className="summary-box mb-4">
          <div className="summary-item">
            <span className="label">Bisnis</span>
            <span className="value">{activatedData.businessName}</span>
          </div>
          {activatedData.businessAddress && (
            <div className="summary-item">
              <span className="label">Alamat</span>
              <span className="value">{activatedData.businessAddress}</span>
            </div>
          )}
          <div className="summary-item">
            <span className="label">ID Kartu</span>
            <span className="value font-mono">{cardId}</span>
          </div>
          <div className="summary-item">
            <span className="label">Tujuan</span>
            <span className="value">Google Review</span>
          </div>
        </div>

        <div className="info-alert mb-4">
          <p>Simpan PIN Anda dengan aman! Anda akan membutuhkan PIN dan ID Kartu <strong>{cardId}</strong> untuk mengedit pengaturan ini di masa depan melalui halaman <code>/manage</code>.</p>
        </div>

        <div className="flex gap-2 flex-col">
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary w-full text-center py-3 font-semibold"
          >
            Test Review ⭐
          </a>
          <a
            href={`/c/${cardId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary w-full text-center py-3 font-semibold"
          >
            Tes Kartu Saya
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
          <label htmlFor="businessSearch">Cari Bisnis Anda</label>
          <div className="flex gap-2">
            <input
              type="text"
              id="businessSearch"
              placeholder="contoh: Kopi Kenangan Senayan"
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
            className="btn btn-secondary mt-2 w-full py-2 font-semibold"
          >
            {searching ? 'Mencari...' : '🔍 Cari Bisnis'}
          </button>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results mt-3">
              {searchResults.map((place) => (
                <div key={place.placeId} className="search-result-item">
                  <div className="search-result-info">
                    <span className="search-result-name">{place.name}</span>
                    <span className="search-result-address">{place.address}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectBusiness(place)}
                    className="btn btn-primary py-1 font-semibold"
                    style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', paddingLeft: '16px', paddingRight: '16px' }}
                  >
                    Pilih
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {hasSearched && !searching && searchResults.length === 0 && (
            <div className="info-alert mt-3">
              <p>Tidak ditemukan bisnis dengan kata kunci tersebut. Coba kata kunci lain.</p>
            </div>
          )}
        </div>
      ) : (
        /* Selected Business Confirmation */
        <div className="input-group">
          <label>Bisnis Terpilih</label>
          <div className="selected-business-box">
            <div className="selected-business-check">✓</div>
            <div className="selected-business-info">
              <span className="selected-business-name">{selectedBusiness.name}</span>
              <span className="selected-business-address">{selectedBusiness.address}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleChangeBusiness}
            className="btn btn-secondary mt-2 w-full py-2 font-semibold"
            style={{ fontSize: '0.875rem' }}
            disabled={loading}
          >
            Ganti Bisnis
          </button>
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
            <span className="help-text">Digunakan untuk memulihkan PIN jika Anda lupa.</span>
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label htmlFor="pin">Buat PIN</label>
              <input
                type="password"
                id="pin"
                pattern="\d*"
                maxLength={6}
                placeholder="4 hingga 6 digit"
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
            className="btn btn-primary w-full py-3 font-semibold mt-2"
            disabled={loading}
          >
            {loading ? 'Mengaktifkan Kartu...' : 'Aktifkan Kartu Saya'}
          </button>
        </>
      )}
    </form>
  );
}
