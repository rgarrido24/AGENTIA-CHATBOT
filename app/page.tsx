'use client';

import { AgentiaChatWidget } from '@/components/AgentiaChatWidget';
import { AgentiaLandingPage } from '@/components/landing/AgentiaLandingPage';
import { useAnalytics } from '@/src/lib/analytics-client';

export default function LandingPage() {
  useAnalytics();
  return (
    <>
      <AgentiaLandingPage />
      <AgentiaChatWidget />
    </>
  );
}
