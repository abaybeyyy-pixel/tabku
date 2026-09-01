import { notFound, redirect } from 'next/navigation';
import { findCardById } from '@/lib/db-helpers';
import OnboardingForm from './OnboardingForm';

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const upperCardId = cardId.toUpperCase();
  const card = await findCardById(upperCardId);

  if (!card) {
    notFound();
  }

  // If card is already active, redirect to management or destination URL
  if (card.status === 'ACTIVE') {
    redirect(`/c/${upperCardId}`);
  }

  // If card is disabled
  if (card.status === 'DISABLED') {
    redirect(`/c/${upperCardId}`);
  }

  return (
    <main className="min-vh flex align-items-center justify-content-center py-5 px-3">
      <div className="onboarding-card">
        <div className="header-logo">
          <a href="/" className="font-bold text-sm text-primary tracking-wide">
            TAPKU AKTIVASI
          </a>
          <span className="card-badge">{upperCardId}</span>
        </div>
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold mb-1">Aktivasi Kartu Review</h1>
          <p className="text-muted text-xs">Hubungkan kartu Anda ke profil lokasi Google Review bisnis Anda.</p>
        </div>
        <OnboardingForm cardId={upperCardId} />
      </div>
    </main>
  );
}
