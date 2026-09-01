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
  const [copiedLink, setCopiedLink] = useState(false);

  // Tab state within dashboard: 'details' | 'business' | 'pin'
  const [dashTab, setDashTab] = useState<'details' | 'business' | 'pin'>('details');

  // Edit Business Name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [customBusinessName, setCustomBusinessName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Forgot PIN state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCardId, setForgotCardId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newForgotPin, setNewForgotPin] = useState('');
  const [confirmForgotPin, setConfirmForgotPin] = useState('');

  // Business search state (for "Ganti Lokasi Bisnis" tab)
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
        body: JSON.stringify({ cardId: cardId.trim().toUpperCase(), pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal melakukan autentikasi.');
      }

      setLoggedInCard(data.card);
      setCustomBusinessName(data.card.businessName || '');
      setDashTab('details');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ID Kartu atau PIN salah.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit business name only
  const handleSaveBusinessName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBusinessName.trim()) {
      setError('Nama bisnis tidak boleh kosong.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setSavingName(true);

    try {
      const response = await fetch('/api/cards/update-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: loggedInCard.cardId,
          pin: pin,
          businessName: customBusinessName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui nama bisnis.');
      }

      setLoggedInCard((prev: any) => ({
        ...prev,
        businessName: customBusinessName.trim(),
      }));
      setSuccessMsg('Nama usaha berhasil diperbarui.');
      setIsEditingName(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui nama bisnis.';
      setError(message);
    } finally {
      setSavingName(false);
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
        body: JSON.stringify({ cardId: forgotCardId.trim().toUpperCase(), email: forgotEmail.trim() }),
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
          cardId: forgotCardId.trim().toUpperCase(),
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

  // Handle update business
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
      setCustomBusinessName(selectedBusiness.name);
      setSuccessMsg('Lokasi bisnis berhasil diperbarui.');
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
      setSuccessMsg('PIN keamanan berhasil diperbarui.');
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

  const handleCopyLink = () => {
    if (!loggedInCard) return;
    const url = `${window.location.origin}/c/${loggedInCard.cardId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
    setIsEditingName(false);
  };

  return (
    <main className="min-vh flex items-center justify-center py-6 px-3">
      <div className="onboarding-card">
        {/* HEADER */}
        <div className="header-logo">
          <a href="/" className="font-extrabold text-sm tracking-wider" style={{ color: 'var(--primary-color)' }}>
            TAPKU
          </a>
          {loggedInCard ? (
            <span className="card-badge">{loggedInCard.cardId}</span>
          ) : (
            <span className="card-badge">Portal Kelola</span>
          )}
        </div>

        {error && <div className="error-alert mb-4">{error}</div>}
        {successMsg && <div className="success-alert mb-4">{successMsg}</div>}

        {/* BELUM LOGIN */}
        {!loggedInCard && (
          <div>
            {!isForgotMode ? (
              /* FORM LOGIN */
              <div className="animate-fade-in">
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold mb-1">Kelola Kartu Anda</h1>
                  <p className="text-muted text-xs">Masukkan ID Kartu & PIN untuk mengatur ulasan dan profil bisnis.</p>
                </div>

                <form onSubmit={handleLogin} className="form-group">
                  <div className="input-group">
                    <label htmlFor="cardId">ID Kartu</label>
                    <input
                      type="text"
                      id="cardId"
                      placeholder="contoh: GR0001"
                      value={cardId}
                      onChange={(e) => setCardId(e.target.value.toUpperCase())}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="pin">PIN Keamanan</label>
                    <input
                      type="password"
                      id="pin"
                      maxLength={6}
                      placeholder="Masukkan 4-6 digit angka"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full py-3 font-semibold mt-1"
                    disabled={loading}
                  >
                    {loading ? 'Memverifikasi...' : 'Masuk ke Pengaturan'}
                  </button>

                  <div className="flex justify-between items-center text-xs mt-2">
                    <a href="/" className="text-muted hover:underline">Kembali ke Beranda</a>
                    <button
                      type="button"
                      className="link-btn text-xs font-semibold"
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
                  <h1 className="text-xl font-bold mb-1">Atur Ulang PIN</h1>
                  <p className="text-muted text-xs">Pulihkan akses melalui email yang terdaftar pada kartu.</p>
                </div>

                {!otpSent ? (
                  /* FORM KIRIM OTP */
                  <form onSubmit={handleRequestOtp} className="form-group">
                    <div className="input-group">
                      <label htmlFor="forgotCardId">ID Kartu</label>
                      <input
                        type="text"
                        id="forgotCardId"
                        placeholder="contoh: GR0001"
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
                      className="btn btn-primary w-full py-3 font-semibold mt-1"
                      disabled={loading}
                    >
                      {loading ? 'Mengirim Kode...' : 'Kirim Kode OTP'}
                    </button>

                    <div className="text-center mt-2">
                      <button
                        type="button"
                        className="link-btn text-xs font-semibold"
                        onClick={() => {
                          setIsForgotMode(false);
                          setError('');
                          setSuccessMsg('');
                        }}
                      >
                        Kembali ke Form Masuk
                      </button>
                    </div>
                  </form>
                ) : (
                  /* MASUKKAN OTP DAN RESET PIN */
                  <form onSubmit={handleResetPin} className="form-group">
                    <div className="info-alert mb-2">
                      Kode OTP 6 digit telah dikirimkan ke email terdaftar Anda.
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
                          placeholder="Ulangi PIN"
                          value={confirmForgotPin}
                          onChange={(e) => setConfirmForgotPin(e.target.value.replace(/\D/g, ''))}
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
                      {loading ? 'Menyimpan PIN...' : 'Simpan PIN Baru'}
                    </button>

                    <div className="text-center mt-2">
                      <button
                        type="button"
                        className="link-btn text-xs font-semibold"
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
              <h1 className="text-xl font-bold mb-1">Pengaturan Kartu</h1>
              <p className="text-muted text-xs">Kelola profil usaha, link ulasan Google, dan keamanan kartu Anda.</p>
            </div>

            {/* TAB SELECTOR */}
            <div className="tab-container">
              <button
                className={`tab-btn ${dashTab === 'details' ? 'active' : ''}`}
                onClick={() => { setDashTab('details'); setError(''); setSuccessMsg(''); }}
              >
                Ringkasan
              </button>
              <button
                className={`tab-btn ${dashTab === 'business' ? 'active' : ''}`}
                onClick={() => {
                  setDashTab('business');
                  setError('');
                  setSuccessMsg('');
                  setSelectedBusiness(null);
                  setSearchQuery('');
                  setSearchResults([]);
                  setHasSearched(false);
                }}
              >
                Ganti Lokasi
              </button>
              <button
                className={`tab-btn ${dashTab === 'pin' ? 'active' : ''}`}
                onClick={() => { setDashTab('pin'); setError(''); setSuccessMsg(''); }}
              >
                Ganti PIN
              </button>
            </div>

            {/* TAB 1: RINGKASAN & EDIT NAMA USAHA */}
            {dashTab === 'details' && (
              <div className="animate-fade-in flex flex-col gap-3">
                {/* Form Edit Nama Usaha Inline */}
                {isEditingName ? (
                  <form onSubmit={handleSaveBusinessName} className="p-3 border rounded-md" style={{ background: 'var(--background-accent)' }}>
                    <div className="input-group mb-2">
                      <label htmlFor="editNameInput">Nama Usaha Baru</label>
                      <input
                        type="text"
                        id="editNameInput"
                        value={customBusinessName}
                        onChange={(e) => setCustomBusinessName(e.target.value)}
                        placeholder="contoh: Kedai Kopi Joni"
                        disabled={savingName}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary flex-1 py-1.5 text-xs font-semibold"
                        disabled={savingName}
                      >
                        {savingName ? 'Menyimpan...' : 'Simpan Nama'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsEditingName(false); setCustomBusinessName(loggedInCard.businessName || ''); }}
                        className="btn btn-secondary flex-1 py-1.5 text-xs font-semibold"
                        disabled={savingName}
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : null}

                {/* DETAIL INFORMASI KARTU */}
                <div className="summary-box">
                  {/* Nama Usaha */}
                  <div className="summary-card-row">
                    <div className="flex justify-between items-center">
                      <span className="summary-label">Nama Usaha</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(!isEditingName)}
                        className="link-btn text-xs font-bold"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        Edit Nama
                      </button>
                    </div>
                    <div className="summary-val-main">
                      {loggedInCard.businessName || '-'}
                    </div>
                  </div>

                  {/* Alamat Google Maps */}
                  {loggedInCard.businessAddress && (
                    <div className="summary-card-row">
                      <span className="summary-label">Alamat Terdaftar</span>
                      <div className="summary-val-sub">
                        {loggedInCard.businessAddress}
                      </div>
                    </div>
                  )}

                  {/* Status & Email */}
                  <div className="summary-card-grid-2">
                    <div>
                      <span className="summary-label block mb-1">Status Kartu</span>
                      <span className={`status-tag ${loggedInCard.status.toLowerCase()}`}>
                        {loggedInCard.status === 'ACTIVE' ? 'Aktif' : loggedInCard.status === 'DISABLED' ? 'Nonaktif' : loggedInCard.status}
                      </span>
                    </div>
                    <div>
                      <span className="summary-label block mb-1">Email Pemulihan</span>
                      <div className="summary-val-sub font-mono" style={{ fontSize: '0.78rem' }}>
                        {loggedInCard.email}
                      </div>
                    </div>
                  </div>

                  {/* Tujuan Redirect */}
                  <div className="summary-card-row">
                    <span className="summary-label">Tujuan Redirect</span>
                    <div className="text-xs font-bold text-success flex items-center gap-1 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Google Write a Review (Bintang 5 Langsung)
                    </div>
                  </div>
                </div>

                {/* TOMBOL AKSI UTAMA (Jarak Nyaman & Bernapas) */}
                <div className="flex flex-col gap-3 mt-4">
                  {loggedInCard.destinationUrl && (
                    <a
                      href={loggedInCard.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary w-full py-3.5 px-4 font-bold text-sm"
                      style={{ fontSize: '0.9rem' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Buka Halaman Ulasan Google
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn btn-secondary w-full py-3 px-3 text-xs font-bold"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    {copiedLink ? 'Link Tersalin!' : 'Salin Link Kartu'}
                  </button>

                  <a
                    href={`/c/${loggedInCard.cardId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary w-full py-3 px-3 text-xs font-bold"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                      <line x1="12" y1="20" x2="12.01" y2="20" />
                    </svg>
                    Tes Redirect Kartu
                  </a>

                  <button
                    onClick={handleLogout}
                    className="btn btn-danger w-full py-3 font-bold text-xs"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Keluar dari Akun
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: GANTI LOKASI BISNIS VIA GOOGLE PLACES */}
            {dashTab === 'business' && (
              <div className="form-group animate-fade-in">
                {!selectedBusiness ? (
                  <div className="input-group">
                    <label htmlFor="businessSearchManage">Cari Nama Tempat / Cabang Baru</label>
                    <input
                      type="text"
                      id="businessSearchManage"
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
                    />

                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={searching || !searchQuery.trim()}
                      className="btn btn-secondary mt-1 w-full py-2 text-xs font-semibold"
                    >
                      {searching ? 'Mencari di Google Maps...' : 'Cari Tempat'}
                    </button>

                    {/* Search Results List */}
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
                        Tidak ditemukan tempat dengan nama tersebut. Coba gunakan kata kunci atau lokasi yang lebih spesifik.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setDashTab('details')}
                      className="btn btn-secondary w-full py-2 text-xs font-semibold mt-2"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  /* Selected business confirmation */
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold text-muted">Lokasi Google Review Terpilih:</label>
                    <div className="selected-business-box">
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

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleUpdateBusiness}
                        className="btn btn-primary w-full py-2.5 text-xs font-semibold"
                        disabled={loading}
                      >
                        {loading ? 'Menyimpan...' : 'Simpan Lokasi Baru'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedBusiness(null); setSearchQuery(''); }}
                        className="btn btn-secondary w-full py-2.5 text-xs font-semibold"
                        disabled={loading}
                      >
                        Cari Ulang
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: GANTI PIN */}
            {dashTab === 'pin' && (
              <form onSubmit={handleChangePin} className="form-group animate-fade-in">
                <div className="input-group">
                  <label htmlFor="currentPinInput">PIN Saat Ini</label>
                  <input
                    type="password"
                    id="currentPinInput"
                    maxLength={6}
                    placeholder="PIN saat ini"
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
                    <label htmlFor="confirmNewPinInput">Konfirmasi PIN</label>
                    <input
                      type="password"
                      id="confirmNewPinInput"
                      maxLength={6}
                      placeholder="Ulangi PIN"
                      value={confirmNewPinInput}
                      onChange={(e) => setConfirmNewPinInput(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="btn btn-primary w-full py-2.5 text-xs font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Menyimpan...' : 'Ubah PIN Keamanan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashTab('details')}
                    className="btn btn-secondary w-full py-2.5 text-xs font-semibold"
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
