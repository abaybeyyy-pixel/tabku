'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/lib/db';

export default function AdminPage() {
  const [password] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_password') || '';
    }
    return '';
  });
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
  const [sortFilter, setSortFilter] = useState<'ACTIVATED_FIRST' | 'ACTIVATED_RECENT' | 'CREATED_DESC' | 'PRINTED_FIRST'>('ACTIVATED_FIRST');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'ACTIVE' | 'PRINTED' | 'UNPRINTED'>('ALL');
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

  // Single Card Reset to Onboarding Dialog state
  const [cardToReset, setCardToReset] = useState<string | null>(null);
  const [resettingCard, setResettingCard] = useState(false);

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

  // Helper to ensure cards ordering according to selected sort mode
  // Default 'ACTIVATED_FIRST': Kartu yang paling awal aktif selalu berada di paling atas dan terdepan
  const sortCardsByOrder = (cardList: Card[], mode: string = sortFilter): Card[] => {
    return [...cardList].sort((a, b) => {
      if (mode === 'ACTIVATED_FIRST') {
        const aHasAct = Boolean(a.activated_at);
        const bHasAct = Boolean(b.activated_at);
        if (aHasAct !== bHasAct) {
          return aHasAct ? -1 : 1; // Kartu aktif paling depan
        }
        if (aHasAct && bHasAct) {
          const aTime = new Date(a.activated_at!).getTime();
          const bTime = new Date(b.activated_at!).getTime();
          if (aTime !== bTime) {
            return aTime - bTime; // Paling awal aktif teratas (ASC)
          }
        }
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bCreated - aCreated;
      }

      if (mode === 'ACTIVATED_RECENT') {
        const aHasAct = Boolean(a.activated_at);
        const bHasAct = Boolean(b.activated_at);
        if (aHasAct !== bHasAct) {
          return aHasAct ? -1 : 1;
        }
        if (aHasAct && bHasAct) {
          const aTime = new Date(a.activated_at!).getTime();
          const bTime = new Date(b.activated_at!).getTime();
          if (aTime !== bTime) {
            return bTime - aTime; // Paling baru aktif teratas (DESC)
          }
        }
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bCreated - aCreated;
      }

      if (mode === 'PRINTED_FIRST') {
        const aPrinted = Boolean(a.is_printed);
        const bPrinted = Boolean(b.is_printed);
        if (aPrinted !== bPrinted) {
          return aPrinted ? -1 : 1;
        }
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bCreated - aCreated;
      }

      // Default: CREATED_DESC
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  };

  const fetchData = async (
    pw = password,
    searchQuery = search,
    statusQ = statusFilter,
    printQ = printFilter,
    sortQ = sortFilter,
    targetPage = currentPage,
    targetLimit = pageSize
  ) => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/admin/cards?search=${encodeURIComponent(searchQuery)}&status=${statusQ}&printed=${printQ}&sort=${sortQ}&page=${targetPage}&limit=${targetLimit}`;
      const response = await fetch(url, {
        headers: { 'x-admin-password': pw },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('admin_password');
          router.push('/admin/Sull1v4n');
          return;
        }
        throw new Error('Gagal mengambil data kartu.');
      }

      const data = await response.json();
      setCards(sortCardsByOrder(data.cards || [], sortQ));
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

  useEffect(() => {
    const saved = localStorage.getItem('admin_password');
    if (!saved) {
      router.push('/admin/Sull1v4n');
      return;
    }

    let ignore = false;
    const loadInitialData = async () => {
      try {
        const url = `/api/admin/cards?search=&status=ALL&printed=ALL&sort=ACTIVATED_FIRST&page=1&limit=50`;
        const response = await fetch(url, {
          headers: { 'x-admin-password': saved },
        });

        if (ignore) return;
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('admin_password');
            router.push('/admin/Sull1v4n');
            return;
          }
          throw new Error('Gagal mengambil data kartu.');
        }

        const data = await response.json();
        if (ignore) return;

        setCards(sortCardsByOrder(data.cards || [], 'ACTIVATED_FIRST'));
        setStats(data.stats || { total: 0, active: 0, unactivated: 0, disabled: 0 });
        if (data.pagination) {
          setPagination(data.pagination);
          setCurrentPage(data.pagination.page);
        }
        setLoading(false);
      } catch (err: unknown) {
        if (ignore) return;
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
        setError(message);
        setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, [router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    setCurrentPage(1);
    fetchData(password, newSearch, statusFilter, printFilter, sortFilter, 1, pageSize);
  };

  const handleQuickFilterChange = (filter: 'ALL' | 'ACTIVE' | 'PRINTED' | 'UNPRINTED') => {
    setQuickFilter(filter);
    setCurrentPage(1);

    let nextStatus = 'ALL';
    let nextPrinted = 'ALL';

    if (filter === 'ACTIVE') {
      nextStatus = 'ACTIVE';
    } else if (filter === 'PRINTED') {
      nextPrinted = 'PRINTED';
    } else if (filter === 'UNPRINTED') {
      nextPrinted = 'UNPRINTED';
    }

    setStatusFilter(nextStatus);
    setPrintFilter(nextPrinted);
    fetchData(password, search, nextStatus, nextPrinted, 'ACTIVATED_FIRST', 1, pageSize);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchData(password, search, status, printFilter, sortFilter, 1, pageSize);
  };

  const handlePrintFilterChange = (printed: string) => {
    setPrintFilter(printed);
    setCurrentPage(1);
    fetchData(password, search, statusFilter, printed, sortFilter, 1, pageSize);
  };

  const handleSortFilterChange = (newSort: string) => {
    const safeSort = newSort as 'ACTIVATED_FIRST' | 'ACTIVATED_RECENT' | 'CREATED_DESC' | 'PRINTED_FIRST';
    setSortFilter(safeSort);
    setCurrentPage(1);
    fetchData(password, search, statusFilter, printFilter, safeSort, 1, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchData(password, search, statusFilter, printFilter, sortFilter, newPage, pageSize);
  };

  const handlePageSizeChange = (newLimit: number) => {
    setPageSize(newLimit);
    setCurrentPage(1);
    fetchData(password, search, statusFilter, printFilter, sortFilter, 1, newLimit);
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
        sortCardsByOrder(
          prev.map((c) => (c.card_id === cardId ? { ...c, is_printed: data.isPrinted } : c)),
          sortFilter
        )
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
      fetchData(password, search, statusFilter, printFilter, sortFilter, currentPage, pageSize);
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
      fetchData(password, search, statusFilter, printFilter, sortFilter, currentPage, pageSize);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus kartu.';
      setError(message);
    } finally {
      setDeletingSingle(false);
    }
  };

  // Single card reset to onboarding
  const handleConfirmResetCard = async () => {
    if (!cardToReset) return;
    setResettingCard(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/cards/${cardToReset}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ action: 'reset-onboarding' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mereset kartu ke status onboarding.');
      }

      setSuccess(`Kartu ${cardToReset} berhasil direset ke status awal (Onboarding). ID QR kini siap diregistrasi ulang.`);
      setCardToReset(null);
      fetchData(password, search, statusFilter, printFilter, sortFilter, currentPage, pageSize);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mereset kartu ke status onboarding.';
      setError(message);
    } finally {
      setResettingCard(false);
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
      fetchData(password, search, statusFilter, printFilter, sortFilter, currentPage, pageSize);
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
      fetchData(password, search, statusFilter, printFilter, sortFilter, 1, pageSize);
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
  const handleExportCSV = async () => {
    try {
      let cardsToExport = cards;
      if (selectedCardIds.length > 0) {
        cardsToExport = cards.filter((c) => selectedCardIds.includes(c.card_id));
      } else {
        const res = await fetch(
          `/api/admin/cards?all=true&search=${encodeURIComponent(search)}&status=${statusFilter}&printed=${printFilter}`,
          { headers: { 'x-admin-password': password } }
        );
        const dataAll = await res.json();
        if (dataAll.cards && dataAll.cards.length > 0) {
          cardsToExport = dataAll.cards;
        }
      }

      if (cardsToExport.length === 0) {
        setError('Tidak ada data kartu untuk diekspor ke CSV.');
        return;
      }

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        ['Card ID,Permanent URL,Business Name,WhatsApp / Kontak,Destination,Status,Printed'].join(',') +
        '\n' +
        cardsToExport
          .map(
            (c) =>
              `${c.card_id},https://mycarrd.com/c/${c.card_id},"${(c.business_name || '').replace(/"/g, '""')}","${(c.email || '').replace(/"/g, '""')}","${(c.destination_url || '').replace(/"/g, '""')}",${c.status},${c.is_printed ? 'YES' : 'NO'}`
          )
          .join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `mycarrd_cards_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess(`Berhasil mengunduh CSV ${cardsToExport.length} kartu.`);
    } catch {
      setError('Gagal mengekspor data ke CSV.');
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    setLoading(true);
    setError('');
    try {
      const { jsPDF } = await import('jspdf');

      let targetCardIds: string[] = [];
      if (selectedCardIds.length > 0) {
        targetCardIds = selectedCardIds;
      } else {
        // Fetch all card IDs matching current filters
        const res = await fetch(
          `/api/admin/cards?all=true&search=${encodeURIComponent(search)}&status=${statusFilter}&printed=${printFilter}`,
          { headers: { 'x-admin-password': password } }
        );
        const dataAll = await res.json();
        targetCardIds = (dataAll.cards || []).map((c: Card) => c.card_id);
      }

      if (targetCardIds.length === 0) {
        throw new Error('Tidak ada kartu untuk diekspor.');
      }

      // Memory safeguard: Cap each PDF export batch to 300 cards (25 A4 pages)
      // This guarantees browser never hits memory exhaustion while printing batches
      const MAX_PER_PDF = 300;
      let exportIds = targetCardIds;
      let notice = '';
      if (exportIds.length > MAX_PER_PDF) {
        exportIds = exportIds.slice(0, MAX_PER_PDF);
        notice = ` (300 kartu pertama)`;
      }

      // Generate QR codes in safe chunks of 50
      const chunkSize = 50;
      const qrResults: { cardId: string; data: string }[] = [];
      for (let i = 0; i < exportIds.length; i += chunkSize) {
        const chunk = exportIds.slice(i, i + chunkSize);
        const response = await fetch('/api/admin/qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': password,
          },
          body: JSON.stringify({ cardIds: chunk, format: 'png' }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Gagal membuat QR untuk PDF.');
        }
        qrResults.push(...(data.results || []));
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Grid setup: 3 columns x 4 rows = 12 barcodes per A4 page
      // Clean minimalist format matching single download (ONLY barcode & card ID below)
      const cardsPerRow = 3;
      const size = 46; // 46mm QR code square
      const spacingX = 18;
      const spacingY = 18;
      const startX = 18; // Margin left
      const startY = 16; // Margin top

      let x = startX;
      let y = startY;

      for (let i = 0; i < qrResults.length; i++) {
        const qr = qrResults[i];

        // Draw clean QR code image
        doc.addImage(qr.data, 'PNG', x, y, size, size);

        // Draw ONLY the card ID directly centered below the barcode
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(qr.cardId, x + size / 2, y + size + 5.5, { align: 'center' });

        if ((i + 1) % cardsPerRow === 0) {
          x = startX;
          y += size + spacingY;

          if (y + size + spacingY > 285 && i < qrResults.length - 1) {
            doc.addPage();
            x = startX;
            y = startY;
          }
        } else {
          x += size + spacingX;
        }
      }

      doc.save(`mycarrd_qr_sheet_${Date.now()}.pdf`);
      setSuccess(`PDF lembar ${qrResults.length} QR berhasil diunduh${notice}.`);

      // Automatically mark all exported cards as printed
      fetch('/api/admin/cards', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          action: 'mark-printed',
          cardIds: exportIds,
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
          setCards((prev) =>
            sortCardsByOrder(
              prev.map((c) => (c.card_id === cardId ? { ...c, is_printed: true } : c)),
              sortFilter
            )
          );
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
      setCards((prev) =>
        sortCardsByOrder(
          prev.map((c) => (c.card_id === cardId ? { ...c, is_printed: true } : c)),
          sortFilter
        )
      );
    }).catch(() => {});
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_password');
    router.push('/admin/Sull1v4n');
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
          <Link href="/" className="admin-header-btn">
            Beranda
          </Link>
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
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '160px' }}>
              <input
                type="text"
                placeholder="Cari ID, nama usaha, no. WA..."
                value={search}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  padding: '0.42rem 2rem 0.42rem 0.65rem',
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
                    fetchData(password, '', statusFilter, printFilter, 'ACTIVATED_FIRST');
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

            {/* Box Filter 1: Status Kartu (Urutan Teratas Otomatis) */}
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              aria-label="Filter Status Kartu"
              style={{
                flex: '1 1 140px',
                minWidth: '130px',
                padding: '0.42rem 0.65rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                background: '#ffffff',
                color: 'var(--foreground)',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">Semua (Urutan Teratas)</option>
              <option value="ACTIVE">Aktif ({stats.active || 0})</option>
              <option value="UNACTIVATED">Pending ({stats.unactivated || 0})</option>
            </select>

            {/* Box Filter 2: Status Cetak QR */}
            <select
              value={printFilter}
              onChange={(e) => handlePrintFilterChange(e.target.value)}
              aria-label="Filter Status Cetak QR"
              style={{
                flex: '1 1 140px',
                minWidth: '130px',
                padding: '0.42rem 0.65rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                background: '#ffffff',
                color: 'var(--foreground)',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">Semua Cetak</option>
              <option value="PRINTED">Sudah Dicetak ({stats.printed || 0})</option>
              <option value="UNPRINTED">Belum Dicetak ({stats.unprinted !== undefined ? stats.unprinted : Math.max(0, stats.total - (stats.printed || 0))})</option>
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

                  {/* Middle / Body: Minimalist (Nama Usaha, No HP & Tanggal Aktivasi) */}
                  <div className="admin-card-body">
                    {/* Nama Usaha */}
                    <div className="font-bold text-slate-900 text-truncate" style={{ fontSize: '0.85rem' }}>
                      {card.business_name || (
                        <span className="text-muted italic font-normal text-xs">
                          Belum diaktivasi
                        </span>
                      )}
                    </div>

                    {/* No HP & Tanggal Aktivasi (Minimalist) */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500" style={{ fontSize: '0.74rem' }}>
                      {/* No HP / WhatsApp */}
                      {card.email && (() => {
                        const isPhone = /^[0-9+]+$/.test(card.email.replace(/[\s-]/g, ''));
                        if (isPhone) {
                          let cleanPhone = card.email.replace(/\D/g, '');
                          if (cleanPhone.startsWith('0')) {
                            cleanPhone = '62' + cleanPhone.slice(1);
                          }
                          const greeting = encodeURIComponent(
                            `Halo ${card.business_name || 'Pemilik Kartu'}, kami dari Admin Mycarrd terkait kartu pintar Anda (${card.card_id}).`
                          );
                          const waUrl = `https://wa.me/${cleanPhone}?text=${greeting}`;
                          return (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                              title={`Buka Chat WhatsApp: ${card.email}`}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600 flex-shrink-0">
                                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
                              </svg>
                              <span>{card.email}</span>
                            </a>
                          );
                        }

                        return (
                          <span className="inline-flex items-center gap-1 font-mono text-slate-600">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 flex-shrink-0">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <span>{card.email}</span>
                          </span>
                        );
                      })()}

                      {/* Separator jika no HP dan tanggal aktivasi ada */}
                      {card.email && card.activated_at && (
                        <span className="text-slate-300">•</span>
                      )}

                      {/* Tanggal Aktivasi */}
                      {card.activated_at && (
                        <span className="inline-flex items-center gap-1 text-slate-500" title={`Waktu Aktivasi: ${new Date(card.activated_at).toLocaleString('id-ID')}`}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 flex-shrink-0">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>
                            Aktif: {new Date(card.activated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(card.activated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
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
                      onClick={() => setCardToReset(card.card_id)}
                      title="Reset QR / Onboarding Baru"
                      aria-label="Reset QR / Onboarding Baru"
                      className="action-icon-btn btn-reset"
                      style={{ width: '38px', height: '38px', minWidth: '38px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
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

      {/* POPUP MODAL: RESET CARD TO ONBOARDING CONFIRMATION */}
      {cardToReset && (
        <div className="modal-backdrop">
          <div className="onboarding-card modal-content animate-fade-in" style={{ maxWidth: '410px', padding: '1.25rem' }}>
            <div className="flex items-center gap-2 mb-2">
              <div style={{ background: '#fff7ed', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </div>
              <h3 className="text-sm font-bold m-0" style={{ color: '#c2410c' }}>Reset QR ke Status Onboarding?</h3>
            </div>

            <p className="text-muted text-xs mb-2.5 leading-relaxed">
              Anda akan mereset kartu <strong className="font-mono font-bold" style={{ color: 'var(--foreground)' }}>{cardToReset}</strong> ke status awal (registrasi baru).
            </p>

            <div className="p-2.5 rounded-sm mb-3 text-xs" style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', lineHeight: '1.45' }}>
              <div className="font-bold mb-1">Dampak setelah direset:</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                <li>Nama usaha, link ulasan Google Maps, no. WhatsApp &amp; PIN akan dikosongkan.</li>
                <li>Status kartu kembali menjadi <strong>Pending (UNACTIVATED)</strong>.</li>
                <li>Saat kartu ditap atau QR discan, pelanggan diarahkan ke halaman onboarding (<span className="font-mono font-semibold">/onboarding/{cardToReset}</span>).</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmResetCard}
                className="btn w-full py-1.5 font-semibold text-xs"
                style={{ background: '#ea580c', color: '#ffffff', border: '1px solid #ea580c' }}
                disabled={resettingCard}
              >
                {resettingCard ? 'Mereset...' : 'Ya, Reset ke Onboarding'}
              </button>
              <button
                type="button"
                onClick={() => setCardToReset(null)}
                className="btn btn-secondary w-full py-1.5 font-semibold text-xs"
                disabled={resettingCard}
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

            {selectedCard.email ? (() => {
              const isPhone = /^[0-9+]+$/.test(selectedCard.email.replace(/[\s-]/g, ''));
              if (isPhone) {
                let cleanPhone = selectedCard.email.replace(/\D/g, '');
                if (cleanPhone.startsWith('0')) {
                  cleanPhone = '62' + cleanPhone.slice(1);
                }
                const greeting = encodeURIComponent(
                  `Halo ${selectedCard.business_name || 'Pemilik Kartu'}, kami dari Admin Mycarrd (mycarrd.com) mengenai permohonan reset PIN untuk kartu ${selectedCard.card_id}.`
                );
                const waUrl = `https://wa.me/${cleanPhone}?text=${greeting}`;
                return (
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 mb-3">
                    <span className="font-bold block text-[11px] text-emerald-800 mb-1">
                      No. WhatsApp Pemilik Terdaftar:
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-sm text-emerald-950 select-all">
                        {selectedCard.email}
                      </span>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 px-2 text-xs font-semibold flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        style={{ textDecoration: 'none', fontSize: '11px' }}
                      >
                        Chat WA ↗
                      </a>
                    </div>
                  </div>
                );
              }
              return (
                <div className="p-2 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900 mb-3">
                  <span className="font-bold block text-[11px] text-blue-700">Email Pemilik Terdaftar:</span>
                  <span className="font-mono font-semibold select-all">{selectedCard.email}</span>
                </div>
              );
            })() : (
              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-xs text-muted mb-3">
                Kartu belum memiliki kontak WhatsApp/email terdaftar.
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
