import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tapku — Platform Kartu Google Review',
  description: 'Ubah kartu fisik Google Review Anda menjadi pengalaman ketuk-dan-ulasan yang praktis. Kelola tautan tujuan, ubah konfigurasi, dan kumpulkan ulasan bisnis secara instan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
