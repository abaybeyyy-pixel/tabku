'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('admin_password');
    if (saved) {
      router.push('/admin');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    fetch('/api/admin/cards', {
      headers: {
        'x-admin-password': password,
      },
    })
      .then((res) => {
        if (res.ok) {
          localStorage.setItem('admin_password', password);
          router.push('/admin');
        } else {
          setError('Kata sandi administrator tidak valid.');
        }
      })
      .catch(() => {
        setError('Terjadi kesalahan jaringan.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <main className="min-vh flex align-items-center justify-content-center py-5 px-3">
      <div className="onboarding-card">
        <div className="header-logo">
          <a href="/" className="flex items-center gap-2">
            <div className="logo-icon">A</div>
            <span className="font-bold text-sm">TAPKU ADMIN</span>
          </a>
          <span className="card-badge">Portal Akses</span>
        </div>

        <div className="text-center mb-4">
          <h1 className="text-xl font-bold mb-1">Masuk Dashboard Admin</h1>
          <p className="text-muted text-xs">Masukkan kata sandi administrator untuk mengelola database kartu.</p>
        </div>

        {error && <div className="error-alert mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="form-group">
          <div className="input-group">
            <label htmlFor="password">Kata Sandi</label>
            <input
              type="password"
              id="password"
              placeholder="Masukkan password admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3 font-semibold text-xs mt-1"
            disabled={loading}
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard →'}
          </button>

          <div className="text-center mt-2">
            <a href="/" className="text-xs text-muted hover:underline">
              ← Kembali ke Beranda
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
