'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [cards, setCards] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, active: 0, unactivated: 0, disabled: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bulk generator state
  const [genPrefix, setGenPrefix] = useState('GR');
  const [genCount, setGenCount] = useState(10);
  const [generating, setGenerating] = useState(false);

  // Card detail dialog / PIN reset dialog state
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [newPinInput, setNewPinInput] = useState('');
  const [updatingCard, setUpdatingCard] = useState(false);

  // Print Label Preview Modal state
  const [printLabelCardId, setPrintLabelCardId] = useState<string>('');
  const [printLabelDataUrl, setPrintLabelDataUrl] = useState<string>('');

  // Show QR Preview Modal state
  const [showQrCardId, setShowQrCardId] = useState<string>('');
  const [showQrDataUrl, setShowQrDataUrl] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('admin_password');
    if (!saved) {
      router.push('/admin/login');
    } else {
      setPassword(saved);
      fetchData(saved);
    }
  }, [router]);

  const fetchData = async (pw: string, searchQuery = search, statusQ = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/admin/cards?search=${encodeURIComponent(searchQuery)}&status=${statusQ}`;
      const response = await fetch(url, {
        headers: { 'x-admin-password': pw },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('admin_password');
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch cards data.');
      }

      const data = await response.json();
      setCards(data.cards || []);
      setStats(data.stats || { total: 0, active: 0, unactivated: 0, disabled: 0 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    fetchData(password, e.target.value, statusFilter);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchData(password, search, status);
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          prefix: genPrefix.trim().toUpperCase(),
          count: genCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate cards.');
      }

      setSuccess(`✓ Berhasil membuat ${data.count} kartu baru.`);
      fetchData(password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate cards.';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCardAction = async (cardId: string, action: 'disable' | 'reactivate') => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/cards/${cardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Action failed.');
      }

      setSuccess(data.message);
      fetchData(password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed.';
      setError(message);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    setUpdatingCard(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/cards/${selectedCard.card_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ action: 'reset-pin', newPin: newPinInput }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset PIN.');
      }

      setSuccess(`✓ PIN kartu ${selectedCard.card_id} berhasil diubah.`);
      setSelectedCard(null);
      setNewPinInput('');
      fetchData(password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset PIN.';
      setError(message);
    } finally {
      setUpdatingCard(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + ['Card ID,Permanent URL,Destination,Status'].join(',') + '\n'
      + cards.map(c => `${c.card_id},${window.location.origin}/c/${c.card_id},"${c.destination_url || ''}",${c.status}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tapku_cards_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const handleExportPDF = async () => {
    setLoading(true);
    setError('');
    try {
      const { jsPDF } = await import('jspdf');
      
      const cardIds = cards.map(c => c.card_id);
      if (cardIds.length === 0) {
        throw new Error('Tidak ada kartu untuk diekspor.');
      }

      const response = await fetch('/api/admin/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ cardIds, format: 'png' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate QRs for PDF.');
      }

      const qrResults = data.results || [];
      const doc = new jsPDF();
      
      let x = 15;
      let y = 20;
      const size = 45;
      const spacingX = 15;
      const spacingY = 20;
      const cardsPerRow = 3;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Tapku NFC/QR Card Sheets', 15, 12);
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 12);
      doc.line(15, 14, 195, 14);

      for (let i = 0; i < qrResults.length; i++) {
        const qr = qrResults[i];
        
        doc.addImage(qr.data, 'PNG', x, y, size, size);
        
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'bold');
        doc.text(`CARD ID: ${qr.cardId}`, x + (size / 2), y + size + 5, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('Helvetica', 'normal');
        doc.text(`/c/${qr.cardId}`, x + (size / 2), y + size + 9, { align: 'center' });

        if ((i + 1) % cardsPerRow === 0) {
          x = 15;
          y += size + spacingY;
          
          if (y + size + spacingY > 280 && i < qrResults.length - 1) {
            doc.addPage();
            y = 20;
          }
        } else {
          x += size + spacingX;
        }
      }

      doc.save(`tapku_qr_codes_${Date.now()}.pdf`);
      setSuccess('✓ PDF lembar QR berhasil diunduh.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export QRs to PDF.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Show QR preview
  const handleShowQR = async (cardId: string) => {
    setError('');
    setLoadingQr(true);
    setShowQrCardId(cardId);
    try {
      const response = await fetch('/api/admin/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ cardIds: [cardId], format: 'png' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate QR.');
      setShowQrDataUrl(data.results[0].data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to show QR.';
      setError(message);
      setShowQrCardId('');
    } finally {
      setLoadingQr(false);
    }
  };

  // Export Print-Ready PNG
  const handleDownloadPrintPNG = async (cardId: string) => {
    setError('');
    try {
      const response = await fetch('/api/admin/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ cardIds: [cardId], format: 'png' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate QR PNG.');
      }

      const qrBase64 = data.results[0].data;

      const img = new Image();
      img.onload = () => {
        const qrSize = 400;
        const padding = 30;
        const labelHeight = 40;
        const canvas = document.createElement('canvas');
        canvas.width = qrSize + (padding * 2);
        canvas.height = qrSize + (padding * 2) + labelHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding, qrSize, qrSize);

        ctx.fillStyle = '#18181b';
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(cardId, canvas.width / 2, qrSize + padding + 28);

        const pngUrl = canvas.toDataURL('image/png');
        
        setPrintLabelDataUrl(pngUrl);
        setPrintLabelCardId(cardId);

        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `qr_${cardId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src = qrBase64;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export Print PNG.';
      setError(message);
    }
  };

  const handlePrintDirectly = (cardId: string, dataUrl: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Pop-up blocker mencegah pencetakan. Izinkan pop-up dan coba lagi.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label ${cardId}</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
            @media print {
              body { margin: 0; }
              img { max-width: 100%; max-height: 100%; }
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); setTimeout(function() { window.close(); }, 500);" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_password');
    router.push('/admin/login');
  };

  return (
    <main className="container py-4" style={{ maxWidth: '980px' }}>
      {/* TOPBAR */}
      <header className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="logo-icon">G</div>
          <div>
            <h1 className="text-lg font-bold">Tapku Dashboard</h1>
            <p className="text-muted text-xs">Pusat Manajemen Kartu NFC &amp; QR</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href="/" className="btn btn-secondary py-1.5 px-3 text-xs font-semibold">
            Lihat Web ↗
          </a>
          <button onClick={handleLogout} className="btn btn-secondary py-1.5 px-3 text-xs font-semibold">
            Keluar
          </button>
        </div>
      </header>

      {error && <div className="error-alert mb-3">{error}</div>}
      {success && <div className="success-alert mb-3">{success}</div>}

      {/* STATS OVERVIEW */}
      <div className="grid-4 mb-4">
        {[
          { label: 'Total Kartu', value: stats.total, color: 'var(--foreground)' },
          { label: 'Kartu Aktif', value: stats.active, color: '#10b981' },
          { label: 'Pending (Belum Aktif)', value: stats.unactivated, color: '#f59e0b' },
          { label: 'Dinonaktifkan', value: stats.disabled, color: '#ef4444' },
        ].map((s, i) => (
          <div
            key={i}
            className="feature-card-minimal p-3"
            style={{ border: '1px solid var(--border)' }}
          >
            <span className="text-xs text-muted font-medium">{s.label}</span>
            <span className="text-2xl font-bold font-mono" style={{ color: s.color }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* GENERATOR & EXPORT TOOLS */}
      <div className="grid-2 mb-4">
        {/* Bulk Generator */}
        <div className="feature-card-minimal p-4">
          <h2 className="text-sm font-bold mb-2">⚡ Generate ID Kartu Baru</h2>
          <form onSubmit={handleBulkGenerate} className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Prefix (GR)"
              maxLength={4}
              value={genPrefix}
              onChange={(e) => setGenPrefix(e.target.value.toUpperCase())}
              style={{ flex: '1 1 80px', padding: '0.45rem 0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', background: 'var(--background)', color: 'var(--foreground)' }}
            />
            <input
              type="number"
              min={1}
              max={100}
              value={genCount}
              onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
              style={{ width: '70px', padding: '0.45rem 0.65rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', background: 'var(--background)', color: 'var(--foreground)' }}
            />
            <button
              type="submit"
              className="btn btn-primary text-xs font-semibold py-2 px-3"
              disabled={generating}
            >
              {generating ? 'Membuat...' : '+ Buat Batch'}
            </button>
          </form>
        </div>

        {/* Export Data */}
        <div className="feature-card-minimal p-4">
          <h2 className="text-sm font-bold mb-2">📁 Ekspor & Cetak QR</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary flex-1 py-2 text-xs font-semibold"
            >
              📄 Data CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="btn btn-secondary flex-1 py-2 text-xs font-semibold"
            >
              📋 Lembar Cetak PDF
            </button>
          </div>
        </div>
      </div>

      {/* CARD REGISTRY LIST */}
      <div className="feature-card-minimal p-4">
        {/* Search & Filter Bar */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <input
            type="text"
            placeholder="Cari ID kartu atau nama bisnis..."
            value={search}
            onChange={handleSearchChange}
            style={{
              flex: '1 1 220px',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              background: 'var(--background)',
              color: 'var(--foreground)',
              minWidth: 0,
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              background: 'var(--background)',
              color: 'var(--foreground)',
            }}
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="UNACTIVATED">Pending</option>
            <option value="DISABLED">Nonaktif</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-5 text-muted text-xs">Memuat data kartu...</div>
        ) : cards.length === 0 ? (
          <div className="text-center py-5 text-muted text-xs">Tidak ditemukan kartu yang cocok.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {cards.map((card) => (
              <div
                key={card.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--background-card)',
                  flexWrap: 'wrap',
                }}
              >
                {/* Left: ID & Status */}
                <div style={{ minWidth: '90px' }}>
                  <span className="font-mono font-bold text-sm block">{card.card_id}</span>
                  <span className={`status-tag ${card.status.toLowerCase()} mt-1`} style={{ fontSize: '0.65rem' }}>
                    {card.status === 'ACTIVE' ? 'Aktif' : card.status === 'UNACTIVATED' ? 'Pending' : 'Off'}
                  </span>
                </div>

                {/* Middle: Business details */}
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <div className="text-xs font-semibold text-truncate">
                    {card.business_name || <span className="text-muted italic">Belum diaktivasi</span>}
                  </div>
                  {card.business_address && (
                    <div className="text-xs text-muted text-truncate" style={{ fontSize: '0.72rem' }}>
                      {card.business_address}
                    </div>
                  )}
                  {card.activated_at && (
                    <div className="text-subtle" style={{ fontSize: '0.68rem' }}>
                      Aktif: {new Date(card.activated_at).toLocaleDateString('id-ID')}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex gap-1.5 flex-wrap items-center">
                  <button
                    onClick={() => handleShowQR(card.card_id)}
                    title="Lihat QR Code"
                    className="btn btn-secondary py-1 px-2.5 text-xs font-semibold"
                  >
                    👁 QR
                  </button>
                  <button
                    onClick={() => handleDownloadPrintPNG(card.card_id)}
                    title="Download PNG Cetak"
                    className="btn btn-secondary py-1 px-2 text-xs font-semibold"
                  >
                    ⬇ PNG
                  </button>
                  <button
                    onClick={() => { setSelectedCard(card); setNewPinInput(''); }}
                    title="Reset PIN"
                    className="btn btn-secondary py-1 px-2 text-xs font-semibold"
                  >
                    🔑 PIN
                  </button>
                  {card.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleCardAction(card.card_id, 'disable')}
                      title="Nonaktifkan Kartu"
                      className="btn btn-danger py-1 px-2 text-xs font-semibold"
                    >
                      Off
                    </button>
                  )}
                  {card.status === 'DISABLED' && (
                    <button
                      onClick={() => handleCardAction(card.card_id, 'reactivate')}
                      title="Aktifkan Kartu"
                      className="btn btn-secondary py-1 px-2 text-xs font-semibold"
                      style={{ color: '#10b981', borderColor: '#a7f3d0' }}
                    >
                      On
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POPUP MODAL: PIN RESET */}
      {selectedCard && (
        <div className="modal-backdrop">
          <div className="onboarding-card modal-content animate-fade-in">
            <h3 className="text-base font-bold mb-1">Atur Ulang PIN Kartu</h3>
            <p className="text-muted text-xs mb-3">
              Membuat kode sandi baru untuk kartu <strong className="font-mono">{selectedCard.card_id}</strong>.
            </p>
            <form onSubmit={handleResetPin} className="form-group">
              <div className="input-group">
                <label>PIN Baru (4-6 digit angka)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan PIN baru"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary w-full py-2 font-semibold text-xs"
                  disabled={updatingCard}
                >
                  {updatingCard ? 'Menyimpan...' : 'Simpan PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="btn btn-secondary w-full py-2 font-semibold text-xs"
                  disabled={updatingCard}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: SHOW QR PREVIEW */}
      {showQrCardId && (
        <div className="modal-backdrop">
          <div className="onboarding-card modal-content animate-fade-in text-center" style={{ maxWidth: '380px' }}>
            <h3 className="text-base font-bold mb-1">QR Code: {showQrCardId}</h3>
            <p className="text-muted text-xs mb-3">
              Scan kode QR di bawah ini dengan kamera ponsel untuk menguji tautan.
            </p>
            
            {loadingQr ? (
              <div className="py-4 text-muted text-xs">Memuat QR Code...</div>
            ) : showQrDataUrl ? (
              <div className="mb-3 flex flex-col items-center">
                <img 
                  src={showQrDataUrl} 
                  alt={`QR ${showQrCardId}`}
                  style={{ 
                    width: '240px', 
                    height: '240px', 
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    padding: '8px',
                  }} 
                />
                <p className="font-mono font-bold mt-2 text-sm">{showQrCardId}</p>
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPrintPNG(showQrCardId)}
                className="btn btn-primary w-full py-2 text-xs font-semibold"
              >
                Download PNG
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQrCardId('');
                  setShowQrDataUrl('');
                }}
                className="btn btn-secondary w-full py-2 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: PRINT PREVIEW */}
      {printLabelCardId && printLabelDataUrl && (
        <div className="modal-backdrop">
          <div className="onboarding-card modal-content animate-fade-in" style={{ maxWidth: '540px' }}>
            <h3 className="text-base font-bold mb-1">Pratinjau Label Cetak</h3>
            <p className="text-muted text-xs mb-3">
              Label cetak resolusi tinggi siap dipasang pada kartu fisik.
            </p>
            
            <div className="mb-3 flex justify-center">
              <img 
                src={printLabelDataUrl} 
                alt={`Label ${printLabelCardId}`}
                style={{ 
                  width: '100%', 
                  maxHeight: '320px',
                  objectFit: 'contain',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: '#ffffff',
                }} 
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePrintDirectly(printLabelCardId, printLabelDataUrl)}
                className="btn btn-primary w-full py-2 text-xs font-semibold"
              >
                Cetak Langsung
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintLabelCardId('');
                  setPrintLabelDataUrl('');
                }}
                className="btn btn-secondary w-full py-2 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
