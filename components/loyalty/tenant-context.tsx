'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { getTenant, type TenantConfig } from '@/lib/wallet-tenant';

const LoyaltyTenantContext = createContext<TenantConfig | null>(null);

export function LoyaltyTenantProvider({
  tenant,
  children,
}: {
  tenant: TenantConfig;
  children: ReactNode;
}) {
  return (
    <LoyaltyTenantContext.Provider value={tenant}>{children}</LoyaltyTenantContext.Provider>
  );
}

/** Config del layout (Mongo) o fallback hardcodeado para SABUCAN / Carnitas. */
export function useLoyaltyTenant(tenantId: string): TenantConfig | null {
  const ctx = useContext(LoyaltyTenantContext);
  if (ctx) return ctx;
  return getTenant(tenantId);
}
