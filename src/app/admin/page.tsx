'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/lib/db';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    unactivated: number;
    disabled: number;
    totalTaps?: number;
    printed?: number;
    unprinted?: number;
  }>({ total: 0, active: 0, unactivated: 0, disabled: 0 });
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [printFilter, setPrintFilter] = useState('ALL'); // 'ALL' | 'UNPRINTED' | 'PRINTED'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bulk Selection State
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [updatingPrintBulk, setUpdatingPrintBulk] = useState(false);

  // Single Delete Confirmation Dialog state
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deletingSingle, setDeletingSingle] = useState(false);

  // Bulk generator state (Random 6-digit card IDs)
  const [genPrefix, setGenPrefix] = useState('');
  const [genCount, setGenCount] = useState(10);
  const [generating, setGenerating] = useState(false);

  // Card detail dialog / PIN reset dialog state
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [newPinInput, setNewPinInput] = useState('');
  const [updatingCard, setUpdatingCard] = useState(false);

  // Print Label Preview Modal state
  const [printLabelCardId, setPrintLabelCardId] = useState<string>('');
  const [printLabelDataUrl, setPrintLabelDataUrl] = useState<string>('');

  // Show QR Preview Modal state
  const [showQrCardId, setShowQrCardId] = useState<string>('');
  const [showQrDataUrl, setShowQrDataUrl] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });

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

  const fetchData = async (
    pw = password,
    searchQuery = search,
    statusQ = statusFilter,
    printQ = printFilter,
    targetPage = currentPage,
    targetLimit = pageSize
  ) => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/admin/cards?search=${encodeURIComponent(searchQuery)}&status=${statusQ}&printed=${printQ}&page=${targetPage}&limit=${targetLimit}`;
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
      if (data.pagination) {
        setPagination(data.pagination);
        setCurrentPage(data.pagination.page);
      } else {
        setPagination({
          total: (data.cards || []).length,
          page: targetPage,
          limit: targetLimit,
          totalPages: Math.max(1, Math.ceil(((data.cards || []).length) / targetLimit)),
        });
        setCurrentPage(targetPage);
      }
      setSelectedCardIds([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    setCurrentPage(1);
    fetchData(password, newSearch, statusFilter, printFilter, 1, pageSize);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchData(password, search, status, printFilter, 1, pageSize);
  };

  const handlePrintFilterChange = (printed: string) => {
    setPrintFilter(printed);
    setCurrentPage(1);
    fetchData(password, search, statusFilter, printed, 1, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchData(password, search, statusFilter, printFilter, newPage, pageSize);
  };

  const handlePageSizeChange = (newLimit: number) => {
    setPageSize(newLimit);
    setCurrentPage(1);
    fetchData(password, search, statusFilter, printFilter, 1, newLimit);
  };

  const getPageNumbers = () => {
    const total = pagination.totalPages;
    const current = currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }

    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
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

  // Toggle single card print status
  const handleTogglePrintStatus = async (cardId: string) => {
    try {
      const response = await fetch(`/api/admin/cards/${cardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ action: 'toggle-printed' }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal mengubah status cetak.');

      // Instant optimistic UI update
      setCards((prev) =>
        prev.map((c) => (c.card_id === cardId ? { ...c, is_printed: data.isPrinted } : c))
      );
      setStats((prev) => ({
        ...prev,
        printed: (prev.printed || 0) + (data.isPrinted ? 1 : -1),
        unprinted: Math.max(0, (prev.unprinted || 0) + (data.isPrinted ? -1 : 1)),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah status cetak.';
      setError(message);
    }
  };

  // Bulk mark print status
  const handleBulkMarkPrinted = async (isPrinted: boolean) => {
    if (selectedCardIds.length === 0) return;
    setUpdatingPrintBulk(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/cards', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          action: 'mark-printed',
          cardIds: selectedCardIds,
          isPrinted,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memperbarui status cetak.');

      setSuccess(
        isPrinted
          ? `Berhasil menandai ${selectedCardIds.length} kartu sudah dicetak.`
          : `Berhasil menandai ${selectedCardIds.length} kartu belum dicetak.`
      );
      setSelectedCardIds([]);
      fetchData(password, search, statusFilter, printFilter);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui status cetak.';
      setError(message);
    } finally {
      setUpdatingPrintBulk(false);
    }
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
      fetchData(password, search, statusFilter, printFilter);
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
      fetchData(password, search, statusFilter, printFilter);
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
      setCurrentPage(1);
      fetchData(password, search, statusFilter, printFilter, 1, pageSize);
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
      fetchData(password, search, statusFilter, printFilter);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui PIN.';
      setError(message);
    } finally {
      setUpdatingCard(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Card ID,Permanent URL,Destination,Status,Printed'].join(',') +
      '\n' +
      cards
        .map(
          (c) =>
            `${c.card_id},https://mycarrd.com/c/${c.card_id},"${c.destination_url || ''}",${c.status},${c.is_printed ? 'YES' : 'NO'}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mycarrd_cards_${Date.now()}.csv`);
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

      const cardIds = cards.map((c) => c.card_id);
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
      doc.text('Mycarrd NFC/QR Card Sheets (mycarrd.com)', 15, 12);
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 12);
      doc.line(15, 14, 195, 14);

      for (let i = 0; i < qrResults.length; i++) {
        const qr = qrResults[i];

        doc.addImage(qr.data, 'PNG', x, y, size, size);

        doc.setFontSize(10);
        doc.setFont('Helvetica', 'bold');
        doc.text(`CARD ID: ${qr.cardId}`, x + size / 2, y + size + 5, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('Helvetica', 'normal');
        doc.text(`mycarrd.com/c/${qr.cardId}`, x + size / 2, y + size + 9, { align: 'center' });

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

      doc.save(`mycarrd_qr_codes_${Date.now()}.pdf`);
      setSuccess('PDF lembar QR berhasil diunduh.');

      // Automatically offer to mark all exported cards as printed
      fetch('/api/admin/cards', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          action: 'mark-printed',
          cardIds,
          isPrinted: true,
        }),
      }).then(() => {
        fetchData(password, search, statusFilter, printFilter);
      }).catch(() => {});
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

  // Export Print-Ready PNG & auto-mark printed
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
        canvas.width = qrSize + padding * 2;
        canvas.height = qrSize + padding * 2 + labelHeight;
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

        // Mark as printed automatically
        fetch(`/api/admin/cards/${cardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify({ action: 'set-printed', isPrinted: true }),
        }).then(() => {
          setCards((prev) => prev.map((c) => (c.card_id === cardId ? { ...c, is_printed: true } : c)));
        }).catch(() => {});
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

    // Mark as printed automatically
    fetch(`/api/admin/cards/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ action: 'set-printed', isPrinted: true }),
    }).then(() => {
      setCards((prev) => prev.map((c) => (c.card_id === cardId ? { ...c, is_printed: true } : c)));
    }).catch(() => {});
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_password');
    router.push('/admin/login');
  };

  const isAllSelected = cards.length > 0 && selectedCardIds.length === cards.length;

  return (
    <main className="container py-3" style={{ maxWidth: '880px' }}>
      {/* COMPACT TOPBAR */}
      <header className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="text-base font-extrabold tracking-tight">MYCARRD ADMIN</h1>
          <p className="text-muted text-xs" style={{ fontSize: '0.72rem' }}>
            Pusat Manajemen Kartu NFC &amp; Dynamic QR (mycarrd.com)
          </p>
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

      {/* 6-METRICS STATS ROW (Balanced 3x2 on mobile) */}
      <div className="admin-stats-grid mb-3">
        <div className="admin-stat-box">
          <span className="admin-stat-label">Total Kartu</span>
          <span className="admin-stat-value" style={{ color: 'var(--foreground)' }}>
            {stats.total}
          </span>
        </div>
        <div className="admin-stat-box">
          <span className="admin-stat-label">Kartu Aktif</span>
          <span className="admin-stat-value" style={{ color: 'var(--success-accent, #15803d)' }}>
            {stats.active}
          </span>
        </div>
        <div className="admin-stat-box">
          <span className="admin-stat-label">Pending</span>
          <span className="admin-stat-value" style={{ color: 'var(--accent-gold, #d97706)' }}>
            {stats.unactivated}
          </span>
        </div>
        <div className="admin-stat-box">
          <span className="admin-stat-label">Belum Dicetak</span>
          <span className="admin-stat-value" style={{ color: '#475569' }}>
            {stats.unprinted !== undefined ? stats.unprinted : Math.max(0, stats.total - (stats.printed || 0))}
          </span>
        </div>
        <div className="admin-stat-box">
          <span className="admin-stat-label">Sudah Dicetak</span>
          <span className="admin-stat-value" style={{ color: '#047857' }}>
            {stats.printed || 0}
          </span>
        </div>
        <div className="admin-stat-box">
          <span className="admin-stat-label">Total Tap Platform</span>
          <span className="admin-stat-value" style={{ color: '#2563eb' }}>
            {(stats.totalTaps || 0).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* COMPACT TOOLS (Generate & Export) */}
      <div className="admin-tools-grid mb-3">
        {/* Bulk Generator */}
        <div className="feature-card-minimal p-3">
          <h2 className="text-xs font-bold mb-1.5 text-muted uppercase tracking-wider" style={{ fontSize: '0.7rem' }}>
            Generate ID Random (6 Digit)
          </h2>
          <form onSubmit={handleBulkGenerate} className="flex gap-2">
            <input
              type="text"
              placeholder="Prefix (opsi)"
              maxLength={4}
              value={genPrefix}
              onChange={(e) => setGenPrefix(e.target.value.toUpperCase())}
              style={{
                flex: '1 1 80px',
                minWidth: 0,
                padding: '0.35rem 0.5rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                background: '#ffffff',
                color: 'var(--foreground)',
              }}
            />
            <input
              type="number"
              min={1}
              max={100}
              value={genCount}
              onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
              style={{
                width: '55px',
                padding: '0.35rem 0.4rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                background: '#ffffff',
                color: 'var(--foreground)',
                textAlign: 'center',
              }}
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
          <h2 className="text-xs font-bold mb-1.5 text-muted uppercase tracking-wider" style={{ fontSize: '0.7rem' }}>
            Ekspor &amp; Cetak Lembar QR
          </h2>
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
          <div className="flex gap-2 flex-1 flex-wrap items-center" style={{ minWidth: '220px' }}>
            {/* Search input */}
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
              <input
                type="text"
                placeholder="Cari ID, nama usaha, atau email..."
                value={search}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  padding: '0.4rem 2rem 0.4rem 0.65rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  background: '#ffffff',
                  color: 'var(--foreground)',
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    fetchData(password, '', statusFilter, printFilter);
                  }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    padding: '2px',
                    lineHeight: 1,
                  }}
                  title="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Status Aktif/Pending */}
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
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="UNACTIVATED">Pending</option>
            </select>

            {/* Filter Status Cetak QR */}
            <select
              value={printFilter}
              onChange={(e) => handlePrintFilterChange(e.target.value)}
              style={{
                padding: '0.4rem 0.65rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                background: '#ffffff',
                color: 'var(--foreground)',
              }}
            >
              <option value="ALL">Semua Cetak</option>
              <option value="UNPRINTED">Belum Dicetak</option>
              <option value="PRINTED">Sudah Dicetak</option>
            </select>
          </div>

          {/* Bulk Selection Actions */}
          {selectedCardIds.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap animate-fade-in">
              <span className="text-xs font-semibold text-muted" style={{ fontSize: '0.72rem' }}>
                {selectedCardIds.length} dipilih
              </span>
              <button
                type="button"
                onClick={() => handleBulkMarkPrinted(true)}
                className="btn btn-secondary py-1 px-2.5 text-xs font-semibold"
                disabled={updatingPrintBulk}
              >
                Tandai Cetak
              </button>
              <button
                type="button"
                onClick={() => handleBulkMarkPrinted(false)}
                className="btn btn-secondary py-1 px-2.5 text-xs font-semibold"
                disabled={updatingPrintBulk}
              >
                Batal Cetak
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="btn btn-danger py-1 px-2.5 text-xs font-semibold"
              >
                Hapus
              </button>
            </div>
          )}
        </div>

        {/* Selection Bar (Select All Toggle) */}
        {cards.length > 0 && (
          <div
            className="flex items-center justify-between mb-2 py-1.5 px-2.5 rounded-sm"
            style={{ background: 'var(--background-subtle)', border: '1px solid var(--border-subtle)' }}
          >
            <label className="flex items-center gap-2 text-xs font-semibold text-muted cursor-pointer" style={{ fontSize: '0.72rem' }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                style={{ width: '15px', height: '15px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
              />
              <span>Pilih Semua di Halaman Ini ({cards.length} kartu)</span>
            </label>
            {selectedCardIds.length > 0 && (
              <span className="text-xs text-muted font-semibold" style={{ fontSize: '0.72rem' }}>
                {selectedCardIds.length} dipilih
              </span>
            )}
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
                  {/* Top Bar on Mobile / Left on Desktop: Checkbox + ID + Status Tag + Printed Badge */}
                  <div className="admin-card-header">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelectCard(card.card_id)}
                        style={{ width: '15px', height: '15px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                      />
                      <span className="font-mono font-bold text-xs">{card.card_id}</span>
                      <span
                        className={`status-tag ${card.status.toLowerCase()}`}
                        style={{ fontSize: '0.62rem', padding: '0.12rem 0.45rem' }}
                      >
                        {card.status === 'ACTIVE' ? 'Aktif' : 'Pending'}
                      </span>
                    </div>

                    {/* Interactive Print Status On/Off Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleTogglePrintStatus(card.card_id)}
                      className={`print-toggle-btn ${card.is_printed ? 'printed' : 'unprinted'}`}
                      title={card.is_printed ? 'Status: Sudah Cetak (Klik untuk ubah)' : 'Status: Belum Cetak (Klik untuk ubah)'}
                      aria-label={`Status cetak: ${card.is_printed ? 'Sudah' : 'Belum'}`}
                    >
                      <span className="print-toggle-track" aria-hidden="true">
                        <span className="print-toggle-thumb" />
                      </span>
                      <span className="print-toggle-label">{card.is_printed ? 'Sudah' : 'Belum'}</span>
                    </button>
                  </div>

                  {/* Middle / Body: Business details & User Email & Destination */}
                  <div className="admin-card-body">
                    <div className="text-xs font-semibold text-truncate" style={{ fontSize: '0.82rem' }}>
                      {card.business_name || (
                        <span className="text-muted italic" style={{ fontSize: '0.75rem' }}>
                          Belum diaktivasi
                        </span>
                      )}
                    </div>

                    {/* Destination URL or Type */}
                    {card.destination_url && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted text-truncate" style={{ fontSize: '0.72rem' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-slate-400">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span className="font-mono text-truncate text-slate-600 select-all font-medium">
                          {card.place_id ? 'Google Maps Review' : card.destination_url}
                        </span>
                      </div>
                    )}

                    {card.email && (
                      <div
                        className="flex items-center gap-1.5 mt-0.5 text-blue-800 bg-blue-50 py-0.5 px-1.5 rounded-sm border border-blue-100"
                        style={{ fontSize: '0.7rem', width: 'fit-content', maxWidth: '100%' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-blue-600">
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

                    <div className="flex items-center gap-3 mt-1 text-muted text-xs" style={{ fontSize: '0.68rem' }}>
                      <span>Tap: <strong>{card.tap_count || 0}x</strong></span>
                      {card.activated_at && (
                        <span>Aktif: {new Date(card.activated_at).toLocaleDateString('id-ID')}</span>
                      )}
                    </div>
                  </div>

                  {/* Right / Footer Action Toolbar (4 Touch-Friendly Buttons) */}
                  <div className="admin-card-actions">
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
                      onClick={() => {
                        setSelectedCard(card);
                        setNewPinInput('');
                      }}
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

        {/* Minimalist Pagination Bar */}
        {!loading && pagination.total > 0 && (
          <div className="admin-pagination-container">
            <div className="admin-pagination-info">
              <span>
                Menampilkan{' '}
                <strong>
                  {((pagination.page - 1) * pagination.limit + 1).toLocaleString('id-ID')}
                </strong>
                –
                <strong>
                  {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString('id-ID')}
                </strong>{' '}
                dari <strong>{pagination.total.toLocaleString('id-ID')}</strong> kartu
              </span>
            </div>

            <div className="admin-pagination-controls">
              <div className="admin-page-size-selector">
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>Per hal:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="admin-page-select"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="admin-pagination-buttons">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="pagination-btn"
                  title="Halaman Sebelumnya"
                  aria-label="Halaman Sebelumnya"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {getPageNumbers().map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                        …
                      </span>
                    );
                  }
                  const pageNum = Number(item);
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`pagination-btn ${isActive ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages}
                  className="pagination-btn"
                  title="Halaman Berikutnya"
                  aria-label="Halaman Berikutnya"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
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
            <div
              className="p-2 border rounded-sm mb-3 max-h-28 overflow-y-auto font-mono text-xs text-muted"
              style={{ background: 'var(--background-subtle)', fontSize: '0.72rem' }}
            >
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
