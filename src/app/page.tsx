'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Homepage() {
  const [cardId, setCardId] = useState('');
  const [error, setError] = useState('');
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({});
  const router = useRouter();

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId.trim()) {
      setError('Silakan masukkan ID Kartu.');
      return;
    }
    router.push(`/onboarding/${cardId.trim().toUpperCase()}`);
  };

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const testimonials = [
    {
      quote: "Sebelum pakai kartu ini, kami hanya dapat sekitar 3 ulasan seminggu. Sekarang bisa lebih dari 20 ulasan. Pelanggan cukup tap kartu di meja kasir dan langsung nulis ulasan.",
      author: "Alex Rivera",
      role: "Pemilik, Saturdays Coffee Co.",
      location: "Jakarta"
    },
    {
      quote: "Fitur untuk mengganti link ulasan secara instan dengan PIN sangat membantu. Kami sempat pindah lokasi dan bisa memperbarui link ulasan hanya dalam 5 detik.",
      author: "Sarah Jenkins",
      role: "Pendiri, Bloom Hair Salon",
      location: "Bali"
    },
    {
      quote: "Produk luar biasa. Kualitas kartu fisik NFC premium dan pengalihan link sangat cepat tanpa delay. Sangat direkomendasikan untuk toko fisik.",
      author: "Marcus Chen",
      role: "Direktur, Apex Fitness Studio",
      location: "Surabaya"
    }
  ];

  const features = [
    {
      title: "Teknologi Ketuk NFC",
      description: "Dilengkapi dengan chip NFC premium. Cukup ketuk kartu ke ponsel pelanggan dan halaman ulasan akan langsung terbuka secara otomatis."
    },
    {
      title: "Kode QR Dinamis",
      description: "Kode QR dengan kontras tinggi dicetak di setiap kartu. Berfungsi sebagai alternatif cadangan yang sempurna untuk ponsel model lama."
    },
    {
      title: "Tanpa Aplikasi Tambahan",
      description: "Berjalan langsung di browser bawaan iOS dan Android. Pelanggan tidak perlu mengunduh aplikasi pihak ketiga apa pun."
    },
    {
      title: "Kelola Link Mandiri",
      description: "Ubah URL tujuan Google Review Anda kapan saja melalui dashboard pengelolaan mandiri yang aman menggunakan PIN Anda."
    },
    {
      title: "Keamanan Terlindungi PIN",
      description: "Semua konfigurasi kartu Anda dilindungi dengan PIN numerik 4 hingga 6 digit yang Anda buat sendiri saat aktivasi pertama."
    },
    {
      title: "Pengalihan Instan",
      description: "Sistem pengalihan server-side bekerja dalam hitungan milidetik, memberikan pelanggan Anda pengalaman ulasan yang cepat dan tanpa jeda."
    }
  ];

  const faqs = [
    {
      q: "Bagaimana cara kerja Kartu Google Review ini?",
      a: "Setiap kartu memiliki chip NFC internal dan kode QR tercetak. Saat pelanggan menempelkan ponsel mereka atau memindai kode QR kartu, ponsel akan membuka link permanen platform kami yang secara instan mengarahkan mereka ke halaman ulasan Google Bisnis Anda."
    },
    {
      q: "Apakah saya bisa mengubah link ulasan setelah kartu dicetak?",
      a: "Bisa. Ini adalah fitur utama platform kami. Melalui dashboard /manage dengan memasukkan ID Kartu dan PIN Anda, Anda dapat memperbarui URL tujuan kapan saja tanpa perlu mengganti kartu fisik."
    },
    {
      q: "Apakah pelanggan harus menginstal aplikasi untuk memindai?",
      a: "Tidak. Fitur pemindai NFC sudah terintegrasi secara bawaan di hampir semua smartphone modern, dan kode QR dapat dipindai menggunakan aplikasi kamera biasa."
    },
    {
      q: "Bagaimana jika saya lupa PIN pengelolaan kartu saya?",
      a: "Anda dapat menggunakan fitur 'Lupa PIN' di halaman kelola kartu. Masukkan ID Kartu dan email terdaftar untuk menerima kode OTP 6-digit guna menyetel ulang PIN Anda dengan aman."
    }
  ];

  return (
    <div className="home-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-container">
          <a href="/" className="nav-logo">
            <span>TAPKU</span>
          </a>
          <div className="nav-links">
            <a href="#features" className="nav-link">Fitur</a>
            <a href="#workflow" className="nav-link">Cara Kerja</a>
            <a href="#testimonials" className="nav-link">Testimoni</a>
            <a href="#faq" className="nav-link">Tanya Jawab</a>
          </div>
          <div className="nav-ctas">
            <a href="/manage" className="btn btn-secondary py-2 px-4 font-semibold text-sm">
              Kelola Kartu
            </a>
            <a href="/admin/login" className="btn btn-primary py-2 px-4 font-semibold text-sm">
              Admin
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-section text-center">
        <div className="container-sm hero-content">
          <h1 className="hero-title font-extrabold mb-3">
            Lebih Banyak Ulasan. <br />
            <span className="text-gradient">Satu Ketukan Praktis.</span>
          </h1>
          <p className="hero-subtitle text-muted mb-5 max-w-xl mx-auto">
            Hubungkan kartu Google Review fisik Anda ke lokasi bisnis Anda secara instan. Atur tautan, kelola pengalihan, dan kumpulkan ulasan pelanggan dalam hitungan detik.
          </p>

          {/* QUICK START CARD FORM */}
          <div className="cta-box mb-4">
            <form onSubmit={handleActivate} className="cta-form">
              <input
                type="text"
                placeholder="Masukkan ID Kartu (misal: AB1234)"
                value={cardId}
                onChange={(e) => {
                  setCardId(e.target.value);
                  setError('');
                }}
                className="card-id-input"
              />
              <button type="submit" className="btn btn-primary font-semibold py-3 px-6">
                Aktifkan Kartu
              </button>
            </form>
          </div>
          {error && <p className="error-text text-sm mb-4">{error}</p>}
          
          <p className="text-xs text-muted">
            Sudah membeli kartu? Masukkan ID Kartu Anda di atas untuk mulai menghubungkan link ulasan Anda.
          </p>
        </div>
      </section>

      {/* STATS ROW */}
      <section className="stats-section border-t border-b py-4">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item text-center">
              <span className="stat-num font-bold">10 Ribu+</span>
              <span className="stat-label text-xs text-muted uppercase">Kartu Dikirim</span>
            </div>
            <div className="stat-item text-center">
              <span className="stat-num font-bold">500 Ribu+</span>
              <span className="stat-label text-xs text-muted uppercase">Ulasan Terkumpul</span>
            </div>
            <div className="stat-item text-center">
              <span className="stat-num font-bold">99.9%</span>
              <span className="stat-label text-xs text-muted uppercase">Jaminan Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="features-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Fitur</span>
            <h2 className="section-title font-bold">Dirancang untuk Toko & Bisnis Lokal</h2>
            <p className="text-muted max-w-xl mx-auto mt-2">
              Segala hal yang Anda butuhkan untuk meningkatkan peringkat pencarian Google Maps dan membangun reputasi bisnis Anda.
            </p>
          </div>

          <div className="grid-3">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card-minimal">
                <h3 className="h4 font-bold mb-2">{feature.title}</h3>
                <p className="text-muted text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / WORKFLOW */}
      <section id="workflow" className="workflow-section py-5 border-t border-b bg-muted-light">
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Cara Kerja</span>
            <h2 className="section-title font-bold">Protokol Aktivasi Mudah</h2>
            <p className="text-muted max-w-xl mx-auto mt-2">
              Tanpa keahlian teknis khusus. Kartu Anda siap digunakan dalam waktu kurang dari dua menit.
            </p>
          </div>

          <div className="grid-4">
            <div className="step-card-minimal">
              <div className="step-badge">01</div>
              <h3 className="h4 font-bold mb-2">Terima Kartu</h3>
              <p className="text-muted text-sm">
                Dapatkan kartu fisik NFC/QR Tapku Anda. Kartu tiba dalam kondisi siap dikonfigurasi.
              </p>
            </div>

            <div className="step-card-minimal">
              <div className="step-badge">02</div>
              <h3 className="h4 font-bold mb-2">Scan & Hubungkan</h3>
              <p className="text-muted text-sm">
                Ketuk kartu ke ponsel Anda atau pindai kode QR untuk membuka halaman portal aktivasi perdana.
              </p>
            </div>

            <div className="step-card-minimal">
              <div className="step-badge">03</div>
              <h3 className="h4 font-bold mb-2">Simpan Pengaturan</h3>
              <p className="text-muted text-sm">
                Masukkan nama bisnis, tempel URL Google Review tujuan Anda, dan tentukan PIN pengaman Anda.
              </p>
            </div>

            <div className="step-card-minimal">
              <div className="step-badge">04</div>
              <h3 className="h4 font-bold mb-2">Mulai Kumpulkan</h3>
              <p className="text-muted text-sm">
                Letakkan kartu di meja kasir. Pelanggan cukup mengetuk kartu untuk menulis ulasan secara instan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="testimonials-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">Testimoni</span>
            <h2 className="section-title font-bold">Dipercaya Pelaku Usaha Lokal</h2>
            <p className="text-muted max-w-xl mx-auto mt-2">
              Cerita nyata dari pemilik toko fisik yang berhasil menaikkan rating pencarian lokal mereka.
            </p>
          </div>

          <div className="grid-3">
            {testimonials.map((t, idx) => (
              <div key={idx} className="testimonial-card">
                <p className="quote-text mb-4">"{t.quote}"</p>
                <div className="author-details">
                  <span className="author-name font-bold block">{t.author}</span>
                  <span className="author-role text-xs text-muted block">{t.role}</span>
                  <span className="author-location text-xs text-muted font-mono block">{t.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="faq-section py-5 border-t">
        <div className="container-sm">
          <div className="text-center mb-5">
            <span className="section-badge mb-2">FAQ</span>
            <h2 className="section-title font-bold">Pertanyaan Umum</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className="faq-item border-b py-3">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="faq-question w-full flex justify-between align-items-center text-left font-semibold py-2"
                >
                  <span>{faq.q}</span>
                  <span className="faq-icon font-mono">{faqOpen[idx] ? '[-]' : '[+]'}</span>
                </button>
                {faqOpen[idx] && (
                  <div className="faq-answer text-muted text-sm py-2 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="final-cta py-5 border-t text-center bg-muted-light">
        <div className="container-sm">
          <h2 className="h2 font-extrabold mb-3">Siap Meningkatkan SEO Lokal Anda?</h2>
          <p className="text-muted mb-4 max-w-lg mx-auto">
            Dapatkan ulasan bintang lima di Google Maps dengan kartu fisik NFC kami secara instan.
          </p>
          <div className="flex justify-content-center gap-3">
            <a href="#hero" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn btn-primary py-3 px-6 font-semibold">
              Aktifkan Kartu
            </a>
            <a href="/manage" className="btn btn-secondary py-3 px-6 font-semibold">
              Dashboard Kelola
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer text-center py-4 border-t">
        <div className="container">
          <p className="text-muted text-xs mb-0">
            &copy; {new Date().getFullYear()} Tapku. Hak cipta dilindungi undang-undang. Google, Google Maps, dan Google Review adalah merek dagang dari Google LLC.
          </p>
        </div>
      </footer>
    </div>
  );
}
