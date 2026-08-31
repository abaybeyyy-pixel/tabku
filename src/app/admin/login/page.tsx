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
    <main className="min-vh flex align-items-center justify-content-center py-4 px-3 light-landing">
      <div className="onboarding-card">
        <div className="header-logo">
          <div className="logo-icon admin">A</div>
          <span className="card-badge">Keamanan</span>
        </div>

        <div className="text-center mb-4">
          <h1 className="h2 font-bold mb-1">Portal Admin</h1>
          <p className="text-muted">Masukkan kata sandi administrator untuk mengakses dashboard.</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="form-group">
          <div className="input-group">
            <label htmlFor="password">Kata Sandi</label>
            <input
              type="password"
              id="password"
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3 font-semibold mt-2"
            disabled={loading}
          >
            {loading ? 'Memverifikasi...' : 'Masuk Dashboard'}
          </button>
        </form>
      </div>
    </main>
  );
}
