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
    <main className="min-vh flex items-center justify-center py-6 px-3">
      <div className="onboarding-card">
        <div className="header-logo">
          <a href="/" className="font-extrabold text-sm tracking-wider" style={{ color: 'var(--primary-color)' }}>
            TAPKU
          </a>
          <span className="card-badge">{upperCardId}</span>
        </div>
        <OnboardingForm cardId={upperCardId} />
      </div>
    </main>
  );
}
