import localFont from 'next/font/local';

export const geist = localFont({
  src: [
    { path: './fonts/Geist-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Geist-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/Geist-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/Geist-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-geist',
  display: 'swap',
});
