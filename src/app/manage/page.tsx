'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  destinationUrl?: string;
  source?: 'google' | 'url' | 'osm' | 'direct';
  isDirect?: boolean;
}

interface LoggedInCard {
  cardId: string;
  businessName?: string | null;
  destinationUrl?: string | null;
  placeId?: string | null;
  businessAddress?: string | null;
  status?: string;
  email?: string;
  tapCount?: number;
  qrCount?: number;
  lastTappedAt?: string | null;
  activatedAt?: string | null;
  updatedAt?: string | null;
}

export default function ManagePage() {
  // Login phase state
  const [cardId, setCardId] = useState('');
  const [pin, setPin] = useState('');
  const [loggedInCard, setLoggedInCard] = useState<LoggedInCard | null>(null);
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
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotCardId, setForgotCardId] = useState('');

  // Google Maps link convert state (for "Tujuan Kartu" Google Maps tab)
  const [manageGoogleMapsUrl, setManageGoogleMapsUrl] = useState('');
  const [convertingManageLink, setConvertingManageLink] = useState(false);
  const [convertedManageReview, setConvertedManageReview] = useState<{
    name: string;
    placeId: string | null;
    reviewUrl: string;
    address: string;
  } | null>(null);

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
    if (!loggedInCard) return;
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

      setLoggedInCard((prev) => (prev ? {
        ...prev,
        businessName: customBusinessName.trim(),
      } : null));
      setSuccessMsg('Nama usaha berhasil diperbarui.');
      setIsEditingName(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui nama bisnis.';
      setError(message);
    } finally {
      setSavingName(false);
    }
  };

  // Handle convert Google Maps link into direct 5-star review link
  const handleConvertManageLink = async (urlToConvert?: string) => {
    const rawUrl = (urlToConvert ?? manageGoogleMapsUrl).trim();
    if (!rawUrl) {
      setError('Masukkan atau tempel tautan Google Maps usaha Anda.');
      return null;
    }

    setConvertingManageLink(true);
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

      const reviewData = {
        name: data.name || loggedInCard?.businessName || 'Usaha Google Maps',
        placeId: data.placeId || null,
        reviewUrl: data.destinationUrl || rawUrl,
        address: data.address || 'Terverifikasi dari tautan Google Maps',
      };

      setConvertedManageReview(reviewData);
      return reviewData;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Tautan tidak valid atau gagal diproses.';
      setError(message);
      return null;
    } finally {
      setConvertingManageLink(false);
    }
  };

  const handleManageUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && (pastedText.includes('google.com/maps') || pastedText.includes('goo.gl') || pastedText.includes('http'))) {
      setManageGoogleMapsUrl(pastedText);
      setTimeout(() => {
        handleConvertManageLink(pastedText);
      }, 50);
    }
  };

  // Handle update Google Maps destination
  const handleUpdateGoogleReview = async () => {
    if (!loggedInCard) return;

    let review = convertedManageReview;
    if (!review) {
      review = await handleConvertManageLink(manageGoogleMapsUrl);
      if (!review) return;
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
          placeId: review.placeId || undefined,
          businessName: review.name,
          businessAddress: review.address,
          customUrl: review.reviewUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui tujuan kartu.');
      }

      const finalDest = data.card?.destinationUrl || review.reviewUrl;

      setLoggedInCard((prev) => (prev ? {
        ...prev,
        businessName: review.name,
        businessAddress: review.address,
        placeId: review.placeId,
        destinationUrl: finalDest,
      } : null));
      setCustomBusinessName(review.name);
      setSuccessMsg('Tujuan kartu berhasil dihubungkan ke ulasan bintang 5 Google Maps.');
      setConvertedManageReview(null);
      setManageGoogleMapsUrl('');
      setDashTab('details');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui ulasan Google Maps.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle save custom link
  const handleSaveCustomLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInCard) return;
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

      setLoggedInCard((prev) => (prev ? {
        ...prev,
        businessName: editCustomName.trim(),
        destinationUrl: formattedUrl,
        placeId: null,
        businessAddress: null,
      } : null));
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
    if (!loggedInCard) return;
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
    setManageGoogleMapsUrl('');
    setConvertedManageReview(null);
    setConvertingManageLink(false);
    setIsEditingName(false);
  };

  return (
    <main className="min-vh flex items-center justify-center py-6 px-3">
      <div className="onboarding-card">
        {/* HEADER */}
        <div className="header-logo">
          <Link href="/" className="font-extrabold text-sm tracking-wider" style={{ color: 'var(--primary-color)' }}>
            MYCARRD
          </Link>
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
                    <Link href="/" className="text-muted hover:underline">Kembali ke Beranda</Link>
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
                    if (!forgotPhone.trim()) {
                      setError('Nomor WhatsApp terdaftar wajib diisi.');
                      return;
                    }

                    const message = `Halo Admin Mycarrd (mycarrd.com), saya ingin meminta bantuan reset PIN untuk kartu pintar saya.\n\n• ID Kartu: ${forgotCardId.trim().toUpperCase()}\n• No. WhatsApp Terdaftar: ${forgotPhone.trim()}\n\nMohon bantuannya untuk verifikasi dan reset PIN kartu saya. Terima kasih!`;
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
                    <label htmlFor="forgotPhone">Nomor WhatsApp yang Didaftarkan</label>
                    <input
                      type="tel"
                      id="forgotPhone"
                      placeholder="contoh: 081234567890"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
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
                      Admin akan mencocokkan nomor WhatsApp Anda dengan data pendaftaran di database untuk memastikan keamanan akun sebelum mereset PIN baru.
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
                  setManageGoogleMapsUrl('');
                  setConvertedManageReview(null);
                  setConvertingManageLink(false);
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
                      <span className="stat-metric-title">Total Interaksi</span>
                    </div>
                    <div className="stat-metric-body">
                      <span className="stat-metric-num">{loggedInCard.tapCount || 0}</span>
                      <span className="stat-metric-unit">
                        {loggedInCard.qrCount && loggedInCard.qrCount > 0 
                          ? `(Tap: ${Math.max(0, (loggedInCard.tapCount || 0) - loggedInCard.qrCount)} • QR: ${loggedInCard.qrCount})`
                          : 'kali dibuka (NFC & QR)'}
                      </span>
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
                        {loggedInCard.lastTappedAt ? formatDateTime(loggedInCard.lastTappedAt) : 'Belum ada tap/scan'}
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
                    <span className={`status-tag ${(loggedInCard.status || 'ACTIVE').toLowerCase()}`}>
                      {loggedInCard.status === 'ACTIVE' ? 'Aktif' : loggedInCard.status === 'DISABLED' ? 'Nonaktif' : (loggedInCard.status || 'Aktif')}
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

                  {/* Kontak Pemulihan (WhatsApp / Email) */}
                  <div className="summary-card-row">
                    <span className="summary-label">
                      {loggedInCard.email && /^[0-9+]+$/.test(loggedInCard.email.replace(/[\s-]/g, ''))
                        ? 'No. WhatsApp Pemilik'
                        : 'Email / Kontak Pemulihan'}
                    </span>
                    <div className="summary-val-sub font-mono" style={{ fontSize: '0.78rem' }}>
                      {loggedInCard.email}
                    </div>
                  </div>

                  {/* Tujuan Redirect */}
                  <div className="summary-card-row">
                    <div className="flex items-center justify-between">
                      <span className="summary-label">Tujuan Redirect Kartu</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: loggedInCard.placeId ? '#ecfdf5' : '#eff6ff',
                          color: loggedInCard.placeId ? '#047857' : '#1d4ed8',
                          border: `1px solid ${loggedInCard.placeId ? '#a7f3d0' : '#bfdbfe'}`,
                          fontSize: '0.68rem',
                        }}
                      >
                        {loggedInCard.placeId ? 'Google Maps Review' : 'Custom Link'}
                      </span>
                    </div>

                    {loggedInCard.placeId ? (
                      <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mt-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Google Write a Review</span>
                      </div>
                    ) : (
                      <div className="text-xs font-mono font-semibold text-blue-600 break-all mt-1 flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        <span>{loggedInCard.destinationUrl}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* TOMBOL AKSI UTAMA (RINGKAS & MINIMALIS) */}
                <div className="flex flex-col gap-3 mt-4">
                  <div className="flex gap-2">
                    <a
                      href={`/c/${loggedInCard.cardId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Buka Link Kartu
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="btn btn-secondary flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      {copiedLink ? 'Tersalin!' : 'Salin Link'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-logout"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <div className="mb-3">
                  <span className="text-xs font-bold text-slate-800 block mb-1">Pilih Mode Tujuan Kartu:</span>
                  <p className="text-muted text-xs">
                    Tentukan ke mana kartu fisik NFC dan kode QR Anda akan mengarahkan pelanggan saat disentuh.
                  </p>
                </div>

                {/* 2 BESAR PILIHAN KARTU (GOOGLE MAPS VS CUSTOM LINK) */}
                <div className="dest-choice-grid">
                  {/* Pilihan 1: Google Maps Review */}
                  <div
                    className={`dest-choice-card ${manageLinkType === 'google_review' ? 'active' : ''}`}
                    onClick={() => {
                      setManageLinkType('google_review');
                      setError('');
                    }}
                  >
                    <div className="dest-choice-header">
                      <div className="dest-choice-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <span className="dest-choice-title">Google Maps Review</span>
                        {loggedInCard.placeId && (
                          <span className="dest-choice-badge bg-emerald-100 text-emerald-800 ml-1.5 inline-block">
                            Aktif
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="dest-choice-desc">
                      Otomatis membuka ulasan bintang 5 profil Google Bisnis Anda.
                    </span>
                  </div>

                  {/* Pilihan 2: Custom Link URL */}
                  <div
                    className={`dest-choice-card ${manageLinkType === 'custom_url' ? 'active' : ''}`}
                    onClick={() => {
                      setManageLinkType('custom_url');
                      setError('');
                    }}
                  >
                    <div className="dest-choice-header">
                      <div className="dest-choice-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      </div>
                      <div>
                        <span className="dest-choice-title">Custom Link URL</span>
                        {!loggedInCard.placeId && loggedInCard.destinationUrl && (
                          <span className="dest-choice-badge bg-blue-100 text-blue-800 ml-1.5 inline-block">
                            Aktif
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="dest-choice-desc">
                      Arahkan ke WhatsApp, Instagram, TikTok, Website, Menu, dll.
                    </span>
                  </div>
                </div>

                {/* PILIHAN 1: GOOGLE MAPS REVIEW (COPY LINK TO 5-STAR DIRECT) */}
                {manageLinkType === 'google_review' && (
                  <div className="form-group animate-fade-in">
                    {!convertedManageReview ? (
                      <div className="input-group">
                        <label htmlFor="manageGoogleMapsUrl">Tautan Google Maps Usaha</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            id="manageGoogleMapsUrl"
                            placeholder="https://maps.app.goo.gl/... atau google.com/maps/place/..."
                            value={manageGoogleMapsUrl}
                            onChange={(e) => {
                              setManageGoogleMapsUrl(e.target.value);
                              if (convertedManageReview) setConvertedManageReview(null);
                            }}
                            onPaste={handleManageUrlPaste}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConvertManageLink();
                              }
                            }}
                            disabled={convertingManageLink || loading}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => handleConvertManageLink()}
                            disabled={convertingManageLink || loading || !manageGoogleMapsUrl.trim()}
                            className="btn btn-primary py-2 px-4 text-xs font-semibold whitespace-nowrap"
                          >
                            {convertingManageLink ? 'Memproses...' : 'Cek Link'}
                          </button>
                        </div>
                        <span className="help-text">
                          Buka Google Maps &gt; cari usaha Anda &gt; klik Bagikan &gt; Salin Link lalu tempel di sini.
                        </span>

                        <button
                          type="button"
                          onClick={() => setDashTab('details')}
                          className="btn btn-secondary w-full py-2.5 text-xs font-semibold mt-3"
                        >
                          Batal & Kembali ke Ringkasan
                        </button>
                      </div>
                    ) : (
                      /* Converted 5-Star Review Confirmation */
                      <div className="flex flex-col gap-3 animate-fade-in">
                        <label className="text-xs font-semibold text-muted">Lokasi Google Review Terverifikasi:</label>
                        <div className="selected-business-box">
                          <div className="selected-business-check">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <div className="selected-business-info">
                            <span className="selected-business-name">{convertedManageReview.name}</span>
                            <span className="selected-business-address">
                              Otomatis diubah menjadi tautan ulasan bintang 5 langsung
                            </span>
                            <a
                              href={convertedManageReview.reviewUrl}
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

                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={handleUpdateGoogleReview}
                            className="btn btn-primary w-full py-2.5 text-xs font-semibold"
                            disabled={loading}
                          >
                            {loading ? 'Menyimpan...' : 'Simpan Lokasi Google Maps'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConvertedManageReview(null);
                              setManageGoogleMapsUrl('');
                            }}
                            className="btn btn-secondary w-full py-2.5 text-xs font-semibold"
                            disabled={loading}
                          >
                            Ganti Link
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
                      <label htmlFor="manageCustomUrl">URL Tautan Tujuan Bebas</label>
                      
                      {/* PRESET CHIPS */}
                      <div className="preset-chips-wrap">
                        <span className="text-[11px] font-semibold text-slate-500 self-center mr-1">Template:</span>
                        <button
                          type="button"
                          className="preset-chip"
                          onClick={() => setEditCustomUrl('https://wa.me/62')}
                        >
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          className="preset-chip"
                          onClick={() => setEditCustomUrl('https://instagram.com/')}
                        >
                          Instagram
                        </button>
                        <button
                          type="button"
                          className="preset-chip"
                          onClick={() => setEditCustomUrl('https://tiktok.com/@')}
                        >
                          TikTok
                        </button>
                        <button
                          type="button"
                          className="preset-chip"
                          onClick={() => setEditCustomUrl('https://linktr.ee/')}
                        >
                          Linktree
                        </button>
                        <button
                          type="button"
                          className="preset-chip"
                          onClick={() => setEditCustomUrl('https://')}
                        >
                          Website
                        </button>
                      </div>

                      <input
                        type="text"
                        id="manageCustomUrl"
                        value={editCustomUrl}
                        onChange={(e) => setEditCustomUrl(e.target.value)}
                        placeholder="https://instagram.com/tokoanda atau https://wa.me/628..."
                        disabled={savingCustomLink}
                        required
                      />

                      {/* Live Link Test Preview */}
                      {editCustomUrl.trim().length > 4 && (
                        <div className="url-preview-card">
                          <div className="flex items-center gap-1.5 overflow-hidden text-xs">
                            <span className="text-slate-400">Target:</span>
                            <span className="font-mono text-blue-600 truncate font-semibold">
                              {/^https?:\/\//i.test(editCustomUrl.trim()) ? editCustomUrl.trim() : `https://${editCustomUrl.trim()}`}
                            </span>
                          </div>
                          <a
                            href={/^https?:\/\//i.test(editCustomUrl.trim()) ? editCustomUrl.trim() : `https://${editCustomUrl.trim()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary py-1 px-2 text-[11px] font-bold flex-shrink-0 flex items-center gap-1"
                          >
                            <span>Tes Link</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        </div>
                      )}

                      <span className="help-text">
                        Kartu fisik NFC dan kode QR akan otomatis membuka tautan ini saat disentuh oleh pelanggan.
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

                    <div className="flex gap-2 mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary w-full py-2.5 text-xs font-semibold"
                        disabled={savingCustomLink}
                      >
                        {savingCustomLink ? 'Menyimpan Tautan...' : 'Simpan Tautan Custom'}
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
