import { StoreGoogleOnboarding } from '@/components/store-google-onboarding';

export const metadata = {
  title: 'Complete sua conta — Tesoob',
  description: 'Escolha seu apelido e conclua sua conta Tesoob.',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function GoogleOnboardingPage() {
  return <StoreGoogleOnboarding />;
}
