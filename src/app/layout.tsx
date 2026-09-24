import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Container ship study guide', template: '%s · Container ship study guide' },
  description: 'An interactive 3D study manual of a 2,806 TEU geared container ship and its MAN B&W 7G60ME-C9.5 main engine, for marine engineers and cadets.',
};
export const viewport: Viewport = { themeColor: '#f6f7f5', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
