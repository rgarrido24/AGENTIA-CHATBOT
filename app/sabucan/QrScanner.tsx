'use client';

import { LoyaltyQrScanner, telefonoFromQrPayload } from '@/components/loyalty/QrScanner';
import { SABUCAN_NAVY, SABUCAN_ORANGE } from '@/lib/sabucan-brand';

export { telefonoFromQrPayload };

type Props = {
  disabled?: boolean;
  onScan: (value: string) => void;
};

export function SabucanQrScanner({ disabled, onScan }: Props) {
  return (
    <LoyaltyQrScanner
      disabled={disabled}
      accentColor={SABUCAN_ORANGE}
      primaryColor={SABUCAN_NAVY}
      onScan={onScan}
    />
  );
}
