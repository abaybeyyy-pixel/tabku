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
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
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

      setSuccess(`Successfully generated ${data.count} cards.`);
      fetchData(password);
    } catch (err: any) {
      setError(err.message || 'Failed to generate cards.');
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
    } catch (err: any) {
      setError(err.message || 'Action failed.');
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

      setSuccess(data.message);
      setSelectedCard(null);
      setNewPinInput('');
      fetchData(password);
    } catch (err: any) {
      setError(err.message || 'Failed to reset PIN.');
    } finally {
      setUpdatingCard(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Card ID,Permanent URL,Destination,Status"].join(",") + "\n"
      + cards.map(c => `${c.card_id},${window.location.origin}/c/${c.card_id},"${c.destination_url || ''}",${c.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tapku_cards_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF of all filtered QR codes (in a grid layout)
  const handleExportPDF = async () => {
    setLoading(true);
    setError('');
    try {
      const { jsPDF } = await import('jspdf');
      
      const cardIds = cards.map(c => c.card_id);
      if (cardIds.length === 0) {
        throw new Error("No cards found to export QR codes.");
      }

      const response = await fetch('/api/admin/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ cardIds, format: 'png' })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate QRs for PDF.');
      }

      const qrResults = data.results || [];
      const doc = new jsPDF();
      
      let x = 15;
      let y = 15;
      const size = 45;
      const spacingX = 15;
      const spacingY = 20;
      const cardsPerRow = 3;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Tapku NFC/QR Card Sheets", 15, 12);
      doc.setFontSize(8);
      doc.setFont("Helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 12);
      doc.line(15, 14, 195, 14);

      y = 20;

      for (let i = 0; i < qrResults.length; i++) {
        const qr = qrResults[i];
        
        // Add QR image to PDF
        doc.addImage(qr.data, 'PNG', x, y, size, size);
        
        // Add ID Label under QR code
        doc.setFontSize(10);
        doc.setFont("Helvetica", "bold");
        doc.text(`CARD ID: ${qr.cardId}`, x + (size/2), y + size + 5, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont("Helvetica", "normal");
        doc.text(`/c/${qr.cardId}`, x + (size/2), y + size + 9, { align: 'center' });

        // Update layout matrix coordinates
        if ((i + 1) % cardsPerRow === 0) {
          x = 15;
          y += size + spacingY;
          
          // Add a new page if page boundary reached
          if (y + size + spacingY > 280 && i < qrResults.length - 1) {
            doc.addPage();
            y = 20;
          }
        } else {
          x += size + spacingX;
        }
      }

      doc.save(`tapku_qr_codes_${Date.now()}.pdf`);
      setSuccess("PDF QR codes exported successfully.");
    } catch (err: any) {
      setError(err.message || 'Failed to export QRs to PDF.');
    } finally {
      setLoading(false);
    }
  };

  // Export SVG for a specific card
  const handleExportSingleSVG = async (cardId: string) => {
    setError('');
    try {
      const response = await fetch('/api/admin/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ cardIds: [cardId], format: 'svg' })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate SVG.');
      }

      const svgContent = data.results[0].data;
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qr_${cardId}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export SVG.');
    }
  };

  // Show QR preview (no download, just display)
  const handleShowQR = async (cardId: string) => {
    setError('');
    setLoadingQr(true);
    setShowQrCardId(cardId);
    try {
      const response = await fetch('/api/admin/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ cardIds: [cardId], format: 'png' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate QR.');
      setShowQrDataUrl(data.results[0].data);
    } catch (err: any) {
      setError(err.message || 'Failed to show QR.');
      setShowQrCardId('');
    } finally {
      setLoadingQr(false);
    }
  };

  // Export Print-Ready PNG (QR Code + small Card ID below)
  const handleDownloadPrintPNG = async (cardId: string) => {
    setError('');
    try {
      const response = await fetch('/api/admin/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ cardIds: [cardId], format: 'png' })
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

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // QR Code centered
        ctx.drawImage(img, padding, padding, qrSize, qrSize);

        // Card ID label below QR
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(cardId, canvas.width / 2, qrSize + padding + 28);

        const pngUrl = canvas.toDataURL('image/png');
        
        // Save to states for preview modal
        setPrintLabelDataUrl(pngUrl);
        setPrintLabelCardId(cardId);

        // Trigger file download
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `qr_${cardId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src = qrBase64;
    } catch (err: any) {
      setError(err.message || 'Failed to export Print PNG.');
    }
  };

  const handlePrintDirectly = (cardId: string, dataUrl: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Pop-up blocker is preventing direct printing. Please allow popups for this page and try again.');
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
    <main className="admin-container py-4 px-3 light-landing">
      {/* HEADER */}
      <header className="admin-header flex justify-between align-items-center mb-4">
        <div>
          <h1 className="h1 font-bold mb-0">Konsol Admin Tapku</h1>
          <p className="text-muted">Kelola database kartu NFC, buat identitas & ekspor kode QR.</p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary font-semibold">
          Keluar
        </button>
      </header>

      {/* STATS OVERVIEW */}
      <section className="grid-4 mb-4">
        <div className="stat-card">
          <span className="stat-label">Total Dibuat</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Kartu Aktif</span>
          <span className="stat-value active-color">{stats.active}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Belum Aktif</span>
          <span className="stat-value text-muted">{stats.unactivated}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Nonaktif</span>
          <span className="stat-value disabled-color">{stats.disabled}</span>
        </div>
      </section>

      {/* FEEDBACK */}
      {error && <div className="error-alert mb-4">{error}</div>}
      {success && <div className="success-alert mb-4">{success}</div>}

      {/* BOTTOM LAYOUT GRID */}
      <div className="admin-body-layout">
        
        {/* LEFT COLUMN: ACTIONS & TOOLS */}
        <div className="admin-sidebar-col">
          {/* BULK CARD GENERATOR */}
          <div className="tool-card mb-4">
            <h2 className="h4 font-bold mb-3">Generator Kartu Massal</h2>
            <form onSubmit={handleBulkGenerate} className="form-group">
              <div className="input-group">
                <label>Prefix ID Kartu</label>
                <input
                  type="text"
                  maxLength={4}
                  value={genPrefix}
                  onChange={(e) => setGenPrefix(e.target.value.replace(/[^A-Za-z]/g, ''))}
                  disabled={generating}
                  required
                />
                <span className="help-text">Huruf saja (contoh: GR, AB, QR).</span>
              </div>
              <div className="input-group">
                <label>Jumlah</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value) || 0)}
                  disabled={generating}
                  required
                />
                <span className="help-text">Maksimum 1.000 kartu per batch.</span>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full py-2 font-semibold"
                disabled={generating}
              >
                {generating ? 'Membuat Identitas...' : 'Buat Kartu'}
              </button>
            </form>
          </div>

          {/* BULK EXPORT UTILITIES */}
          <div className="tool-card">
            <h2 className="h4 font-bold mb-3">Ekspor Massal</h2>
            <p className="text-muted text-sm mb-3">
              Ekspor daftar parameter atau lembar cetak QR Code.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={handleExportCSV} className="btn btn-secondary w-full py-2 font-semibold text-center">
                Ekspor Daftar CSV
              </button>
              <button onClick={handleExportPDF} className="btn btn-secondary w-full py-2 font-semibold text-center">
                Ekspor QR Code (Lembar PDF)
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DATABASE VIEWER */}
        <div className="admin-main-col">
          <div className="tool-card h-full">
            <div className="flex justify-between align-items-center mb-3" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 className="h4 font-bold mb-0">Registri Kartu</h2>
              <div className="flex gap-2" style={{ flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                <input
                  type="text"
                  placeholder="Cari ID Kartu / Bisnis..."
                  value={search}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="UNACTIVATED">Belum Aktif</option>
                  <option value="ACTIVE">Aktif</option>
                  <option value="DISABLED">Nonaktif</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted">Memperbarui registri...</div>
            ) : cards.length === 0 ? (
              <div className="text-center py-4 text-muted">Tidak ada kartu yang cocok dengan pencarian.</div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID Kartu</th>
                      <th>Nama Bisnis</th>
                      <th>Status</th>
                      <th>Tanggal Aktif</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((card) => (
                      <tr key={card.id}>
                        <td className="font-mono font-bold">{card.card_id}</td>
                        <td>{card.business_name || <span className="text-muted italic">Belum diaktifkan</span>}</td>
                        <td>
                          <span className={`status-tag ${card.status.toLowerCase()}`}>
                            {card.status}
                          </span>
                        </td>
                        <td>
                          {card.activated_at 
                            ? new Date(card.activated_at).toLocaleDateString() 
                            : <span className="text-muted">-</span>
                          }
                        </td>
                        <td>
                          <div className="flex gap-1 justify-content-center" style={{ flexWrap: 'wrap' }}>
                             <button
                               onClick={() => handleShowQR(card.card_id)}
                               className="action-btn"
                               title="Lihat QR Code"
                               style={{ background: 'var(--primary-color)', color: 'var(--primary-text)', borderColor: 'var(--primary-color)' }}
                             >
                               👁 QR
                             </button>
                             <button
                               onClick={() => handleDownloadPrintPNG(card.card_id)}
                               className="action-btn"
                               title="Download QR PNG"
                             >
                               PNG
                             </button>
                             <button
                               onClick={() => handleExportSingleSVG(card.card_id)}
                               className="action-btn"
                               title="Download Raw SVG QR"
                             >
                               SVG
                             </button>
                            <button
                              onClick={() => {
                                setSelectedCard(card);
                                setNewPinInput('');
                              }}
                              className="action-btn"
                              title="Reset PIN"
                            >
                              PIN
                            </button>
                            {card.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleCardAction(card.card_id, 'disable')}
                                className="action-btn danger"
                                title="Nonaktifkan Kartu"
                              >
                                Nonaktif
                              </button>
                            )}
                            {card.status === 'DISABLED' && (
                              <button
                                onClick={() => handleCardAction(card.card_id, 'reactivate')}
                                className="action-btn success"
                                title="Aktifkan Kembali"
                              >
                                Aktifkan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POPUP MODAL: PIN RESET */}
      {selectedCard && (
        <div className="modal-backdrop">
          <div className="onboarding-card modal-content animate-fade-in">
            <h3 className="h3 font-bold mb-2">Atur Ulang PIN Kartu</h3>
            <p className="text-muted text-sm mb-4">
              Membuat kode sandi baru untuk kartu <strong className="font-mono">{selectedCard.card_id}</strong>.
            </p>
            <form onSubmit={handleResetPin} className="form-group">
              <div className="input-group">
                <label>PIN Baru (4-6 digit)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan PIN angka"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary w-full py-2 font-semibold"
                  disabled={updatingCard}
                >
                  {updatingCard ? 'Memperbarui PIN...' : 'Atur Ulang PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="btn btn-secondary w-full py-2 font-semibold"
                  disabled={updatingCard}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* POPUP MODAL: PRINT PREVIEW */}
      {printLabelCardId && printLabelDataUrl && (
        <div className="modal-backdrop">
          <div className="onboarding-card modal-content animate-fade-in" style={{ maxWidth: '640px' }}>
            <h3 className="h3 font-bold mb-2">Pratinjau Label Cetak</h3>
            <p className="text-muted text-sm mb-4">
              Jika unduhan otomatis tidak dimulai, klik kanan gambar di bawah dan pilih <strong>"Simpan gambar sebagai..."</strong>.
            </p>
            
            <div className="mb-4" style={{ display: 'flex', justifyContent: 'center' }}>
              <img 
                src={printLabelDataUrl} 
                alt={`Label ${printLabelCardId}`}
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: '#ffffff'
                }} 
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePrintDirectly(printLabelCardId, printLabelDataUrl)}
                className="btn btn-primary w-full py-2 font-semibold"
              >
                Cetak Langsung
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintLabelCardId('');
                  setPrintLabelDataUrl('');
                }}
                className="btn btn-secondary w-full py-2 font-semibold"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: SHOW QR PREVIEW (scan-ready) */}
      {showQrCardId && (
        <div className="modal-backdrop">
          <div className="onboarding-card modal-content animate-fade-in" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <h3 className="h3 font-bold mb-2">QR Code: {showQrCardId}</h3>
            <p className="text-muted text-sm mb-4">
              Scan kode QR di bawah ini dengan kamera HP untuk menguji sebelum cetak.
            </p>
            
            {loadingQr ? (
              <div className="py-4 text-muted">Memuat QR Code...</div>
            ) : showQrDataUrl ? (
              <div className="mb-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img 
                  src={showQrDataUrl} 
                  alt={`QR ${showQrCardId}`}
                  style={{ 
                    width: '280px', 
                    height: '280px', 
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    padding: '8px'
                  }} 
                />
                <p className="font-mono font-bold mt-2" style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>{showQrCardId}</p>
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPrintPNG(showQrCardId)}
                className="btn btn-primary w-full py-2 font-semibold"
              >
                Download PNG
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQrCardId('');
                  setShowQrDataUrl('');
                }}
                className="btn btn-secondary w-full py-2 font-semibold"
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
