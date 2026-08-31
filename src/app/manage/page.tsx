'use client';

import React, { useState } from 'react';

export default function ManagePage() {
  // Login phase state
  const [cardId, setCardId] = useState('');
  const [pin, setPin] = useState('');
  const [loggedInCard, setLoggedInCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resolvingUrl, setResolvingUrl] = useState(false);

  // Tab state within dashboard: 'details' | 'destination' | 'pin'
  const [dashTab, setDashTab] = useState<'details' | 'destination' | 'pin'>('details');

  // Forgot PIN state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCardId, setForgotCardId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newForgotPin, setNewForgotPin] = useState('');
  const [confirmForgotPin, setConfirmForgotPin] = useState('');

  // Dashboard edits state
  const [newDestinationUrl, setNewDestinationUrl] = useState('');
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
      setNewDestinationUrl(data.card.destinationUrl || '');
      setDashTab('details');
    } catch (err: any) {
      setError(err.message || 'ID Kartu atau PIN salah.');
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
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim kode OTP.');
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
    } catch (err: any) {
      setError(err.message || 'Gagal mengatur ulang PIN.');
    } finally {
      setLoading(false);
    }
  };

  // Handle update destination
  const handleResolveUrl = async () => {
    if (!newDestinationUrl.trim()) {
      setError('Masukkan URL Google Maps terlebih dahulu.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setResolvingUrl(true);
    try {
      const res = await fetch('/api/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newDestinationUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal generate link.');
      if (data.resolvedUrl) {
        setNewDestinationUrl(data.resolvedUrl);
        setSuccessMsg('Link berhasil di-generate! Silakan perbarui tujuan.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengonversi link.');
    } finally {
      setResolvingUrl(false);
    }
  };

  const handleUpdateDestination = async (e: React.FormEvent) => {
    e.preventDefault();
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
          newDestinationUrl: newDestinationUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui URL tujuan.');
      }

      setLoggedInCard((prev: any) => ({ ...prev, destinationUrl: newDestinationUrl.trim() }));
      setSuccessMsg('URL tujuan berhasil diperbarui.');
      setDashTab('details');
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui URL tujuan.');
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
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah PIN.');
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
  };

  return (
    <main className="min-vh flex align-items-center justify-content-center py-4 px-3">
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
              <p className="text-muted">Kelola tautan tujuan dan kontrol akses.</p>
            </div>

            {/* Tab Selector */}
            <div className="flex justify-between border-b pb-2 mb-4">
              <button
                className={`tab-btn font-semibold ${dashTab === 'details' ? 'active' : ''}`}
                onClick={() => setDashTab('details')}
              >
                Ringkasan
              </button>
              <button
                className={`tab-btn font-semibold ${dashTab === 'destination' ? 'active' : ''}`}
                onClick={() => setDashTab('destination')}
              >
                Ubah URL
              </button>
              <button
                className={`tab-btn font-semibold ${dashTab === 'pin' ? 'active' : ''}`}
                onClick={() => setDashTab('pin')}
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
                    <span className="label">URL Redirect Ulasan</span>
                    <span className="value text-truncate">{loggedInCard.destinationUrl}</span>
                  </div>
                </div>

                <div className="flex gap-2">
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

            {/* TAB: UBAH URL TUJUAN */}
            {dashTab === 'destination' && (
              <form onSubmit={handleUpdateDestination} className="form-group animate-fade-in">
                <div className="input-group">
                  <label htmlFor="newDestinationUrl">URL Google Review / Maps</label>
                  <input
                    type="url"
                    id="newDestinationUrl"
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    value={newDestinationUrl}
                    onChange={(e) => setNewDestinationUrl(e.target.value)}
                    disabled={loading || resolvingUrl}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleResolveUrl}
                    disabled={resolvingUrl || !newDestinationUrl}
                    className="btn btn-secondary mt-2 w-full py-2 font-semibold"
                    style={{ fontSize: '0.875rem' }}
                  >
                    {resolvingUrl ? 'Memproses Link...' : 'Generate Link Review Otomatis'}
                  </button>
                  <span className="help-text mt-1">Jika Anda memasukkan link pendek (maps.app.goo.gl), klik tombol Generate sebelum memperbarui.</span>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary w-full py-2 font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Menyimpan...' : 'Perbarui Tujuan'}
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
