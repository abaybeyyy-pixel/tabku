'use client';

import React, { useState } from 'react';

export default function Homepage() {
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({ 0: true });
  const [selectedStars, setSelectedStars] = useState(5);

  // 3D Phone Mockup Interactive State
  const [cardTransform, setCardTransform] = useState('perspective(1200px) rotateX(0deg) rotateY(0deg)');
  const [hasTappedCard, setHasTappedCard] = useState(false);

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 10;

    setCardTransform(`perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleCardMouseLeave = () => {
    setCardTransform('perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  const handleCardClick = () => {
    setHasTappedCard(true);
    setTimeout(() => {
      setHasTappedCard(false);
    }, 2500);
  };

  const waUrl = 'https://wa.me/6281211156865?text=Halo%20Tapku,%20saya%20ingin%20pesan%20Smart%20Card%20Google%20Review%20NFC%20untuk%20bisnis%20saya.';
  const waResellerUrl = 'https://wa.me/6281211156865?text=Halo%20Tapku,%20saya%20tertarik%20untuk%20bergabung%20menjadi%20Reseller%20/%20Mitra%20resmi%20Tapku.';
  const waInfoUrl = 'https://wa.me/6281211156865?text=Halo%20Tapku,%20saya%20ingin%20tanya%20informasi%20lengkap%20seputar%20Kartu%20Google%20Review%20NFC.';

  // Target Markets Data
  const targetMarkets = [
    {
      category: 'Kuliner & F&B',
      title: 'Kafe, Restoran & Bakery',
      description: 'Taruh kartu di meja kasir atau etalase. Pelanggan yang puas santap langsung memberi ulasan bintang 5 sebelum melangkah keluar.',
      examples: 'Coffee Shop, Restoran Keluarga, Kedai Ramen, Artisan Bakery',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      ),
    },
    {
      category: 'Kecantikan & Gaya',
      title: 'Barbershop, Salon & Spa',
      description: 'Momen terbaik minta ulasan adalah saat pelanggan bercermin dan sangat puas dengan hasil potongan rambut atau treatment mereka.',
      examples: 'Gentlemen Barber, Nail Art Studio, Salon Rambut, Reflexology',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      category: 'Kesehatan & Medis',
      title: 'Klinik Gigi & Aesthetic',
      description: 'Tingkatkan keyakinan calon pasien baru dengan puluhan testimoni jujur dan rating 4.9+ di pencarian Google Maps.',
      examples: 'Dental Care, Praktek Dokter Spesialis, Aesthetic Clinic, Apotek',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
    {
      category: 'Otomotif & Servis',
      title: 'Bengkel & Car Detailing',
      description: 'Pengendara selalu mencari bengkel terdekat dengan review terbaik. Amankan posisi peringkat #1 di area sekitar Anda.',
      examples: 'Bengkel Mobil/Motor, Salon Mobil & Detailing, Toko Ban, AC Mobil',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      category: 'Hospitality & Wisata',
      title: 'Hotel Butik, Villa & Homestay',
      description: 'Saat tamu check-out dan mengembalikan kunci kamar, staf resepsionis cukup sodorkan kartu Tapku untuk ulasan instan.',
      examples: 'Boutique Hotel, Villa Liburan, Guest House, Agen Travel',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      category: 'Retail & Komunitas',
      title: 'Gym, Pet Shop & Retail Store',
      description: 'Bangun reputasi lokal yang kuat. Bisnis dengan ulasan aktif selalu mendapatkan traffic kunjungan fisik yang konsisten.',
      examples: 'Fitness Center, Pet Clinic, Optik Kacamata, Toko Fashion',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),
    },
  ];

  // Dynamic Link Benefits Data
  const dynamicBenefits = [
    {
      title: 'Beli 1x, Aktif Seumur Hidup',
      description: '100% Tanpa biaya langganan bulanan atau tahunan. Kartu dapat digunakan tanpa batas ulasan selamanya.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      title: 'Bebas Ganti Lokasi Realtime',
      description: 'Pindah alamat, buka cabang baru, atau rebrand nama bisnis? Cukup perbarui di portal kelola tanpa perlu beli kartu baru.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
      ),
    },
    {
      title: 'Direct Google Review Deep-Link',
      description: 'Sistem otomatis mengarahkan ke formulir ulasan resmi dengan Place ID akurat sehingga bintang 5 langsung terbuka.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="12 8 8 12 12 16 12 13 16 13 16 11 12 11 12 8" />
        </svg>
      ),
    },
    {
      title: 'Sinkronisasi Otomatis NFC & QR',
      description: 'Satu pengaturan link otomatis memperbarui chip NFC dan kode QR dinamis di belakang kartu secara instan.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
    },
  ];

  const workflows = [
    {
      step: '01',
      title: 'Terima Kartu Fisik',
      description: 'Kartu pintar siap pakai tiba di alamat Anda. Tempelkan HP untuk aktivasi awal mandiri dalam 1 menit.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      step: '02',
      title: 'Cari Lokasi Google Bisnis',
      description: 'Ketik nama usaha Anda melalui Google Places API terintegrasi. Sistem otomatis menautkan Place ID resmi.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      step: '03',
      title: 'Amankan dengan PIN',
      description: 'Atur PIN pengaman dan email pemulihan. Anda bebas mengubah nama usaha atau link tujuan kapan saja.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      step: '04',
      title: 'Pelanggan Tap & Review',
      description: 'Letakkan di meja kasir. Pelanggan cukup menempelkan HP dan modal rating bintang 5 langsung terbuka otomatis.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ];

  // Marquee Row 1 Reviews
  const marqueeReviewsRow1 = [
    {
      quote: 'Dulu customer sering lupa kasih ulasan meskipun puas. Sejak taruh kartu Tapku di meja kasir, tiap hari rata-rata masuk 6 sampai 8 review bintang 5.',
      author: 'Reza Fahrezi',
      role: 'Owner',
      business: 'Kopi Dua Musim',
      location: 'Jakarta Selatan',
      rating: 5,
    },
    {
      quote: 'Sangat praktis saat rebrand nama klinik. Cukup ubah nama di portal kelola dan Place ID baru langsung tersambung tanpa perlu cetak ulang kartu.',
      author: 'drg. Melani Wijaya',
      role: 'Founder',
      business: 'DentaCare Clinic',
      location: 'Surabaya',
      rating: 5,
    },
    {
      quote: 'Kartu fisiknya kokoh dan estetik. Tamu hotel yang check-out tinggal tap waktu mengembalikan kunci kamar, ulasan langsung naik drastis.',
      author: 'Budi Santoso',
      role: 'Operations Manager',
      business: 'De Prime Villa',
      location: 'Bali',
      rating: 5,
    },
    {
      quote: 'Bengkel kami sekarang ranking nomor 1 di Google Maps area BSD. Customer merasa gampang karena tidak perlu repot cari link manual.',
      author: 'Hendri Gunawan',
      role: 'Head Workshop',
      business: 'Garasi Auto BSD',
      location: 'Tangerang Selatan',
      rating: 5,
    },
    {
      quote: 'Barbershop kami jadi jauh lebih dipercaya pelanggan baru. Ulasan bintang 5 bertambah puluhan dalam hitungan 2 minggu pertama.',
      author: 'Fajar Nugraha',
      role: 'Owner',
      business: 'Gentlemen Cut Barber',
      location: 'Bandung',
      rating: 5,
    },
    {
      quote: 'Pelanggan bakery kami yang ibu-ibu pun tidak kesulitan. Tinggal tempel HP ke kartu di etalase kasir, langsung muncul bintang 5.',
      author: 'Siti Rahmawati',
      role: 'Head Baker',
      business: 'Delice Artisanal Pastry',
      location: 'Yogyakarta',
      rating: 5,
    },
  ];

  // Marquee Row 2 Reviews
  const marqueeReviewsRow2 = [
    {
      quote: 'Investasi terbaik untuk bisnis kuliner fisik kami. Peringkat Google Maps naik, dan omzet dine-in terasa ikut terdorong karena rating tinggi.',
      author: 'William Tanuwidjaja',
      role: 'Co-Founder',
      business: 'Nasi Goreng Kebon Sirih',
      location: 'Jakarta Pusat',
      rating: 5,
    },
    {
      quote: 'Pasien estetik kami senang karena reviewernya cepat tidak sampai 10 detik. Fitur edit nama dan linknya juga gampang dipahami staf kasir.',
      author: 'dr. Stephanie',
      role: 'Medical Director',
      business: 'Glow Aesthetic Studio',
      location: 'Medan',
      rating: 5,
    },
    {
      quote: 'Kami pasang di 4 cabang laundry sekaligus. Kartunya awet, respon tap-nya cepat di iPhone maupun Android merk apa pun.',
      author: 'Agus Salim',
      role: 'Owner',
      business: 'CleanXpress Laundry',
      location: 'Semarang',
      rating: 5,
    },
    {
      quote: 'Pet shop kami sering ramai saat weekend. Customer yang nunggu grooming selesai biasanya santai tap kartu ulasan sambil nunggu.',
      author: 'Claudia Monita',
      role: 'Manager',
      business: 'Paws & Paws Pet Clinic',
      location: 'Jakarta Barat',
      rating: 5,
    },
    {
      quote: 'Pelanggan studio gym kami banyak yang aktif di sosial media. Begitu disuruh tap kartu ulasan, mereka langsung kasih bintang 5 dengan senang hati.',
      author: 'Rian Pratama',
      role: 'Lead Coach',
      business: 'Pulse Fitness Center',
      location: 'Malang',
      rating: 5,
    },
    {
      quote: 'Pengalihan URL Google Review-nya sangat cepat dan mulus. Customer tidak perlu login ulang jika sudah punya akun Google di HP.',
      author: 'Doni Kurniawan',
      role: 'Marketing Lead',
      business: 'Ruang Hijau Coworking',
      location: 'Depok',
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: 'Bagaimana cara kerja Kartu Google Review Tapku?',
      a: 'Kartu dilengkapi chip NFC dan kode QR dinamis. Saat pelanggan menempelkan smartphone atau memindai kode QR di kartu, layar HP langsung membuka jendela resmi Google Review tempat pelanggan bisa langsung memberi rating bintang 5 dan ulasan dalam hitungan detik.',
    },
    {
      q: 'Bagaimana jika nama bisnis atau Place ID saya berubah nanti?',
      a: 'Bisa, 100% fleksibel! Ini keunggulan utama teknologi Dynamic Link Tapku. Dengan memasukkan ID Kartu dan PIN Anda pada sistem Tapku, Anda bebas memperbarui nama bisnis dan Place ID Google Maps kapan saja tanpa perlu mengganti kartu fisik.',
    },
    {
      q: 'Apakah semua jenis smartphone bisa menggunakan kartu ini?',
      a: 'Ya. Untuk iPhone XR ke atas dan hampir seluruh Android modern, fitur NFC aktif secara otomatis tanpa aplikasi tambahan. Untuk ponsel tanpa NFC, pelanggan cukup memindai kode QR pada bagian belakang kartu menggunakan kamera bawaan HP.',
    },
    {
      q: 'Apakah ada biaya langganan bulanan atau tahunan?',
      a: 'Sama sekali tidak ada biaya langganan bulanan atau tahunan (1x Beli, Aktif Selamanya). Anda dapat menggunakan kartu selamanya tanpa batasan jumlah tap ulasan.',
    },
    {
      q: 'Bagaimana cara bergabung menjadi Reseller atau Mitra?',
      a: 'Anda dapat menghubungi tim kemitraan kami melalui tombol "Gabung Reseller via WhatsApp". Kami menyediakan paket grosir B2B dengan margin keuntungan tinggi, materi promosi siap pakai, dan dukungan sistem.',
    },
    {
      q: 'Apakah kartu membutuhkan baterai atau pengisian daya?',
      a: 'Tidak. Chip NFC bersifat pasif dan ditenagai oleh sinyal induksi elektromagnetik dari smartphone pelanggan saat ditempelkan, sehingga dapat digunakan selamanya tanpa baterai.',
    },
  ];

  return (
    <div className="home-container">
      {/* WHATSAPP LIVE MARQUEE ANNOUNCEMENT BANNER */}
      <a
        href={waInfoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="wa-marquee-banner"
        title="Klik untuk chat WhatsApp Customer Support Tapku"
      >
        <div className="wa-marquee-badge">
          <span className="wa-live-dot"></span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-5.514 0-10 4.486-10 10 0 1.761.459 3.417 1.258 4.865l-1.297 4.735 4.856-1.273c1.393.759 2.977 1.173 4.683 1.173 5.514 0 10-4.486 10-10s-4.486-10-10-10z" />
          </svg>
          <span>CS ONLINE</span>
        </div>
        <div className="wa-marquee-track-container">
          <div className="wa-marquee-content">
            <span className="wa-marquee-item">
              💬 <strong>Punya pertanyaan atau butuh informasi produk?</strong> Chat Customer Support kami via WhatsApp (Respon Cepat).
            </span>
            <span className="wa-marquee-sep">•</span>
            <span className="wa-marquee-item">
              🚀 <strong>Konsultasi Gratis &amp; Dapatkan Penawaran Khusus!</strong> Klik untuk langsung chat via WhatsApp ➜
            </span>
            <span className="wa-marquee-sep">•</span>
            <span className="wa-marquee-item">
              ⭐ <strong>Tapku Smart Card Google Review NFC:</strong> Praktis sekali tap langsung buka review bintang 5 bisnis Anda!
            </span>
            <span className="wa-marquee-sep">•</span>
            <span className="wa-marquee-item">
              💬 <strong>Punya pertanyaan atau butuh informasi produk?</strong> Chat Customer Support kami via WhatsApp (Respon Cepat).
            </span>
            <span className="wa-marquee-sep">•</span>
            <span className="wa-marquee-item">
              🚀 <strong>Konsultasi Gratis &amp; Dapatkan Penawaran Khusus!</strong> Klik untuk langsung chat via WhatsApp ➜
            </span>
            <span className="wa-marquee-sep">•</span>
            <span className="wa-marquee-item">
              ⭐ <strong>Tapku Smart Card Google Review NFC:</strong> Praktis sekali tap langsung buka review bintang 5 bisnis Anda!
            </span>
            <span className="wa-marquee-sep">•</span>
          </div>
        </div>
      </a>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-container">
          <a href="/" className="nav-logo font-bold">
            TAPKU
          </a>
          <div className="nav-links">
            <a href="#target-market" className="nav-link">Untuk Bisnis</a>
            <a href="#benefits" className="nav-link">Kelebihan</a>
            <a href="#comparison" className="nav-link">Komparasi</a>
            <a href="#workflow" className="nav-link">Cara Kerja</a>
            <a href="#reseller" className="nav-link">Reseller</a>
            <a href="#testimonials" className="nav-link">Testimoni</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>
          <div className="nav-actions">
            <a href="/manage" className="btn-manage-nav">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Login User</span>
            </a>
          </div>
        </div>
      </nav>

      {/* SIDE-BY-SIDE HERO SECTION WITH 3D PHONE MOCKUP & WHATSAPP CTA */}
      <section className="hero-section py-6">
        <div className="container">
          <div className="hero-split-grid">
            {/* Left Column: Heading, Subtitle & WhatsApp CTA */}
            <div>
              {/* UNIFIED HERO TRUST BADGE */}
              <div className="hero-badge-pill mb-3">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
                <span className="font-bold text-xs" style={{ color: '#15803d' }}>TERUJI TINGKATKAN 3X REVIEW</span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span className="text-muted text-xs font-semibold">Smart Card No. 1 di Indonesia</span>
              </div>

              <h1 className="hero-title font-extrabold mb-3">
                Banjir Review Bintang 5 di Google Maps <br />
                <span className="text-gradient">Cukup dengan Sekali Tempel HP</span>
              </h1>

              <p className="hero-subtitle mb-4">
                <strong>93% calon pelanggan memilih bisnis dengan rating tertinggi di Google Maps.</strong> Jangan biarkan kompetitor merebut pelanggan Anda. Dengan Tapku, pelanggan cukup menempelkan HP untuk langsung memberi ulasan bintang 5 dalam 2 detik.
              </p>

              {/* SINGLE FOCUSED WHATSAPP CTA */}
              <div className="hero-cta-wrap mb-1">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp py-3 px-6 text-sm font-bold"
                  style={{ width: 'auto', minWidth: '240px' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-5.514 0-10 4.486-10 10 0 1.761.459 3.417 1.258 4.865l-1.297 4.735 4.856-1.273c1.393.759 2.977 1.173 4.683 1.173 5.514 0 10-4.486 10-10s-4.486-10-10-10z" />
                  </svg>
                  Pesan Kartu via WhatsApp
                </a>
              </div>

              {/* VALUE TRUST ROW */}
              <div className="hero-trust-row">
                <span className="trust-pill-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  1x Beli Aktif Selamanya
                </span>
                <span className="dot-sep">•</span>
                <span className="trust-pill-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Bebas Ganti Lokasi
                </span>
                <span className="dot-sep">•</span>
                <span className="trust-pill-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Garansi Chip 100%
                </span>
              </div>

              {/* SOCIAL PROOF: RATUSAN UNIT TERJUAL & RATING BINTANG */}
              <div className="hero-social-card">
                <div className="avatar-group">
                  <div className="avatar-bubble" style={{ background: '#dbeafe', color: '#1e40af' }}>R</div>
                  <div className="avatar-bubble" style={{ background: '#dcfce7', color: '#15803d' }}>M</div>
                  <div className="avatar-bubble" style={{ background: '#fef3c7', color: '#b45309' }}>B</div>
                  <div className="avatar-bubble" style={{ background: '#f3e8ff', color: '#6b21a8' }}>H</div>
                  <div className="avatar-bubble count">+850</div>
                </div>

                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                    <span className="font-extrabold text-xs ml-1" style={{ fontSize: '0.78rem' }}>4.9 / 5.0</span>
                  </div>
                  <p className="text-muted text-xs truncate" style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                    <strong style={{ color: 'var(--foreground)' }}>850+ Unit Kartu Terjual</strong> &amp; Dipercaya UMKM
                  </p>
                </div>
              </div>
            </div>


            {/* Right Column: 3D Interactive Smartphone Tap Mockup */}
            <div className="flex flex-col items-center">
              <div className="phone-3d-wrapper">
                <div
                  className="phone-device-container"
                  style={{ transform: cardTransform }}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                >
                  {/* Floating NFC Card tapping phone */}
                  <div
                    className={`nfc-floating-card ${hasTappedCard ? 'tapping' : ''}`}
                    onClick={handleCardClick}
                    title="Klik kartu untuk simulasi Tap NFC"
                  >
                    <div className="flex justify-between items-center">
                      <div className="nfc-card-chip" style={{ width: '18px', height: '12px' }}></div>
                      <span className="font-mono text-xs font-bold" style={{ fontSize: '0.6rem' }}>NFC</span>
                    </div>
                    <div>
                      <span className="block font-bold text-xs" style={{ fontSize: '0.65rem' }}>TAPKU SMART CARD</span>
                      <span className="text-subtle block" style={{ fontSize: '0.55rem' }}>Kedai Kopi Joni</span>
                    </div>
                  </div>

                  {/* NFC Pulse Wave Animation */}
                  <div className={`nfc-pulse-wave ${hasTappedCard ? 'active' : ''}`}></div>

                  {/* Dynamic Island */}
                  <div className="phone-dynamic-island">
                    <div className="phone-camera-lens"></div>
                  </div>

                  {/* Phone Status Bar */}
                  <div className="phone-status-bar">
                    <span>09:41</span>
                    <div className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                        <line x1="12" y1="20" x2="12.01" y2="20" />
                      </svg>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
                        <line x1="22" y1="11" x2="22" y2="13" />
                      </svg>
                    </div>
                  </div>

                  {/* Phone Screen: Google Review Composer */}
                  <div className="phone-screen-content">
                    {/* Google Review Box */}
                    <div className="review-modal-box">
                      <div className="flex items-center justify-between border-b pb-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs" style={{ color: '#2563eb' }}>Google Review</span>
                        </div>
                        <span className="text-muted text-xs" style={{ fontSize: '0.65rem' }}>Resmi</span>
                      </div>

                      <div className="mb-2">
                        <h4 className="font-bold text-xs" style={{ color: '#0f172a' }}>Kedai Kopi Joni</h4>
                        <p className="text-muted" style={{ fontSize: '0.68rem' }}>Jl. Asia Afrika No.19, Jakarta Pusat</p>
                      </div>

                      <div className="flex items-center gap-2 mb-2 p-1.5 rounded" style={{ background: '#f8fafc' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                          D
                        </div>
                        <div style={{ fontSize: '0.7rem' }}>
                          <span className="font-semibold block text-slate-800">Dimas Pratama</span>
                          <span className="text-muted" style={{ fontSize: '0.6rem' }}>Posting ulasan publik</span>
                        </div>
                      </div>

                      {/* Interactive 5 Stars Row */}
                      <div className="text-center my-2">
                        <span className="text-xs font-semibold text-slate-600 block mb-1" style={{ fontSize: '0.7rem' }}>
                          Beri rating bintang ulasan:
                        </span>
                        <div className="review-stars-row">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setSelectedStars(star)}
                              className="review-star-btn"
                              title={`Beri rating ${star} bintang`}
                            >
                              <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill={star <= selectedStars ? '#f59e0b' : '#e2e8f0'}
                                stroke={star <= selectedStars ? '#f59e0b' : '#cbd5e1'}
                                strokeWidth="1.5"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#475569', lineHeight: '1.4' }}>
                        "Kopinya mantap, baristanya ramah banget. Tempat sangat nyaman untuk kerja!"
                      </div>
                    </div>

                    {/* Submit Button Inside Phone */}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleCardClick}
                        className="btn btn-primary w-full py-2 font-bold text-xs"
                        style={{ borderRadius: '10px' }}
                      >
                        {hasTappedCard ? 'Ulasan Terkirim ke Google' : 'Posting Ulasan'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instant Tap Feedback notification */}
                {hasTappedCard && (
                  <div className="animate-fade-in p-2 rounded-md border text-center shadow-xs mt-2" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', width: '280px' }}>
                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-success">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>NFC Berhasil Terbaca di HP!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 IMPACT STATISTICS STRIP */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid-4">
            <div className="stat-item">
              <span className="stat-num">+300%</span>
              <span className="stat-label">Kenaikan Ulasan Google Bulanan</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">&lt; 2 Detik</span>
              <span className="stat-label">Waktu Tempel ke Form Ulasan</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">Rp 0</span>
              <span className="stat-label">Biaya Langganan (1x Beli Seumur Hidup)</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">100%</span>
              <span className="stat-label">Garansi Chip NFC Awet &amp; Akurat</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: 1X BELI AKTIF SELAMANYA & DYNAMIC LINK BENEFITS */}
      <section id="benefits" className="py-6 border-b" style={{ background: '#ffffff' }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Keunggulan Teknologi</span>
            <h2 className="section-title font-bold mt-1">Beli Sekali, Aktif Seumur Hidup dengan Dynamic Link</h2>
            <p className="text-muted max-w-lg mx-auto text-sm mt-2">
              Investasi cerdas tanpa biaya berlangganan. Kartu pintar fleksibel yang mengikuti pertumbuhan bisnis Anda.
            </p>
          </div>

          <div className="grid-4">
            {dynamicBenefits.map((item, idx) => (
              <div key={idx} className="feature-card-minimal p-4">
                <div className="step-badge mb-3">{item.icon}</div>
                <h3 className="text-sm font-bold mb-1.5">{item.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: TARGET MARKET (Untuk Bisnis Apa?) */}
      <section id="target-market" className="py-6 border-b" style={{ background: 'var(--background-subtle)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Target Industri</span>
            <h2 className="section-title font-bold mt-1">Solusi Teruji untuk Segala Jenis Bisnis Fisik</h2>
            <p className="text-muted max-w-lg mx-auto text-sm mt-2">
              Didesain khusus untuk meningkatkan ulasan bintang 5 bagi seluruh bisnis yang memiliki lokasi toko fisik.
            </p>
          </div>

          <div className="target-market-grid">
            {targetMarkets.map((market, idx) => (
              <div key={idx} className="target-card">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="target-card-icon">{market.icon}</div>
                    <span className="section-badge" style={{ fontSize: '0.65rem' }}>{market.category}</span>
                  </div>
                  <h3 className="text-sm font-bold mb-1.5">{market.title}</h3>
                  <p className="text-muted text-xs leading-relaxed mb-3">{market.description}</p>
                </div>
                <div className="border-t pt-2 text-xs text-subtle" style={{ fontSize: '0.72rem' }}>
                  <strong>Contoh:</strong> {market.examples}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: COMPARISON TABLE (Tanpa Kartu vs Dengan Kartu Tapku) */}
      <section id="comparison" className="py-6 border-b" style={{ background: '#ffffff' }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Komparasi Nyata</span>
            <h2 className="section-title font-bold mt-1">Tanpa Kartu vs Dengan Kartu Pintar Tapku</h2>
            <p className="text-muted max-w-lg mx-auto text-sm mt-2">
              Tinggalkan cara lama yang lambat dan merepotkan. Bandingkan efisiensi nyata kartu pintar Tapku.
            </p>
          </div>

          <div className="comparison-wrapper">
            {/* Desktop Header */}
            <div className="comparison-table-header">
              <span>Parameter</span>
              <span>Tanpa Kartu (Cara Manual)</span>
              <span>Dengan Kartu Pintar Tapku</span>
            </div>

            {/* Item 1: Kecepatan */}
            <div className="comparison-card-item">
              <div>
                <h3 className="comparison-param-title">Kecepatan Buka Ulasan</h3>
                <p className="text-xs text-muted">Waktu proses bagi pelanggan</p>
              </div>
              <div className="comparison-duel-grid">
                <div className="comp-duel-box manual">
                  <div className="comp-duel-badge manual">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Cara Manual</span>
                  </div>
                  <div className="comp-duel-val">1 - 2 Menit</div>
                  <div className="comp-duel-desc">Harus buka Maps &amp; ketik nama toko manual</div>
                </div>
                <div className="comp-duel-box tapku">
                  <div className="comp-duel-badge tapku">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Pakai Tapku</span>
                  </div>
                  <div className="comp-duel-val">&lt; 2 Detik (Instan)</div>
                  <div className="comp-duel-desc">Sekali tap langsung muncul form bintang 5</div>
                </div>
              </div>
            </div>

            {/* Item 2: Konversi */}
            <div className="comparison-card-item">
              <div>
                <h3 className="comparison-param-title">Tingkat Keberhasilan Review</h3>
                <p className="text-xs text-muted">Persentase pelanggan yang bersedia ulas</p>
              </div>
              <div className="comparison-duel-grid">
                <div className="comp-duel-box manual">
                  <div className="comp-duel-badge manual">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span>Cara Manual</span>
                  </div>
                  <div className="comp-duel-val">&lt; 5% (Rendah)</div>
                  <div className="comp-duel-desc">Customer sering malas &amp; lupa karena ribet</div>
                </div>
                <div className="comp-duel-box tapku">
                  <div className="comp-duel-badge tapku">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Pakai Tapku</span>
                  </div>
                  <div className="comp-duel-val">Hingga 75%+ (Tinggi)</div>
                  <div className="comp-duel-desc">Sangat mudah dilakukan di kasir sambil bayar</div>
                </div>
              </div>
            </div>

            {/* Item 3: Fleksibilitas Ganti Alamat */}
            <div className="comparison-card-item">
              <div>
                <h3 className="comparison-param-title">Fleksibilitas (Pindah Alamat)</h3>
                <p className="text-xs text-muted">Jika rebrand atau pindah lokasi ruko</p>
              </div>
              <div className="comparison-duel-grid">
                <div className="comp-duel-box manual">
                  <div className="comp-duel-badge manual">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span>Cara Manual</span>
                  </div>
                  <div className="comp-duel-val">Cetak Ulang Brosur</div>
                  <div className="comp-duel-desc">Banner/kertas lama harus dibuang &amp; bayar cetak</div>
                </div>
                <div className="comp-duel-box tapku">
                  <div className="comp-duel-badge tapku">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Pakai Tapku</span>
                  </div>
                  <div className="comp-duel-val">Edit Cloud Realtime</div>
                  <div className="comp-duel-desc">Cukup ubah link di portal tanpa ganti kartu fisik</div>
                </div>
              </div>
            </div>

            {/* Item 4: Biaya */}
            <div className="comparison-card-item">
              <div>
                <h3 className="comparison-param-title">Biaya Pemakaian</h3>
                <p className="text-xs text-muted">Biaya langganan software / tools</p>
              </div>
              <div className="comparison-duel-grid">
                <div className="comp-duel-box manual">
                  <div className="comp-duel-badge manual">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span>Software Lain</span>
                  </div>
                  <div className="comp-duel-val">Ratusan Ribu / Bulan</div>
                  <div className="comp-duel-desc">Biaya langganan recurring terus menerus</div>
                </div>
                <div className="comp-duel-box tapku">
                  <div className="comp-duel-badge tapku">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Pakai Tapku</span>
                  </div>
                  <div className="comp-duel-val">1x Beli Seumur Hidup</div>
                  <div className="comp-duel-desc">Rp 0 biaya bulanan atau tahunan selamanya</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: WORKFLOW / CARA KERJA */}
      <section id="workflow" className="py-6 border-b">
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Cara Kerja</span>
            <h2 className="section-title font-bold mt-1">Alur Sederhana &amp; Otomatis</h2>
            <p className="text-muted max-w-lg mx-auto text-sm mt-2">
              Tidak butuh keahlian teknis. Hubungkan kartu Anda dalam hitungan menit dan mulai kumpulkan ulasan pelanggan.
            </p>
          </div>

          <div className="grid-4">
            {workflows.map((item, idx) => (
              <div key={idx} className="step-card-minimal">
                <div className="flex justify-between items-center mb-3">
                  <div className="step-badge">{item.step}</div>
                  <div style={{ color: 'var(--primary-color)' }}>{item.icon}</div>
                </div>
                <h3 className="text-sm font-bold mb-2">{item.title}</h3>
                <p className="text-muted text-xs leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: RESELLER & PARTNERSHIP (Peluang Kemitraan) */}
      <section id="reseller" className="py-6 border-b" style={{ background: 'var(--background-subtle)' }}>
        <div className="container">
          <div className="reseller-container">
            <div className="text-center mb-5">
              <span className="section-badge mb-2" style={{ background: '#dcfce7', borderColor: '#86efac', color: '#15803d' }}>
                Peluang Bisnis
              </span>
              <h2 className="section-title font-bold mt-1">Peluang Kemitraan &amp; Reseller Resmi di Kota Anda</h2>
              <p className="text-muted max-w-lg mx-auto text-sm mt-2">
                Dapatkan potensi penghasilan jutaan rupiah dengan menjadi distributor dan reseller resmi Smart Card Google Review di kota Anda.
              </p>
            </div>

            <div className="grid-3 mb-4">
              <div className="reseller-benefit-box">
                <span className="font-bold text-xs text-primary uppercase tracking-wider">Margin Tinggi</span>
                <h3 className="text-sm font-bold">Harga Grosir B2B Spesial</h3>
                <p className="text-muted text-xs leading-relaxed">
                  Dapatkan harga modal sangat kompetitif untuk pembelian partai besar dengan potensi margin keuntungan berlipat.
                </p>
              </div>

              <div className="reseller-benefit-box">
                <span className="font-bold text-xs text-primary uppercase tracking-wider">Pasar Raksasa</span>
                <h3 className="text-sm font-bold">Jutaan UMKM Butuh Review</h3>
                <p className="text-muted text-xs leading-relaxed">
                  Setiap kafe, resto, salon, klinik, bengkel, dan toko fisik di daerah Anda membutuhkan kartu ini untuk meningkatkan omzetnya.
                </p>
              </div>

              <div className="reseller-benefit-box">
                <span className="font-bold text-xs text-primary uppercase tracking-wider">Support Lengkap</span>
                <h3 className="text-sm font-bold">Marketing Kit &amp; Edukasi</h3>
                <p className="text-muted text-xs leading-relaxed">
                  Disediakan materi promosi siap pakai, template presentasi ke calon klien, dan konsultasi strategi penjualan.
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <a
                href={waResellerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp py-3 px-6 font-bold text-sm"
                style={{ width: 'auto', minWidth: '260px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-5.514 0-10 4.486-10 10 0 1.761.459 3.417 1.258 4.865l-1.297 4.735 4.856-1.273c1.393.759 2.977 1.173 4.683 1.173 5.514 0 10-4.486 10-10s-4.486-10-10-10z" />
                </svg>
                Gabung Reseller via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE TESTIMONIALS (Dual-Direction Opposite Scrolling) */}
      <section id="testimonials" className="py-6 border-b">
        <div className="container mb-4">
          <div className="text-center">
            <span className="section-badge mb-2">Testimoni Pelanggan</span>
            <h2 className="section-title font-bold mt-1">Dipercaya Berbagai Pelaku Usaha di Seluruh Indonesia</h2>
            <p className="text-muted max-w-lg mx-auto text-sm mt-2">
              Pengalaman nyata peningkatan omzet, rating bintang 5, dan visibilitas pencarian Google Maps.
            </p>
          </div>
        </div>

        {/* DUAL DIRECTION MARQUEE WRAPPER */}
        <div className="marquee-wrapper">
          {/* ROW 1: SCROLL LEFT */}
          <div className="marquee-row">
            <div className="marquee-track marquee-left">
              {[...marqueeReviewsRow1, ...marqueeReviewsRow1].map((t, idx) => (
                <div key={`row1-${idx}`} className="marquee-card">
                  <div>
                    <div className="quote-stars-svg mb-2">
                      {[...Array(t.rating)].map((_, i) => (
                        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#d97706" stroke="#d97706">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <p className="quote-text">"{t.quote}"</p>
                  </div>
                  <div className="author-details">
                    <div className="flex justify-between items-center">
                      <span className="author-name">{t.author}</span>
                      <span className="text-xs text-primary font-semibold">{t.business}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="author-role">{t.role}</span>
                      <span className="text-xs text-subtle font-mono">{t.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 2: SCROLL RIGHT (Opposite Direction) */}
          <div className="marquee-row">
            <div className="marquee-track marquee-right">
              {[...marqueeReviewsRow2, ...marqueeReviewsRow2].map((t, idx) => (
                <div key={`row2-${idx}`} className="marquee-card">
                  <div>
                    <div className="quote-stars-svg mb-2">
                      {[...Array(t.rating)].map((_, i) => (
                        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#d97706" stroke="#d97706">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <p className="quote-text">"{t.quote}"</p>
                  </div>
                  <div className="author-details">
                    <div className="flex justify-between items-center">
                      <span className="author-name">{t.author}</span>
                      <span className="text-xs text-primary font-semibold">{t.business}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="author-role">{t.role}</span>
                      <span className="text-xs text-subtle font-mono">{t.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-6 border-b" style={{ background: 'var(--background-subtle)' }}>
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`faq-icon-svg ${faqOpen[idx] ? 'open' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
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

      {/* FINAL HIGH-IMPACT CTA */}
      <section className="py-6 text-center" style={{ background: '#ffffff' }}>
        <div className="container-sm">
          <h2 className="text-2xl font-extrabold mb-2">Siap Jadikan Bisnis Anda Pilihan No. 1 di Google Maps?</h2>
          <p className="text-muted text-sm mb-4 max-w-md mx-auto">
            Dapatkan Smart Card NFC &amp; Dynamic QR Google Review resmi sekarang dan raih ratusan ulasan bintang 5 setiap bulan.
          </p>
          <div className="flex justify-center w-full">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp py-3 px-6 font-bold text-sm"
              style={{ width: 'auto', minWidth: '240px' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-5.514 0-10 4.486-10 10 0 1.761.459 3.417 1.258 4.865l-1.297 4.735 4.856-1.273c1.393.759 2.977 1.173 4.683 1.173 5.514 0 10-4.486 10-10s-4.486-10-10-10z" />
              </svg>
              Pesan Kartu via WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* RICH 4-COLUMN FOOTER */}
      <footer className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Column 1: Brand & About */}
            <div>
              <div className="footer-brand-title">TAPKU</div>
              <p className="footer-desc">
                Solusi Smart Card Google Review NFC &amp; Dynamic QR terbaik untuk UMKM dan bisnis modern di Indonesia. Kumpulkan ulasan bintang 5 dengan satu kali tempel.
              </p>
              <div className="mt-3">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary py-1.5 px-3 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-5.514 0-10 4.486-10 10 0 1.761.459 3.417 1.258 4.865l-1.297 4.735 4.856-1.273c1.393.759 2.977 1.173 4.683 1.173 5.514 0 10-4.486 10-10s-4.486-10-10-10z" />
                  </svg>
                  <span>Chat CS WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <div className="footer-col-title">Navigasi</div>
              <div className="footer-col-links">
                <a href="#target-market" className="footer-col-link">Untuk Bisnis Apa</a>
                <a href="#benefits" className="footer-col-link">Keunggulan Dynamic Link</a>
                <a href="#comparison" className="footer-col-link">Komparasi Solusi</a>
                <a href="#workflow" className="footer-col-link">Cara Kerja</a>
                <a href="#reseller" className="footer-col-link">Peluang Reseller</a>
                <a href="#testimonials" className="footer-col-link">Testimoni Klien</a>
                <a href="#faq" className="footer-col-link">Tanya Jawab (FAQ)</a>
              </div>
            </div>

            {/* Column 3: Features */}
            <div>
              <div className="footer-col-title">Fitur &amp; Layanan</div>
              <div className="footer-col-links">
                <a href="#benefits" className="footer-col-link">Aktivasi Kartu Instan</a>
                <a href="#benefits" className="footer-col-link">Dynamic QR Code Cloud</a>
                <a href="#workflow" className="footer-col-link">Google Places API Sync</a>
                <a href="#target-market" className="footer-col-link">Solusi Multi-Bisnis</a>
              </div>
            </div>

            {/* Column 4: Contact & Operations */}
            <div>
              <div className="footer-col-title">Kontak &amp; Bantuan</div>
              <div className="footer-col-links">
                <span className="text-xs text-muted">Dukungan Pelanggan:</span>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-col-link font-bold text-slate-800 flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-5.514 0-10 4.486-10 10 0 1.761.459 3.417 1.258 4.865l-1.297 4.735 4.856-1.273c1.393.759 2.977 1.173 4.683 1.173 5.514 0 10-4.486 10-10s-4.486-10-10-10z" />
                  </svg>
                  <span>Chat CS WhatsApp</span>
                </a>
                <span className="text-xs text-muted mt-1">Jam Operasional:</span>
                <span className="text-xs font-semibold text-slate-700">Senin - Minggu: 08.00 - 21.00 WIB</span>
                <span className="text-xs text-muted mt-1">Pengiriman ke Seluruh Indonesia</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Legal */}
          <div className="footer-bottom-bar">
            <span>&copy; {new Date().getFullYear()} Tapku. Hak cipta dilindungi undang-undang.</span>
            <div className="flex gap-4 text-xs text-muted">
              <span>Solusi Kartu Google Review NFC &amp; Dynamic QR</span>
            </div>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP MARQUEE BUTTON (BOTTOM RIGHT) */}
      <a
        href={waInfoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-wa-widget"
        aria-label="Chat WhatsApp untuk informasi produk"
      >
        <div className="floating-wa-pulse-ring"></div>
        <div className="floating-wa-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-5.514 0-10 4.486-10 10 0 1.761.459 3.417 1.258 4.865l-1.297 4.735 4.856-1.273c1.393.759 2.977 1.173 4.683 1.173 5.514 0 10-4.486 10-10s-4.486-10-10-10z" />
          </svg>
          <span className="floating-wa-online-dot"></span>
        </div>
        
        <div className="floating-wa-marquee-body">
          <div className="floating-wa-label-top">
            <span className="floating-wa-badge">Online</span>
            <span className="floating-wa-phone">Tanya CS Tapku</span>
          </div>
          <div className="floating-wa-marquee-track">
            <div className="floating-wa-marquee-anim">
              <span>💬 Butuh info produk? Tanya langsung via WhatsApp! • Fast response &amp; konsultasi gratis ➜</span>
              <span>💬 Butuh info produk? Tanya langsung via WhatsApp! • Fast response &amp; konsultasi gratis ➜</span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
