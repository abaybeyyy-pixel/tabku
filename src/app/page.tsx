'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Homepage() {
  const [cardId, setCardId] = useState('');
  const [error, setError] = useState('');
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({ 0: true });
  const [activeDemoTab, setActiveDemoTab] = useState<'tap' | 'search' | 'review'>('tap');
  const [selectedStars, setSelectedStars] = useState(5);
  const router = useRouter();

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId.trim()) {
      setError('Silakan masukkan ID Kartu Anda.');
      return;
    }
    router.push(`/onboarding/${cardId.trim().toUpperCase()}`);
  };

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const workflows = [
    {
      step: '01',
      title: 'Terima & Scan Kartu',
      description: 'Dapatkan kartu fisik NFC Anda. Tempelkan kartu ke smartphone atau scan kode QR di belakang untuk membuka portal aktivasi.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      step: '02',
      title: 'Cari Lokasi Bisnis',
      description: 'Ketik nama usaha Anda langsung di form pencarian Google Places API. Pilih cabang yang sesuai tanpa repot copy-paste link manual.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      step: '03',
      title: 'Kunci dengan PIN',
      description: 'Atur 4-6 digit PIN pengaman & email pemulihan. Pengaturan kartu terlindungi dan dapat Anda ganti kapan saja di masa depan.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      step: '04',
      title: 'Langsung Tulis Review',
      description: 'Taruh kartu di kasir. Sekali tap oleh pelanggan, popup Google Write a Review langsung terbuka dengan pilihan 5 bintang.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ];

  const features = [
    {
      title: 'Google Places API Terintegrasi',
      description: 'Cari bisnis semudah mengetik di Google Maps. Sistem otomatis menghasilkan URL composer resmi Google Review yang valid.',
      badge: 'Baru',
    },
    {
      title: 'Chip NFC NTAG Ultra-Fast',
      description: 'Responsivitas instan tanpa jeda. Bekerja mulus di seluruh iPhone (iOS 13+) dan Android berfitur NFC.',
      badge: 'Hardware',
    },
    {
      title: 'QR Code Dinamis Beresolusi Tinggi',
      description: 'Alternatif cepat bagi pelanggan yang ponselnya belum mendukung NFC. Tetap terarah ke link yang sama.',
      badge: 'Fleksibel',
    },
    {
      title: 'Portal Kelola Mandiri (/manage)',
      description: 'Pindah cabang atau ganti nama usaha? Cukup login dengan ID Kartu & PIN Anda untuk memperbarui tujuan ulasan seketika.',
      badge: 'Cloud Sync',
    },
    {
      title: 'Tanpa Install Aplikasi',
      description: 'Pelanggan tidak perlu mendownload aplikasi apa pun. Langsung terbuka di browser bawaan Safari atau Chrome.',
      badge: 'Zero Friction',
    },
    {
      title: 'Keamanan OTP Email',
      description: 'Lupa PIN pengelolaan? Sistem pemulihan email OTP otomatis siap mengirimkan kode reset 6 digit secara instan.',
      badge: 'Aman',
    },
  ];

  const testimonials = [
    {
      quote: 'Dulu susah banget minta review ke customer karena mereka malas ketik nama cafe di Google Maps. Sekarang tinggal tap di meja kasir, ulasan naik 400% dalam sebulan!',
      author: 'Reza Fahrezi',
      role: 'Owner, Kopi Dua Musim',
      location: 'Jakarta Selatan',
      rating: 5,
    },
    {
      quote: 'Fitur ganti bisnisnya canggih banget. Waktu kami rebrand nama klinik, kartu fisik tidak perlu dibuang. Cukup ubah di dashboard dan langsung update.',
      author: 'drg. Melani Wijaya',
      role: 'Founder, DentaCare Clinic',
      location: 'Surabaya',
      rating: 5,
    },
    {
      quote: 'Kualitas kartu fisiknya matte premium, bukan stiker murahan. Sangat cocok ditaruh di front desk hotel kami.',
      author: 'Budi Santoso',
      role: 'Operations Manager, De Prime Villa',
      location: 'Bali',
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: 'Bagaimana cara kerja Kartu Google Review Tapku?',
      a: 'Kartu dilengkapi dengan chip NFC dan kode QR dinamis. Saat pelanggan menempelkan ponselnya atau scan QR, sistem Tapku langsung mengarahkan browser pelanggan ke halaman "Write a Review" resmi Google tempat pelanggan bisa langsung memberi rating bintang 5 dan ulasan.',
    },
    {
      q: 'Apakah saya bisa mengganti link bisnis di kemudian hari?',
      a: 'Bisa! Ini keunggulan utama kartu dinamis Tapku. Anda cukup membuka menu "Kelola Kartu" (/manage), masukkan ID Kartu dan PIN Anda, lalu cari bisnis baru melalui Google Places API. Kartu fisik tetap sama tanpa perlu beli baru.',
    },
    {
      q: 'Apakah semua smartphone bisa menggunakan kartu ini?',
      a: 'Ya. Untuk iPhone XR hingga seri terbaru dan Android modern, fitur NFC aktif secara otomatis tanpa perlu membuka aplikasi apa pun. Untuk ponsel tanpa NFC, pelanggan cukup scan QR code di bagian belakang kartu menggunakan kamera biasa.',
    },
    {
      q: 'Bagaimana jika saya lupa PIN kartu saya?',
      a: 'Gunakan tombol "Lupa PIN" di halaman /manage. Sistem akan mengirimkan kode verifikasi OTP 6 digit ke email pemulihan yang Anda daftarkan saat pertama kali mengaktifkan kartu.',
    },
    {
      q: 'Apakah kartu membutuhkan baterai atau pengisian daya?',
      a: 'Sama sekali tidak. Chip NFC bersifat pasif dan ditenagai oleh sinyal induksi dari smartphone pelanggan saat ditempelkan, sehingga dapat digunakan selamanya tanpa baterai.',
    },
  ];

  return (
    <div className="home-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-container">
          <a href="/" className="nav-logo">
            <span className="nav-logo-badge">G</span>
            <span>TAPKU</span>
          </a>
          <div className="nav-links">
            <a href="#workflow" className="nav-link">Cara Kerja</a>
            <a href="#features" className="nav-link">Fitur</a>
            <a href="#demo" className="nav-link">Simulasi</a>
            <a href="#testimonials" className="nav-link">Testimoni</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>
          <div className="nav-actions">
            <a href="/manage" className="btn btn-secondary py-2 px-3 text-xs font-semibold">
              Kelola Kartu
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-section text-center">
        <div className="hero-glow"></div>
        <div className="container-sm relative" style={{ zIndex: 1 }}>
          <div className="hero-badge-pill">
            <span style={{ color: '#10b981' }}>●</span>
            <span>Google Review NFC & QR Card Platform</span>
          </div>

          <h1 className="hero-title font-extrabold mb-3">
            Kumpulkan Ulasan Google Bintang 5 <br />
            <span className="text-gradient">Cukup Satu Ketukan.</span>
          </h1>

          <p className="hero-subtitle max-w-xl mx-auto mb-5">
            Tingkatkan reputasi dan peringkat SEO Google Maps bisnis Anda. Pelanggan cukup menempelkan ponsel ke kartu fisik untuk langsung membuka formulir ulasan.
          </p>

          {/* QUICK ACTIVATION CTA */}
          <div className="cta-box mb-3">
            <form onSubmit={handleActivate} className="cta-form">
              <input
                type="text"
                placeholder="Masukkan ID Kartu (contoh: GR0001)"
                value={cardId}
                onChange={(e) => {
                  setCardId(e.target.value);
                  setError('');
                }}
                className="card-id-input"
              />
              <button type="submit" className="btn btn-primary py-3 px-5 font-semibold">
                Aktifkan Sekarang →
              </button>
            </form>
          </div>
          {error && <p className="error-alert max-w-md mx-auto mb-3 text-xs">{error}</p>}

          <div className="flex justify-center items-center gap-4 text-xs text-muted mt-3">
            <span>✓ Tanpa Aplikasi Tambahan</span>
            <span>•</span>
            <span>✓ Cari Bisnis Otomatis</span>
            <span>•</span>
            <span>✓ Ganti Link Kapan Saja</span>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="stats-section py-4">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-num">4.9 / 5</span>
              <span className="text-xs text-muted font-medium mt-1">Rata-rata Rating Customer</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">&lt; 3 Detik</span>
              <span className="text-xs text-muted font-medium mt-1">Kecepatan Membuka Review</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">100%</span>
              <span className="text-xs text-muted font-medium mt-1">Kompatibel iOS & Android</span>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO SIMULATION */}
      <section id="demo" className="py-6 border-b">
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Simulasi Interaktif</span>
            <h2 className="section-title font-bold mt-1">Lihat Betapa Mudahnya Flow Pelanggan</h2>
            <p className="text-muted max-w-lg mx-auto text-sm mt-2">
              Cobalah simulasi di bawah ini untuk melihat bagaimana pengalaman pelanggan Anda saat menyentuh kartu.
            </p>
          </div>

          <div className="demo-card-container">
            {/* Step tab switcher */}
            <div className="tab-container max-w-sm mx-auto mb-4">
              <button
                className={`tab-btn ${activeDemoTab === 'tap' ? 'active' : ''}`}
                onClick={() => setActiveDemoTab('tap')}
              >
                1. Tap Kartu
              </button>
              <button
                className={`tab-btn ${activeDemoTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveDemoTab('search')}
              >
                2. Cari Bisnis
              </button>
              <button
                className={`tab-btn ${activeDemoTab === 'review' ? 'active' : ''}`}
                onClick={() => setActiveDemoTab('review')}
              >
                3. Tulis Review
              </button>
            </div>

            {/* TAB 1: TAP PREVIEW */}
            {activeDemoTab === 'tap' && (
              <div className="text-center animate-fade-in py-2">
                <div className="nfc-card-mock mb-4">
                  <div className="nfc-card-top">
                    <div className="nfc-card-chip"></div>
                    <span className="nfc-wave-icon font-mono text-xs">))) NFC</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>TAP FOR REVIEW</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Google Review Smart Card</div>
                  </div>
                  <div className="nfc-card-bottom">
                    <span className="nfc-business-title">Kopi Kenangan Senayan</span>
                    <span className="nfc-card-id">GR0001</span>
                  </div>
                </div>

                <p className="text-sm text-muted mb-3">
                  Pelanggan cukup menempelkan bagian atas ponsel ke kartu ini.
                </p>
                <button
                  onClick={() => setActiveDemoTab('search')}
                  className="btn btn-primary py-2 px-4 text-xs font-semibold"
                >
                  Lihat Cara Hubungkan Lokasi →
                </button>
              </div>
            )}

            {/* TAB 2: SEARCH PLACE PREVIEW */}
            {activeDemoTab === 'search' && (
              <div className="text-left animate-fade-in max-w-md mx-auto py-2">
                <div className="selected-business-box mb-3">
                  <div className="selected-business-check">✓</div>
                  <div className="selected-business-info">
                    <span className="selected-business-name">Kopi Kenangan - Senayan City</span>
                    <span className="selected-business-address">Jl. Asia Afrika No.19, Gelora, Jakarta Selatan</span>
                  </div>
                </div>
                <p className="text-xs text-muted mb-4">
                  Sistem otomatis menarik <strong>Place ID</strong> resmi dari Google Places API untuk membuka modal ulasan langsung.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveDemoTab('review')}
                    className="btn btn-primary py-2 px-4 text-xs font-semibold w-full"
                  >
                    Simulasikan Review Pelanggan →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: WRITE REVIEW MODAL PREVIEW */}
            {activeDemoTab === 'review' && (
              <div className="text-center animate-fade-in max-w-md mx-auto py-2">
                <div style={{ background: 'var(--background-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>G</div>
                    <span className="font-bold text-sm">Google Review Composer</span>
                  </div>
                  <p className="text-xs text-muted mb-3">Beri nilai untuk <strong>Kopi Kenangan Senayan</strong></p>

                  <div className="flex justify-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedStars(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.8rem',
                          cursor: 'pointer',
                          color: star <= selectedStars ? '#f59e0b' : '#d4d4d8',
                          transition: 'transform 0.15s',
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <div style={{ background: 'var(--background-card)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                    "Kopinya mantap, baristanya ramah banget. Pasti bakal balik lagi ke sini!"
                  </div>

                  <div className="mt-3">
                    <span className="status-tag active" style={{ fontSize: '0.7rem' }}>
                      ✓ Ulasan Siap Dikirim ke Google
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveDemoTab('tap')}
                  className="btn btn-secondary py-2 px-4 text-xs font-semibold mt-3"
                >
                  Ulangi Simulasi ↺
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / WORKFLOW */}
      <section id="workflow" className="py-6 border-b" style={{ background: 'var(--background-subtle)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Cara Kerja</span>
            <h2 className="section-title font-bold mt-1">Alur Sederhana & Otomatis</h2>
            <p className="text-muted max-w-lg mx-auto text-sm mt-2">
              Tidak butuh keahlian teknis. Hubungkan kartu Anda dalam hitungan menit dan mulai kumpulkan ulasan pelanggan.
            </p>
          </div>

          <div className="grid-4">
            {workflows.map((item, idx) => (
              <div key={idx} className="step-card-minimal">
                <div className="flex justify-between items-center mb-3">
                  <div className="step-badge">{item.step}</div>
                  <div style={{ color: 'var(--foreground-muted)' }}>{item.icon}</div>
                </div>
                <h3 className="text-sm font-bold mb-2">{item.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="py-6 border-b">
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Keunggulan</span>
            <h2 className="section-title font-bold mt-1">Fitur Dirancang untuk Bisnis Fisik</h2>
            <p className="text-muted max-w-lg mx-auto text-sm mt-2">
              Didesain khusus untuk kafe, restoran, klinik, salon, bengkel, hotel, dan toko retail.
            </p>
          </div>

          <div className="grid-3">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card-minimal">
                <div className="flex justify-between items-center">
                  <span className="section-badge" style={{ fontSize: '0.65rem' }}>{feature.badge}</span>
                </div>
                <h3 className="text-sm font-bold">{feature.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-6 border-b" style={{ background: 'var(--background-subtle)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Testimoni</span>
            <h2 className="section-title font-bold mt-1">Dipercaya Pemilik Usaha di Indonesia</h2>
            <p className="text-muted max-w-lg mx-auto text-sm mt-2">
              Kisah nyata peningkatan rating dan visibilitas pencarian Google Maps.
            </p>
          </div>

          <div className="grid-3">
            {testimonials.map((t, idx) => (
              <div key={idx} className="testimonial-card">
                <div>
                  <div className="quote-stars mb-2">{'★'.repeat(t.rating)}</div>
                  <p className="quote-text text-sm">"{t.quote}"</p>
                </div>
                <div className="author-details">
                  <span className="author-name block">{t.author}</span>
                  <span className="author-role block">{t.role}</span>
                  <span className="text-xs text-subtle font-mono block mt-1">{t.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-6 border-b">
        <div className="container-sm">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Tanya Jawab</span>
            <h2 className="section-title font-bold mt-1">Pertanyaan yang Sering Diajukan</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="faq-question"
                >
                  <span>{faq.q}</span>
                  <span className={`faq-icon-chevron ${faqOpen[idx] ? 'open' : ''}`}>▼</span>
                </button>
                {faqOpen[idx] && (
                  <div className="faq-answer animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-6 text-center" style={{ background: 'var(--background-card)' }}>
        <div className="container-sm">
          <h2 className="text-2xl font-extrabold mb-2">Siap Meledakkan Ulasan Bisnis Anda?</h2>
          <p className="text-muted text-sm mb-4 max-w-md mx-auto">
            Masukkan ID Kartu Anda untuk mulai mengatur lokasi bisnis Anda sekarang juga.
          </p>
          <div className="flex justify-center gap-2 max-w-xs mx-auto">
            <a href="#hero" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn btn-primary py-3 px-6 font-semibold w-full">
              Mulai Aktivasi Kartu ↑
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-4 border-t text-center text-xs text-muted" style={{ background: 'var(--background-subtle)' }}>
        <div className="container flex justify-between items-center flex-wrap gap-2">
          <span>&copy; {new Date().getFullYear()} Tapku. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="/manage" className="hover:underline">Kelola Kartu</a>
            <a href="/admin/login" className="hover:underline">Portal Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
