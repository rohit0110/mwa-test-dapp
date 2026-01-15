import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seeker MWA Test',
  description: 'Testing seeker-test pattern',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
