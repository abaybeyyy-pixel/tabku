'use client';

import React, { useState } from 'react';

interface OnboardingFormProps {
  cardId: string;
}

export default function OnboardingForm({ cardId }: OnboardingFormProps) {
  const [businessName, setBusinessName] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activatedData, setActivatedData] = useState<{ businessName: string; destinationUrl: string } | null>(null);
  const [resolvingUrl, setResolvingUrl] = useState(false);

  const handleResolveUrl = async () => {
    if (!destinationUrl.trim()) {
      setError('Masukkan URL Google Maps terlebih dahulu.');
      return;
    }
    setError('');
    setResolvingUrl(true);
    try {
      const res = await fetch('/api/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: destinationUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal generate link.');
      if (data.resolvedUrl) {
        setDestinationUrl(data.resolvedUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengonversi link.');
    } finally {
      setResolvingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim()) {
      setError('Nama bisnis wajib diisi.');
      return;
    }

    if (!destinationUrl.trim()) {
      setError('URL Google Review wajib diisi.');
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
          destinationUrl: destinationUrl.trim(),
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
        destinationUrl: destinationUrl.trim(),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat aktivasi.');
    } finally {
      setLoading(false);
    }
  };

  if (success && activatedData) {
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
            <span className="label">Nama Bisnis</span>
            <span className="value">{activatedData.businessName}</span>
          </div>
          <div className="summary-item">
            <span className="label">ID Kartu</span>
            <span className="value font-mono">{cardId}</span>
          </div>
          <div className="summary-item">
            <span className="label">URL Tujuan</span>
            <span className="value text-truncate">{activatedData.destinationUrl}</span>
          </div>
        </div>

        <div className="info-alert mb-4">
          <p>Simpan PIN Anda dengan aman! Anda akan membutuhkan PIN dan ID Kartu <strong>{cardId}</strong> untuk mengedit pengaturan ini di masa depan melalui halaman <code>/manage</code>.</p>
        </div>

        <a
          href={`/c/${cardId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary w-full text-center py-3 font-semibold"
        >
          Tes Kartu Saya
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-group animate-fade-in">
      {error && <div className="error-alert">{error}</div>}

      <div className="input-group">
        <label htmlFor="businessName">Nama Bisnis</label>
        <input
          type="text"
          id="businessName"
          placeholder="contoh: Kopi Kenangan Sudirman"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="input-group">
        <label htmlFor="destinationUrl">URL Google Review / Maps</label>
        <input
          type="url"
          id="destinationUrl"
          placeholder="https://search.google.com/local/writereview?placeid=..."
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          disabled={loading || resolvingUrl}
          required
        />
        <button
          type="button"
          onClick={handleResolveUrl}
          disabled={resolvingUrl || !destinationUrl}
          className="btn btn-secondary mt-2 w-full py-2 font-semibold"
          style={{ fontSize: '0.875rem' }}
        >
          {resolvingUrl ? 'Memproses Link...' : 'Generate Link Review Otomatis'}
        </button>
        <span className="help-text mt-1">Link langsung tempat pelanggan menulis ulasan. Jika Anda memasukkan link pendek (maps.app.goo.gl), klik tombol Generate di atas.</span>
      </div>

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
    </form>
  );
}
