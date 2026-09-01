'use client';

import React, { useState } from 'react';

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
}

export default function ManagePage() {
  // Login phase state
  const [cardId, setCardId] = useState('');
  const [pin, setPin] = useState('');
  const [loggedInCard, setLoggedInCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tab state within dashboard: 'details' | 'business' | 'pin'
  const [dashTab, setDashTab] = useState<'details' | 'business' | 'pin'>('details');

  // Forgot PIN state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCardId, setForgotCardId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newForgotPin, setNewForgotPin] = useState('');
  const [confirmForgotPin, setConfirmForgotPin] = useState('');

  // Business search state (for "Ganti Bisnis" tab)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<PlaceResult | null>(null);

  // Dashboard edits state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');

  // Handle standard management login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/cards/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: cardId.trim(), pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal melakukan autentikasi.');
      }

      setLoggedInCard(data.card);
      setDashTab('details');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ID Kartu atau PIN salah.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot pin - request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/cards/forgot-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: forgotCardId.trim(), email: forgotEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim kode OTP.');
      }

      setOtpSent(true);
      setSuccessMsg(data.message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengirim kode OTP.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot pin - reset with OTP
  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (newForgotPin !== confirmForgotPin) {
      setError('Konfirmasi PIN tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/cards/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: forgotCardId.trim(),
          otp: otp.trim(),
          newPin: newForgotPin,
          confirmNewPin: confirmForgotPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengatur ulang PIN.');
      }

      setSuccessMsg('PIN berhasil diperbarui. Silakan masuk kembali.');
      setIsForgotMode(false);
      setOtpSent(false);
      setCardId(forgotCardId);
      setForgotCardId('');
      setForgotEmail('');
      setOtp('');
      setNewForgotPin('');
      setConfirmForgotPin('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengatur ulang PIN.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle business search
  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('Masukkan minimal 2 karakter untuk mencari bisnis.');
      return;
    }
    setError('');
    setSuccessMsg('');
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

  // Handle update business (destination)
  const handleUpdateBusiness = async () => {
    if (!selectedBusiness) {
      setError('Silakan cari dan pilih bisnis terlebih dahulu.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/cards/update-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: loggedInCard.cardId,
          pin: pin,
          placeId: selectedBusiness.placeId,
          businessName: selectedBusiness.name,
          businessAddress: selectedBusiness.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui bisnis.');
      }

      setLoggedInCard((prev: any) => ({
        ...prev,
        businessName: selectedBusiness.name,
        businessAddress: selectedBusiness.address,
        placeId: selectedBusiness.placeId,
        destinationUrl: `https://search.google.com/local/writereview?placeid=${selectedBusiness.placeId}`,
      }));
      setSuccessMsg('Bisnis berhasil diperbarui.');
      setSelectedBusiness(null);
      setSearchQuery('');
      setDashTab('details');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui bisnis.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle change PIN inside dashboard
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (newPinInput !== confirmNewPinInput) {
      setError('PIN baru tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/cards/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: loggedInCard.cardId,
          currentPin: currentPinInput,
          newPin: newPinInput,
          confirmNewPin: confirmNewPinInput,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengubah PIN.');
      }

      setPin(newPinInput);
      setSuccessMsg('PIN berhasil diubah.');
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmNewPinInput('');
      setDashTab('details');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah PIN.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedInCard(null);
    setCardId('');
    setPin('');
    setError('');
    setSuccessMsg('');
    setSelectedBusiness(null);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <main className="min-vh flex align-items-center justify-content-center py-4 px-3 light-landing">
      <div className="onboarding-card">
        <div className="header-logo">
          <div className="logo-icon">G</div>
          <span className="card-badge">Portal</span>
        </div>

        {error && <div className="error-alert">{error}</div>}
        {successMsg && <div className="success-alert">{successMsg}</div>}

        {/* BELUM LOGIN */}
        {!loggedInCard && (
          <div>
            {!isForgotMode ? (
              /* FORM LOGIN */
              <div className="animate-fade-in">
                <div className="text-center mb-4">
                  <h1 className="h2 font-bold mb-1">Kelola Kartu Anda</h1>
                  <p className="text-muted">Masukkan detail kartu untuk memperbarui pengaturan.</p>
                </div>

                <form onSubmit={handleLogin} className="form-group">
                  <div className="input-group">
                    <label htmlFor="cardId">ID Kartu</label>
                    <input
                      type="text"
                      id="cardId"
                      placeholder="contoh: AB1234"
                      value={cardId}
                      onChange={(e) => setCardId(e.target.value.toUpperCase())}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="pin">PIN</label>
                    <input
                      type="password"
                      id="pin"
                      maxLength={6}
                      placeholder="Masukkan PIN 4-6 digit"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full py-3 font-semibold mt-2"
                    disabled={loading}
                  >
                    {loading ? 'Memverifikasi...' : 'Kelola Kartu'}
                  </button>

                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="link-btn font-semibold"
                      onClick={() => {
                        setIsForgotMode(true);
                        setError('');
                        setSuccessMsg('');
                      }}
                    >
                      Lupa PIN?
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* MODUL LUPA PIN */
              <div className="animate-fade-in">
                <div className="text-center mb-4">
                  <h1 className="h2 font-bold mb-1">Atur Ulang PIN</h1>
                  <p className="text-muted">Pulihkan menggunakan alamat email terdaftar Anda.</p>
                </div>

                {!otpSent ? (
                  /* FORM KIRIM OTP */
                  <form onSubmit={handleRequestOtp} className="form-group">
                    <div className="input-group">
                      <label htmlFor="forgotCardId">ID Kartu</label>
                      <input
                        type="text"
                        id="forgotCardId"
                        placeholder="contoh: AB1234"
                        value={forgotCardId}
                        onChange={(e) => setForgotCardId(e.target.value.toUpperCase())}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="forgotEmail">Email Terdaftar</label>
                      <input
                        type="email"
                        id="forgotEmail"
                        placeholder="pemilik@bisnisku.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-full py-3 font-semibold mt-2"
                      disabled={loading}
                    >
                      {loading ? 'Mengirim Kode...' : 'Kirim Kode OTP'}
                    </button>

                    <div className="text-center mt-3">
                      <button
                        type="button"
                        className="link-btn font-semibold"
                        onClick={() => {
                          setIsForgotMode(false);
                          setError('');
                          setSuccessMsg('');
                        }}
                      >
                        Kembali ke Login
                      </button>
                    </div>
                  </form>
                ) : (
                  /* MASUKKAN OTP DAN RESET PIN */
                  <form onSubmit={handleResetPin} className="form-group">
                    <div className="info-alert mb-3">
                      Periksa email Anda (atau log konsol terminal pada mode MVP) untuk mendapatkan kode OTP 6 digit.
                    </div>

                    <div className="input-group">
                      <label htmlFor="otp">Kode OTP 6 Digit</label>
                      <input
                        type="text"
                        id="otp"
                        maxLength={6}
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="grid-2">
                      <div className="input-group">
                        <label htmlFor="newForgotPin">PIN Baru</label>
                        <input
                          type="password"
                          id="newForgotPin"
                          maxLength={6}
                          placeholder="4-6 digit"
                          value={newForgotPin}
                          onChange={(e) => setNewForgotPin(e.target.value.replace(/\D/g, ''))}
                          disabled={loading}
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="confirmForgotPin">Konfirmasi PIN</label>
                        <input
                          type="password"
                          id="confirmForgotPin"
                          maxLength={6}
                          placeholder="Ulangi"
                          value={confirmForgotPin}
                          onChange={(e) => setConfirmForgotPin(e.target.value.replace(/\D/g, ''))}
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
                      {loading ? 'Memperbarui PIN...' : 'Atur Ulang PIN'}
                    </button>

                    <div className="text-center mt-3">
                      <button
                        type="button"
                        className="link-btn font-semibold"
                        onClick={() => {
                          setOtpSent(false);
                          setError('');
                          setSuccessMsg('');
                        }}
                      >
                        Kirim Ulang OTP
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* DASHBOARD SETELAH LOGIN */}
        {loggedInCard && (
          <div className="animate-fade-in">
            <div className="text-center mb-4">
              <h1 className="h2 font-bold mb-1">Dashboard Kartu</h1>
              <p className="text-muted">Kelola bisnis dan kontrol akses.</p>
            </div>

            {/* Tab Selector */}
            <div className="flex justify-between border-b pb-2 mb-4">
              <button
                className={`tab-btn font-semibold ${dashTab === 'details' ? 'active' : ''}`}
                onClick={() => { setDashTab('details'); setError(''); setSuccessMsg(''); }}
              >
                Ringkasan
              </button>
              <button
                className={`tab-btn font-semibold ${dashTab === 'business' ? 'active' : ''}`}
                onClick={() => { setDashTab('business'); setError(''); setSuccessMsg(''); setSelectedBusiness(null); setSearchQuery(''); setSearchResults([]); setHasSearched(false); }}
              >
                Ganti Bisnis
              </button>
              <button
                className={`tab-btn font-semibold ${dashTab === 'pin' ? 'active' : ''}`}
                onClick={() => { setDashTab('pin'); setError(''); setSuccessMsg(''); }}
              >
                Ganti PIN
              </button>
            </div>

            {/* TAB: RINGKASAN */}
            {dashTab === 'details' && (
              <div className="animate-fade-in">
                <div className="summary-box mb-4">
                  <div className="summary-item">
                    <span className="label">Nama Bisnis</span>
                    <span className="value">{loggedInCard.businessName}</span>
                  </div>
                  {loggedInCard.businessAddress && (
                    <div className="summary-item">
                      <span className="label">Alamat</span>
                      <span className="value">{loggedInCard.businessAddress}</span>
                    </div>
                  )}
                  <div className="summary-item">
                    <span className="label">ID Kartu</span>
                    <span className="value font-mono">{loggedInCard.cardId}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Status</span>
                    <span className={`status-tag ${loggedInCard.status.toLowerCase()}`}>
                      {loggedInCard.status === 'ACTIVE' ? 'AKTIF' : loggedInCard.status === 'DISABLED' ? 'NONAKTIF' : loggedInCard.status}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Email Terdaftar</span>
                    <span className="value">{loggedInCard.email}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Tujuan</span>
                    <span className="value">Google Review</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-col">
                  {loggedInCard.destinationUrl && (
                    <a
                      href={loggedInCard.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary w-full text-center py-2 font-semibold"
                    >
                      Test Review ⭐
                    </a>
                  )}
                  <a
                    href={`/c/${loggedInCard.cardId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary w-full text-center py-2 font-semibold"
                  >
                    Tes Redirect Kartu
                  </a>
                  <button
                    onClick={handleLogout}
                    className="btn btn-danger w-full py-2 font-semibold"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            )}

            {/* TAB: GANTI BISNIS */}
            {dashTab === 'business' && (
              <div className="form-group animate-fade-in">
                {!selectedBusiness ? (
                  <div className="input-group">
                    <label htmlFor="businessSearchManage">Cari Bisnis Baru</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="businessSearchManage"
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

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setDashTab('details')}
                        className="btn btn-secondary w-full py-2 font-semibold"
                        disabled={loading}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Selected business confirmation + update button */
                  <div className="input-group">
                    <label>Bisnis Baru Terpilih</label>
                    <div className="selected-business-box">
                      <div className="selected-business-check">✓</div>
                      <div className="selected-business-info">
                        <span className="selected-business-name">{selectedBusiness.name}</span>
                        <span className="selected-business-address">{selectedBusiness.address}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={handleUpdateBusiness}
                        className="btn btn-primary w-full py-2 font-semibold"
                        disabled={loading}
                      >
                        {loading ? 'Menyimpan...' : 'Perbarui Bisnis'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedBusiness(null); setSearchQuery(''); }}
                        className="btn btn-secondary w-full py-2 font-semibold"
                        disabled={loading}
                      >
                        Cari Lagi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: GANTI PIN */}
            {dashTab === 'pin' && (
              <form onSubmit={handleChangePin} className="form-group animate-fade-in">
                <div className="input-group">
                  <label htmlFor="currentPinInput">PIN Saat Ini</label>
                  <input
                    type="password"
                    id="currentPinInput"
                    maxLength={6}
                    placeholder="PIN digit saat ini"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label htmlFor="newPinInput">PIN Baru</label>
                    <input
                      type="password"
                      id="newPinInput"
                      maxLength={6}
                      placeholder="4-6 digit"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="confirmNewPinInput">Konfirmasi PIN Baru</label>
                    <input
                      type="password"
                      id="confirmNewPinInput"
                      maxLength={6}
                      placeholder="Ulangi PIN baru"
                      value={confirmNewPinInput}
                      onChange={(e) => setConfirmNewPinInput(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary w-full py-2 font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Memperbarui...' : 'Ubah PIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashTab('details')}
                    className="btn btn-secondary w-full py-2 font-semibold"
                    disabled={loading}
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
