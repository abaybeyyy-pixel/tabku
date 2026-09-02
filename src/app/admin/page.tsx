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

  // Bulk Selection State
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Single Delete Confirmation Dialog state
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deletingSingle, setDeletingSingle] = useState(false);

  // Bulk generator state (Random 6-digit card IDs)
  const [genPrefix, setGenPrefix] = useState('');
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
        throw new Error('Gagal mengambil data kartu.');
      }

      const data = await response.json();
      setCards(data.cards || []);
      setStats(data.stats || { total: 0, active: 0, unactivated: 0, disabled: 0 });
      setSelectedCardIds([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
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

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedCardIds.length === cards.length && cards.length > 0) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(cards.map((c) => c.card_id));
    }
  };

  const handleToggleSelectCard = (cardId: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  // Single card delete
  const handleConfirmSingleDelete = async () => {
    if (!cardToDelete) return;
    setDeletingSingle(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/cards/${cardToDelete}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': password,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus kartu.');
      }

      setSuccess(`Kartu ${cardToDelete} berhasil dihapus.`);
      setCardToDelete(null);
      fetchData(password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus kartu.';
      setError(message);
    } finally {
      setDeletingSingle(false);
    }
  };

  // Bulk delete
  const handleConfirmBulkDelete = async () => {
    if (selectedCardIds.length === 0) return;
    setDeletingBulk(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/cards', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ cardIds: selectedCardIds }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus kartu terpilih.');
      }

      setSuccess(`Berhasil menghapus ${selectedCardIds.length} kartu.`);
      setSelectedCardIds([]);
      setShowBulkDeleteConfirm(false);
      fetchData(password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus kartu terpilih.';
      setError(message);
    } finally {
      setDeletingBulk(false);
    }
  };

  // Bulk generator
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
        throw new Error(data.error || 'Gagal membuat kartu baru.');
      }

      setSuccess(`Berhasil membuat ${data.count} kartu baru.`);
      fetchData(password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal membuat kartu baru.';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  // Reset PIN
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
        throw new Error(data.error || 'Gagal memperbarui PIN.');
      }

      setSuccess(`PIN kartu ${selectedCard.card_id} berhasil diubah.`);
      setSelectedCard(null);
      setNewPinInput('');
      fetchData(password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui PIN.';
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
        throw new Error(data.error || 'Gagal membuat QR untuk PDF.');
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
      setSuccess('PDF lembar QR berhasil diunduh.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengekspor QR ke PDF.';
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
      if (!response.ok) throw new Error(data.error || 'Gagal memuat QR.');
      setShowQrDataUrl(data.results[0].data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menampilkan QR.';
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
        throw new Error(data.error || 'Gagal membuat gambar QR PNG.');
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

        ctx.fillStyle = '#1e293b';
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
      const message = err instanceof Error ? err.message : 'Gagal mengekspor file PNG.';
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

  const isAllSelected = cards.length > 0 && selectedCardIds.length === cards.length;

  return (
    <main className="container py-3" style={{ maxWidth: '860px' }}>
      {/* COMPACT TOPBAR WITH SPACED BUTTONS */}
      <header className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="text-base font-extrabold tracking-tight">TAPKU ADMIN</h1>
          <p className="text-muted text-xs" style={{ fontSize: '0.72rem' }}>Pusat Manajemen Kartu NFC &amp; Dynamic QR</p>
        </div>
        <div className="admin-header-actions">
          <a href="/" className="admin-header-btn">
            Beranda
          </a>
          <button onClick={handleLogout} className="admin-header-btn">
            Keluar
          </button>
        </div>
      </header>

      {error && <div className="error-alert mb-2.5 py-2 px-3 text-xs">{error}</div>}
      {success && <div className="success-alert mb-2.5 py-2 px-3 text-xs">{success}</div>}

      {/* COMPACT 3-COLUMN STATS ROW (Always 1 row on mobile & desktop) */}
      <div className="admin-stats-grid mb-3">
        <div className="admin-stat-box">
          <span className="admin-stat-label">Total Kartu</span>
          <span className="admin-stat-value" style={{ color: 'var(--foreground)' }}>
            {stats.total}
          </span>
        </div>
        <div className="admin-stat-box">
          <span className="admin-stat-label">Kartu Aktif</span>
          <span className="admin-stat-value" style={{ color: 'var(--success-accent)' }}>
            {stats.active}
          </span>
        </div>
        <div className="admin-stat-box">
          <span className="admin-stat-label">Pending</span>
          <span className="admin-stat-value" style={{ color: 'var(--accent-gold)' }}>
            {stats.unactivated}
          </span>
        </div>
      </div>

      {/* COMPACT TOOLS (Generate & Export) */}
      <div className="admin-tools-grid mb-3">
        {/* Bulk Generator */}
        <div className="feature-card-minimal p-3">
          <h2 className="text-xs font-bold mb-1.5 text-muted uppercase tracking-wider" style={{ fontSize: '0.7rem' }}>Generate ID Random (6 Digit)</h2>
          <form onSubmit={handleBulkGenerate} className="flex gap-2">
            <input
              type="text"
              placeholder="Prefix (opsi)"
              maxLength={4}
              value={genPrefix}
              onChange={(e) => setGenPrefix(e.target.value.toUpperCase())}
              style={{ flex: '1 1 80px', minWidth: 0, padding: '0.35rem 0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', background: '#ffffff', color: 'var(--foreground)' }}
            />
            <input
              type="number"
              min={1}
              max={100}
              value={genCount}
              onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
              style={{ width: '55px', padding: '0.35rem 0.4rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', background: '#ffffff', color: 'var(--foreground)', textAlign: 'center' }}
            />
            <button
              type="submit"
              className="btn btn-primary text-xs font-semibold py-1.5 px-3"
              disabled={generating}
              style={{ whiteSpace: 'nowrap' }}
            >
              {generating ? '...' : '+ Buat'}
            </button>
          </form>
        </div>

        {/* Export Data */}
        <div className="feature-card-minimal p-3">
          <h2 className="text-xs font-bold mb-1.5 text-muted uppercase tracking-wider" style={{ fontSize: '0.7rem' }}>Ekspor &amp; Cetak</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary flex-1 py-1.5 text-xs font-semibold"
            >
              Data CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="btn btn-secondary flex-1 py-1.5 text-xs font-semibold"
            >
              Lembar PDF
            </button>
          </div>
        </div>
      </div>

      {/* CARD REGISTRY LIST */}
      <div className="feature-card-minimal p-3">
        {/* Search, Filter & Bulk Actions Bar */}
        <div className="flex gap-2 mb-2.5 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-1 flex-wrap" style={{ minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Cari ID / bisnis..."
              value={search}
              onChange={handleSearchChange}
              style={{
                flex: '1 1 160px',
                padding: '0.4rem 0.65rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                background: '#ffffff',
                color: 'var(--foreground)',
                minWidth: 0,
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              style={{
                padding: '0.4rem 0.65rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                background: '#ffffff',
                color: 'var(--foreground)',
              }}
            >
              <option value="ALL">Semua</option>
              <option value="ACTIVE">Aktif</option>
              <option value="UNACTIVATED">Pending</option>
            </select>
          </div>

          {/* Bulk Selection Actions */}
          {selectedCardIds.length > 0 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs font-semibold text-muted" style={{ fontSize: '0.75rem' }}>
                {selectedCardIds.length} dipilih
              </span>
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="btn btn-danger py-1 px-2.5 text-xs font-semibold"
              >
                Hapus ({selectedCardIds.length})
              </button>
            </div>
          )}
        </div>

        {/* Selection Bar (Select All Toggle) */}
        {cards.length > 0 && (
          <div className="flex items-center gap-2 mb-2 py-1.5 px-2.5 rounded-sm" style={{ background: 'var(--background-subtle)', border: '1px solid var(--border-subtle)' }}>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted cursor-pointer" style={{ fontSize: '0.72rem' }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                style={{ width: '14px', height: '14px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
              />
              <span>Pilih Semua ({cards.length} kartu)</span>
            </label>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4 text-muted text-xs">Memuat data kartu...</div>
        ) : cards.length === 0 ? (
          <div className="text-center py-4 text-muted text-xs">Tidak ditemukan kartu yang cocok.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {cards.map((card) => {
              const isChecked = selectedCardIds.includes(card.card_id);
              return (
                <div
                  key={card.id}
                  className={`admin-card-item ${isChecked ? 'selected' : ''}`}
                >
                  {/* Left: Checkbox + ID + Status */}
                  <div className="flex items-center gap-2.5" style={{ minWidth: '110px' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelectCard(card.card_id)}
                      style={{ width: '15px', height: '15px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                    />
                    <div>
                      <span className="font-mono font-bold text-xs block">{card.card_id}</span>
                      <span className={`status-tag ${card.status.toLowerCase()}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                        {card.status === 'ACTIVE' ? 'Aktif' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Business details & User Email */}
                  <div style={{ flex: '1 1 140px', minWidth: 0, paddingRight: '0.5rem' }}>
                    <div className="text-xs font-semibold text-truncate" style={{ fontSize: '0.8rem' }}>
                      {card.business_name || <span className="text-muted italic" style={{ fontSize: '0.75rem' }}>Belum diaktivasi</span>}
                    </div>
                    {card.email && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-blue-800 bg-blue-50 py-0.5 px-1.5 rounded-sm border border-blue-100" style={{ fontSize: '0.7rem', width: 'fit-content', maxWidth: '100%' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-blue-600">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span className="font-mono text-truncate select-all font-medium">{card.email}</span>
                      </div>
                    )}
                    {card.business_address && (
                      <div className="text-muted text-truncate mt-0.5" style={{ fontSize: '0.68rem' }}>
                        {card.business_address}
                      </div>
                    )}
                    {card.activated_at && (
                      <div className="text-subtle" style={{ fontSize: '0.65rem' }}>
                        Aktif: {new Date(card.activated_at).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </div>

                  {/* Right: Minimalist Action Icon Buttons (Touch-Friendly 38px) */}
                  <div className="flex gap-2 items-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleShowQR(card.card_id)}
                      title="Lihat QR Code"
                      aria-label="Lihat QR Code"
                      className="action-icon-btn btn-qr"
                      style={{ width: '38px', height: '38px', minWidth: '38px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadPrintPNG(card.card_id)}
                      title="Download PNG Cetak"
                      aria-label="Download PNG Cetak"
                      className="action-icon-btn btn-download"
                      style={{ width: '38px', height: '38px', minWidth: '38px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSelectedCard(card); setNewPinInput(''); }}
                      title="Atur Ulang PIN"
                      aria-label="Atur Ulang PIN"
                      className="action-icon-btn btn-pin"
                      style={{ width: '38px', height: '38px', minWidth: '38px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCardToDelete(card.card_id)}
                      title="Hapus Kartu Ini"
                      aria-label="Hapus Kartu Ini"
                      className="action-icon-btn btn-delete"
                      style={{ width: '38px', height: '38px', minWidth: '38px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POPUP MODAL: SINGLE DELETE CONFIRMATION */}
      {cardToDelete && (
        <div className="modal-backdrop">
          <div className="onboarding-card modal-content animate-fade-in" style={{ maxWidth: '380px', padding: '1.25rem' }}>
            <h3 className="text-sm font-bold mb-1 text-danger">Hapus Kartu Ini?</h3>
            <p className="text-muted text-xs mb-3">
              Hapus kartu <strong className="font-mono">{cardToDelete}</strong> secara permanen dari database?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="btn btn-danger w-full py-1.5 font-semibold text-xs"
                disabled={deletingSingle}
              >
                {deletingSingle ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="btn btn-secondary w-full py-1.5 font-semibold text-xs"
                disabled={deletingSingle}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: BULK DELETE CONFIRMATION */}
      {showBulkDeleteConfirm && (
        <div className="modal-backdrop">
          <div className="onboarding-card modal-content animate-fade-in" style={{ maxWidth: '400px', padding: '1.25rem' }}>
            <h3 className="text-sm font-bold mb-1 text-danger">Hapus {selectedCardIds.length} Kartu Terpilih?</h3>
            <p className="text-muted text-xs mb-2">
              Daftar ID kartu berikut akan dihapus permanen:
            </p>
            <div className="p-2 border rounded-sm mb-3 max-h-28 overflow-y-auto font-mono text-xs text-muted" style={{ background: 'var(--background-subtle)', fontSize: '0.72rem' }}>
              {selectedCardIds.join(', ')}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="btn btn-danger w-full py-1.5 font-semibold text-xs"
                disabled={deletingBulk}
              >
                {deletingBulk ? 'Menghapus...' : `Hapus ${selectedCardIds.length} Kartu`}
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="btn btn-secondary w-full py-1.5 font-semibold text-xs"
                disabled={deletingBulk}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: PIN RESET */}
      {selectedCard && (
        <div className="modal-backdrop">
          <div className="onboarding-card modal-content animate-fade-in" style={{ maxWidth: '380px', padding: '1.25rem' }}>
            <h3 className="text-sm font-bold mb-1">Atur Ulang PIN Kartu</h3>
            <p className="text-muted text-xs mb-2">
              ID Kartu: <strong className="font-mono text-slate-900">{selectedCard.card_id}</strong>
              {selectedCard.business_name && ` — ${selectedCard.business_name}`}
            </p>

            {selectedCard.email ? (
              <div className="p-2 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900 mb-3">
                <span className="font-bold block text-[11px] text-blue-700">Email Pemilik Terdaftar:</span>
                <span className="font-mono font-semibold select-all">{selectedCard.email}</span>
              </div>
            ) : (
              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-xs text-muted mb-3">
                Kartu belum memiliki email pendaftaran terdaftar.
              </div>
            )}
            <form onSubmit={handleResetPin} className="form-group">
              <div className="input-group">
                <label style={{ fontSize: '0.72rem' }}>PIN Baru (4-6 digit angka)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan PIN"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary w-full py-1.5 font-semibold text-xs"
                  disabled={updatingCard}
                >
                  {updatingCard ? 'Menyimpan...' : 'Simpan PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="btn btn-secondary w-full py-1.5 font-semibold text-xs"
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
          <div className="onboarding-card modal-content animate-fade-in text-center" style={{ maxWidth: '340px', padding: '1.25rem' }}>
            <h3 className="text-sm font-bold mb-1">QR Code: {showQrCardId}</h3>
            <p className="text-muted text-xs mb-2.5">
              Scan dengan kamera HP untuk menguji tautan kartu.
            </p>
            
            {loadingQr ? (
              <div className="py-3 text-muted text-xs">Memuat QR...</div>
            ) : showQrDataUrl ? (
              <div className="mb-2.5 flex flex-col items-center">
                <img 
                  src={showQrDataUrl} 
                  alt={`QR ${showQrCardId}`}
                  style={{ 
                    width: '200px', 
                    height: '200px', 
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    padding: '6px',
                  }} 
                />
                <p className="font-mono font-bold mt-1.5 text-xs">{showQrCardId}</p>
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPrintPNG(showQrCardId)}
                className="btn btn-primary w-full py-1.5 text-xs font-semibold"
              >
                Download PNG
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQrCardId('');
                  setShowQrDataUrl('');
                }}
                className="btn btn-secondary w-full py-1.5 text-xs font-semibold"
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
          <div className="onboarding-card modal-content animate-fade-in" style={{ maxWidth: '460px', padding: '1.25rem' }}>
            <h3 className="text-sm font-bold mb-1">Pratinjau Label Cetak</h3>
            <p className="text-muted text-xs mb-2.5">
              Label cetak resolusi tinggi siap dipasang pada kartu fisik.
            </p>
            
            <div className="mb-2.5 flex justify-center">
              <img 
                src={printLabelDataUrl} 
                alt={`Label ${printLabelCardId}`}
                style={{ 
                  width: '100%', 
                  maxHeight: '260px',
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
                className="btn btn-primary w-full py-1.5 text-xs font-semibold"
              >
                Cetak Langsung
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintLabelCardId('');
                  setPrintLabelDataUrl('');
                }}
                className="btn btn-secondary w-full py-1.5 text-xs font-semibold"
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
