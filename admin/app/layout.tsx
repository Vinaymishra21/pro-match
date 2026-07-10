import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wovnn — Admin',
  description: 'Moderation & analytics dashboard for Wovnn'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
