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

  // Link Type mode within 'business' tab: 'google_review' | 'custom_url'
  const [manageLinkType, setManageLinkType] = useState<'google_review' | 'custom_url'>('google_review');
  const [editCustomUrl, setEditCustomUrl] = useState('');
  const [editCustomName, setEditCustomName] = useState('');
  const [savingCustomLink, setSavingCustomLink] = useState(false);

  // Edit Business Name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [customBusinessName, setCustomBusinessName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Forgot PIN state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCardId, setForgotCardId] = useState('');

  // Business search state (for "Tujuan Kartu" Google Maps tab)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<PlaceResult | null>(null);

  // Dashboard edits state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Belum ada interaksi tap';
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB'
      );
    } catch {
      return dateStr;
    }
  };

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
      setEditCustomName(data.card.businessName || '');
      setEditCustomUrl(data.card.destinationUrl || '');
      setManageLinkType(data.card.placeId ? 'google_review' : 'custom_url');
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

  // Handle save custom link
  const handleSaveCustomLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomUrl.trim()) {
      setError('URL tujuan wajib diisi.');
      return;
    }
    let formattedUrl = editCustomUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    try {
      new URL(formattedUrl);
    } catch {
      setError('Format URL tidak valid. Contoh: https://instagram.com/tokoanda');
      return;
    }
    if (!editCustomName.trim()) {
      setError('Nama usaha atau label wajib diisi.');
      return;
    }

    setSavingCustomLink(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/cards/update-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: loggedInCard.cardId,
          pin,
          linkType: 'custom_url',
          customUrl: formattedUrl,
          businessName: editCustomName.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui tautan.');
      }

      setLoggedInCard((prev: any) => ({
        ...prev,
        businessName: editCustomName.trim(),
        destinationUrl: formattedUrl,
        placeId: null,
        businessAddress: null,
      }));
      setCustomBusinessName(editCustomName.trim());
      setSuccessMsg('Tautan tujuan kartu berhasil diperbarui.');
      setDashTab('details');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui tautan.';
      setError(message);
    } finally {
      setSavingCustomLink(false);
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
            MYCARRD
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
                  <p className="text-muted text-xs">Masukkan ID Kartu &amp; PIN untuk mengatur ulasan dan profil bisnis.</p>
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
              /* MODUL LUPA PIN (WHATSAPP ADMIN ASSISTED) */
              <div className="animate-fade-in">
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold mb-1">Bantuan Reset PIN</h1>
                  <p className="text-muted text-xs">
                    Hubungi Admin resmi Mycarrd via WhatsApp untuk verifikasi &amp; reset PIN kartu Anda.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!forgotCardId.trim()) {
                      setError('ID Kartu wajib diisi.');
                      return;
                    }
                    if (!forgotEmail.trim()) {
                      setError('Email terdaftar wajib diisi.');
                      return;
                    }

                    const message = `Halo Admin Mycarrd (mycarrd.com), saya ingin meminta bantuan reset PIN untuk kartu pintar saya.\n\n• ID Kartu: ${forgotCardId.trim().toUpperCase()}\n• Email Terdaftar: ${forgotEmail.trim()}\n\nMohon bantuannya untuk verifikasi dan reset PIN kartu saya. Terima kasih!`;
                    const waUrl = `https://wa.me/6281211156865?text=${encodeURIComponent(message)}`;
                    window.open(waUrl, '_blank');
                  }}
                  className="form-group"
                >
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
                    <label htmlFor="forgotEmail">Email yang Didaftarkan Sebelumnya</label>
                    <input
                      type="email"
                      id="forgotEmail"
                      placeholder="contoh: pemilik@bisnisku.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1 my-1">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Verifikasi Aman via WhatsApp Resmi
                    </div>
                    <p className="text-emerald-700 leading-relaxed text-[11px]">
                      Admin akan mencocokkan email Anda dengan data pendaftaran di database untuk memastikan keamanan akun sebelum mereset PIN baru.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="btn w-full py-3 font-semibold mt-1 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>Hubungi Admin via WhatsApp</span>
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
                  setEditCustomUrl(loggedInCard.destinationUrl || '');
                  setEditCustomName(loggedInCard.businessName || '');
                  setManageLinkType(loggedInCard.placeId ? 'google_review' : 'custom_url');
                }}
              >
                Tujuan Kartu
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
                {/* 1. TOP STATS ROW (2 Clean Metric Cards) */}
                <div className="grid-2 gap-2.5">
                  {/* Total Tap Card */}
                  <div className="stat-metric-card">
                    <div className="stat-metric-header">
                      <div className="stat-metric-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                          <line x1="12" y1="20" x2="12.01" y2="20" />
                        </svg>
                      </div>
                      <span className="stat-metric-title">Total Tap</span>
                    </div>
                    <div className="stat-metric-body">
                      <span className="stat-metric-num">{loggedInCard.tapCount || 0}</span>
                      <span className="stat-metric-unit">kali dibuka</span>
                    </div>
                  </div>

                  {/* Terakhir Ditempel Card */}
                  <div className="stat-metric-card">
                    <div className="stat-metric-header">
                      <div className="stat-metric-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <span className="stat-metric-title">Aktivitas Terakhir</span>
                    </div>
                    <div className="stat-metric-body">
                      <span className="stat-metric-text">
                        {loggedInCard.lastTappedAt ? formatDateTime(loggedInCard.lastTappedAt) : 'Belum ada tap'}
                      </span>
                    </div>
                  </div>
                </div>

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

                {/* 2. DETAIL INFORMASI KARTU UTAMA */}
                <div className="summary-box">
                  {/* Top Bar: ID Kartu + Status Tag */}
                  <div className="flex justify-between items-center pb-2.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted font-medium">ID Kartu:</span>
                      <span
                        className="font-mono font-bold text-xs px-2 py-0.5 rounded"
                        style={{ background: 'var(--background-accent)', color: 'var(--foreground)' }}
                      >
                        {loggedInCard.cardId}
                      </span>
                    </div>
                    <span className={`status-tag ${loggedInCard.status.toLowerCase()}`}>
                      {loggedInCard.status === 'ACTIVE' ? 'Aktif' : loggedInCard.status === 'DISABLED' ? 'Nonaktif' : loggedInCard.status}
                    </span>
                  </div>

                  {/* Nama Usaha */}
                  <div className="summary-card-row">
                    <div className="flex justify-between items-center">
                      <span className="summary-label">Nama Usaha / Label</span>
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

                  {/* Alamat Google Maps (Jika tipe Google Maps) */}
                  {loggedInCard.placeId && loggedInCard.businessAddress && (
                    <div className="summary-card-row">
                      <span className="summary-label">Alamat Terdaftar</span>
                      <div className="summary-val-sub">
                        {loggedInCard.businessAddress}
                      </div>
                    </div>
                  )}

                  {/* Email Pemulihan */}
                  <div className="summary-card-row">
                    <span className="summary-label">Email Pemulihan</span>
                    <div className="summary-val-sub font-mono" style={{ fontSize: '0.78rem' }}>
                      {loggedInCard.email}
                    </div>
                  </div>

                  {/* Tujuan Redirect */}
                  <div className="summary-card-row">
                    <span className="summary-label">Tujuan Redirect</span>
                    {loggedInCard.placeId ? (
                      <div className="text-xs font-bold text-success flex items-center gap-1 mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Google Write a Review (Bintang 5 Langsung)
                      </div>
                    ) : (
                      <div className="text-xs font-mono font-semibold text-blue-600 break-all mt-0.5 flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        {loggedInCard.destinationUrl}
                      </div>
                    )}
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
                      {loggedInCard.placeId ? 'Buka Halaman Ulasan Google' : 'Buka Tautan Tujuan'}
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

            {/* TAB 2: GANTI TUJUAN KARTU (GOOGLE MAPS ATAU CUSTOM LINK) */}
            {dashTab === 'business' && (
              <div className="animate-fade-in">
                {/* SUB-TABS: GOOGLE MAPS VS CUSTOM LINK */}
                <div className="link-type-selector mb-3.5">
                  <button
                    type="button"
                    className={`link-type-tab ${manageLinkType === 'google_review' ? 'active' : ''}`}
                    onClick={() => {
                      setManageLinkType('google_review');
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
                    className={`link-type-tab ${manageLinkType === 'custom_url' ? 'active' : ''}`}
                    onClick={() => {
                      setManageLinkType('custom_url');
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

                {/* PILIHAN 1: GOOGLE MAPS REVIEW */}
                {manageLinkType === 'google_review' && (
                  <div className="form-group animate-fade-in">
                    {!selectedBusiness ? (
                      <div className="input-group">
                        <label htmlFor="businessSearchManage">Cari Nama Tempat / Cabang Google Maps</label>
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

                {/* PILIHAN 2: CUSTOM LINK */}
                {manageLinkType === 'custom_url' && (
                  <form onSubmit={handleSaveCustomLink} className="form-group animate-fade-in">
                    <div className="input-group">
                      <label htmlFor="manageCustomUrl">URL Tujuan Bebas</label>
                      <input
                        type="text"
                        id="manageCustomUrl"
                        value={editCustomUrl}
                        onChange={(e) => setEditCustomUrl(e.target.value)}
                        placeholder="https://instagram.com/tokoanda atau https://wa.me/..."
                        disabled={savingCustomLink}
                        required
                      />
                      <span className="help-text">
                        Kartu akan otomatis membuka tautan ini saat di-tap via NFC atau di-scan QR.
                      </span>
                    </div>

                    <div className="input-group">
                      <label htmlFor="manageCustomName">Nama Usaha / Label Kartu</label>
                      <input
                        type="text"
                        id="manageCustomName"
                        value={editCustomName}
                        onChange={(e) => setEditCustomName(e.target.value)}
                        placeholder="contoh: Kedai Kopi Joni"
                        disabled={savingCustomLink}
                        required
                      />
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        className="btn btn-primary w-full py-2.5 text-xs font-semibold"
                        disabled={savingCustomLink}
                      >
                        {savingCustomLink ? 'Menyimpan...' : 'Simpan Tautan Custom'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashTab('details')}
                        className="btn btn-secondary w-full py-2.5 text-xs font-semibold"
                        disabled={savingCustomLink}
                      >
                        Batal
                      </button>
                    </div>
                  </form>
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
